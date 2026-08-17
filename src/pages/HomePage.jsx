import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../hooks/useAuth';
import { serviceApi } from '../api/serviceApi';
import { promotionApi } from '../api/promotionApi';

export default function HomePage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { user, isAuthenticated } = useAuth();

  const [activeNav, setActiveNav] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Nairobi, KE');
  const [favorites, setFavorites] = useState({});

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState(null);

  // Featured / Promoted Provider State
  const [featuredProvider, setFeaturedProvider] = useState(null);
  const [isPromotedSponsored, setIsPromotedSponsored] = useState(false);

  useEffect(() => {
    const fetchServicesAndPromotions = async () => {
      try {
        setLoadingServices(true);
        const [servicesRes, promoRes] = await Promise.all([
          serviceApi.getServices(),
          promotionApi.getFeaturedProviders().catch(() => ({ success: false }))
        ]);

        if (servicesRes.success && servicesRes.data) {
          setServices(servicesRes.data);
        }

        if (promoRes.success && promoRes.data && promoRes.data.featuredProvider) {
          setFeaturedProvider(promoRes.data.featuredProvider);
          setIsPromotedSponsored(true);
        }
      } catch (err) {
        setServicesError('Failed to load available laundry services.');
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServicesAndPromotions();
  }, []);

  const toggleFavorite = (serviceId, e) => {
    e.stopPropagation();
    setFavorites(prev => ({
      ...prev,
      [serviceId]: !prev[serviceId]
    }));
  };

  const [homeSort, setHomeSort] = useState('rating_desc');
  const [selectedHomeCategory, setSelectedHomeCategory] = useState('All');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState('All');

  // Sort services: Promoted partner services appear at the very TOP (#1), then sorted by 5-star rating or cheap price
  const promotedProviderId = featuredProvider?._id || featuredProvider?.id || null;

  const sortedServices = [...services].sort((a, b) => {
    const aProviderId = (a.provider?._id || a.provider || '').toString();
    const bProviderId = (b.provider?._id || b.provider || '').toString();

    const aIsPromoted = promotedProviderId && aProviderId === promotedProviderId;
    const bIsPromoted = promotedProviderId && bProviderId === promotedProviderId;

    if (aIsPromoted && !bIsPromoted) return -1;
    if (!aIsPromoted && bIsPromoted) return 1;

    if (homeSort === 'cheap') {
      const aPrice = a.basePrice || 0;
      const bPrice = b.basePrice || 0;
      if (aPrice !== bPrice) return aPrice - bPrice;
    }

    // Default: Sort strictly by 5-star rating down to lower rating
    const aRating = Number(a.provider?.providerDetails?.rating ?? 5.0);
    const bRating = Number(b.provider?.providerDetails?.rating ?? 5.0);
    if (bRating !== aRating) return bRating - aRating;

    return 0;
  });

  const filteredServices = sortedServices.filter(service => {
    const q = searchQuery.toLowerCase();
    const nameMatch = service.name?.toLowerCase().includes(q);
    const catMatch = service.category?.toLowerCase().includes(q);
    const providerMatch = service.provider?.fullName?.toLowerCase().includes(q) ||
      service.provider?.providerDetails?.businessName?.toLowerCase().includes(q);

    const matchesSearch = !q || nameMatch || catMatch || providerMatch;
    const matchesCategory = selectedHomeCategory === 'All' || service.category?.toLowerCase() === selectedHomeCategory.toLowerCase();
    
    let matchesPrice = true;
    const price = service.basePrice || 0;
    if (selectedPriceFilter === 'budget') {
      matchesPrice = price <= 300;
    } else if (selectedPriceFilter === 'standard') {
      matchesPrice = price > 300 && price <= 800;
    } else if (selectedPriceFilter === 'premium') {
      matchesPrice = price > 800;
    }

    return matchesSearch && matchesCategory && matchesPrice;
  });

  return (
    <div className="bg-background font-body-md text-on-surface min-h-screen">
      {/* Fixed Top Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-surface/80 backdrop-blur-xl z-40 flex items-center justify-between px-container-padding-desktop shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img
              alt="Laundry Service Logo"
              className="h-8 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida/AP1WRLta25wmxF0oJh9s5exB3Ml7fMmY_esGvwYxcKOGZXWLBepx1CHhANhjBXqPbbNnTNm7MIbDRR3Ab1Vj9ov3fBDnLO5WMZag_dDQfQOL4Trb-Yxm9ddXDK3GQcZCyhVXI96L6P4dWgbcfnOjDNoJfkSUIj_KSAzA2jUTk3ZD3csi9B1PcK3Z8tfcLndPQbkxp7gOwemuQOl7rko664DBJXqzta58JFFYVZgGIT-K6ed6EbOP4vs3Fde4xos"
            />
            <span className="font-headline-md text-headline-md text-primary tracking-tight font-semibold">
              Cleanly
            </span>
          </div>

          <nav className="hidden lg:flex items-center gap-2">
            {[
              { id: 'discover', label: 'Discover', icon: 'explore' },
              { id: 'compare', label: 'Compare', icon: 'compare_arrows' },
              { id: 'my-orders', label: 'My Orders', icon: 'local_laundry_service' },
              { id: 'support', label: 'Support', icon: 'help_outline' },
            ].map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all group ${isActive
                      ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span className="font-label-md text-label-md">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Global Search & Location */}
        <div className="flex items-center gap-6 flex-1 max-w-xl mx-8">
          <div className="flex-1 flex items-center gap-3 bg-surface-container-lowest px-4 py-2.5 rounded-full border border-outline-variant/30 focus-within:ring-1 focus-within:ring-primary transition-all">
            <span className="material-symbols-outlined text-outline">search</span>
            <input
              className="bg-transparent border-none outline-none text-body-sm w-full text-on-surface placeholder:text-on-surface-variant/50"
              placeholder="Search services, items or cleaners..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-container rounded-full cursor-pointer hover:bg-surface-container-high transition-colors shrink-0">
            <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
            <span className="text-body-sm font-medium">{location}</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">keyboard_arrow_down</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            user.role === 'admin' ? (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-4 py-2 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm hover:bg-slate-800 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                <span>Super Admin</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/provider')}
                className="px-4 py-2 rounded-full bg-primary text-on-primary font-semibold text-xs flex items-center gap-1.5 shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">dry_cleaning</span>
                <span>Cleaner Portal</span>
              </button>
            )
          ) : (
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center text-on-primary shadow-sm cursor-pointer"
              onClick={() => navigate('/login')}
              title="Access Portal Login"
            >
              <span className="material-symbols-outlined text-[20px]">person</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative pt-20 bg-background min-h-screen">
        <div className="flex flex-col w-full pb-16">
          {/* Hero Banner Section */}
          <div className="relative w-full h-[360px] bg-surface-container rounded-3xl overflow-hidden shadow-sm mx-auto max-w-[1240px] mt-8 flex flex-col justify-center items-center group px-4">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-80 mix-blend-multiply group-hover:scale-105 transition-transform duration-1000 ease-out"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAEDadytEqqBpAlJ_oWC_yb2Txa9MnRnSdg3CH3IKu_af3zPc4U62lUiXXNJX6Ddx481B0Ga4w20_DluX1E6ZCwUPhJyWuPXP10b_Z5LTLNfuV5I3Npgb7LiY3z3UlYLgFBRshJHqfCB9rOejR0jP4hDrovsb3-TM4pmbgxkEZUchfahYvi8Nj2coeQPC-AFHjfP87-kUwKkhRf6S9jFdmEjmChuKU7P_IUrDVXI5CLNHAZ3WH0_pKfkQ')`,
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container/60 to-transparent"></div>

            <div className="relative z-10 flex flex-col items-center gap-6 max-w-3xl px-8 w-full">
              <h1 className="font-headline-xl text-headline-xl text-on-surface text-center font-bold">
                Find the perfect clean, near you.
              </h1>
              <div className="w-full bg-surface/90 backdrop-blur-md rounded-full shadow-md flex items-center p-2 gap-4 border border-outline-variant/20 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 pl-4 pr-2 border-r border-outline-variant/30 text-on-surface-variant flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">location_on</span>
                  <span className="font-body-md text-body-md whitespace-nowrap">{location}</span>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-[20px]">search</span>
                  <input
                    className="w-full bg-transparent border-none outline-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50"
                    placeholder="Search dry cleaning, wash & fold..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { }}
                  className="bg-primary hover:bg-surface-tint text-on-primary px-6 py-3 rounded-full font-label-md text-label-md transition-colors whitespace-nowrap font-medium"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Top Rated Providers Section */}
          <div className="max-w-[1240px] mx-auto w-full px-container-padding-desktop mt-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold flex items-center gap-2">
                  <span>Top Rated Providers</span>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    5★ Ranked
                  </span>
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                  Vetted laundry professionals arranged by client ratings and affordability
                </p>
              </div>

              {/* Interactive Sort & Filter Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-surface-container p-1 rounded-full border border-outline-variant/30 text-xs">
                  <button
                    type="button"
                    onClick={() => setHomeSort('rating_desc')}
                    className={`px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      homeSort === 'rating_desc'
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    <span>Top Rated</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHomeSort('cheap')}
                    className={`px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      homeSort === 'cheap'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">payments</span>
                    <span>Cheapest</span>
                  </button>
                </div>

                {/* Price Filter Pill */}
                <select
                  value={selectedPriceFilter}
                  onChange={(e) => setSelectedPriceFilter(e.target.value)}
                  className="bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-bold py-1.5 px-3 rounded-full outline-none focus:border-primary cursor-pointer"
                >
                  <option value="All">All Prices</option>
                  <option value="budget">Cheap (&le; KES 300)</option>
                  <option value="standard">Standard (KES 300 - 800)</option>
                  <option value="premium">Premium (KES 800+)</option>
                </select>

                <button
                  type="button"
                  onClick={() => navigate('/reviews')}
                  className="px-3.5 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/5 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">rate_review</span>
                  <span>Rankings &amp; Reviews</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-bento-gap">
              {/* Service Grid Left Column */}
              <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-bento-gap">
                {loadingServices ? (
                  <div className="col-span-full py-12 text-center text-primary flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-[24px]">sync</span>
                    Loading live laundry services catalog...
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-on-surface-variant font-body-md bg-surface-container-lowest rounded-2xl border border-surface-container/40">
                    No active services found matching your search.
                  </div>
                ) : (
                  filteredServices.map((service) => {
                    const providerBusinessName = service.provider?.providerDetails?.businessName || service.provider?.fullName || 'Aura Partner Cleaner';
                    const providerRating = service.provider?.providerDetails?.rating || 5.0;
                    const providerTillNumber = service.provider?.providerDetails?.tillNumber || '8995354';
                    const paymentChannelsCount = service.provider?.providerDetails?.paymentChannels?.length || 0;
                    const hasChannelConfigured = Boolean(
                      paymentChannelsCount > 0 ||
                      service.provider?.providerDetails?.payoutPhoneNumber ||
                      (service.provider?.providerDetails?.tillNumber && service.provider?.providerDetails?.tillNumber !== '8995354')
                    );
                    const deliveryFee = typeof service.deliveryFee === 'number' ? service.deliveryFee : 200;

                    const checkoutState = {
                      serviceId: service._id,
                      serviceName: service.name,
                      category: service.category,
                      details: service.description || 'Standard professional laundry care.',
                      servicePrice: service.basePrice || 0,
                      pricingType: service.pricingType || 'per_kg',
                      deliveryOption: deliveryFee === 0 ? 'Free Delivery' : 'Standard Pickup & Delivery',
                      deliveryPrice: deliveryFee,
                      tillNumber: providerTillNumber,
                      hasChannelConfigured: hasChannelConfigured,
                      providerName: providerBusinessName
                    };

                    const serviceProviderId = (service.provider?._id || service.provider || '').toString();
                    const isPromotedService = Boolean(promotedProviderId && serviceProviderId === promotedProviderId);

                    return (
                      <div
                        key={service._id}
                        onClick={() => navigate('/checkout', { state: checkoutState })}
                        className={`bg-surface-container-lowest rounded-[16px] p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between h-[280px] border ${isPromotedService
                            ? 'border-blue-500/40 ring-1 ring-blue-500/20 bg-gradient-to-b from-blue-50/20 to-white'
                            : 'border-transparent hover:border-primary/20'
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-primary text-[24px]">local_laundry_service</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors font-medium">
                                  {service.name}
                                </h3>
                                {isPromotedService && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 shrink-0">
                                    <span className="material-symbols-outlined text-[12px]">verified</span>
                                    Top Partner
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="font-body-sm text-on-surface-variant text-xs font-semibold text-blue-700">
                                  {providerBusinessName}
                                </p>
                                <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded">
                                  ★ {providerRating}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => toggleFavorite(service._id, e)}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-outline transition-colors"
                            title="Favorite"
                          >
                            <span className={`material-symbols-outlined text-[20px] ${favorites[service._id] ? 'text-red-500' : ''}`}>
                              {favorites[service._id] ? 'favorite' : 'favorite_border'}
                            </span>
                          </button>
                        </div>

                        <p className="font-body-sm text-on-surface-variant line-clamp-2 my-2">
                          {service.description || 'Professional washing, drying, and folding service.'}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="px-3 py-1 bg-secondary-container/20 text-secondary rounded-md font-label-md text-label-md font-semibold">
                            {service.category}
                          </span>
                          <span className="px-3 py-1 bg-surface-container rounded-md font-label-md text-label-md text-on-surface-variant">
                            {service.pricingType?.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="mt-2 flex items-end justify-between border-t border-surface-container/30 pt-3">
                          <div>
                            <p className="font-body-sm text-body-sm text-on-surface-variant mb-0.5">
                              Price
                            </p>
                            <p className="font-headline-md text-headline-md text-on-surface font-semibold">
                              KES {service.basePrice?.toLocaleString()}{' '}
                              <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">
                                / {service.pricingType === 'per_kg' ? 'kg' : service.pricingType === 'per_item' ? 'item' : 'order'}
                              </span>
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                            <span className="material-symbols-outlined text-primary group-hover:text-on-primary transition-colors">
                              arrow_forward
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Promoted Section Right Column */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-bento-gap">
                <div className="bg-primary text-on-primary rounded-[16px] p-6 shadow-md relative overflow-hidden flex-1 min-h-[280px]">
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 bg-on-primary/20 backdrop-blur-md rounded-full font-label-md text-label-md text-on-primary inline-flex items-center gap-1.5 font-semibold">
                          <span className="material-symbols-outlined text-[15px]">verified</span>
                          {isPromotedSponsored ? 'Featured Cleaner' : 'Top Partner'}
                        </span>
                        {featuredProvider?.rating && (
                          <div className="flex items-center gap-1 bg-black/20 px-2.5 py-1 rounded-full text-xs font-semibold">
                            <span className="material-symbols-outlined text-amber-300 text-[14px]">star</span>
                            <span>{featuredProvider.rating}</span>
                          </div>
                        )}
                      </div>

                      <h3 className="font-headline-lg text-headline-lg mb-2 font-bold tracking-tight">
                        {featuredProvider?.businessName || 'Sparkle Cleaners'}
                      </h3>
                      <p className="font-body-md text-body-md text-on-primary/90 opacity-90 leading-snug">
                        {featuredProvider?.tagline || 'Same-day pickup and delivery for busy professionals.'}
                      </p>

                      {featuredProvider?.featuredService && (
                        <div className="mt-3 bg-white/10 rounded-xl p-2.5 backdrop-blur-xs text-xs">
                          <span className="opacity-80 block text-[11px] uppercase tracking-wider font-semibold">Popular Service:</span>
                          <span className="font-bold">{featuredProvider.featuredService.name}</span> — KES {featuredProvider.featuredService.basePrice?.toLocaleString()}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const s = featuredProvider?.featuredService;
                        const sId = s?._id || services[0]?._id;
                        const sName = s?.name || `${featuredProvider?.businessName || 'Featured'} Laundry Service`;
                        const sPrice = s?.basePrice || 1200;
                        const deliveryFee = typeof s?.deliveryFee === 'number' ? s.deliveryFee : 200;

                        navigate('/checkout', {
                          state: {
                            serviceId: sId,
                            serviceName: sName,
                            details: s?.description || 'Same-day Pickup & Delivery',
                            servicePrice: sPrice,
                            deliveryOption: deliveryFee === 0 ? 'Free Delivery' : 'Priority Express Pickup & Delivery',
                            deliveryPrice: deliveryFee,
                            tillNumber: featuredProvider?.tillNumber || '8995354',
                            providerName: featuredProvider?.businessName || 'Featured Cleaner',
                            hasChannelConfigured: true
                          },
                        });
                      }}
                      className="w-full bg-on-primary text-primary px-4 py-3 rounded-xl font-label-md text-label-md hover:bg-surface-container-lowest transition-colors mt-6 font-semibold shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                      <span>Book Featured Cleaner</span>
                    </button>
                  </div>
                  <svg
                    className="absolute -bottom-10 -right-10 w-48 h-48 text-on-primary/10 rotate-12 pointer-events-none"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="w-full py-6 mt-16 text-center text-on-surface-variant font-body-sm text-body-sm border-t border-outline-variant/20">
            <p>© 2026 {settings?.platformName || 'Aura Laundry'}. All rights reserved.</p>
            <p className="text-xs text-outline mt-1">Support: {settings?.supportEmail || 'support@auralaundry.co.ke'} | {settings?.supportPhone || '+254 700 000 000'}</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

