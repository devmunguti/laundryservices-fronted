import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi } from '../api/orderApi';
import LiveNavigationMap from '../components/navigation/LiveNavigationMap';
import {
  fetchRoadRoute,
  getHaversineDistanceKm,
  getBearing,
  formatDistance,
  formatEta
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

  // Live Driver Position & Navigation State
  const [driverPosition, setDriverPosition] = useState(null);
  const [destinationPosition, setDestinationPosition] = useState(null);
  const [heading, setHeading] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [autoFollow, setAutoFollow] = useState(true);

  // Route & Turn-by-Turn Maneuvers
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [etaMinutes, setEtaMinutes] = useState(0);
  const [routeSteps, setRouteSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Simulation Mode State (for testing on desktop)
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationIntervalRef = useRef(null);
  const simWaypointIndexRef = useRef(0);

  // Watch position geolocation ref
  const watchIdRef = useRef(null);
  const isMountedRef = useRef(true);

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
        // Priority: 1. Customer live GPS coordinates, 2. campus hub preset, 3. Nairobi fallback
        let destLat = ord.pickupAddress?.coordinates?.lat;
        let destLng = ord.pickupAddress?.coordinates?.lng;

        if (!destLat || !destLng) {
          // Approximate University/Campus coordinates
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

  // Start Real Browser Geolocation Tracking
  useEffect(() => {
    if (!navigator.geolocation || isSimulating) return;

    // Get immediate position first
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const initPos = [lat, lng];
        setDriverPosition(initPos);
        setSpeed(pos.coords.speed ? pos.coords.speed * 3.6 : 0); // m/s to km/h
      },
      () => {
        // Fallback offset near destination for initial route calculation
        if (destinationPosition) {
          setDriverPosition([destinationPosition[0] - 0.012, destinationPosition[1] - 0.008]);
        } else {
          setDriverPosition(NAIROBI_DEFAULT);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // Watch position continuously
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (!isMountedRef.current || isSimulating) return;
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
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

        // Stream live position to backend for customer tracking
        orderApi.updateProviderLiveLocation(orderId, {
          coordinates: {
            lat: newLat,
            lng: newLng,
            accuracy: pos.coords.accuracy,
            heading: newHeading,
            speed: newSpeed
          },
          isNavigating: true,
          currentLeg: order?.status === 'Out_For_Delivery' ? 'delivery' : 'pickup'
        }).catch(() => {});
      },
      (err) => {
        console.warn('Geolocation watch error:', err.message);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [destinationPosition, isSimulating, orderId, order?.status]);

  // Compute Turn-by-Turn Road Route when Driver & Destination positions are available
  useEffect(() => {
    if (!driverPosition || !destinationPosition) return;

    let isSubscribed = true;
    const calculateRoute = async () => {
      const routeData = await fetchRoadRoute(driverPosition, destinationPosition);
      if (!isSubscribed) return;

      setRouteCoordinates(routeData.coordinates);
      setDistanceKm(routeData.distanceKm);
      setEtaMinutes(routeData.durationMinutes);
      setRouteSteps(routeData.steps);
      setCurrentStepIndex(0);
    };

    calculateRoute();

    return () => {
      isSubscribed = false;
    };
  }, [destinationPosition]); // Only recalculate full path on destination change or init

  // Recalculate Distance and ETA as driver position updates
  useEffect(() => {
    if (!driverPosition || !destinationPosition) return;
    const dist = getHaversineDistanceKm(
      driverPosition[0],
      driverPosition[1],
      destinationPosition[0],
      destinationPosition[1]
    );
    setDistanceKm(Number(dist.toFixed(2)));
    setEtaMinutes(Math.max(1, Math.round((dist / 28) * 60)));
  }, [driverPosition, destinationPosition]);

  // Simulated Drive Handler (for test drive / preview on desktop)
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
        setStatusSuccessMsg('You have arrived at the customer destination!');
        setTimeout(() => setStatusSuccessMsg(''), 4000);
        return;
      }

      const currentPoint = routeCoordinates[simWaypointIndexRef.current];
      const nextPoint = routeCoordinates[simWaypointIndexRef.current + 1];

      const stepBearing = getBearing(currentPoint[0], currentPoint[1], nextPoint[0], nextPoint[1]);
      setHeading(stepBearing);
      setDriverPosition(nextPoint);
      setSpeed(Math.floor(25 + Math.random() * 15)); // Simulated 25 - 40 km/h

      // Sync simulated coordinates to backend
      orderApi.updateProviderLiveLocation(orderId, {
        coordinates: {
          lat: nextPoint[0],
          lng: nextPoint[1],
          heading: stepBearing,
          speed: 30
        },
        isNavigating: true,
        currentLeg: order?.status === 'Out_For_Delivery' ? 'delivery' : 'pickup'
      }).catch(() => {});

      simWaypointIndexRef.current += 1;
    }, 1200);
  };

  // Quick Order Status Transitions from Driver Mode
  const handleUpdateStatus = async (newStatus, msg) => {
    try {
      setStatusUpdating(true);
      const res = await orderApi.updateOrderStatus(order._id || order.id, newStatus);
      if (res.success) {
        setStatusSuccessMsg(msg || `Status updated to ${newStatus.replace(/_/g, ' ')}`);
        await fetchOrder();
        setTimeout(() => setStatusSuccessMsg(''), 3500);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-['Inter']">
        <div className="w-14 h-14 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-4"></div>
        <h2 className="font-bold text-lg">Initializing Uber-Style Navigation...</h2>
        <p className="text-xs text-slate-400 mt-1">Acquiring GPS satellites and calculating optimal route.</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-['Inter']">
        <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-2xl">error</span>
        </div>
        <h2 className="font-bold text-lg mb-1">{error || 'Order Not Found'}</h2>
        <button
          onClick={() => navigate('/provider/orders')}
          className="mt-4 px-5 py-2.5 bg-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
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
  const currentStep = routeSteps[currentStepIndex] || {
    instruction: `Head to ${campusHub}`,
    maneuver: 'straight',
    distance: formatDistance(distanceKm)
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-['Inter'] text-slate-900 select-none">
      {/* ── Top Turn-by-Turn Next Maneuver Bar (Uber Driver Style) ── */}
      <div className="absolute top-4 left-4 right-4 z-30 max-w-xl mx-auto animate-fade-in">
        <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-slate-700/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
              <span className="material-symbols-outlined text-3xl font-bold">
                {currentStep.maneuver === 'turn_left' ? 'turn_left' : currentStep.maneuver === 'turn_right' ? 'turn_right' : 'straight'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl text-emerald-400 font-mono tracking-tight">
                  {formatDistance(distanceKm)}
                </span>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">remaining</span>
              </div>
              <p className="text-xs font-semibold text-slate-200 line-clamp-1 mt-0.5">
                {currentStep.instruction}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/provider/orders')}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Exit Navigation"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
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

      {/* ── Floating Controls (Right Side) ── */}
      <div className="absolute right-4 top-28 z-20 flex flex-col gap-2.5">
        {/* Recenter Camera */}
        <button
          type="button"
          onClick={() => setAutoFollow(true)}
          className={`w-11 h-11 rounded-2xl shadow-xl flex items-center justify-center transition-all cursor-pointer ${
            autoFollow ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
          title="Recenter On Driver"
        >
          <span className="material-symbols-outlined text-[22px]">my_location</span>
        </button>

        {/* Simulate Drive Button */}
        <button
          type="button"
          onClick={handleToggleSimulateDrive}
          className={`px-3 py-2 rounded-2xl shadow-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
            isSimulating ? 'bg-amber-500 text-white animate-pulse' : 'bg-white text-slate-800 hover:bg-slate-50'
          }`}
          title="Test simulated drive along route"
        >
          <span className="material-symbols-outlined text-[18px]">
            {isSimulating ? 'stop_circle' : 'play_circle'}
          </span>
          <span className="hidden sm:inline">{isSimulating ? 'Stop Sim' : 'Simulate'}</span>
        </button>
      </div>

      {/* ── Status Success Toast ── */}
      {statusSuccessMsg && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{statusSuccessMsg}</span>
        </div>
      )}

      {/* ── Bottom Driver HUD & Order Actions Card ── */}
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

          {/* Navigation Metrics Ribbon */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Distance</span>
              <span className="font-black text-base text-slate-900 font-mono">{formatDistance(distanceKm)}</span>
            </div>
            <div className="border-x border-slate-200/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Arrival ETA</span>
              <span className="font-black text-base text-blue-600 font-mono">{formatEta(etaMinutes)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Speed</span>
              <span className="font-black text-base text-emerald-700 font-mono">{Math.round(speed)} km/h</span>
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
