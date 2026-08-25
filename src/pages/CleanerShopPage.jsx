import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { serviceApi } from '../api/serviceApi';
import api from '../api/axios';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../hooks/useAuth';

export default function CleanerShopPage() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const { user, isAuthenticated } = useAuth();

  // Initial cleaner info from navigation state fallback
  const passedCleaner = location.state?.cleaner || null;

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cleanerInfo, setCleanerInfo] = useState(passedCleaner);

  // Search & Filtering within Cleaner's Shop
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('default');

  // Item customization state: { [serviceId]: { quantity: number, selectedAddOns: string[] } }
  const [itemOptions, setItemOptions] = useState({});

  useEffect(() => {
    const fetchCleanerServices = async () => {
      if (!providerId) {
        setError('No cleaner ID provided.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch services strictly belonging to this providerId
        const [servicesRes, profileRes] = await Promise.all([
          serviceApi.getServices({ providerId, activeOnly: 'true' }),
          api.get(`/auth/public/providers/${providerId}`).catch(() => ({ data: { success: false } }))
        ]);

        if (servicesRes.success && Array.isArray(servicesRes.data)) {
          setServices(servicesRes.data);

          // Extract provider information from populated service data if not already set
          if (servicesRes.data.length > 0 && servicesRes.data[0].provider) {
            const p = servicesRes.data[0].provider;
            setCleanerInfo(prev => ({
              ...(prev || {}),
              _id: p._id || providerId,
              fullName: p.fullName || 'Professional Cleaner',
              businessName: p.providerDetails?.businessName || p.fullName || 'Partner Cleaner',
              rating: Number(p.providerDetails?.rating ?? 5.0),
              reviewsCount: Number(p.providerDetails?.reviewsCount ?? 0),
              tillNumber: p.providerDetails?.tillNumber || '8995354',
              phone: p.phone || '',
              email: p.email || '',
              isPromoted: Boolean(p.providerDetails?.isPromoted),
              promotionTagline: p.providerDetails?.promotionTagline || '',
              paymentChannels: p.providerDetails?.paymentChannels || []
            }));
          }
        } else {
          setServices([]);
        }

        // If profile endpoint returned data, use it for cleaner banner details
        if (profileRes?.data?.success && profileRes.data.data) {
          const prof = profileRes.data.data;
          setCleanerInfo(prev => ({
            ...(prev || {}),
            ...prof
          }));
        }
      } catch (err) {
        console.error('Failed to load cleaner shop services:', err);
        setError('Failed to load services for this cleaner. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCleanerServices();
  }, [providerId]);

  // Extract unique categories for tab filtering
  const availableCategories = useMemo(() => {
    const cats = new Set(['All']);
    services.forEach(s => {
      if (s.category) cats.add(s.category);
    });
    return Array.from(cats);
  }, [services]);

  // Handle quantity changes
  const handleQuantityChange = (serviceId, delta, min = 1, max = 100) => {
    setItemOptions(prev => {
      const current = prev[serviceId] || { quantity: min, selectedAddOns: [] };
      const newQty = Math.max(min, Math.min(max, current.quantity + delta));
      return {
        ...prev,
        [serviceId]: {
          ...current,
          quantity: newQty
        }
      };
    });
  };

  // Toggle add-on selection
  const handleToggleAddOn = (serviceId, addOn) => {
    setItemOptions(prev => {
      const current = prev[serviceId] || { quantity: 1, selectedAddOns: [] };
      const exists = current.selectedAddOns.some(a => a._id === addOn._id || a.name === addOn.name);
      let updatedAddOns;
      if (exists) {
        updatedAddOns = current.selectedAddOns.filter(a => (a._id || a.name) !== (addOn._id || addOn.name));
      } else {
        updatedAddOns = [...current.selectedAddOns, addOn];
      }
      return {
        ...prev,
        [serviceId]: {
          ...current,
          selectedAddOns: updatedAddOns
        }
      };
    });
  };

  // Filter and sort services strictly for this cleaner
  const filteredServices = useMemo(() => {
    return services
      .filter(s => {
        // Strict isolation: service must belong to this specific cleaner
        const serviceProviderId = (s.provider?._id || s.provider || '').toString();
        if (providerId && serviceProviderId && serviceProviderId !== providerId.toString()) {
          return false;
        }

        const matchesCategory = selectedCategory === 'All' || s.category?.toLowerCase() === selectedCategory.toLowerCase();
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q || s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q);
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortOption === 'price_asc') return (a.basePrice || 0) - (b.basePrice || 0);
        if (sortOption === 'price_desc') return (b.basePrice || 0) - (a.basePrice || 0);
        return 0;
      });
  }, [services, providerId, selectedCategory, searchQuery, sortOption]);

  const handleBookService = (service) => {
    const options = itemOptions[service._id] || { quantity: service.minQuantity || 1, selectedAddOns: [] };
    const quantity = options.quantity || 1;
    const addOns = options.selectedAddOns || [];
    const addOnsTotal = addOns.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    const unitPrice = Number(service.basePrice) || 0;
    const computedServicePrice = (unitPrice * quantity) + addOnsTotal;

    const deliveryFee = typeof service.deliveryFee === 'number' ? service.deliveryFee : 200;
    const businessName = cleanerInfo?.businessName || cleanerInfo?.fullName || 'Verified Cleaner';
    const tillNumber = cleanerInfo?.tillNumber || '8995354';

    const addOnsSummary = addOns.length > 0 ? ` + Add-ons: ${addOns.map(a => a.name).join(', ')}` : '';
    const detailsString = `${quantity} ${service.pricingType?.replace('_', ' ') || 'unit(s)'}${addOnsSummary} • ${service.description || 'Standard care'}`;

    const checkoutState = {
      serviceId: service._id,
      serviceName: service.name,
      category: service.category,
      details: detailsString,
      servicePrice: computedServicePrice,
      baseUnitPrice: unitPrice,
      quantity: quantity,
      selectedAddOns: addOns,
      pricingType: service.pricingType || 'per_kg',
      deliveryOption: deliveryFee === 0 ? 'Free Delivery' : 'Standard Pickup & Delivery',
      deliveryPrice: deliveryFee,
      tillNumber: tillNumber,
      providerName: businessName,
      providerId: cleanerInfo?._id || providerId,
      hasChannelConfigured: true
    };

    navigate('/checkout', { state: checkoutState });
  };

  const businessName = cleanerInfo?.businessName || cleanerInfo?.fullName || 'Professional Cleaner';
  const rating = cleanerInfo?.rating ?? 5.0;
  const reviewsCount = cleanerInfo?.reviewsCount ?? 0;
  const tillNumber = cleanerInfo?.tillNumber || '8995354';

  return (
    <div className="bg-background font-body-md text-on-surface min-h-screen">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-surface/80 backdrop-blur-xl z-40 flex items-center justify-between px-6 lg:px-12 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors bg-surface-container px-3.5 py-2 rounded-full cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>All Cleaners</span>
          </button>

          {/* Home Button */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface-container hover:bg-primary/10 text-on-surface hover:text-primary transition-all group cursor-pointer border border-outline-variant/30 hover:border-primary/40 font-semibold text-xs shrink-0"
            title="Go to Home"
            aria-label="Home"
          >
            <span className="material-symbols-outlined text-[18px] text-primary group-hover:scale-110 transition-transform">home</span>
            <span className="font-bold">Home</span>
          </button>

          {/* Platform / Brand Name */}
          <div className="hidden md:flex flex-col ml-1">
            <span className="font-headline-md text-headline-md text-primary tracking-tight font-bold leading-tight">
              {settings?.platformName || 'Oduori Laundry'}
            </span>
          </div>
        </div>

        {/* Portal access / User status */}
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
                <span>My Portal</span>
              </button>
            )
          ) : (
            <button
              type="button"
              className="px-4 py-2 rounded-full bg-primary hover:bg-primary/90 transition-colors flex items-center gap-1.5 text-on-primary font-semibold text-xs shadow-sm cursor-pointer"
              onClick={() => navigate('/login')}
            >
              <span className="material-symbols-outlined text-[16px]">person</span>
              <span>Portal Login</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative pt-24 pb-20 px-4 md:px-8 max-w-[1240px] mx-auto min-h-screen">
        {/* Cleaner Storefront Hero Banner */}
        <div className="relative bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-surface-container/60 shadow-sm mt-4 overflow-hidden">
          {/* Subtle gradient accent */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-xs shrink-0">
                <span className="material-symbols-outlined text-primary text-[40px]">storefront</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-headline-lg text-2xl md:text-3xl font-bold text-on-surface">
                    {businessName}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    Verified Cleaner
                  </span>
                  {cleanerInfo?.isPromoted && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <span className="material-symbols-outlined text-[14px]">star</span>
                      Featured Partner
                    </span>
                  )}
                </div>

                <p className="text-on-surface-variant text-sm mt-1">
                  {cleanerInfo?.promotionTagline || 'Professional laundry, garment care & dry cleaning services.'}
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-on-surface-variant font-medium">
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-bold border border-amber-200/60">
                    <span>★ {rating.toFixed(1)}</span>
                    <span className="text-amber-600/70 font-normal">({reviewsCount} reviews)</span>
                  </div>

                  {cleanerInfo?.phone && (
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-primary">call</span>
                      <span>{cleanerInfo.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-md font-bold border border-emerald-200/60">
                    <span className="material-symbols-outlined text-[14px]">payments</span>
                    <span>M-Pesa Till: {tillNumber}</span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-600">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                    <span>24-48 Hours Standard Turnaround</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0 w-full md:w-auto justify-between border-t md:border-t-0 pt-4 md:pt-0 border-surface-container">
              <div className="text-left md:text-right">
                <span className="text-xs text-on-surface-variant block">Available Services</span>
                <span className="text-lg font-bold text-primary">{services.length} Offerings</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/reviews')}
                className="px-3.5 py-1.5 rounded-full border border-outline-variant/60 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-amber-500">star</span>
                <span>View Ratings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Store Catalog Section */}
        <div className="mt-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-headline-md text-xl md:text-2xl font-bold text-on-surface">
                Services & Pricing Menu
              </h2>
              <p className="text-xs md:text-sm text-on-surface-variant mt-0.5">
                Select your garments and customized add-ons configured directly by {businessName}
              </p>
            </div>

            {/* In-Store Search & Sort Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-surface-container px-3.5 py-2 rounded-full border border-outline-variant/30 text-xs flex-1 md:w-64">
                <span className="material-symbols-outlined text-[18px] text-outline">search</span>
                <input
                  type="text"
                  placeholder="Search cleaner's menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs w-full text-on-surface"
                />
              </div>

              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-semibold py-2 px-3 rounded-full outline-none focus:border-primary cursor-pointer"
              >
                <option value="default">Default Sorting</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          {availableCategories.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${selectedCategory === cat
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Catalog State Render */}
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-primary">
              <span className="material-symbols-outlined animate-spin text-[32px]">sync</span>
              <p className="font-semibold text-sm">Loading services and portal prices...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-center">
              <p className="font-bold">{error}</p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-full text-xs font-bold cursor-pointer"
              >
                Return to Cleaners Directory
              </button>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-3xl p-12 text-center border border-surface-container/40">
              <span className="material-symbols-outlined text-[48px] text-outline mb-2">dry_cleaning</span>
              <h3 className="font-bold text-lg text-on-surface">No services found</h3>
              <p className="text-sm text-on-surface-variant max-w-md mx-auto mt-1">
                {searchQuery || selectedCategory !== 'All'
                  ? 'Try clearing your search query or choosing another service category.'
                  : `${businessName} has not published any active services yet.`}
              </p>
              {(searchQuery || selectedCategory !== 'All') && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                  className="mt-4 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition-all cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map(service => {
                const options = itemOptions[service._id] || { quantity: service.minQuantity || 1, selectedAddOns: [] };
                const qty = options.quantity || 1;
                const selectedAddOns = options.selectedAddOns || [];
                const addOnsTotal = selectedAddOns.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
                const unitPrice = Number(service.basePrice) || 0;
                const totalItemPrice = (unitPrice * qty) + addOnsTotal;
                const deliveryFee = typeof service.deliveryFee === 'number' ? service.deliveryFee : 200;

                return (
                  <div
                    key={service._id}
                    className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container/60 hover:border-primary/30 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary mb-2 inline-block">
                            {service.category}
                          </span>
                          <h3 className="font-headline-md text-lg font-bold text-on-surface">
                            {service.name}
                          </h3>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-on-surface-variant block">Price</span>
                          <span className="text-lg font-bold text-on-surface">
                            KES {unitPrice.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-on-surface-variant block">
                            / {service.pricingType === 'per_kg' ? 'kg' : service.pricingType === 'pair_of_shoes' ? 'pair' : service.pricingType === 'per_item' ? 'item' : 'order'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-on-surface-variant mt-2 line-clamp-2">
                        {service.description || 'Standard high-grade professional wash, fabric care, and packaging.'}
                      </p>

                      <div className="flex items-center gap-3 mt-3 text-[11px] text-on-surface-variant font-medium">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-primary">local_shipping</span>
                          {deliveryFee === 0 ? 'Free Delivery' : `Delivery: KES ${deliveryFee}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">timer</span>
                          {service.turnaroundTime || '24-48 hrs'}
                        </span>
                      </div>

                      {/* Add-ons list if provider configured add-ons */}
                      {Array.isArray(service.addOns) && service.addOns.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-surface-container/40">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
                            Optional Add-ons:
                          </span>
                          <div className="space-y-1.5">
                            {service.addOns.map(addOn => {
                              const isChecked = selectedAddOns.some(a => (a._id || a.name) === (addOn._id || addOn.name));
                              return (
                                <label
                                  key={addOn._id || addOn.name}
                                  className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer border transition-colors ${isChecked ? 'bg-primary/5 border-primary/30 text-primary font-semibold' : 'bg-surface-container/30 border-transparent text-on-surface-variant'}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleAddOn(service._id, addOn)}
                                      className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                                    />
                                    <span>{addOn.name}</span>
                                  </div>
                                  <span className="text-xs font-bold">+KES {addOn.price}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Quantity Selector */}
                      <div className="mt-4 pt-3 border-t border-surface-container/40 flex items-center justify-between">
                        <span className="text-xs font-semibold text-on-surface-variant">
                          Quantity ({service.pricingType === 'per_kg' ? 'kg' : 'units'}):
                        </span>
                        <div className="flex items-center gap-2 bg-surface-container px-2 py-1 rounded-full border border-outline-variant/30">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(service._id, -1, service.minQuantity || 1, service.maxQuantity || 100)}
                            className="w-6 h-6 rounded-full bg-surface hover:bg-surface-container-high flex items-center justify-center text-xs font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-6 text-center">{qty}</span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(service._id, 1, service.minQuantity || 1, service.maxQuantity || 100)}
                            className="w-6 h-6 rounded-full bg-surface hover:bg-surface-container-high flex items-center justify-center text-xs font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Total & Action Button */}
                    <div className="mt-6 pt-4 border-t border-surface-container/60">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-on-surface-variant font-medium">Estimated Subtotal:</span>
                        <span className="text-base font-extrabold text-on-surface">
                          KES {totalItemPrice.toLocaleString()}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBookService(service)}
                        className="w-full bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer group"
                      >
                        <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                        <span>Book This Service</span>
                        <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-on-surface-variant font-body-sm text-xs border-t border-outline-variant/20">
        <p>© 2026 {settings?.platformName || 'Oduori Laundry'}. All rights reserved.</p>
      </footer>
    </div>
  );
}
