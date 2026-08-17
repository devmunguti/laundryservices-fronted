/**
 * Routing & Navigation Service
 * Calculates road waypoints, turn-by-turn maneuvers, Haversine distances, ETAs,
 * and handles route interpolation for simulated driving.
 */

// Calculate great-circle distance between two GPS points in kilometers (Haversine Formula)
export function getHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate bearing angle between two coordinates in degrees (0 - 360)
export function getBearing(startLat, startLng, destLat, destLng) {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// Format distance nicely: "450 m" or "2.3 km"
export function formatDistance(distanceKm) {
  if (distanceKm == null) return '—';
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

// Format ETA in minutes/hours
export function formatEta(minutes) {
  if (minutes == null || minutes <= 0) return 'Arrived';
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${Math.round(minutes)} mins`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hrs}h ${mins}m`;
}

/**
 * Fetch real turn-by-turn road route via public OSRM API with fallback
 * @param {[number, number]} start [lat, lng]
 * @param {[number, number]} end [lat, lng]
 */
export async function fetchRoadRoute(start, end) {
  const [startLat, startLng] = start;
  const [endLat, endLng] = end;

  // Fallback direct interpolated points
  const fallbackDistanceKm = getHaversineDistanceKm(startLat, startLng, endLat, endLng);
  const fallbackEtaMinutes = Math.max(2, Math.round((fallbackDistanceKm / 28) * 60)); // Avg 28 km/h urban speed

  const directPoints = generateInterpolatedWaypoints([startLat, startLng], [endLat, endLng], 20);
  const fallbackResult = {
    coordinates: directPoints,
    distanceKm: Number(fallbackDistanceKm.toFixed(2)),
    durationMinutes: fallbackEtaMinutes,
    steps: [
      {
        instruction: 'Head towards destination along main campus route',
        maneuver: 'straight',
        distance: formatDistance(fallbackDistanceKm),
        street: 'Campus Road'
      },
      {
        instruction: 'Arrive at destination pickup / delivery spot',
        maneuver: 'arrive',
        distance: '0 m',
        street: 'Destination'
      }
    ]
  };

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return fallbackResult;

    const data = await response.json();
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return fallbackResult;
    }

    const route = data.routes[0];
    const geoCoordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

    const steps = [];
    if (route.legs && route.legs[0] && route.legs[0].steps) {
      route.legs[0].steps.forEach((st) => {
        const type = st.maneuver?.type || 'straight';
        const modifier = st.maneuver?.modifier || '';
        let maneuverIcon = 'straight';

        if (type === 'arrive') maneuverIcon = 'flag';
        else if (modifier.includes('left')) maneuverIcon = 'turn_left';
        else if (modifier.includes('right')) maneuverIcon = 'turn_right';
        else if (modifier.includes('uturn')) maneuverIcon = 'u_turn_left';

        steps.push({
          instruction: st.maneuver?.instruction || `${capitalize(modifier || type)} onto ${st.name || 'Road'}`,
          maneuver: maneuverIcon,
          distance: formatDistance(st.distance / 1000),
          street: st.name || 'Campus Access Road'
        });
      });
    }

    return {
      coordinates: geoCoordinates.length > 0 ? geoCoordinates : directPoints,
      distanceKm: Number((route.distance / 1000).toFixed(2)),
      durationMinutes: Math.max(1, Math.round(route.duration / 60)),
      steps: steps.length > 0 ? steps : fallbackResult.steps
    };
  } catch (err) {
    return fallbackResult;
  }
}

// Generate smooth intermediate waypoints between start and destination
export function generateInterpolatedWaypoints(start, end, numPoints = 25) {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = start[0] + (end[0] - start[0]) * t;
    const lng = start[1] + (end[1] - start[1]) * t;
    points.push([lat, lng]);
  }
  return points;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
