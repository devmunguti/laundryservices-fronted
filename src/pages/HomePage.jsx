import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { serviceApi } from '../api/serviceApi';

export default function HomePage() {
  const navigate = useNavigate();
  const { settings } = useSettings();

  const [activeNav, setActiveNav] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Nairobi, KE');
  const [favorites, setFavorites] = useState({});

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        const res = await serviceApi.getServices();
        if (res.success && Array.isArray(res.data)) {
          setServices(res.data);
        } else {
          setServicesError('Unable to load services catalog.');
        }
      } catch (err) {
        console.error('Failed to load services:', err);
        setServicesError('Failed to connect to backend service catalog.');
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  const toggleFavorite = (serviceId, e) => {
    e.stopPropagation();
    setFavorites((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }));
  };

  const filteredServices = services.filter((s) =>
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all group ${
                    isActive
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
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
            title="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center text-on-primary shadow-sm"
            onClick={() => navigate('/login')}
            title="Access Portal Login"
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
          </button>
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
                  onClick={() => {}}
                  className="bg-primary hover:bg-surface-tint text-on-primary px-6 py-3 rounded-full font-label-md text-label-md transition-colors whitespace-nowrap font-medium"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Top Rated Providers Section */}
          <div className="max-w-[1240px] mx-auto w-full px-container-padding-desktop mt-16">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
                  Top Rated Providers
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                  Highly vetted services in your area
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-full border border-outline-variant/50 hover:bg-surface-container-high transition-colors text-on-surface font-label-md text-label-md flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">tune</span> Filter
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
                    const providerName = service.provider?.fullName || service.provider?.providerDetails?.businessName || 'Sparkle Partner';
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
                      providerName: providerName
                    };

                    return (
                      <div
                        key={service._id}
                        onClick={() => navigate('/checkout', { state: checkoutState })}
                        className="bg-surface-container-lowest rounded-[16px] p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between h-[280px] border border-transparent hover:border-primary/20"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-primary text-[24px]">local_laundry_service</span>
                            </div>
                            <div>
                              <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors font-medium">
                                {service.name}
                              </h3>
                              <p className="font-body-sm text-on-surface-variant text-xs font-medium">
                                Partner: {providerName}
                              </p>
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
                      <span className="px-3 py-1 bg-on-primary/20 backdrop-blur-md rounded-full font-label-md text-label-md text-on-primary inline-block mb-4">
                        Promoted
                      </span>
                      <h3 className="font-headline-lg text-headline-lg mb-2 font-bold">
                        SpeedyWash
                      </h3>
                      <p className="font-body-md text-body-md text-on-primary/90 opacity-90">
                        Same-day pickup and delivery for busy professionals.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate('/checkout', {
                          state: {
                            serviceName: 'SpeedyWash Express',
                            details: 'Same-day Pickup & Delivery',
                            servicePrice: 1800,
                            deliveryOption: 'Priority Express Zone',
                            deliveryPrice: 400,
                            tillNumber: '555 999',
                          },
                        })
                      }
                      className="w-full bg-on-primary text-primary px-4 py-3 rounded-xl font-label-md text-label-md hover:bg-surface-container-lowest transition-colors mt-6 font-semibold"
                    >
                      Book Now
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

