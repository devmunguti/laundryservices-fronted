import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * LiveNavigationMap - Interactive Leaflet Map for Real-Time Driver Navigation
 * Features:
 * - Real-time vehicle marker with heading rotation and speed indicator
 * - Destination target pin with pulse ring
 * - Google-Maps-style dual-layer road polyline (glowing casing + vibrant center)
 * - Auto-follow driver mode and smooth camera panning
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
  nextManeuverPoint = null,
  className = 'w-full h-full'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const nextTurnMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const routeGlowPolylineRef = useRef(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter = driverPosition || destinationPosition || [-1.286389, 36.817223];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 16,
        zoomControl: false,
        attributionControl: false
      });

      // CartoDB Voyager tiles (crisp, modern navigation aesthetic)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Sleek zoom controls on top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        driverMarkerRef.current = null;
        destMarkerRef.current = null;
        nextTurnMarkerRef.current = null;
        routePolylineRef.current = null;
        routeGlowPolylineRef.current = null;
      }
    };
  }, []);

  // Update Destination Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !destinationPosition) return;

    const [lat, lng] = destinationPosition;

    const destIcon = L.divIcon({
      className: 'custom-dest-marker',
      html: `
        <div class="relative flex flex-col items-center -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div class="absolute w-12 h-12 bg-emerald-500/25 rounded-full animate-ping pointer-events-none"></div>
          <div class="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-full shadow-2xl border-2 border-white flex items-center justify-center text-white font-bold text-sm">
            <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">home</span>
          </div>
          <div class="mt-1 bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap border border-white/20">
            ${destinationSubLabel || destinationLabel || 'Destination'}
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    if (!destMarkerRef.current) {
      destMarkerRef.current = L.marker([lat, lng], { icon: destIcon }).addTo(map);
    } else {
      destMarkerRef.current.setLatLng([lat, lng]);
      destMarkerRef.current.setIcon(destIcon);
    }
  }, [destinationPosition, destinationLabel, destinationSubLabel]);

  // Update Driver Vehicle Marker & Heading
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !driverPosition) return;

    const [lat, lng] = driverPosition;

    const driverHtml = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
        <div class="absolute w-14 h-14 bg-blue-500/25 rounded-full animate-pulse pointer-events-none"></div>
        <div class="w-11 h-11 bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 rounded-full shadow-2xl border-2 border-white flex items-center justify-center text-white transition-transform duration-300 ease-out" style="transform: rotate(${heading}deg);">
          <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">navigation</span>
        </div>
        ${
          speed > 0
            ? `<div class="absolute -top-6 bg-slate-900/90 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap">${Math.round(
                speed
              )} km/h</div>`
            : ''
        }
      </div>
    `;

    if (!driverMarkerRef.current) {
      const driverIcon = L.divIcon({
        className: 'custom-driver-marker',
        html: driverHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
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

  // Render & Update Google-Maps-Style Turn-by-Turn Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeCoordinates && routeCoordinates.length > 1) {
      // Background glow polyline (Google Maps outer border)
      if (!routeGlowPolylineRef.current) {
        routeGlowPolylineRef.current = L.polyline(routeCoordinates, {
          color: '#1d4ed8',
          weight: 9,
          opacity: 0.4,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);
      } else {
        routeGlowPolylineRef.current.setLatLngs(routeCoordinates);
      }

      // Foreground vibrant polyline (Google Maps road path)
      if (!routePolylineRef.current) {
        routePolylineRef.current = L.polyline(routeCoordinates, {
          color: '#2563eb',
          weight: 5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);
      } else {
        routePolylineRef.current.setLatLngs(routeCoordinates);
      }

      // If auto-follow is disabled, fit the entire road route into view
      if (!autoFollow && driverPosition && destinationPosition) {
        const bounds = L.latLngBounds(routeCoordinates);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
      }
    }
  }, [routeCoordinates, autoFollow, driverPosition, destinationPosition]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
}
