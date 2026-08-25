import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { orderApi } from '../api/orderApi';
import LiveNavigationMap from '../components/navigation/LiveNavigationMap';
import {
  fetchRoadRoute,
  getHaversineDistanceKm,
  getBearing,
  getCompassDirection,
  formatDistance,
  formatEta,
  formatArrivalTime,
  speakManeuver
} from '../services/routingService';

// Default Nairobi Central coordinates fallback
const NAIROBI_DEFAULT = [-1.286389, 36.817223];

export default function ProviderNavigationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  // Order Data & Loading State
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Live Driver / Cleaner Position & Detection State
  const [driverPosition, setDriverPosition] = useState(null);
  const [cleanerLocationName, setCleanerLocationName] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [gpsLocked, setGpsLocked] = useState(false);

  // Destination State
  const [destinationPosition, setDestinationPosition] = useState(null);
  const [heading, setHeading] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [accuracy, setAccuracy] = useState(null);
  const [autoFollow, setAutoFollow] = useState(true);

  // Route & Turn-by-Turn Maneuvers
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [etaMinutes, setEtaMinutes] = useState(0);
  const [routeSteps, setRouteSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Voice Guidance (Speech Assistant)
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Search / Change Starting Point State
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [startSearchQuery, setStartSearchQuery] = useState('');
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [isSearchingStart, setIsSearchingStart] = useState(false);

  // Simulation Mode State (for testing on desktop)
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationIntervalRef = useRef(null);
  const simWaypointIndexRef = useRef(0);

  // Watch position geolocation ref
  const watchIdRef = useRef(null);
  const isMountedRef = useRef(true);
  const lastSyncTimeRef = useRef(0);
  const lastRouteCalcPosRef = useRef(null);

  // Status Action Loading
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusSuccessMsg, setStatusSuccessMsg] = useState('');

  // Fetch Order Details
  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await orderApi.getOrderById(orderId);
      if (res.success && res.data) {
        const ord = res.data;
        setOrder(ord);

        // Determine destination GPS coordinates
        // Priority: 1. Customer live GPS coordinates, 2. campus hub preset, 3. Nairobi default
        let destLat = ord.pickupAddress?.coordinates?.lat;
        let destLng = ord.pickupAddress?.coordinates?.lng;

        if (!destLat || !destLng) {
          destLat = -1.2804;
          destLng = 36.8163;
        }

        setDestinationPosition([destLat, destLng]);
      } else {
        setError(res.message || 'Order not found.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order navigation details.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchOrder();
    return () => {
      isMountedRef.current = false;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [fetchOrder]);

  // Sync Provider Location to Backend (Debounced)
  const syncLocationToBackend = useCallback(
    (coords, curSpeed, curHeading) => {
      const now = Date.now();
      if (now - lastSyncTimeRef.current < 3000) return;
      lastSyncTimeRef.current = now;

      orderApi
        .updateProviderLiveLocation(orderId, {
          coordinates: {
            lat: coords[0],
            lng: coords[1],
            accuracy: coords[2] || 10,
            heading: curHeading || 0,
            speed: curSpeed || 0
          },
          isNavigating: true,
          currentLeg: order?.status === 'Out_For_Delivery' ? 'delivery' : 'pickup'
        })
        .catch(() => {});
    },
    [orderId, order?.status]
  );

  // Reverse Geocode Cleaner Location to get human-readable spot
  const reverseGeocodeCleanerLocation = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: { 'Accept-Language': 'en' }
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data) {
          const spotName =
            data.address?.amenity ||
            data.address?.building ||
            data.address?.road ||
            data.address?.suburb ||
            data.name ||
            data.display_name?.split(',')[0] ||
            'Detected Current Spot';
          setCleanerLocationName(spotName);
        }
      }
    } catch (e) {
      console.warn('Reverse geocode error:', e);
    }
  };

  // Explicit Cleaner Location Detection Function
  const detectCleanerLocation = useCallback(() => {
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const curAccuracy = Math.round(pos.coords.accuracy);
        const curSpeed = pos.coords.speed ? pos.coords.speed * 3.6 : 0;
        const curHeading = pos.coords.heading || 0;

        const newPos = [lat, lng];
        setDriverPosition(newPos);
        setAccuracy(curAccuracy);
        setSpeed(curSpeed);
        if (curHeading) setHeading(curHeading);
        setGpsLocked(true);
        setIsDetectingLocation(false);

        // Fetch spot name
        reverseGeocodeCleanerLocation(lat, lng);

        // Sync to backend
        syncLocationToBackend([lat, lng, curAccuracy], curSpeed, curHeading);
      },
      (err) => {
        setIsDetectingLocation(false);
        if (err.code === 1) {
          setGpsError('Location permission denied. Please allow location access in your browser or search starting spot.');
        } else if (err.code === 2) {
          setGpsError('Position unavailable. Please search your current location or tap the map.');
        } else {
          setGpsError('Location request timed out. Retrying...');
        }

        // Fallback offset near destination if not already set
        if (!driverPosition) {
          if (destinationPosition) {
            const fallbackPos = [destinationPosition[0] - 0.012, destinationPosition[1] - 0.008];
            setDriverPosition(fallbackPos);
            reverseGeocodeCleanerLocation(fallbackPos[0], fallbackPos[1]);
          } else {
            setDriverPosition(NAIROBI_DEFAULT);
          }
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, [destinationPosition, driverPosition, syncLocationToBackend]);

  // Initial Location Detection on Component Load
  useEffect(() => {
    if (!isSimulating) {
      detectCleanerLocation();
    }
  }, [detectCleanerLocation, isSimulating]);

  // Continuous Geolocation Tracking Watcher
  useEffect(() => {
    if (!navigator.geolocation || isSimulating) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (!isMountedRef.current || isSimulating) return;
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        const curAccuracy = Math.round(pos.coords.accuracy);
        const newSpeed = pos.coords.speed ? pos.coords.speed * 3.6 : 0;
        const newHeading = pos.coords.heading || 0;

        setDriverPosition((prev) => {
          if (prev) {
            const calculatedBearing = getBearing(prev[0], prev[1], newLat, newLng);
            if (calculatedBearing !== 0) setHeading(calculatedBearing);
          }
          return [newLat, newLng];
        });

        if (newHeading) setHeading(newHeading);
        setSpeed(newSpeed);
        setAccuracy(curAccuracy);
        setGpsLocked(true);

        syncLocationToBackend([newLat, newLng, curAccuracy], newSpeed, newHeading);
      },
      (err) => {
        console.warn('Geolocation continuous watch notice:', err.message);
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 12000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isSimulating, syncLocationToBackend]);

  // Compute Shortest Road Route & Live Direction when Driver or Destination Updates
  useEffect(() => {
    if (!driverPosition || !destinationPosition) return;

    const lastPos = lastRouteCalcPosRef.current;
    if (lastPos) {
      const movedDistance = getHaversineDistanceKm(lastPos[0], lastPos[1], driverPosition[0], driverPosition[1]);
      if (movedDistance < 0.035) {
        const dist = getHaversineDistanceKm(
          driverPosition[0],
          driverPosition[1],
          destinationPosition[0],
          destinationPosition[1]
        );
        setDistanceKm(Number(dist.toFixed(2)));
        setEtaMinutes(Math.max(1, Math.round((dist / 28) * 60)));
        return;
      }
    }

    lastRouteCalcPosRef.current = driverPosition;
    let isSubscribed = true;

    const calculateRoute = async () => {
      const routeData = await fetchRoadRoute(driverPosition, destinationPosition);
      if (!isSubscribed) return;

      setRouteCoordinates(routeData.coordinates);
      setDistanceKm(routeData.distanceKm);
      setEtaMinutes(routeData.durationMinutes);
      setRouteSteps(routeData.steps);

      if (routeData.steps && routeData.steps[0] && voiceEnabled) {
        speakManeuver(routeData.steps[0].instruction);
      }
    };

    calculateRoute();

    return () => {
      isSubscribed = false;
    };
  }, [driverPosition, destinationPosition, voiceEnabled]);

  // Progress Turn-by-Turn Steps as Driver Moves
  useEffect(() => {
    if (!driverPosition || routeSteps.length === 0) return;

    const nextStep = routeSteps[currentStepIndex + 1];
    if (nextStep && nextStep.location) {
      const distToNextStepKm = getHaversineDistanceKm(
        driverPosition[0],
        driverPosition[1],
        nextStep.location[0],
        nextStep.location[1]
      );

      if (distToNextStepKm < 0.03) {
        const nextIdx = currentStepIndex + 1;
        setCurrentStepIndex(nextIdx);
        if (voiceEnabled && routeSteps[nextIdx]) {
          speakManeuver(routeSteps[nextIdx].instruction);
        }
      }
    }
  }, [driverPosition, routeSteps, currentStepIndex, voiceEnabled]);

  // Place Search Debounce for Changing Starting Position
  useEffect(() => {
    if (!startSearchQuery.trim() || startSearchQuery.trim().length < 2) {
      setStartSuggestions([]);
      setIsSearchingStart(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingStart(true);
      try {
        const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          startSearchQuery.trim()
        )}&countrycodes=ke&limit=5&addressdetails=1`;
        const res = await fetch(endpoint, { headers: { 'Accept-Language': 'en' } });
        if (res.ok) {
          const data = await res.json();
          setStartSuggestions(data || []);
        }
      } catch (err) {
        console.warn('Start place search warning:', err);
      } finally {
        setIsSearchingStart(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [startSearchQuery]);

  const handleSelectStartSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const name = item.display_name.split(',')[0];

    setDriverPosition([lat, lon]);
    setCleanerLocationName(name);
    setShowLocationSearch(false);
    setStartSearchQuery('');
    setGpsLocked(true);
    syncLocationToBackend([lat, lon, 10], 0, 0);
  };

  // Simulated Drive Handler (for Testing & Demonstration)
  const handleToggleSimulateDrive = () => {
    if (isSimulating) {
      setIsSimulating(false);
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
      return;
    }

    if (routeCoordinates.length < 2) return;

    setIsSimulating(true);
    simWaypointIndexRef.current = 0;

    simulationIntervalRef.current = setInterval(() => {
      if (simWaypointIndexRef.current >= routeCoordinates.length - 1) {
        clearInterval(simulationIntervalRef.current);
        setIsSimulating(false);
        setSpeed(0);
        setStatusSuccessMsg('You have arrived at the client destination!');
        if (voiceEnabled) speakManeuver('You have arrived at your destination.');
        setTimeout(() => setStatusSuccessMsg(''), 4500);
        return;
      }

      const currentPoint = routeCoordinates[simWaypointIndexRef.current];
      const nextPoint = routeCoordinates[simWaypointIndexRef.current + 1];

      const stepBearing = getBearing(currentPoint[0], currentPoint[1], nextPoint[0], nextPoint[1]);
      setHeading(stepBearing);
      setDriverPosition(nextPoint);
      setSpeed(Math.floor(28 + Math.random() * 12));

      syncLocationToBackend(nextPoint, 30, stepBearing);
      simWaypointIndexRef.current += 1;
    }, 1100);
  };

  // Quick Order Status Transitions from Driver Mode
  const handleUpdateStatus = async (newStatus, msg) => {
    try {
      setStatusUpdating(true);
      const res = await orderApi.updateOrderStatus(order._id || order.id, newStatus);
      if (res.success) {
        toast.success(msg || `Status updated to ${newStatus.replace(/_/g, ' ')}`);
        setStatusSuccessMsg(msg || `Status updated to ${newStatus.replace(/_/g, ' ')}`);
        await fetchOrder();
        setTimeout(() => setStatusSuccessMsg(''), 3500);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-['Inter']">
        <div className="w-14 h-14 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-4"></div>
        <h2 className="font-bold text-lg">Detecting Cleaner Location & Calculating Route...</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting to GPS satellites and loading Google Maps road data.</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-['Inter']">
        <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-2xl">error</span>
        </div>
        <h2 className="font-bold text-lg mb-1">{error || 'Order Not Found'}</h2>
        <p className="text-xs text-slate-400 max-w-sm text-center">
          Unable to find order navigation details for reference: <span className="font-mono text-blue-400">{orderId}</span>
        </p>
        <button
          onClick={() => navigate('/provider/orders')}
          className="mt-5 px-6 py-2.5 bg-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-lg cursor-pointer"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const customerName = order.customerDetails?.fullName || order.customer?.fullName || 'Customer';
  const customerPhone = order.customerDetails?.phone || order.customer?.phone || order.payment?.phoneNumber || '';
  const campusHub = order.pickupAddress?.campusLocation || order.pickupAddress?.street || 'Main Campus';
  const roomNumber = order.pickupAddress?.houseNumber || '';
  const pickupInstructions = order.pickupAddress?.instructions || order.notes || '';

  // Calculate live bearing & compass direction between cleaner and client
  const calculatedBearing = driverPosition && destinationPosition
    ? getBearing(driverPosition[0], driverPosition[1], destinationPosition[0], destinationPosition[1])
    : 0;
  const compass = getCompassDirection(calculatedBearing);

  const currentStep = routeSteps[currentStepIndex] || {
    instruction: `Proceed towards ${campusHub}`,
    maneuver: 'straight',
    distance: formatDistance(distanceKm)
  };
  const nextUpcomingStep = routeSteps[currentStepIndex + 1];

  // Google Maps External App URL
  const googleMapsUrl = driverPosition && destinationPosition
    ? `https://www.google.com/maps/dir/?api=1&origin=${driverPosition[0]},${driverPosition[1]}&destination=${destinationPosition[0]},${destinationPosition[1]}&travelmode=driving`
    : `https://maps.google.com/?q=${destinationPosition?.[0] || -1.286},${destinationPosition?.[1] || 36.817}`;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-['Inter'] text-slate-900 select-none">
      {/* ── Top Turn-by-Turn Next Maneuver Bar (Google Maps Style) ── */}
      <div className="absolute top-3 left-3 right-3 z-30 max-w-xl mx-auto animate-fade-in">
        <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-3xl p-4 shadow-2xl border border-slate-700/60 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              {/* Turn Icon */}
              <div className="w-13 h-13 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shrink-0 border border-emerald-400/30">
                <span className="material-symbols-outlined text-3xl font-black">
                  {currentStep.maneuver === 'turn_left'
                    ? 'turn_left'
                    : currentStep.maneuver === 'turn_right'
                    ? 'turn_right'
                    : currentStep.maneuver === 'turn_slight_left'
                    ? 'turn_slight_left'
                    : currentStep.maneuver === 'turn_slight_right'
                    ? 'turn_slight_right'
                    : currentStep.maneuver === 'u_turn_left'
                    ? 'u_turn_left'
                    : currentStep.maneuver === 'flag'
                    ? 'sports_score'
                    : 'straight'}
                </span>
              </div>

              {/* Maneuver Instruction & Distance */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-2xl text-emerald-400 font-mono tracking-tight">
                    {currentStep.distance || formatDistance(distanceKm)}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full border border-slate-700">
                    {currentStep.street || 'Shortest Route'}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-100 line-clamp-1 mt-0.5 leading-snug">
                  {currentStep.instruction}
                </p>
              </div>
            </div>

            {/* Voice & Close Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  voiceEnabled ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
                title={voiceEnabled ? 'Voice Guidance On' : 'Voice Guidance Muted'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {voiceEnabled ? 'volume_up' : 'volume_off'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/provider/orders')}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                title="Exit Navigation"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>

          {/* Cleaner Detected Location & Calculated Direction Ribbon */}
          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2 text-slate-300 truncate">
              <span className="flex items-center gap-1 text-emerald-400 font-bold shrink-0">
                <span className="material-symbols-outlined text-[14px]">my_location</span>
                <span>Cleaner Spot:</span>
              </span>
              <span className="text-slate-200 truncate font-medium">
                {cleanerLocationName || (driverPosition ? `${driverPosition[0].toFixed(4)}, ${driverPosition[1].toFixed(4)}` : 'Detecting...')}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-slate-800 text-blue-400 px-2 py-0.5 rounded-md font-bold text-[10px] border border-slate-700">
                <span className="material-symbols-outlined text-[13px]">{compass.icon}</span>
                <span>{compass.label} ({compass.degrees}°)</span>
              </div>

              {/* 1-Click Detect Cleaner Location Button */}
              <button
                type="button"
                onClick={detectCleanerLocation}
                disabled={isDetectingLocation}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-60"
                title="Detect & refresh cleaner GPS position"
              >
                <span className={`material-symbols-outlined text-[12px] ${isDetectingLocation ? 'animate-spin' : ''}`}>
                  {isDetectingLocation ? 'sync' : 'gps_fixed'}
                </span>
                <span>{isDetectingLocation ? 'Detecting...' : 'Detect GPS'}</span>
              </button>
            </div>
          </div>

          {/* Next upcoming maneuver preview pill */}
          {nextUpcomingStep && (
            <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-slate-500 font-semibold">Then:</span>
                <span className="text-slate-300 font-medium truncate">{nextUpcomingStep.instruction}</span>
              </div>
              <span className="text-slate-400 font-mono shrink-0 ml-2">{nextUpcomingStep.distance}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Map Canvas ── */}
      <div className="w-full h-full">
        <LiveNavigationMap
          driverPosition={driverPosition}
          destinationPosition={destinationPosition}
          routeCoordinates={routeCoordinates}
          heading={heading}
          speed={speed}
          autoFollow={autoFollow}
          destinationLabel={customerName}
          destinationSubLabel={roomNumber ? `${campusHub} (${roomNumber})` : campusHub}
          className="w-full h-full"
        />
      </div>

      {/* ── Floating Map Controls (Right Side) ── */}
      <div className="absolute right-4 top-48 z-20 flex flex-col gap-2.5">
        {/* Detect / Recenter Camera */}
        <button
          type="button"
          onClick={() => {
            setAutoFollow(true);
            detectCleanerLocation();
          }}
          className={`w-11 h-11 rounded-2xl shadow-xl flex items-center justify-center transition-all cursor-pointer ${
            autoFollow ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
          title="Detect Location & Recenter On Cleaner"
        >
          <span className="material-symbols-outlined text-[22px]">my_location</span>
        </button>

        {/* View Entire Route */}
        <button
          type="button"
          onClick={() => setAutoFollow(false)}
          className={`w-11 h-11 rounded-2xl shadow-xl flex items-center justify-center transition-all cursor-pointer ${
            !autoFollow ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
          title="Overview Entire Route"
        >
          <span className="material-symbols-outlined text-[22px]">route</span>
        </button>

        {/* Change Starting Point Search Toggle */}
        <button
          type="button"
          onClick={() => setShowLocationSearch(!showLocationSearch)}
          className={`w-11 h-11 rounded-2xl shadow-xl flex items-center justify-center transition-all cursor-pointer ${
            showLocationSearch ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
          title="Search / Adjust Starting Location"
        >
          <span className="material-symbols-outlined text-[20px]">edit_location</span>
        </button>

        {/* Open in Native Google Maps App */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="w-11 h-11 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 shadow-xl flex items-center justify-center transition-all cursor-pointer"
          title="Open in Google Maps App"
        >
          <span className="material-symbols-outlined text-[20px] text-blue-600">open_in_new</span>
        </a>

        {/* Simulate Drive Button */}
        <button
          type="button"
          onClick={handleToggleSimulateDrive}
          className={`px-3 py-2 rounded-2xl shadow-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
            isSimulating ? 'bg-amber-500 text-white animate-pulse' : 'bg-white text-slate-800 hover:bg-slate-50'
          }`}
          title="Test simulated drive along shortest road route"
        >
          <span className="material-symbols-outlined text-[18px]">
            {isSimulating ? 'stop_circle' : 'play_circle'}
          </span>
          <span className="hidden sm:inline">{isSimulating ? 'Stop Sim' : 'Simulate'}</span>
        </button>
      </div>

      {/* ── Search Starting Location Modal / Drawer ── */}
      {showLocationSearch && (
        <div className="absolute top-44 left-4 right-4 z-40 max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-4 border border-slate-200 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-indigo-600">edit_location</span>
              <span>Set Cleaner Starting Spot</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowLocationSearch(false)}
              className="text-slate-400 hover:text-slate-700 text-xs"
            >
              Close
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search current cleaner spot / hostel / estate..."
              value={startSearchQuery}
              onChange={(e) => setStartSearchQuery(e.target.value)}
              className="w-full bg-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none border border-transparent focus:bg-white focus:border-indigo-600 transition-all"
            />
            {isSearchingStart && (
              <span className="material-symbols-outlined animate-spin text-sm text-indigo-600 absolute right-3 top-3">
                sync
              </span>
            )}
          </div>

          {startSuggestions.length > 0 && (
            <div className="mt-2 divide-y divide-slate-100 max-h-48 overflow-y-auto rounded-xl border border-slate-100">
              {startSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectStartSuggestion(item)}
                  className="w-full text-left p-2 hover:bg-indigo-50 text-xs text-slate-800 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate">{item.display_name}</span>
                  <span className="material-symbols-outlined text-sm text-indigo-600 shrink-0 ml-2">check</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                detectCleanerLocation();
                setShowLocationSearch(false);
              }}
              className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">my_location</span>
              <span>Use Real GPS Satellite Fix</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Status Success Toast ── */}
      {statusSuccessMsg && (
        <div className="absolute top-44 left-1/2 -translate-x-1/2 z-40 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{statusSuccessMsg}</span>
        </div>
      )}

      {/* ── GPS Error Notice ── */}
      {gpsError && (
        <div className="absolute top-44 left-1/2 -translate-x-1/2 z-40 bg-amber-600 text-white px-4 py-2 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 max-w-sm text-center">
          <span className="material-symbols-outlined text-base shrink-0">warning</span>
          <span>{gpsError}</span>
        </div>
      )}

      {/* ── Bottom Google Maps HUD & Order Actions Card ── */}
      <div className="absolute bottom-4 left-4 right-4 z-30 max-w-xl mx-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-2xl border border-slate-200/80 flex flex-col gap-4">
          {/* Header Row: Customer, Campus Hub, ETA & Communication */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 font-mono text-[11px] font-black px-2 py-0.5 rounded-md">
                  {order.orderRef || `#ORD-${order._id?.slice(-6).toUpperCase()}`}
                </span>
                <span className="text-xs text-slate-500 font-semibold truncate">{order.items?.[0]?.name || 'Laundry'}</span>
                {accuracy && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                    GPS ±{accuracy}m
                  </span>
                )}
              </div>
              <h3 className="font-black text-base text-slate-900 mt-1 truncate">{customerName}</h3>
              <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5 truncate">
                <span className="material-symbols-outlined text-[15px] text-blue-600 shrink-0">location_on</span>
                <span><strong>{campusHub}</strong> {roomNumber && `• Room ${roomNumber}`}</span>
              </p>
              {pickupInstructions && (
                <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">
                  "{pickupInstructions}"
                </p>
              )}
            </div>

            {/* Quick Call & WhatsApp Floating Actions */}
            {customerPhone && (
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`tel:${customerPhone}`}
                  className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors"
                  title="Call Customer"
                >
                  <span className="material-symbols-outlined text-[20px]">call</span>
                </a>
                <a
                  href={`https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md hover:bg-emerald-700 transition-colors"
                  title="WhatsApp Customer"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                </a>
              </div>
            )}
          </div>

          {/* Navigation Metrics Ribbon (Google Maps Style) */}
          <div className="grid grid-cols-4 gap-2 bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Time</span>
              <span className="font-black text-base text-emerald-600 font-mono">{formatEta(etaMinutes)}</span>
            </div>
            <div className="border-l border-slate-200/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Distance</span>
              <span className="font-black text-base text-slate-900 font-mono">{formatDistance(distanceKm)}</span>
            </div>
            <div className="border-l border-slate-200/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">ETA</span>
              <span className="font-black text-base text-blue-600 font-mono">{formatArrivalTime(etaMinutes)}</span>
            </div>
            <div className="border-l border-slate-200/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Direction</span>
              <span className="font-black text-xs text-indigo-700 font-mono flex items-center justify-center gap-0.5 mt-0.5">
                <span className="material-symbols-outlined text-sm">{compass.icon}</span>
                <span>{compass.label.split('-')[0]}</span>
              </span>
            </div>
          </div>

          {/* ── Status Progression Action Buttons ── */}
          <div className="flex gap-2">
            {order.status === 'Pending' || order.status === 'Pickup_Scheduled' ? (
              <button
                type="button"
                disabled={statusUpdating}
                onClick={() => handleUpdateStatus('Picked_Up', 'Order marked as Picked Up! Head to laundry facility.')}
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">shopping_bag</span>
                <span>Confirm Items Picked Up</span>
              </button>
            ) : order.status === 'Picked_Up' ? (
              <button
                type="button"
                disabled={statusUpdating}
                onClick={() => handleUpdateStatus('In_Wash', 'Order status set to In Wash / Cleaning.')}
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">local_laundry_service</span>
                <span>Start Cleaning / In Wash</span>
              </button>
            ) : order.status === 'In_Wash' || order.status === 'Ready_For_Delivery' ? (
              <button
                type="button"
                disabled={statusUpdating}
                onClick={() => handleUpdateStatus('Out_For_Delivery', 'Delivery navigation started! Client notified.')}
                className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">electric_moped</span>
                <span>Start Delivery to Customer</span>
              </button>
            ) : order.status === 'Out_For_Delivery' ? (
              <button
                type="button"
                disabled={statusUpdating}
                onClick={() => handleUpdateStatus('Delivered', 'Order successfully Delivered!')}
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">task_alt</span>
                <span>Confirm Delivery Completed</span>
              </button>
            ) : (
              <div className="w-full text-center py-2 text-xs font-semibold text-slate-500">
                Order status: {order.status}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
