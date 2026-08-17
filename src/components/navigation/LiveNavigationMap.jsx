import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * LiveNavigationMap - Interactive Leaflet Map for Real-Time Driver Navigation
 * Renders live driver vehicle marker with heading rotation, destination home pin,
 * and animated turn-by-turn road polyline.
 */
export default function LiveNavigationMap({
  driverPosition,
  destinationPosition,
  routeCoordinates = [],
  heading = 0,
  speed = 0,
  autoFollow = true,
  destinationLabel = 'Customer Destination',
  destinationSubLabel = '',
  className = 'w-full h-full'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const routeGlowPolylineRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter = driverPosition || destinationPosition || [-1.286389, 36.817223]; // Nairobi default

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 15,
        zoomControl: false,
        attributionControl: false
      });

      // Add modern clean CartoDB Voyager tiles (crisp & high performance)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Add sleek zoom control on right
      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Destination Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !destinationPosition) return;

    const [lat, lng] = destinationPosition;

    if (!destMarkerRef.current) {
      const destIcon = L.divIcon({
        className: 'custom-dest-marker',
        html: `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
            <div class="absolute w-10 h-10 bg-emerald-500/20 rounded-full animate-ping pointer-events-none"></div>
            <div class="w-9 h-9 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-full shadow-lg border-2 border-white flex items-center justify-center text-white font-bold text-sm">
              <span class="material-symbols-outlined text-[18px]">home</span>
            </div>
            <div class="absolute -bottom-6 bg-slate-900/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
              ${destinationSubLabel || 'Target'}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      destMarkerRef.current = L.marker([lat, lng], { icon: destIcon }).addTo(map);
      destMarkerRef.current.bindPopup(`
        <div class="p-1 font-sans text-xs">
          <strong class="text-emerald-700 block">${destinationLabel}</strong>
          <span class="text-slate-600">${destinationSubLabel}</span>
        </div>
      `);
    } else {
      destMarkerRef.current.setLatLng([lat, lng]);
    }
  }, [destinationPosition, destinationLabel, destinationSubLabel]);

  // Update Driver Marker & Heading
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !driverPosition) return;

    const [lat, lng] = driverPosition;

    const driverHtml = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
        <div class="absolute w-12 h-12 bg-blue-500/20 rounded-full animate-pulse pointer-events-none"></div>
        <div class="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full shadow-xl border-2 border-white flex items-center justify-center text-white transition-transform duration-300" style="transform: rotate(${heading}deg);">
          <span class="material-symbols-outlined text-[22px]">navigation</span>
        </div>
        ${speed > 0 ? `<div class="absolute -top-5 bg-blue-700 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow-xs">${Math.round(speed)} km/h</div>` : ''}
      </div>
    `;

    if (!driverMarkerRef.current) {
      const driverIcon = L.divIcon({
        className: 'custom-driver-marker',
        html: driverHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      driverMarkerRef.current = L.marker([lat, lng], { icon: driverIcon, zIndexOffset: 1000 }).addTo(map);
    } else {
      driverMarkerRef.current.setLatLng([lat, lng]);
      const iconElement = driverMarkerRef.current.getElement();
      if (iconElement) {
        iconElement.innerHTML = driverHtml;
      }
    }

    if (autoFollow) {
      map.panTo([lat, lng], { animate: true, duration: 0.8 });
    }
  }, [driverPosition, heading, speed, autoFollow]);

  // Render & Update Turn-by-Turn Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeCoordinates && routeCoordinates.length > 1) {
      // Background glow polyline
      if (!routeGlowPolylineRef.current) {
        routeGlowPolylineRef.current = L.polyline(routeCoordinates, {
          color: '#0052ff',
          weight: 9,
          opacity: 0.35,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);
      } else {
        routeGlowPolylineRef.current.setLatLngs(routeCoordinates);
      }

      // Foreground sharp polyline
      if (!routePolylineRef.current) {
        routePolylineRef.current = L.polyline(routeCoordinates, {
          color: '#0052ff',
          weight: 5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);
      } else {
        routePolylineRef.current.setLatLngs(routeCoordinates);
      }

      // If neither auto-following driver strictly, fit bounds to entire route
      if (!autoFollow) {
        const bounds = L.latLngBounds(routeCoordinates);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    }
  }, [routeCoordinates, autoFollow]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
}
