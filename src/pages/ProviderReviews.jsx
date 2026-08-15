import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { reviewApi } from '../api/reviewApi';

export default function cleanersReviews({ isStandalone = true }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [metrics, setMetrics] = useState({
    totalReviews: 0,
    averageRating: 5.0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reviewApi.getProviderReviews({
        search: searchQuery || undefined,
        rating: ratingFilter !== 'all' ? ratingFilter : undefined
      });

      if (res.success) {
        setReviews(res.data || []);
        if (res.metrics) {
          setMetrics(res.metrics);
        }
      } else {
        setError(res.message || 'Failed to fetch reviews.');
      }
    } catch (err) {
      console.error('Error loading provider reviews:', err);
      setError(err.response?.data?.message || 'Unable to load customer reviews.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, ratingFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReviews();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchReviews]);

  const handleSendReply = async (reviewId) => {
    if (!replyText.trim()) return;
    try {
      setSubmittingReply(true);
      const res = await reviewApi.replyToReview(reviewId, replyText.trim());
      if (res.success) {
        setReviews(prev =>
          prev.map(rev => (rev._id === reviewId ? res.data : rev))
        );
        setReplyingId(null);
        setReplyText('');
      } else {
        alert(res.message || 'Failed to post reply.');
      }
    } catch (err) {
      console.error('Error posting review reply:', err);
      alert(err.response?.data?.message || 'Error posting review reply.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const formatReviewTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins <= 0 ? 1 : diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return 'VC';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const mainContent = (
    <div className="flex flex-col w-full h-full relative font-body-md text-on-surface">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-headline-lg text-on-surface font-bold tracking-tight">Customer Reviews</h1>
          <p className="font-body-md text-on-surface-variant mt-1">
            Real customer feedback provided by clients upon laundry completion.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant font-body-sm pl-10 pr-4 py-2.5 rounded-xl border border-surface-container/60 focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
            />
          </div>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="w-full sm:w-auto bg-surface-container-lowest text-on-surface font-label-md font-semibold px-4 py-2.5 rounded-xl border border-surface-container/60 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer shadow-xs"
          >
            <option value="all">All Ratings ({metrics.totalReviews})</option>
            <option value="5">5 Stars ({metrics.distribution[5] || 0})</option>
            <option value="4">4 Stars ({metrics.distribution[4] || 0})</option>
            <option value="3">3 Stars ({metrics.distribution[3] || 0})</option>
            <option value="2">2 Stars ({metrics.distribution[2] || 0})</option>
            <option value="1">1 Star ({metrics.distribution[1] || 0})</option>
          </select>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Rating Summary Card */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-surface-container/40 text-center">
            <h2 className="font-display-lg text-5xl font-extrabold text-on-surface mb-2">
              {metrics.averageRating > 0 ? metrics.averageRating.toFixed(1) : '5.0'}
            </h2>
            <div className="flex justify-center text-amber-500 mb-2">
              {[1, 2, 3, 4, 5].map((i) => {
                const filled = metrics.averageRating >= i;
                const half = !filled && metrics.averageRating >= i - 0.5;
                return (
                  <span
                    key={i}
                    className="material-symbols-outlined text-[24px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {filled ? 'star' : half ? 'star_half' : 'star'}
                  </span>
                );
              })}
            </div>
            <p className="font-label-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-6">
              Based on {metrics.totalReviews} customer {metrics.totalReviews === 1 ? 'review' : 'reviews'}
            </p>

            {/* Breakdown bars */}
            <div className="space-y-3 font-label-sm font-medium text-on-surface-variant">
              {[
                { stars: '5 Stars', count: metrics.distribution[5] || 0, pct: metrics.percentages[5] || 0 },
                { stars: '4 Stars', count: metrics.distribution[4] || 0, pct: metrics.percentages[4] || 0 },
                { stars: '3 Stars', count: metrics.distribution[3] || 0, pct: metrics.percentages[3] || 0 },
                { stars: '2 Stars', count: metrics.distribution[2] || 0, pct: metrics.percentages[2] || 0 },
                { stars: '1 Star', count: metrics.distribution[1] || 0, pct: metrics.percentages[1] || 0 }
              ].map((item) => (
                <div key={item.stars} className="flex items-center gap-3">
                  <span className="w-14 text-left text-xs font-semibold">{item.stars}</span>
                  <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${item.pct}%` }}
                    ></div>
                  </div>
                  <span className="w-10 text-right font-bold text-on-surface text-xs">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary rounded-3xl p-6 text-on-primary shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-white">verified</span>
              </div>
              <h3 className="font-headline-sm text-lg font-bold mb-1">Clean Quality Guarantee</h3>
              <p className="font-body-sm text-on-primary/80 leading-relaxed text-xs">
                Customer ratings update your live profile score across the platform. Providing prompt and spotless service boosts client bookings!
              </p>
            </div>
          </div>
        </div>

        {/* Right Reviews List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {loading ? (
            <div className="bg-surface-container-lowest rounded-3xl p-12 text-center text-primary font-body-md border border-surface-container/40 flex items-center justify-center gap-3">
              <span className="material-symbols-outlined animate-spin text-2xl">sync</span>
              Loading customer reviews...
            </div>
          ) : error ? (
            <div className="bg-rose-50 rounded-3xl p-6 text-center text-rose-700 font-body-md border border-rose-200">
              {error}
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-3xl p-12 text-center text-on-surface-variant font-body-md border border-surface-container/40">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">rate_review</span>
              <p className="font-semibold text-on-surface">No customer reviews yet.</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Completed customer orders will appear here once clients rate their laundry experience.
              </p>
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev._id}
                className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-surface-container/40 flex flex-col gap-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-headline-sm font-bold text-sm">
                      {getInitials(rev.customerName)}
                    </div>
                    <div>
                      <h4 className="font-label-lg font-bold text-on-surface">{rev.customerName}</h4>
                      <p className="font-body-sm text-xs text-on-surface-variant">
                        {formatReviewTime(rev.createdAt)} •{' '}
                        <span className="font-mono text-primary font-semibold">#{rev.orderRef}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <span
                        key={i}
                        className="material-symbols-outlined text-[20px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                </div>

                {rev.comment && (
                  <p className="font-body-md text-sm text-on-surface leading-relaxed italic">
                    "{rev.comment}"
                  </p>
                )}

                {rev.tags && rev.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {rev.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-surface-container text-on-surface-variant rounded-full font-label-sm text-xs font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Existing Reply */}
                {rev.reply?.text && (
                  <div className="mt-2 p-4 bg-surface-container-low rounded-2xl border-l-4 border-primary">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-label-sm font-bold text-primary">Your Official Response</span>
                      <span className="text-[11px] text-on-surface-variant">
                        {formatReviewTime(rev.reply.repliedAt)}
                      </span>
                    </div>
                    <p className="font-body-sm text-xs text-on-surface leading-relaxed">
                      {rev.reply.text}
                    </p>
                  </div>
                )}

                {/* Reply Button / Inline Form */}
                {!rev.reply?.text && (
                  <div>
                    {replyingId === rev._id ? (
                      <div className="mt-2 flex flex-col gap-3">
                        <textarea
                          rows={3}
                          placeholder={`Write your response to ${rev.customerName}...`}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant p-3 rounded-xl border border-surface-container/60 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingId(null);
                              setReplyText('');
                            }}
                            className="px-4 py-1.5 rounded-full text-xs font-label-sm font-semibold text-on-surface-variant hover:bg-surface-container cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={submittingReply}
                            onClick={() => handleSendReply(rev._id)}
                            className="px-5 py-1.5 rounded-full text-xs font-label-sm font-semibold bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {submittingReply ? 'Sending...' : 'Send Response'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingId(rev._id);
                          setReplyText('');
                        }}
                        className="self-start text-xs font-label-sm font-semibold text-primary hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">reply</span>
                        <span>Reply to {rev.customerName?.split(' ')[0] || 'Customer'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  if (!isStandalone) return mainContent;

  return (
    <div className="bg-surface-container-low font-body-md text-on-surface min-h-screen flex flex-col">
      <div className="md:pl-72 flex flex-col min-h-screen">
        <main className="flex-1 p-6 md:p-10">
          {mainContent}
        </main>
      </div>
    </div>
  );
}
