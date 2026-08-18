import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Custom animated map pin icon for Leaflet
 */
const createCustomPinIcon = (label = 'Pickup Point') => {
  return L.divIcon({
    className: 'custom-pickup-pin',
    html: `
      <div class="relative flex flex-col items-center -translate-x-1/2 -translate-y-full cursor-pointer">
        <div class="absolute -bottom-1 w-4 h-2 bg-slate-900/30 rounded-full blur-[1px]"></div>
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-primary/20 rounded-full animate-ping pointer-events-none"></div>
          <div class="w-9 h-9 bg-gradient-to-tr from-primary to-primary-container rounded-full shadow-lg border-2 border-white flex items-center justify-center text-white">
            <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">location_on</span>
          </div>
        </div>
        <div class="mt-1 bg-slate-900/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap border border-white/20">
          ${label}
        </div>
      </div>
    `,
    iconSize: [36, 48],
    iconAnchor: [18, 42]
  });
};

/**
 * PickupLocationPicker
 * Comprehensive pickup location selector supporting:
 * 1. Admin Campus Pickup Hubs / Stations dropdown & instructions
 * 2. "Not on the list" custom location key-in
 * 3. Place search with instant suggestions (OSM Nominatim)
 * 4. Interactive click-to-pin Leaflet map
 * 5. High-accuracy 1-click live GPS sharing
 */
export default function PickupLocationPicker({
  campusLocations = [],
  selectedCampusLocation = '',
  onSelectCampusLocation,
  customStreet = '',
  onChangeCustomStreet,
  houseNumber = '',
  onChangeHouseNumber,
  pickupInstructions = '',
  onChangePickupInstructions,
  gpsCoords = null,
  onGpsCoordsChange,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const accuracyCircleRef = useRef(null);

  // Search places states
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchError, setSearchError] = useState('');

  // GPS states
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [gpsLocked, setGpsLocked] = useState(Boolean(gpsCoords));

  // Reverse geocoding status
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Determine if user has selected "Not on list / Custom Location"
  const isCustomMode =
    selectedCampusLocation === 'Custom House / Apartment Address' ||
    selectedCampusLocation === 'Not on the list (Custom Location)' ||
    selectedCampusLocation === 'CUSTOM_LOCATION';

  // Default initial coordinates (Nairobi, Kenya)
  const defaultCenter = [ -1.286389, 36.817223 ];

  // Helper to fly map to coordinates & set marker
  const updateMapPosition = useCallback((lat, lng, zoom = 16, label = 'Pickup Point', accuracy = null) => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    map.flyTo([lat, lng], zoom, {
      animate: true,
      duration: 1.2
    });

    // Update or create Marker
    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], {
        icon: createCustomPinIcon(label),
        draggable: true
      }).addTo(map);

      // Handle marker drag end
      markerRef.current.on('dragend', (e) => {
        const position = e.target.getLatLng();
        handlePositionSelect(position.lat, position.lng, null, true);
      });
    } else {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setIcon(createCustomPinIcon(label));
    }

    // Update or create accuracy circle
    if (accuracy && accuracy > 0) {
      if (!accuracyCircleRef.current) {
        accuracyCircleRef.current = L.circle([lat, lng], {
          radius: accuracy,
          color: '#2563eb',
          fillColor: '#3b82f6',
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: '4, 4'
        }).addTo(map);
      } else {
        accuracyCircleRef.current.setLatLng([lat, lng]);
        accuracyCircleRef.current.setRadius(accuracy);
      }
    } else if (accuracyCircleRef.current) {
      accuracyCircleRef.current.remove();
      accuracyCircleRef.current = null;
    }
  }, []);

  // Position select handler (with reverse geocode option)
  const handlePositionSelect = async (lat, lng, accuracy = null, shouldReverseGeocode = false) => {
    const coords = {
      lat: Number(lat),
      lng: Number(lng),
      accuracy: accuracy ? Math.round(accuracy) : 10
    };

    onGpsCoordsChange?.(coords);
    setGpsLocked(true);
    setGpsError('');
    updateMapPosition(coords.lat, coords.lng, 16, 'Pickup Pin', coords.accuracy);

    if (shouldReverseGeocode) {
      setIsReverseGeocoding(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en',
            }
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.display_name) {
            const shortName =
              data.address?.amenity ||
              data.address?.building ||
              data.address?.road ||
              data.address?.suburb ||
              data.name ||
              data.display_name.split(',')[0];

            if (isCustomMode || !selectedCampusLocation) {
              onChangeCustomStreet?.(shortName || data.display_name);
            }
          }
        }
      } catch (err) {
        console.warn('Reverse geocode warning:', err);
      } finally {
        setIsReverseGeocoding(false);
      }
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = gpsCoords?.lat || defaultCenter[0];
      const initialLng = gpsCoords?.lng || defaultCenter[1];

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: gpsCoords ? 16 : 13,
        zoomControl: false,
        attributionControl: false
      });

      // CartoDB Voyager tiles for crisp high contrast street map
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Add zoom control at bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Handle Map Click to Pin
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        handlePositionSelect(lat, lng, null, true);
      });

      mapInstanceRef.current = map;

      // If initial GPS coords exist, place pin
      if (gpsCoords?.lat && gpsCoords?.lng) {
        updateMapPosition(gpsCoords.lat, gpsCoords.lng, 16, 'Pickup Pin', gpsCoords.accuracy);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        accuracyCircleRef.current = null;
      }
    };
  }, []);

  // Center on campus hub when selected if coordinates exist
  useEffect(() => {
    if (!isCustomMode && selectedCampusLocation) {
      const hub = campusLocations.find(l => l.name === selectedCampusLocation);
      if (hub?.coordinates?.lat && hub?.coordinates?.lng) {
        updateMapPosition(hub.coordinates.lat, hub.coordinates.lng, 17, hub.name);
        onGpsCoordsChange?.({
          lat: hub.coordinates.lat,
          lng: hub.coordinates.lng,
          accuracy: 10
        });
        setGpsLocked(true);
      }
    }
  }, [selectedCampusLocation, isCustomMode, campusLocations, updateMapPosition, onGpsCoordsChange]);

  // Debounced search on OSM Nominatim
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError('');
      try {
        // Query OpenStreetMap Nominatim prioritizing Kenya
        const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&countrycodes=ke&limit=6&addressdetails=1`;

        const res = await fetch(endpoint, {
          headers: {
            'Accept-Language': 'en',
          }
        });

        if (res.ok) {
          const data = await res.json();
          setSuggestions(data || []);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.warn('Place search error:', err);
        setSearchError('Place suggestions currently unavailable. You can click on the map to pin your location.');
      } finally {
        setIsSearching(false);
      }
    }, 380);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle clicking a place search suggestion
  const handleSelectSuggestion = (place) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);

    // Friendly place name
    const mainTitle = place.address?.amenity ||
      place.address?.building ||
      place.address?.road ||
      place.address?.suburb ||
      place.name ||
      place.display_name.split(',')[0];

    onChangeCustomStreet?.(mainTitle || place.display_name);
    setSearchQuery(mainTitle || place.display_name);
    setShowSuggestions(false);

    handlePositionSelect(lat, lon, 10, false);
  };

  // 1-Click Browser Live GPS Handler
  const handleShareLiveLocation = () => {
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy);

        handlePositionSelect(lat, lng, accuracy, true);
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          setGpsError('Location permission denied. Please enable location permissions in browser settings.');
        } else if (err.code === 2) {
          setGpsError('Position unavailable. Please search for your building name or click on the map.');
        } else {
          setGpsError('Location request timed out. Please try again or tap on the map.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Current selected hub details
  const currentHub = campusLocations.find(l => l.name === selectedCampusLocation);

  return (
    <div className="flex flex-col gap-4">
      {/* Hub / Station Selector vs Custom Location */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-on-surface flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-on-surface">
            <span className="material-symbols-outlined text-[18px] text-primary">location_city</span>
            <span>Campus Pickup Hub / Station</span>
          </span>
          <span className="text-[11px] text-primary font-medium">Official Pickup Spots</span>
        </label>

        <div className="relative">
          <select
            value={selectedCampusLocation}
            onChange={(e) => {
              const val = e.target.value;
              onSelectCampusLocation(val);
              const loc = campusLocations.find(l => l.name === val);
              if (loc && loc.instructions) {
                onChangePickupInstructions?.(loc.instructions);
              }
            }}
            className="w-full bg-[#F1F5F9] rounded-xl px-4 py-3.5 text-sm text-on-surface border border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer font-medium appearance-none shadow-xs"
          >
            {campusLocations.map((loc, idx) => (
              <option key={idx} value={loc.name}>
                {loc.name === 'Custom House / Apartment Address' || loc.name === 'Not on the list (Custom Location)'
                  ? '📍 Not on the list? (Key in custom location name / Map Pin)'
                  : `${loc.name} ${loc.zone ? `(${loc.zone})` : ''}`}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">expand_more</span>
          </div>
        </div>

        {/* Selected Hub Zone & Instructions Pill */}
        {!isCustomMode && currentHub && (
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 flex items-start gap-2.5 mt-1">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
            </div>
            <div className="flex-1 text-xs">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-primary">{currentHub.name}</span>
                {currentHub.zone && (
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                    {currentHub.zone}
                  </span>
                )}
              </div>
              {currentHub.instructions ? (
                <p className="text-on-surface-variant text-[11px] leading-relaxed">
                  {currentHub.instructions}
                </p>
              ) : (
                <p className="text-on-surface-variant text-[11px]">
                  Rider will meet you at the official pickup spot.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Custom Location Name Key-in & Place Search (When not on list OR for pinpointing) */}
      <div className="flex flex-col gap-1.5 relative">
        <label className="text-xs font-semibold text-on-surface flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-secondary">travel_explore</span>
            <span>
              {isCustomMode ? 'Key in Location Name / Search Map Places' : 'Search Nearby Places / Custom Landmark'}
            </span>
          </span>
          {isCustomMode && (
            <span className="text-[11px] bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded-full">
              Custom Location
            </span>
          )}
        </label>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </div>

          <input
            type="text"
            placeholder="Type place, hostel, apartment or building name (e.g. Apex Court, Hall 3, Madaraka)"
            value={isCustomMode ? customStreet : searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              if (isCustomMode) {
                onChangeCustomStreet?.(val);
              }
              setSearchQuery(val);
              setShowSuggestions(true);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            className="w-full bg-[#F1F5F9] rounded-xl pl-10 pr-10 py-3 text-sm text-on-surface border border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-xs"
          />

          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
              <span className="material-symbols-outlined animate-spin text-primary text-[18px]">sync</span>
            </div>
          )}

          {!isSearching && (isCustomMode ? customStreet : searchQuery) && (
            <button
              type="button"
              onClick={() => {
                if (isCustomMode) onChangeCustomStreet?.('');
                setSearchQuery('');
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-outline hover:text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Real-time Map Place Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-30 top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-outline-variant/50 max-h-60 overflow-y-auto divide-y divide-surface-container">
            <div className="p-2 bg-surface-container-lowest text-[11px] font-semibold text-outline uppercase tracking-wider flex items-center justify-between">
              <span>Map Suggestions (Click to pin on map)</span>
              <button
                type="button"
                onClick={() => setShowSuggestions(false)}
                className="text-xs hover:text-on-surface"
              >
                Close
              </button>
            </div>
            {suggestions.map((item, idx) => {
              const mainName =
                item.address?.amenity ||
                item.address?.building ||
                item.address?.road ||
                item.name ||
                item.display_name.split(',')[0];
              const subAddress = item.display_name;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-primary/5 transition-colors flex items-start gap-2.5 group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors mt-0.5">
                    <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                      {mainName}
                    </p>
                    <p className="text-[11px] text-on-surface-variant truncate">
                      {subAddress}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary transition-colors self-center">
                    arrow_forward
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {searchError && (
          <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">info</span>
            {searchError}
          </p>
        )}
      </div>

      {/* Interactive Map & Live Share GPS Section */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 overflow-hidden shadow-xs">
        {/* Map Header with Live Location Button */}
        <div className="p-3.5 bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-surface-variant/40 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[16px]">map</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-on-surface">Interactive Pickup Map</h4>
              <p className="text-[10px] text-on-surface-variant">
                Click/drag pin on map for exact gate or door pickup
              </p>
            </div>
          </div>

          {/* Live GPS Button */}
          <button
            type="button"
            onClick={handleShareLiveLocation}
            disabled={gpsLoading}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              gpsLocked
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-primary hover:bg-primary/90 text-on-primary'
            }`}
          >
            {gpsLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[15px]">sync</span>
                <span>Locating GPS...</span>
              </>
            ) : gpsLocked ? (
              <>
                <span className="material-symbols-outlined text-[15px]">gps_fixed</span>
                <span>Live GPS Locked</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[15px]">my_location</span>
                <span>Use My Live Location</span>
              </>
            )}
          </button>
        </div>

        {/* Leaflet Map Canvas */}
        <div className="relative w-full h-[220px] sm:h-[260px] bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Map Overlay Hint */}
          <div className="absolute top-2 left-2 z-[400] bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-medium px-2.5 py-1 rounded-full shadow-md pointer-events-none flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Tap anywhere to reposition pickup pin</span>
          </div>

          {/* Reverse Geocoding Indicator */}
          {isReverseGeocoding && (
            <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5 border border-slate-200">
              <span className="material-symbols-outlined animate-spin text-[14px] text-primary">sync</span>
              <span>Fetching street address...</span>
            </div>
          )}
        </div>

        {/* GPS Info & Status Bar */}
        {gpsLocked && gpsCoords && (
          <div className="p-3 bg-emerald-50/70 border-t border-emerald-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-950">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>
                <strong>Precise Coordinates:</strong> {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}
                {gpsCoords.accuracy ? ` (±${gpsCoords.accuracy}m)` : ''}
              </span>
            </div>

            <a
              href={`https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 text-[11px] underline"
            >
              <span>Preview Google Maps</span>
              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
            </a>
          </div>
        )}

        {gpsError && (
          <div className="p-2.5 bg-red-50 border-t border-red-200 text-xs text-red-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
            <span>{gpsError}</span>
          </div>
        )}
      </div>

      {/* Room / House / Apartment Number & Landmark Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-secondary">meeting_room</span>
            <span>Room / House / Apartment No.</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Room 204, 2nd Floor"
            value={houseNumber}
            onChange={(e) => onChangeHouseNumber?.(e.target.value)}
            className="w-full bg-[#F1F5F9] rounded-lg px-3.5 py-3 text-sm text-on-surface border border-transparent focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-tertiary">notes</span>
            <span>Pickup Notes / Landmark</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Near the main water dispenser"
            value={pickupInstructions}
            onChange={(e) => onChangePickupInstructions?.(e.target.value)}
            className="w-full bg-[#F1F5F9] rounded-lg px-3.5 py-3 text-sm text-on-surface border border-transparent focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>
    </div>
  );
}
