import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../hooks/useAuth';
import { serviceApi } from '../api/serviceApi';
import { promotionApi } from '../api/promotionApi';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

export default function HomePage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { user, isAuthenticated } = useAuth();

  const [activeNav, setActiveNav] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Nairobi, KE');
  const [favorites, setFavorites] = useState({});

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Featured / Promoted Provider State
  const [featuredProviders, setFeaturedProviders] = useState([]);
  const [isPromotedSponsored, setIsPromotedSponsored] = useState(false);

  // Sorting & Filtering States
  const [cleanerSort, setCleanerSort] = useState('rating_desc');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [servicesRes, promoRes] = await Promise.all([
          serviceApi.getServices({ activeOnly: 'true' }),
          promotionApi.getFeaturedProviders().catch(() => ({ success: false }))
        ]);

        if (servicesRes.success && Array.isArray(servicesRes.data)) {
          setServices(servicesRes.data);
        }

        if (promoRes.success && promoRes.data) {
          const list = promoRes.data.featuredProviders || (promoRes.data.featuredProvider ? [promoRes.data.featuredProvider] : []);
          setFeaturedProviders(list);
          setIsPromotedSponsored(Boolean(promoRes.isSponsored));
        }
      } catch (err) {
        console.error('Failed to load cleaners catalog:', err);
        setError('Failed to load available cleaners directory.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleFavorite = (cleanerId, e) => {
    e.stopPropagation();
    setFavorites(prev => ({
      ...prev,
      [cleanerId]: !prev[cleanerId]
    }));
  };

  const promotedProviderIds = useMemo(() => {
    return new Set(featuredProviders.map(fp => (fp._id || fp.provider?._id || '').toString()));
  }, [featuredProviders]);

  // Aggregate services into unique Cleaners/Providers
  const cleaners = useMemo(() => {
    const providerMap = new Map();

    services.forEach(service => {
      const provider = service.provider;
      if (!provider || !provider._id) return;

      const pId = provider._id.toString();
      if (!providerMap.has(pId)) {
        const featuredMatch = featuredProviders.find(
          fp => (fp._id || fp.provider?._id || '').toString() === pId
        );
        const is30Days = Boolean(
          featuredMatch?.is30DaysPremium ||
          provider.providerDetails?.promotionPackage?.toLowerCase().includes('30') ||
          provider.providerDetails?.promotionPackage?.toLowerCase().includes('dominance')
        );

        providerMap.set(pId, {
          _id: pId,
          businessName: provider.providerDetails?.businessName || provider.fullName || 'Verified Cleaner',
          fullName: provider.fullName || 'Cleaner Partner',
          phone: provider.phone || '',
          email: provider.email || '',
          rating: Number(provider.providerDetails?.rating ?? 5.0),
          reviewsCount: Number(provider.providerDetails?.reviewsCount ?? 0),
          tillNumber: provider.providerDetails?.tillNumber || '8995354',
          isPromoted: Boolean(
            provider.providerDetails?.isPromoted ||
            promotedProviderIds.has(pId)
          ),
          is30DaysPremium: is30Days,
          packageName: featuredMatch?.packageName || provider.providerDetails?.promotionPackage || '',
          promotionTagline: featuredMatch?.tagline || provider.providerDetails?.promotionTagline || '',
          services: [],
          categories: new Set(),
          minPrice: Infinity,
          minDeliveryFee: Infinity,
          turnaroundTime: service.turnaroundTime || '24-48 hours'
        });
      }

      const cleaner = providerMap.get(pId);
      cleaner.services.push(service);
      if (service.category) cleaner.categories.add(service.category);
      if (typeof service.basePrice === 'number' && service.basePrice < cleaner.minPrice) {
        cleaner.minPrice = service.basePrice;
      }
      const dFee = typeof service.deliveryFee === 'number' ? service.deliveryFee : 200;
      if (dFee < cleaner.minDeliveryFee) {
        cleaner.minDeliveryFee = dFee;
      }
    });

    return Array.from(providerMap.values()).map(c => ({
      ...c,
      categories: Array.from(c.categories),
      minPrice: c.minPrice === Infinity ? 0 : c.minPrice,
      minDeliveryFee: c.minDeliveryFee === Infinity ? 200 : c.minDeliveryFee,
      servicesCount: c.services.length
    }));
  }, [services, featuredProviders, promotedProviderIds]);

  // Extract all available specialty categories
  const allSpecialties = useMemo(() => {
    const cats = new Set(['All']);
    cleaners.forEach(c => {
      c.categories.forEach(cat => cats.add(cat));
    });
    return Array.from(cats);
  }, [cleaners]);

  // Filter & Sort Cleaners
  const filteredCleaners = useMemo(() => {
    return cleaners
      .filter(cleaner => {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          cleaner.businessName.toLowerCase().includes(q) ||
          cleaner.fullName.toLowerCase().includes(q) ||
          cleaner.categories.some(cat => cat.toLowerCase().includes(q)) ||
          cleaner.promotionTagline.toLowerCase().includes(q);

        const matchesSpecialty =
          selectedSpecialty === 'All' ||
          cleaner.categories.some(cat => cat.toLowerCase() === selectedSpecialty.toLowerCase());

        let matchesPrice = true;
        if (selectedPriceFilter === 'budget') {
          matchesPrice = cleaner.minPrice <= 300;
        } else if (selectedPriceFilter === 'standard') {
          matchesPrice = cleaner.minPrice > 300 && cleaner.minPrice <= 800;
        } else if (selectedPriceFilter === 'premium') {
          matchesPrice = cleaner.minPrice > 800;
        }

        return matchesSearch && matchesSpecialty && matchesPrice;
      })
      .sort((a, b) => {
        // 30 Days Premium Dominance cleaners always rank #1
        if (a.is30DaysPremium && !b.is30DaysPremium) return -1;
        if (!a.is30DaysPremium && b.is30DaysPremium) return 1;

        // General promoted partners rank above non-promoted
        if (a.isPromoted && !b.isPromoted) return -1;
        if (!a.isPromoted && b.isPromoted) return 1;

        if (cleanerSort === 'cheap') {
          return a.minPrice - b.minPrice;
        }
        if (cleanerSort === 'services_count') {
          return b.servicesCount - a.servicesCount;
        }

        // Default: Sort by rating (5-star first) then review count
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.reviewsCount - a.reviewsCount;
      });
  }, [cleaners, searchQuery, selectedSpecialty, selectedPriceFilter, cleanerSort]);

  const handleOpenCleanerShop = (cleaner) => {
    navigate(`/cleaner/${cleaner._id}`, { state: { cleaner } });
  };

  return (
    <div className="bg-background font-body-md text-on-surface min-h-screen">
      {/* Main Content */}
      <main className="relative pb-16">
        <div className="flex flex-col w-full">
          {/* Hero Banner Section */}
          <div className="relative w-full min-h-[300px] sm:min-h-[340px] bg-surface-container rounded-3xl overflow-hidden shadow-xs mx-auto max-w-[1280px] mt-4 sm:mt-6 flex flex-col justify-center items-center group px-4 sm:px-8 py-8 sm:py-12">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-80 mix-blend-multiply group-hover:scale-105 transition-transform duration-1000 ease-out"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAEDadytEqqBpAlJ_oWC_yb2Txa9MnRnSdg3CH3IKu_af3zPc4U62lUiXXNJX6Ddx481B0Ga4w20_DluX1E6ZCwUPhJyWuPXP10b_Z5LTLNfuV5I3Npgb7LiY3z3UlYLgFBRshJHqfCB9rOejR0jP4hDrovsb3-TM4pmbgxkEZUchfahYvi8Nj2coeQPC-AFHjfP87-kUwKkhRf6S9jFdmEjmChuKU7P_IUrDVXI5CLNHAZ3WH0_pKfkQ')`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container/90 via-surface-container/50 to-transparent" />

            <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-5 max-w-3xl px-4 w-full text-center">
              <span className="px-3.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm font-bold text-xs inline-flex items-center gap-1.5 shadow-xs">
                <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                Verified Laundry Professionals
              </span>
              <h1 className="font-headline-xl text-2xl sm:text-4xl md:text-5xl text-on-surface font-extrabold tracking-tight leading-tight">
                Choose your cleaner. Custom pricing on your terms.
              </h1>
              <p className="text-on-surface-variant text-xs sm:text-base max-w-xl leading-relaxed">
                Browse certified cleaners, inspect transparent pricing per KG or garment, and book pickup &amp; delivery directly.
              </p>

              {/* Integrated Search Bar on Hero for Instant Discovery */}
              <div className="w-full max-w-xl mt-2 flex flex-col sm:flex-row items-center gap-2 bg-surface-container-lowest p-2 rounded-2xl sm:rounded-full border border-outline-variant/40 shadow-md focus-within:ring-2 focus-within:ring-primary/20">
                <div className="flex-1 flex items-center gap-2.5 px-3 py-1.5 w-full">
                  <span className="material-symbols-outlined text-outline text-[20px]">search</span>
                  <input
                    className="bg-transparent border-none outline-none text-body-sm w-full text-on-surface placeholder:text-on-surface-variant/60"
                    placeholder="Search by cleaner name, specialty, or item..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-outline hover:text-on-surface p-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 bg-surface-container rounded-full text-xs text-on-surface font-medium shrink-0 self-end sm:self-auto">
                  <span className="material-symbols-outlined text-primary text-[16px]">location_on</span>
                  <span>{location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cleaners Directory Section */}
          <div className="max-w-[1240px] mx-auto w-full px-4 md:px-8 mt-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="font-headline-lg text-2xl font-bold text-on-surface flex items-center gap-2">
                  <span>Available Cleaners</span>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                    {cleaners.length} Active Partners
                  </span>
                </h2>
                <p className="font-body-md text-body-sm text-on-surface-variant mt-1">
                  Click on any cleaner to open their shop and browse customized services &amp; pricing.
                </p>
              </div>

              {/* Interactive Sort & Filter Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-surface-container p-1 rounded-full border border-outline-variant/30 text-xs">
                  <button
                    type="button"
                    onClick={() => setCleanerSort('rating_desc')}
                    className={`px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer flex items-center gap-1 ${cleanerSort === 'rating_desc'
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    <span>Top Rated</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCleanerSort('cheap')}
                    className={`px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer flex items-center gap-1 ${cleanerSort === 'cheap'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">payments</span>
                    <span>Lowest Price</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCleanerSort('services_count')}
                    className={`px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer flex items-center gap-1 ${cleanerSort === 'services_count'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                    <span>Most Services</span>
                  </button>
                </div>

                {/* Price Filter Pill */}
                <select
                  value={selectedPriceFilter}
                  onChange={(e) => setSelectedPriceFilter(e.target.value)}
                  className="bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-bold py-1.5 px-3 rounded-full outline-none focus:border-primary cursor-pointer"
                >
                  <option value="All">All Starting Prices</option>
                  <option value="budget">Cheap (&le; KES 300)</option>
                  <option value="standard">Standard (KES 300 - 800)</option>
                  <option value="premium">Premium (KES 800+)</option>
                </select>
              </div>
            </div>

            {/* Specialty Category Filter Pills */}
            {allSpecialties.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider shrink-0 mr-1">
                  Specialties:
                </span>
                {allSpecialties.map(spec => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => setSelectedSpecialty(spec)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${selectedSpecialty === spec
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            )}

            {/* Cleaners Grid */}
            <div className="grid grid-cols-12 gap-6">
              {/* Cleaners List */}
              <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                ) : error ? (
                  <div className="col-span-full py-12 text-center text-red-600 bg-red-50 rounded-2xl border border-red-200">
                    <p className="font-bold">{error}</p>
                  </div>
                ) : filteredCleaners.length === 0 ? (
                  <div className="col-span-full">
                    <EmptyState
                      icon="store_mall_directory"
                      title="No Cleaners Found"
                      description="No laundry partners match your current search query or specialty filter."
                      actionLabel="Show All Cleaners"
                      actionIcon="refresh"
                      onAction={() => {
                        setSearchQuery('');
                        setSelectedSpecialty('All');
                        setSelectedPriceFilter('All');
                      }}
                    />
                  </div>
                ) : (
                  filteredCleaners.map(cleaner => {
                    return (
                      <div
                        key={cleaner._id}
                        onClick={() => handleOpenCleanerShop(cleaner)}
                        className={`bg-surface-container-lowest rounded-2xl p-6 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between border ${cleaner.is30DaysPremium
                          ? 'border-amber-500/70 ring-2 ring-amber-400/30 bg-gradient-to-b from-amber-50/40 to-white'
                          : cleaner.isPromoted
                            ? 'border-blue-500/50 ring-1 ring-blue-500/20 bg-gradient-to-b from-blue-50/30 to-white'
                            : 'border-surface-container/60 hover:border-primary/40'
                          }`}
                      >
                        <div>
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3.5">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border group-hover:scale-105 transition-transform ${cleaner.is30DaysPremium ? 'bg-amber-100/80 border-amber-300 text-amber-800' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                                <span className="material-symbols-outlined text-[26px]">
                                  {cleaner.is30DaysPremium ? 'workspace_premium' : 'storefront'}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h3 className="font-headline-md text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                                    {cleaner.businessName}
                                  </h3>
                                  {cleaner.is30DaysPremium ? (
                                    <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-2xs shrink-0">
                                      <span className="material-symbols-outlined text-[12px]">crown</span>
                                      30 Days Premium
                                    </span>
                                  ) : cleaner.isPromoted ? (
                                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 shrink-0">
                                      <span className="material-symbols-outlined text-[12px]">verified</span>
                                      Top Partner
                                    </span>
                                  ) : null}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] text-amber-700 font-extrabold flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                                    ★ {cleaner.rating.toFixed(1)} ({cleaner.reviewsCount})
                                  </span>
                                  <span className="text-[11px] text-on-surface-variant font-medium">
                                    • {cleaner.servicesCount} services
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => toggleFavorite(cleaner._id, e)}
                              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-outline transition-colors shrink-0"
                              title="Favorite Cleaner"
                            >
                              <span className={`material-symbols-outlined text-[18px] ${favorites[cleaner._id] ? 'text-red-500' : ''}`}>
                                {favorites[cleaner._id] ? 'favorite' : 'favorite_border'}
                              </span>
                            </button>
                          </div>

                          <p className="text-xs text-on-surface-variant line-clamp-2 mt-3">
                            {cleaner.promotionTagline || `${cleaner.businessName} offers premium laundry and dry cleaning with express door-to-door delivery.`}
                          </p>

                          {/* Specialties Tags */}
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {cleaner.categories.slice(0, 3).map(cat => (
                              <span
                                key={cat}
                                className="px-2.5 py-0.5 bg-secondary-container/20 text-secondary rounded-md text-[11px] font-semibold"
                              >
                                {cat}
                              </span>
                            ))}
                            {cleaner.categories.length > 3 && (
                              <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded-md text-[10px] font-medium">
                                +{cleaner.categories.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Footer: Starting Price & Action */}
                        <div className="mt-5 pt-3 border-t border-surface-container/40 flex items-end justify-between">
                          <div>
                            <span className="text-[11px] text-on-surface-variant block">Services from</span>
                            <span className="text-base font-extrabold text-on-surface">
                              KES {cleaner.minPrice.toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                            <span>Open Shop</span>
                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Promoted / Featured Partner Sidebar (Handles 1, 2, or more featured cleaners cleanly) */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-500 text-[18px]">verified</span>
                    <span>{isPromotedSponsored ? 'Featured Partner Spot' : 'Top Rated Partner'}</span>
                  </h3>
                  {featuredProviders.length > 1 && (
                    <span className="text-[11px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {featuredProviders.length} Partners Featured
                    </span>
                  )}
                </div>

                {featuredProviders.length === 0 ? (
                  <div className="bg-primary text-on-primary rounded-3xl p-6 shadow-md text-center">
                    <span className="material-symbols-outlined text-[36px] mb-2 text-on-primary/80">workspace_premium</span>
                    <h4 className="font-bold text-lg">Partner With Us</h4>
                    <p className="text-xs text-on-primary/90 mt-1">Boost your business with 30 Days Premium Dominance placement.</p>
                  </div>
                ) : (
                  featuredProviders.map((fp, index) => {
                    const is30Days = Boolean(fp.is30DaysPremium || fp.packageName?.toLowerCase().includes('30') || fp.packageName?.toLowerCase().includes('dominance'));
                    const pRating = Number(fp.rating ?? 5.0);
                    const pName = fp.businessName || fp.fullName || 'Featured Cleaner';
                    const targetId = fp._id || fp.provider?._id;

                    return (
                      <div
                        key={targetId || index}
                        className={`rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[290px] border transition-all ${is30Days
                          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white border-amber-400/40 ring-1 ring-amber-400/30'
                          : isPromotedSponsored
                            ? 'bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white border-blue-400/30'
                            : 'bg-primary text-on-primary border-primary/20'
                          }`}
                      >
                        <div className="relative z-10 flex flex-col h-full justify-between">
                          <div>
                            {/* Card Tag Badge */}
                            <div className="flex items-center justify-between mb-4">
                              {is30Days ? (
                                <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-extrabold rounded-full text-xs inline-flex items-center gap-1 shadow-sm">
                                  <span className="material-symbols-outlined text-[15px]">crown</span>
                                  30 Days Premium Dominance
                                </span>
                              ) : isPromotedSponsored ? (
                                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs text-white inline-flex items-center gap-1.5 font-bold">
                                  <span className="material-symbols-outlined text-[15px]">verified</span>
                                  {fp.packageName || 'Featured Partner'}
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-amber-400/20 text-amber-200 border border-amber-400/30 rounded-full text-xs inline-flex items-center gap-1.5 font-bold">
                                  <span className="material-symbols-outlined text-[15px]">star</span>
                                  Highest Rated Cleaner (5★)
                                </span>
                              )}

                              <div className="flex items-center gap-1 bg-black/30 px-2.5 py-1 rounded-full text-xs font-bold">
                                <span className="material-symbols-outlined text-amber-300 text-[14px]">star</span>
                                <span>{pRating.toFixed(1)}</span>
                              </div>
                            </div>

                            <h3 className="text-xl font-extrabold mb-1.5 tracking-tight flex items-center gap-1.5">
                              <span>{pName}</span>
                              {is30Days && (
                                <span className="material-symbols-outlined text-amber-400 text-[18px]">verified</span>
                              )}
                            </h3>

                            <p className="text-xs text-white/80 leading-relaxed line-clamp-3">
                              {fp.tagline || (is30Days ? '★ 30 Days Premium Dominance Partner • Express pickup and premium fabric treatment.' : 'Top-tier laundry care with reliable door-to-door delivery.')}
                            </p>

                            <div className="mt-4 bg-white/10 rounded-xl p-2.5 backdrop-blur-xs text-xs space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="opacity-80">M-Pesa Till:</span>
                                <span className="font-bold text-amber-300">{fp.tillNumber || '8995354'}</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="opacity-80">Turnaround:</span>
                                <span className="font-bold">24-48 Hours</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (targetId) {
                                navigate(`/cleaner/${targetId}`);
                              }
                            }}
                            className={`w-full px-4 py-2.5 rounded-xl font-bold text-xs transition-all mt-5 shadow-md flex items-center justify-center gap-2 cursor-pointer ${is30Days
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 hover:brightness-105'
                              : 'bg-white text-slate-900 hover:bg-slate-100'
                              }`}
                          >
                            <span className="material-symbols-outlined text-[17px]">storefront</span>
                            <span>Visit {is30Days ? 'Premium' : 'Featured'} Shop</span>
                            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                          </button>
                        </div>

                        <svg
                          className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12 pointer-events-none"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                        </svg>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="w-full py-6 mt-16 text-center text-on-surface-variant font-body-sm text-xs border-t border-outline-variant/20">
            <p>© 2026 {settings?.platformName || 'Cleanly'}. All rights reserved.</p>
            <p className="text-xs text-outline mt-1">Support: {settings?.supportEmail || 'support@auralaundry.co.ke'} | {settings?.supportPhone || '+254 700 000 000'}</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
