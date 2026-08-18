import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { orderApi } from '../api/orderApi';
import { reviewApi } from '../api/reviewApi';
import LiveNavigationMap from '../components/navigation/LiveNavigationMap';
import { fetchRoadRoute, formatDistance, formatEta } from '../services/routingService';

// ─── Order Status Timeline Definition ─────────────────────────────────────────
// Matches the backend Order model enum exactly
const ORDER_STAGES = [
  { key: 'Pending', label: 'Order Placed', icon: 'check_circle', description: 'Your order has been received and payment confirmed.' },
  { key: 'Pickup_Scheduled', label: 'Pickup Scheduled', icon: 'event', description: 'A pickup time has been scheduled.' },
  { key: 'Picked_Up', label: 'Picked Up', icon: 'local_shipping', description: 'Your laundry has been collected.' },
  { key: 'In_Wash', label: 'In Wash', icon: 'local_laundry_service', description: 'Your laundry is being washed and cleaned.' },
  { key: 'Ready_For_Delivery', label: 'Ready for Delivery', icon: 'inventory_2', description: 'Your clean laundry is ready to be delivered.' },
  { key: 'Out_For_Delivery', label: 'Out for Delivery', icon: 'delivery_dining', description: 'Your laundry is on its way to you.' },
  { key: 'Delivered', label: 'Delivered', icon: 'done_all', description: 'Your laundry has been delivered successfully!' },
];

const CANCELLED_STAGE = { key: 'Cancelled', label: 'Cancelled', icon: 'cancel', description: 'This order has been cancelled.' };

// Terminal states — polling stops here
const TERMINAL_STATUSES = new Set(['Delivered', 'Cancelled']);

// Refresh interval in ms
const POLL_INTERVAL_MS = 15000;

// ─── Helper: derive stage index from status string ────────────────────────────
const getStageIndex = (status) => {
  const idx = ORDER_STAGES.findIndex(s => s.key === status);
  return idx;
};

// ─── Payment Status Badge ─────────────────────────────────────────────────────
function PaymentBadge({ status }) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'paid') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Paid
      </span>
    );
  }
  if (normalized === 'failed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
      Pending
    </span>
  );
}

// ─── Transaction Code Display ─────────────────────────────────────────────────
function TransactionCodeDisplay({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (code && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!code) {
    return (
      <span className="text-sm text-gray-400 italic">Not available yet</span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-base font-bold text-indigo-700 tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
        {code}
      </span>
      <button
        onClick={handleCopy}
        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        title="Copy transaction code"
      >
        <span className="material-symbols-outlined text-base text-gray-600">
          {copied ? 'check' : 'content_copy'}
        </span>
      </button>
    </div>
  );
}

// ─── Status Timeline Component ────────────────────────────────────────────────
function OrderStatusTimeline({ currentStatus, paymentStatus }) {
  const isPaid = String(paymentStatus || '').toLowerCase() === 'paid';
  const isCancelled = currentStatus === 'Cancelled';

  // When payment is confirmed, if status is still 'Pending', automatically advance to 'Pickup_Scheduled'
  let effectiveStatus = currentStatus;
  if (isPaid && currentStatus === 'Pending') {
    effectiveStatus = 'Pickup_Scheduled';
  }

  const currentIndex = isCancelled ? -1 : getStageIndex(effectiveStatus);

  const getStageDescription = (stageKey, isCompleted, isActive) => {
    if (stageKey === 'Pending') {
      return isPaid
        ? 'Payment confirmed via M-Pesa. Order received by provider.'
        : 'Order placed. Awaiting payment confirmation.';
    }
    if (stageKey === 'Pickup_Scheduled') {
      return isActive
        ? (isPaid ? 'Payment confirmed! Pickup is being scheduled.' : 'Pickup is being scheduled.')
        : 'A pickup time has been scheduled.';
    }
    const stage = ORDER_STAGES.find(s => s.key === stageKey);
    return stage?.description || '';
  };

  if (isCancelled) {
    return (
      <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-200">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-red-600 text-2xl">cancel</span>
        </div>
        <div>
          <p className="font-semibold text-red-800">Order Cancelled</p>
          <p className="text-sm text-red-600 mt-0.5">{CANCELLED_STAGE.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {ORDER_STAGES.map((stage, idx) => {
        const isCompleted = idx < currentIndex;
        const isActive = idx === currentIndex;

        return (
          <div key={stage.key} className="flex gap-4 mb-0">
            {/* Timeline spine */}
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${isCompleted ? 'bg-emerald-500 shadow-md shadow-emerald-200' :
                  isActive ? 'bg-indigo-600 shadow-lg shadow-indigo-200 ring-4 ring-indigo-100' :
                    'bg-gray-100 border-2 border-gray-200'
                }`}>
                {isCompleted ? (
                  <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                ) : (
                  <span className={`material-symbols-outlined text-lg ${isActive ? 'text-white' : 'text-gray-400'}`}
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                    {stage.icon}
                  </span>
                )}
              </div>
              {/* Connector line */}
              {idx < ORDER_STAGES.length - 1 && (
                <div className={`w-0.5 h-10 mt-1 transition-all duration-700 ${isCompleted ? 'bg-emerald-400' : 'bg-gray-200'
                  }`} />
              )}
            </div>

            {/* Stage label */}
            <div className={`pb-8 ${idx === ORDER_STAGES.length - 1 ? 'pb-0' : ''}`}>
              <p className={`font-semibold text-sm leading-none mt-2.5 ${isActive ? 'text-indigo-700' : isCompleted ? 'text-emerald-700' : 'text-gray-400'
                }`}>
                {stage.key === 'Pending' && isPaid ? 'Order Placed & Paid' : stage.label}
                {isActive && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full animate-pulse">
                    Current
                  </span>
                )}
              </p>
              {(isActive || isCompleted) && (
                <p className={`text-xs mt-0.5 ${isActive ? 'text-indigo-500' : 'text-emerald-600'}`}>
                  {getStageDescription(stage.key, isCompleted, isActive)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Client Rating & Review Card Component ──────────────────────────────────
const RATING_TAGS = [
  '✨ Crisp Folding',
  '🎯 Stain Removal',
  '⚡ Punctual Driver',
  '🧼 Super Clean',
  '🌸 Fresh Scent',
  '🤝 Great Communication'
];

const RATING_LABELS = {
  1: '1 - Poor Service',
  2: '2 - Fair, Needs Improvement',
  3: '3 - Good Standard',
  4: '4 - Very Good Laundry',
  5: '5 - Outstanding & Spotless! ⭐'
};

function ClientRatingCard({ orderRef, providerName, customerName: defaultName, onReviewSaved }) {
  const [existingReview, setExistingReview] = useState(null);
  const [loadingReview, setLoadingReview] = useState(true);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState(['✨ Crisp Folding', '🧼 Super Clean']);
  const [comment, setComment] = useState('');
  const [name, setName] = useState(defaultName || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Check if order already reviewed
  const checkReview = useCallback(async () => {
    if (!orderRef) return;
    try {
      setLoadingReview(true);
      const res = await reviewApi.getReviewByOrderRef(orderRef);
      if (res.success && res.data) {
        setExistingReview(res.data);
      }
    } catch (e) {
      console.error('Error fetching order review:', e);
    } finally {
      setLoadingReview(false);
    }
  }, [orderRef]);

  useEffect(() => {
    checkReview();
  }, [checkReview]);

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setSubmitError('Please select a star rating.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');
      const res = await reviewApi.submitReview({
        orderRef,
        rating,
        comment: comment.trim(),
        tags: selectedTags,
        customerName: name.trim() || defaultName || 'Verified Customer'
      });

      if (res.success) {
        setSubmitSuccess(true);
        setExistingReview(res.data);
        if (onReviewSaved) onReviewSaved(res.data);
      } else {
        setSubmitError(res.message || 'Failed to submit feedback.');
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Unable to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingReview) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4 flex items-center justify-center py-8">
        <span className="material-symbols-outlined animate-spin text-indigo-600 text-2xl">sync</span>
        <span className="text-sm text-gray-500 ml-2">Loading rating status...</span>
      </div>
    );
  }

  // If already reviewed, display the completed review card
  if (existingReview) {
    return (
      <div className="bg-gradient-to-br from-white to-amber-50/40 rounded-2xl shadow-sm border border-amber-200/60 p-6 mb-4 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified
            </span>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Your Cleaner Rating & Review</h3>
              <p className="text-xs text-gray-500">Feedback for {providerName || 'your cleaner partner'}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
            <span className="material-symbols-outlined text-xs">check</span> Verified Review
          </span>
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1 my-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`material-symbols-outlined text-2xl ${star <= existingReview.rating ? 'text-amber-400' : 'text-gray-200'
                }`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
          ))}
          <span className="ml-2 font-bold text-gray-900 text-sm">
            {existingReview.rating}.0 / 5.0
          </span>
        </div>

        {/* Tags */}
        {existingReview.tags && existingReview.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 my-3">
            {existingReview.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-amber-100/80 text-amber-900 border border-amber-200/60"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Comment */}
        {existingReview.comment && (
          <p className="text-sm text-gray-700 bg-white/80 p-3.5 rounded-xl border border-gray-100 mt-2 italic">
            "{existingReview.comment}"
          </p>
        )}

        {/* Cleaner Response */}
        {existingReview.reply?.text && (
          <div className="mt-4 p-3.5 bg-indigo-50/80 rounded-xl border border-indigo-100/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 mb-1">
              <span className="material-symbols-outlined text-sm text-indigo-600">reply</span>
              Response from {providerName || 'Cleaner Partner'}
            </div>
            <p className="text-xs text-indigo-800 leading-relaxed">{existingReview.reply.text}</p>
          </div>
        )}
      </div>
    );
  }

  // Interactive Review Form
  return (
    <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl shadow-sm border border-indigo-100 p-6 mb-4 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <span className="material-symbols-outlined text-amber-600 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            star
          </span>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-base">Rate Your Laundry Experience</h3>
          <p className="text-xs text-gray-500">Help {providerName || 'your cleaner'} maintain high quality standards</p>
        </div>
      </div>

      {submitError && (
        <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Picker */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Select Rating
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 -m-1 text-3xl focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                  >
                    <span
                      className={`material-symbols-outlined text-3xl transition-colors ${active ? 'text-amber-400' : 'text-gray-300'
                        }`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/50">
              {RATING_LABELS[hoverRating || rating]}
            </span>
          </div>
        </div>

        {/* Quality Feedback Tags */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            What went great? (Tap to select)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {RATING_TAGS.map((tag) => {
              const selected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${selected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comment Textarea */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Your Feedback / Comments (Optional)
          </label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share details about the cleanliness, driver delivery, packaging, or scent..."
            className="w-full text-sm text-gray-900 bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder:text-gray-400"
            maxLength={1000}
          />
          <div className="flex justify-between items-center text-[11px] text-gray-400 mt-1">
            <span>Honest customer feedback directly supports the service team.</span>
            <span>{comment.length} / 1000</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {submitting ? (
            <>
              <span className="material-symbols-outlined animate-spin text-lg">sync</span>
              Submitting Feedback...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">rate_review</span>
              Submit Rating & Review
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// ─── Main TrackOrderPage ──────────────────────────────────────────────────────
export default function TrackOrderPage() {
  const { orderRef } = useParams();
  const navigate = useNavigate();

  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [liveRouteCoords, setLiveRouteCoords] = useState([]);
  const [liveDistanceKm, setLiveDistanceKm] = useState(null);
  const [liveEtaMinutes, setLiveEtaMinutes] = useState(null);

  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Update Live Location using browser GPS
  const handleUpdateGpsLocation = async () => {
    setLocationError('');
    setLocationSuccess(false);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setUpdatingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy)
          };

          const res = await orderApi.updateOrderLiveLocation(orderRef, {
            coordinates: coords,
            houseNumber: editRoom || undefined,
            instructions: editInstructions || undefined,
            liveLocationUrl: `https://maps.google.com/?q=${coords.lat},${coords.lng}`
          });

          if (res.success) {
            setLocationSuccess(true);
            await fetchTracking(true);
            setTimeout(() => {
              setShowLocationModal(false);
              setLocationSuccess(false);
            }, 1800);
          } else {
            setLocationError(res.message || 'Failed to update live location.');
          }
        } catch (e) {
          setLocationError(e.response?.data?.message || 'Error updating location.');
        } finally {
          setUpdatingLocation(false);
        }
      },
      (err) => {
        setUpdatingLocation(false);
        setLocationError('Could not obtain GPS coordinates. Please grant location permissions in your browser.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const fetchTracking = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const res = await orderApi.getOrderTracking(orderRef);
      if (!isMountedRef.current) return;

      if (res.success && res.data) {
        setTracking(res.data);
        setLastRefreshed(new Date());
      } else {
        setError(res.message || 'Order not found.');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const status = err?.response?.status;
      if (status === 404) {
        setError('Order not found. Please check the order reference.');
      } else if (status === 403) {
        setError('You are not authorized to view this order.');
      } else {
        setError(err?.response?.data?.message || 'Unable to load order details. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [orderRef]);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchTracking(false);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchTracking]);

  // Auto-polling — starts after first load, stops when terminal state reached
  useEffect(() => {
    if (loading || error) return;
    if (!tracking) return;

    // Don't poll if already in a terminal state
    if (TERMINAL_STATUSES.has(tracking.status)) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      fetchTracking(true);
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tracking?.status, loading, error, fetchTracking]);

  // Calculate live road route when provider coordinates update
  useEffect(() => {
    const provLat = tracking?.providerLiveLocation?.coordinates?.lat;
    const provLng = tracking?.providerLiveLocation?.coordinates?.lng;
    const destLat = tracking?.pickupAddress?.coordinates?.lat;
    const destLng = tracking?.pickupAddress?.coordinates?.lng;

    if (!provLat || !provLng || !destLat || !destLng) {
      setLiveRouteCoords([]);
      setLiveDistanceKm(null);
      setLiveEtaMinutes(null);
      return;
    }

    let isSubscribed = true;
    const computeRoute = async () => {
      const res = await fetchRoadRoute([provLat, provLng], [destLat, destLng]);
      if (isSubscribed && res) {
        setLiveRouteCoords(res.coordinates || []);
        setLiveDistanceKm(res.distanceKm);
        setLiveEtaMinutes(res.durationMinutes);
      }
    };

    computeRoute();

    return () => {
      isSubscribed = false;
    };
  }, [
    tracking?.providerLiveLocation?.coordinates?.lat,
    tracking?.providerLiveLocation?.coordinates?.lng,
    tracking?.pickupAddress?.coordinates?.lat,
    tracking?.pickupAddress?.coordinates?.lng
  ]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-KE', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (amount == null) return '—';
    return `KES ${Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
  };

  const getMethodLabel = (method) => {
    if (!method) return 'M-Pesa';
    const map = { mpesa: 'M-Pesa', cod: 'Cash on Delivery', card: 'Card' };
    return map[method.toLowerCase()] || method;
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="material-symbols-outlined text-white text-3xl animate-spin">sync</span>
          </div>
          <p className="text-gray-600 font-medium">Loading your order...</p>
          <p className="text-gray-400 text-sm mt-1">{orderRef}</p>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-red-500 text-3xl">error_outline</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => fetchTracking(false)}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!tracking) return null;

  const isPaid = ['Paid', 'paid'].includes(tracking.paymentStatus);
  const isDelivered = tracking.status === 'Delivered';
  const isCancelled = tracking.status === 'Cancelled';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 font-['Inter']">
      {/* Fixed header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="h-16 px-4 max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go home"
          >
            <span className="material-symbols-outlined text-gray-600">arrow_back</span>
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900 text-base leading-none">Track Order</h1>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{tracking.orderRef}</p>
          </div>
          {isRefreshing && (
            <div className="flex items-center gap-1.5 text-xs text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-sm animate-spin">sync</span>
              <span>Updating...</span>
            </div>
          )}
          {!isRefreshing && !TERMINAL_STATUSES.has(tracking.status) && (
            <button
              onClick={() => fetchTracking(true)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <span className="material-symbols-outlined text-gray-500 text-lg">refresh</span>
            </button>
          )}
        </div>
      </header>

      <main className="pt-20 pb-10 px-4 max-w-2xl mx-auto">

        {/* ── Success Banner (for just-paid orders) ── */}
        {isPaid && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 mb-5 shadow-lg shadow-emerald-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">Payment Confirmed!</p>
              <p className="text-emerald-100 text-sm mt-0.5">Your laundry order is being processed.</p>
            </div>
          </div>
        )}

        {/* ── Delivered Banner ── */}
        {isDelivered && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 mb-5 shadow-lg shadow-indigo-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>done_all</span>
            </div>
            <div>
              <p className="text-white font-bold text-base">Order Delivered!</p>
              <p className="text-indigo-200 text-sm mt-0.5">Thank you for using Laundry.</p>
            </div>
          </div>
        )}

        {/* ── Order Summary Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 font-mono">{tracking.orderRef}</h2>
              <p className="text-sm text-gray-400 mt-0.5">Placed {formatDate(tracking.createdAt)}</p>
            </div>
            <PaymentBadge status={tracking.paymentStatus} />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Service</p>
              <p className="font-medium text-gray-900">{tracking.service?.name || 'Laundry Service'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Amount</p>
              <p className="font-bold text-gray-900">{formatCurrency(tracking.pricing?.grandTotal)}</p>
            </div>
            {tracking.provider && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Provider</p>
                <p className="font-medium text-gray-900">{tracking.provider.name}</p>
              </div>
            )}
            {tracking.payment?.method && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Payment Method</p>
                <p className="font-medium text-gray-900">{getMethodLabel(tracking.payment.method)}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── M-Pesa Transaction Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-700 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>phone_iphone</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">M-Pesa Transaction</h3>
              <p className="text-xs text-gray-400">Your payment receipt code</p>
            </div>
          </div>
          {tracking.payment ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1.5">Transaction Code</p>
                <TransactionCodeDisplay code={tracking.payment.transactionId} />
              </div>
              {tracking.payment.paidAt && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Paid At</p>
                  <p className="text-sm font-medium text-gray-700">{formatDate(tracking.payment.paidAt)}</p>
                </div>
              )}
              {tracking.payment.failureReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                  <span className="font-semibold">Payment Issue: </span>
                  {tracking.payment.failureReason}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Payment information unavailable</p>
          )}
        </div>

        {/* ── Pickup Location & Live GPS Pin Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Pickup &amp; House Location</h3>
                <p className="text-xs text-gray-400">Cleaner pickup destination and GPS pinpoint</p>
              </div>
            </div>

            {!TERMINAL_STATUSES.has(tracking.status) && (
              <button
                type="button"
                onClick={() => {
                  setEditRoom(tracking.pickupAddress?.houseNumber || '');
                  setEditInstructions(tracking.pickupAddress?.instructions || '');
                  setShowLocationModal(true);
                }}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">my_location</span>
                <span>Update GPS Pin</span>
              </button>
            )}
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-400 text-xs uppercase font-medium">Campus Pickup Point:</span>
              <span className="font-semibold text-gray-800 text-right">
                {tracking.pickupAddress?.campusLocation || tracking.pickupAddress?.street || 'Main Campus'}
              </span>
            </div>

            {tracking.pickupAddress?.houseNumber && (
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 text-xs uppercase font-medium">Room / House / Floor:</span>
                <span className="font-semibold text-indigo-700 text-right">
                  {tracking.pickupAddress.houseNumber}
                </span>
              </div>
            )}

            {tracking.pickupAddress?.instructions && (
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 text-xs uppercase font-medium">Pickup Instructions:</span>
                <span className="text-gray-700 text-right max-w-[240px]">
                  {tracking.pickupAddress.instructions}
                </span>
              </div>
            )}

            {/* GPS Pinpoint Status & Direct Navigation Link */}
            {tracking.pickupAddress?.coordinates?.lat ? (
              <div className="mt-3 space-y-3">
                {/* Interactive In-App Live Map */}
                <div className="h-64 w-full rounded-2xl overflow-hidden border border-gray-200 shadow-xs relative">
                  <LiveNavigationMap
                    destinationPosition={[
                      tracking.pickupAddress.coordinates.lat,
                      tracking.pickupAddress.coordinates.lng
                    ]}
                    driverPosition={
                      tracking.providerLiveLocation?.coordinates?.lat
                        ? [
                          tracking.providerLiveLocation.coordinates.lat,
                          tracking.providerLiveLocation.coordinates.lng
                        ]
                        : null
                    }
                    routeCoordinates={liveRouteCoords}
                    heading={tracking.providerLiveLocation?.coordinates?.heading || 0}
                    speed={tracking.providerLiveLocation?.coordinates?.speed || 0}
                    autoFollow={false}
                    destinationLabel={tracking.customer?.name || 'My Delivery Point'}
                    destinationSubLabel={
                      tracking.pickupAddress.houseNumber
                        ? `${tracking.pickupAddress.campusLocation || 'Campus'} (${tracking.pickupAddress.houseNumber})`
                        : (tracking.pickupAddress.campusLocation || 'Campus Hub')
                    }
                    className="w-full h-full"
                  />
                  {tracking.providerLiveLocation?.isNavigating && (
                    <div className="absolute top-3 left-3 z-10 bg-blue-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-pulse border border-white/20">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                      <span>
                        Cleaner En Route {liveEtaMinutes ? `• ~${formatEta(liveEtaMinutes)} away (${formatDistance(liveDistanceKm)})` : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">Live GPS Pin Active</span>
                      <span className="text-[11px] text-emerald-700">
                        {tracking.pickupAddress.coordinates.lat.toFixed(5)}, {tracking.pickupAddress.coordinates.lng.toFixed(5)}
                      </span>
                    </div>
                  </div>
                  <a
                    href={tracking.pickupAddress.liveLocationUrl || `https://maps.google.com/?q=${tracking.pickupAddress.coordinates.lat},${tracking.pickupAddress.coordinates.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <span>Open Maps</span>
                    <span className="material-symbols-outlined text-[14px]">directions</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center justify-between">
                <span>No live GPS coordinates pinned yet.</span>
                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="text-amber-900 font-bold underline hover:no-underline cursor-pointer"
                >
                  Share GPS Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Client Rating & Review Card ── */}
        <ClientRatingCard
          orderRef={tracking.orderRef}
          providerName={tracking.provider?.name || 'Aura Partner'}
          customerName={tracking.customer?.fullName || tracking.deliveryAddress?.contactName}
        />

        {/* ── Order Status Timeline Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600">timeline</span>
            Order Progress
          </h3>
          <OrderStatusTimeline currentStatus={tracking.status} paymentStatus={tracking.paymentStatus} />
        </div>

        {/* ── Auto-refresh notice ── */}
        {!TERMINAL_STATUSES.has(tracking.status) && (
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-4">
            <span className="material-symbols-outlined text-sm text-indigo-400 animate-pulse">fiber_manual_record</span>
            <span>Auto-refreshing every {POLL_INTERVAL_MS / 1000}s</span>
            {lastRefreshed && (
              <span>· Last updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            )}
          </div>
        )}

        {/* ── Need Help link ── */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-400">
            Need help?{' '}
            <Link to="/" className="text-indigo-600 font-medium hover:underline">
              Contact Support
            </Link>
          </p>
        </div>

        {/* ── Modal: Update / Share Live Location ── */}
        {showLocationModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">my_location</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">Update House &amp; Live GPS Pin</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <p className="text-xs text-gray-500">
                Share your precise GPS coordinates and room number to guide the cleaner/rider directly to your door.
              </p>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">
                    Room / House / Floor No.
                  </label>
                  <input
                    type="text"
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                    placeholder="e.g. Room 302, 3rd Floor"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">
                    Specific Landmark / Directions
                  </label>
                  <input
                    type="text"
                    value={editInstructions}
                    onChange={(e) => setEditInstructions(e.target.value)}
                    placeholder="e.g. Beside the main staircase"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {locationError && (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 text-xs flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{locationError}</span>
                </div>
              )}

              {locationSuccess && (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-3 text-xs flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                  <span>GPS location updated and shared with cleaner!</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateGpsLocation}
                  disabled={updatingLocation || locationSuccess}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {updatingLocation ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                      Pinning GPS...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">near_me</span>
                      Acquire &amp; Save GPS
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
