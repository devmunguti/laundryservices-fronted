/**
 * Routing & Navigation Service (Google Maps Style)
 * Calculates shortest driving routes, turn-by-turn maneuvers, Haversine distances,
 * ETAs, speech audio guidance, and route interpolation.
 */

// Calculate great-circle distance between two GPS points in kilometers (Haversine Formula)
export function getHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371; // Earth radius in km
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
  if (startLat == null || startLng == null || destLat == null || destLng == null) return 0;
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

// Convert bearing in degrees into readable compass direction & icon
export function getCompassDirection(bearing) {
  if (bearing == null || isNaN(bearing)) return { label: 'North', icon: 'north', degrees: 0 };
  const deg = (bearing % 360 + 360) % 360;
  if (deg >= 337.5 || deg < 22.5) return { label: 'North', icon: 'north', degrees: Math.round(deg) };
  if (deg >= 22.5 && deg < 67.5) return { label: 'North-East', icon: 'north_east', degrees: Math.round(deg) };
  if (deg >= 67.5 && deg < 112.5) return { label: 'East', icon: 'east', degrees: Math.round(deg) };
  if (deg >= 112.5 && deg < 157.5) return { label: 'South-East', icon: 'south_east', degrees: Math.round(deg) };
  if (deg >= 157.5 && deg < 202.5) return { label: 'South', icon: 'south', degrees: Math.round(deg) };
  if (deg >= 202.5 && deg < 247.5) return { label: 'South-West', icon: 'south_west', degrees: Math.round(deg) };
  if (deg >= 247.5 && deg < 292.5) return { label: 'West', icon: 'west', degrees: Math.round(deg) };
  return { label: 'North-West', icon: 'north_west', degrees: Math.round(deg) };
}

// Format distance nicely: "450 m" or "2.3 km"
export function formatDistance(distanceKm) {
  if (distanceKm == null || isNaN(distanceKm)) return '—';
  if (distanceKm < 1) {
    const meters = Math.max(10, Math.round(distanceKm * 1000));
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

// Format ETA in minutes/hours
export function formatEta(minutes) {
  if (minutes == null || isNaN(minutes) || minutes <= 0) return 'Arrived';
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hrs}h ${mins}m`;
}

// Format arrival clock time (e.g., "10:35 AM")
export function formatArrivalTime(minutesFromNow) {
  const d = new Date(Date.now() + Math.max(0, (minutesFromNow || 0) * 60000));
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Text-to-Speech (Voice Guidance like Google Maps Navigation)
 */
let lastSpokenText = '';
export function speakManeuver(text) {
  if (!('speechSynthesis' in window) || !text || text === lastSpokenText) return;
  try {
    window.speechSynthesis.cancel(); // Stop prior speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';
    lastSpokenText = text;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis error:', e);
  }
}

/**
 * Fetch real shortest turn-by-turn road route via public OSRM driving API with fallback
 * @param {[number, number]} start [lat, lng]
 * @param {[number, number]} end [lat, lng]
 */
export async function fetchRoadRoute(start, end) {
  const [startLat, startLng] = start;
  const [endLat, endLng] = end;

  // Fallback direct interpolated points
  const fallbackDistanceKm = getHaversineDistanceKm(startLat, startLng, endLat, endLng);
  const fallbackEtaMinutes = Math.max(1, Math.round((fallbackDistanceKm / 28) * 60)); // Avg 28 km/h urban speed

  const directPoints = generateInterpolatedWaypoints([startLat, startLng], [endLat, endLng], 25);
  const fallbackResult = {
    coordinates: directPoints,
    distanceKm: Number(fallbackDistanceKm.toFixed(2)),
    durationMinutes: fallbackEtaMinutes,
    steps: [
      {
        instruction: 'Head towards destination along main campus route',
        maneuver: 'straight',
        distance: formatDistance(fallbackDistanceKm),
        street: 'Campus Road',
        location: [startLat, startLng]
      },
      {
        instruction: 'Arrive at client pickup / delivery spot',
        maneuver: 'flag',
        distance: '0 m',
        street: 'Destination',
        location: [endLat, endLng]
      }
    ]
  };

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true&annotations=true`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

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
        const modifier = (st.maneuver?.modifier || '').toLowerCase();
        let maneuverIcon = 'straight';

        if (type === 'arrive') maneuverIcon = 'flag';
        else if (modifier.includes('sharp left')) maneuverIcon = 'turn_sharp_left';
        else if (modifier.includes('sharp right')) maneuverIcon = 'turn_sharp_right';
        else if (modifier.includes('slight left')) maneuverIcon = 'turn_slight_left';
        else if (modifier.includes('slight right')) maneuverIcon = 'turn_slight_right';
        else if (modifier.includes('left')) maneuverIcon = 'turn_left';
        else if (modifier.includes('right')) maneuverIcon = 'turn_right';
        else if (modifier.includes('uturn')) maneuverIcon = 'u_turn_left';
        else if (type.includes('roundabout')) maneuverIcon = 'roundabout_right';

        let instruction = '';
        const streetName = st.name || '';

        if (type === 'arrive') {
          instruction = 'Arrive at destination';
        } else if (type === 'depart') {
          instruction = streetName ? `Head out on ${streetName}` : 'Head towards destination';
        } else if (modifier) {
          instruction = `${capitalize(modifier)} onto ${streetName || 'Road'}`;
        } else {
          instruction = `Continue straight on ${streetName || 'the road'}`;
        }

        steps.push({
          instruction,
          maneuver: maneuverIcon,
          distance: formatDistance(st.distance / 1000),
          distanceMeters: st.distance,
          street: streetName || 'Main Route',
          location: st.maneuver?.location ? [st.maneuver.location[1], st.maneuver.location[0]] : null
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
