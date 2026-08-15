import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { reviewApi } from '../api/reviewApi';
import Navbar from '../components/layout/Navbar';

export default function ReviewsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [error, setError] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMinRating, setSelectedMinRating] = useState('All');
  const [expandedServices, setExpandedServices] = useState({});

  // Quick Review Modal State
  const [reviewOrderRef, setReviewOrderRef] = useState('');

  const fetchDirectory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        minRating: selectedMinRating !== 'All' ? selectedMinRating : undefined,
        search: searchQuery || undefined
      };

      const res = await reviewApi.getProviderDirectory(params);
      if (res.success && res.data) {
        setProviders(res.data);
      } else {
        setError(res.message || 'Failed to load cleaner reviews.');
      }
    } catch (err) {
      console.error('Error fetching provider directory:', err);
      setError(err.response?.data?.message || 'Error loading cleaner rankings and reviews.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedMinRating, searchQuery]);

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  const toggleServicesExpand = (providerId) => {
    setExpandedServices(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  const handleBookService = (provider, service) => {
    navigate('/checkout', {
      state: {
        serviceId: service._id,
        serviceName: service.name,
        details: service.description || `${service.pricingType === 'per_kg' ? 'Per KG wash' : 'Flat rate clean'} by ${provider.name}`,
        servicePrice: service.basePrice || 150,
        deliveryOption: service.deliveryFee === 0 ? 'Free Delivery' : 'Standard Pickup & Delivery',
        deliveryPrice: typeof service.deliveryFee === 'number' ? service.deliveryFee : 150,
        tillNumber: provider.tillNumber || '8995354',
        providerName: provider.name,
        hasChannelConfigured: true
      }
    });
  };

  const handleTrackReviewSubmit = (e) => {
    e.preventDefault();
    if (reviewOrderRef.trim()) {
      navigate(`/track-order/${reviewOrderRef.trim().toUpperCase()}`);
    }
  };

  const categories = ['All', 'Wash & Fold', 'Dry Cleaning', 'Bedding & Linens', 'Ironing & Pressing'];

  return (
    <div className="bg-[#f9f9fc] min-h-screen text-[#1a1c1e] font-['Inter'] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Hero Section */}
        <div className="relative rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-8 md:p-12 shadow-xl overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>Real Verified Client Ratings</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-['Geist'] tracking-tight text-white leading-tight">
              Cleaner Rankings &amp; Client Reviews
            </h1>

            <p className="text-blue-100/90 text-sm sm:text-base leading-relaxed max-w-2xl">
              Compare top laundry partners in Nairobi based on real customer feedback, transparent ratings, and explore the complete catalog of cleaning services each provider offers.
            </p>

            {/* Quick Order Review Input */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-xl">
              <form onSubmit={handleTrackReviewSubmit} className="flex-1 flex items-center bg-white/15 backdrop-blur-md rounded-2xl p-1.5 border border-white/20 focus-within:bg-white/25 transition-all">
                <span className="material-symbols-outlined text-white/60 ml-3 mr-2 text-[20px]">rate_review</span>
                <input
                  type="text"
                  placeholder="Enter Order # to leave a review..."
                  value={reviewOrderRef}
                  onChange={(e) => setReviewOrderRef(e.target.value)}
                  className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/50"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-white text-blue-950 hover:bg-blue-50 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer shrink-0"
                >
                  Rate Order
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#c3c5d9]/30 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search cleaner name, location, or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 py-3 pl-10 pr-4 rounded-2xl text-sm border border-slate-200 outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>

            {/* Rating Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 shrink-0">Filter by Rating:</span>
              <select
                value={selectedMinRating}
                onChange={(e) => setSelectedMinRating(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold py-2.5 px-3 rounded-xl outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="All">All Ratings</option>
                <option value="4.8">4.8+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4.0">4.0+ Stars</option>
              </select>
            </div>
          </div>

          {/* Service Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Directory & Rankings Stream */}
        {loading ? (
          <div className="py-20 text-center text-blue-600 flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
            <p className="text-sm font-semibold text-slate-600">Loading verified cleaner reviews and service rankings...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-rose-700 text-center space-y-2">
            <span className="material-symbols-outlined text-3xl">error</span>
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : providers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 space-y-3 border border-[#c3c5d9]/30">
            <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
            <h3 className="text-lg font-bold text-slate-700">No cleaners found matching your criteria</h3>
            <p className="text-xs text-slate-500">Try adjusting your search terms or clearing your category filters.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {providers.map((provider) => {
              const isExpanded = expandedServices[provider.id];
              const rankColor =
                provider.rank === 1
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : provider.rank === 2
                  ? 'bg-slate-200 text-slate-800 border-slate-300'
                  : provider.rank === 3
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200';

              return (
                <div
                  key={provider.id}
                  className={`bg-white rounded-3xl border transition-all duration-300 shadow-xs hover:shadow-md overflow-hidden ${
                    provider.isPromoted ? 'border-indigo-300 ring-2 ring-indigo-500/10' : 'border-[#c3c5d9]/30'
                  }`}
                >
                  {/* Card Header & Cleaner Summary */}
                  <div className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100">
                    <div className="flex items-start gap-4">
                      {/* Rank Badge */}
                      <div
                        className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black font-['Geist'] text-sm shrink-0 border ${rankColor}`}
                      >
                        <span className="text-[10px] font-bold uppercase leading-none">Rank</span>
                        <span>#{provider.rank}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl sm:text-2xl font-black font-['Geist'] text-slate-900">
                            {provider.name}
                          </h2>

                          {provider.isPromoted && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">star</span>
                              <span>Top Partner</span>
                            </span>
                          )}

                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">verified</span>
                            <span>Verified</span>
                          </span>
                        </div>

                        {provider.promotionTagline && (
                          <p className="text-xs font-medium text-indigo-600 italic">
                            "{provider.promotionTagline}"
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap pt-0.5">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-slate-400">location_on</span>
                            <span>{provider.location}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-slate-400">local_laundry_service</span>
                            <span>{provider.totalServicesCount} Services</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Overall Rating Box & Direct CTA */}
                    <div className="flex items-center gap-4 shrink-0 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className="material-symbols-outlined text-[18px]"
                                style={{
                                  fontVariationSettings: star <= Math.round(provider.rating) ? "'FILL' 1" : "'FILL' 0"
                                }}
                              >
                                star
                              </span>
                            ))}
                          </div>
                          <span className="font-black text-slate-900 text-lg font-['Geist']">
                            {Number(provider.rating).toFixed(1)}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          Based on {provider.reviewsCount} verified reviews
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Provider Services Showcase */}
                  <div className="p-6 md:p-8 bg-slate-50/50 border-b border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600 text-[20px]">local_laundry_service</span>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base font-['Geist']">
                          Services Offered by {provider.name}
                        </h3>
                      </div>

                      {provider.services?.length > 3 && (
                        <button
                          type="button"
                          onClick={() => toggleServicesExpand(provider.id)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isExpanded ? 'Show Less' : `View All ${provider.services.length} Services`}</span>
                          <span className="material-symbols-outlined text-[16px]">
                            {isExpanded ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>
                      )}
                    </div>

                    {provider.services?.length === 0 ? (
                      <div className="text-xs text-slate-400 py-2">
                        No active service offerings published currently.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(isExpanded ? provider.services : provider.services.slice(0, 3)).map((service) => (
                          <div
                            key={service._id}
                            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors"
                          >
                            <div className="space-y-1.5 mb-3">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-bold text-slate-900 text-sm leading-snug">
                                  {service.name}
                                </h4>
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[10px] whitespace-nowrap">
                                  {service.category}
                                </span>
                              </div>

                              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                {service.description || 'Professional laundry service with priority care.'}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <div>
                                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Price</span>
                                <span className="font-black text-slate-900 text-sm font-mono">
                                  KES {service.basePrice?.toLocaleString()}
                                  <span className="text-[11px] font-normal text-slate-500 font-sans">
                                    {service.pricingType === 'per_kg' ? ' / kg' : ''}
                                  </span>
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleBookService(provider, service)}
                                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[15px]">shopping_bag</span>
                                <span>Book Now</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Real Verified Client Reviews Stream */}
                  <div className="p-6 md:p-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500 text-[20px]">chat</span>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base font-['Geist']">
                          Verified Client Reviews ({provider.reviews?.length || 0})
                        </h3>
                      </div>
                    </div>

                    {provider.reviews?.length === 0 ? (
                      <div className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-2xl">
                        No written reviews submitted yet for this cleaner.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {provider.reviews.map((rev) => (
                          <div
                            key={rev._id}
                            className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              {/* Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                    {rev.customerName?.slice(0, 1) || 'C'}
                                  </div>
                                  <div>
                                    <div className="font-bold text-xs text-slate-900">{rev.customerName}</div>
                                    <div className="text-[10px] text-slate-400">
                                      {new Date(rev.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex text-amber-400">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <span
                                      key={s}
                                      className="material-symbols-outlined text-[14px]"
                                      style={{
                                        fontVariationSettings: s <= rev.rating ? "'FILL' 1" : "'FILL' 0"
                                      }}
                                    >
                                      star
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Tags */}
                              {rev.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {rev.tags.map((tag, tIdx) => (
                                    <span
                                      key={tIdx}
                                      className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[10px]"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Comment */}
                              {rev.comment && (
                                <p className="text-xs text-slate-700 leading-relaxed italic">
                                  "{rev.comment}"
                                </p>
                              )}
                            </div>

                            {/* Official Reply */}
                            {rev.reply?.text && (
                              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
                                <div className="flex items-center gap-1 font-bold text-[11px] text-blue-800">
                                  <span className="material-symbols-outlined text-[14px]">reply</span>
                                  <span>{provider.name} (Cleaner Response):</span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-blue-950">
                                  {rev.reply.text}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
