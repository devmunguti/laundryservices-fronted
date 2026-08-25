import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../context/SettingsContext';
import { orderApi } from '../api/orderApi';
import { paymentApi } from '../api/paymentApi';
import { promotionApi } from '../api/promotionApi';
import { serviceApi } from '../api/serviceApi';
import toast from 'react-hot-toast';

import ProviderOrders from './ProviderOrders';
import ProviderServices from './ProviderServices';
import ProviderReviews from './ProviderReviews';
import ProviderEarnings from './ProviderEarnings';
import PaymentChannels from './PaymentChannels';
import ProviderProfile from './ProviderProfile';
import ProviderSettings from './ProviderSettings';
import NotificationBell from '../components/ui/NotificationBell';


export default function ProviderPortal() {
  const { settings } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();


  const initialTab = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Shared State across portal
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [liveBadges, setLiveBadges] = useState({
    activeOrders: 0,
    servicesCount: 0,
    isPromoted: false
  });

  const fetchProviderBadges = useCallback(async () => {
    try {
      const [ordersMetricsRes, servicesRes, promoRes] = await Promise.all([
        orderApi.getOrderMetrics().catch(() => ({ success: false })),
        serviceApi.getServices({ myServices: 'true' }).catch(() => ({ success: false })),
        promotionApi.getMyPromotionRequests().catch(() => ({ success: false }))
      ]);

      const activeCount = ordersMetricsRes.success && ordersMetricsRes.data
        ? (ordersMetricsRes.data.pendingPickups || 0) + (ordersMetricsRes.data.inWash || 0) + (ordersMetricsRes.data.readyForDelivery || 0)
        : 0;

      const servicesTotal = servicesRes.success && servicesRes.data ? servicesRes.data.length : 0;
      const isPromoted = Boolean(promoRes.success && promoRes.data?.isCurrentlyPromoted);

      setLiveBadges({
        activeOrders: activeCount,
        servicesCount: servicesTotal,
        isPromoted
      });
    } catch (e) {
      // quiet fallback
    }
  }, []);

  useEffect(() => {
    fetchProviderBadges();
  }, [fetchProviderBadges, activeTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'orders', label: 'Orders', icon: 'receipt_long', badge: liveBadges.activeOrders > 0 ? `${liveBadges.activeOrders}` : null },
    { id: 'services', label: 'Services', icon: 'local_laundry_service', badge: liveBadges.servicesCount > 0 ? `${liveBadges.servicesCount}` : null },
    { id: 'promotions', label: 'Boost & Promotions', icon: 'rocket_launch', badge: liveBadges.isPromoted ? 'Active' : null },
    { id: 'reviews', label: 'Reviews', icon: 'star_rate' },
    { id: 'earnings', label: 'Earnings', icon: 'payments' },
    { id: 'payment-channels', label: 'Payment Channels', icon: 'account_balance_wallet' },
  ];

  const secondaryNavItems = [
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <div className="bg-[#f9f9fc] font-['Inter'] text-[#1a1c1e] min-h-screen flex flex-col">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Persistent Single Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-72 bg-[#f3f3f6] z-50 flex flex-col shadow-[1px_0_0_0_rgba(0,0,0,0.05)] transition-transform duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.platformName} className="h-7 w-auto object-contain" />
            ) : (
              <span className="material-symbols-outlined text-[#0052ff] text-2xl">local_laundry_service</span>
            )}
            <span className="font-['Geist'] font-bold text-lg text-[#1a1c1e]">{settings?.platformName || 'Laundry'}</span>
          </div>

          <button
            className="text-[#434656] p-1 rounded-lg hover:bg-[#e8e8ea] md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 px-4 mt-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all gap-3 text-left font-['Geist'] text-sm font-medium cursor-pointer ${isActive
                  ? 'bg-[#0052ff] text-[#dfe3ff] shadow-xs'
                  : 'text-[#434656] hover:bg-[#e8e8ea] hover:text-[#1a1c1e]'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${isActive ? 'bg-[#dfe3ff] text-[#0038b6]' : 'bg-[#e2e2e5] text-[#434656]'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-[#c3c5d9]/30"></div>

          {secondaryNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all gap-3 text-left font-['Geist'] text-sm font-medium cursor-pointer ${isActive
                  ? 'bg-[#0052ff] text-[#dfe3ff]'
                  : 'text-[#434656] hover:bg-[#e8e8ea] hover:text-[#1a1c1e]'
                  }`}
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Sidebar Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full mt-4 flex items-center px-4 py-3 rounded-xl transition-all gap-3 text-left font-['Geist'] text-sm font-medium cursor-pointer text-[#ba1a1a] hover:bg-[#ffdad6] hover:text-[#410002]"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Container */}
      <div className="md:pl-72 flex flex-col min-h-screen">
        {/* Persistent Top Header */}
        <header className="sticky top-0 right-0 h-20 bg-[#f9f9fc]/80 backdrop-blur-xl z-30 flex items-center justify-between px-6 md:px-10 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-[#434656] p-2 rounded-xl hover:bg-[#e8e8ea]"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-semibold uppercase text-[#003ec7] tracking-wider bg-[#dde1ff] px-2.5 py-1 rounded-full">
                Active Session
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <NotificationBell />
            <div
              onClick={() => handleTabChange('profile')}

              className="flex items-center gap-3 pl-4 border-l border-[#c3c5d9]/40 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="text-right hidden sm:block">
                <p className="font-['Geist'] font-medium text-sm text-[#1a1c1e]">
                  {user?.fullName || user?.firstName || 'Cleaner Partner'}
                </p>
                <p className="font-['Geist'] text-xs text-[#434656]">{user?.email || 'cleaner Account'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#003ec7] flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-white text-[24px]">person</span>
              </div>
            </div>
          </div>
        </header>



        {/* Dynamic Section Content Body */}
        <main className="flex-1 bg-[#f9f9fc] p-6 md:p-10">
          <div className="max-w-[1280px] mx-auto">
            {activeTab === 'dashboard' && <DashboardView onNavigateTab={handleTabChange} dateRange={dateRange} setDateRange={setDateRange} isDateDropdownOpen={isDateDropdownOpen} setIsDateDropdownOpen={setIsDateDropdownOpen} />}
            {activeTab === 'orders' && <OrdersView />}
            {activeTab === 'services' && <ServicesView onNavigateTab={handleTabChange} />}
            {activeTab === 'promotions' && <PromotionsView />}
            {activeTab === 'reviews' && <ReviewsView />}
            {activeTab === 'earnings' && <EarningsView onNavigateTab={handleTabChange} />}
            {activeTab === 'payment-channels' && <PaymentChannelsView />}
            {activeTab === 'profile' && <ProfileView />}
            {activeTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ==========================================
   Modular View Sub-Components
========================================== */

/* 1. Dashboard View */
function DashboardView({ onNavigateTab, dateRange, setDateRange, isDateDropdownOpen, setIsDateDropdownOpen }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  const [metrics, setMetrics] = useState({
    todayOrders: 0,
    yesterdayOrders: 0,
    growthFormatted: '+0%',
    isPositiveGrowth: true,
    pendingPickups: 0,
    urgentPickups: 0,
    inWash: 0,
    readyForDelivery: 0,
    outForDelivery: 0,
    delivered: 0,
    totalOrders: 0,
    currentWeekTotal: 0,
    prevWeekTotal: 0,
    revenueGrowth: '+0%',
    currentWeekDaily: [0, 0, 0, 0, 0, 0, 0],
    prevWeekDaily: [0, 0, 0, 0, 0, 0, 0]
  });

  const [orders, setOrders] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [ordersRes, metricsRes] = await Promise.all([
        orderApi.getOrders({ limit: 10 }),
        orderApi.getOrderMetrics().catch(() => ({ success: false }))
      ]);

      if (ordersRes.success && ordersRes.data) {
        const rawList = ordersRes.data.orders || [];
        const formatted = rawList.map((o) => ({
          id: o.orderRef || `#ORD-${o._id.slice(-6).toUpperCase()}`,
          rawId: o._id,
          customer: o.customer?.fullName || 'Guest Customer',
          location: o.pickupAddress?.street || 'Nairobi',
          avatarInitials: (o.customer?.fullName || 'GC').split(' ').map(n => n[0]).join('').slice(0, 2),
          status: (o.status || 'Pending').toLowerCase().replace(/_/g, '-'),
          rawStatus: o.status || 'Pending',
          statusLabel: (o.status || 'Pending').replace(/_/g, ' '),
          amount: `KES ${(o.pricing?.grandTotal || o.totalAmount || 0).toLocaleString()}`,
          rawAmount: o.pricing?.grandTotal || o.totalAmount || 0,
          items: o.items?.map(it => `${it.quantity || 1}x ${it.name || 'Laundry'}`).join(', ') || '1x Laundry Service',
          payment: o.payment?.status === 'Paid' || o.paymentStatus === 'Paid' ? 'M-Pesa Paid' : 'Pending',
          paymentStatus: o.paymentStatus || o.payment?.status || 'Pending',
          transactionId: o.transactionId || o.payment?.transactionId || null,
          paidAt: o.payment?.paidAt || null,
          time: new Date(o.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(o.createdAt || Date.now()).toLocaleDateString()
        }));
        setOrders(formatted);
      }

      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const filteredOrders = orders.filter(order => {
    if (orderFilter === 'all') return true;
    if (orderFilter === 'pending') return order.rawStatus === 'Pending' || order.rawStatus === 'Pickup_Scheduled';
    if (orderFilter === 'processing') return order.rawStatus === 'In_Wash' || order.rawStatus === 'Picked_Up' || order.rawStatus === 'Ready_For_Delivery';
    return order.status === orderFilter;
  });

  // Calculate SVG curve coordinates from metrics.currentWeekDaily and prevWeekDaily
  const maxVal = Math.max(
    ...metrics.currentWeekDaily,
    ...metrics.prevWeekDaily,
    1000
  );

  const getPoints = (daily) => {
    return daily.map((val, idx) => {
      const x = (idx / 6) * 100;
      const y = Math.max(10, Math.min(90, 90 - (val / maxVal) * 75));
      return { x, y, val };
    });
  };

  const currentPoints = getPoints(metrics.currentWeekDaily);
  const prevPoints = getPoints(metrics.prevWeekDaily);

  const createCurvedPath = (pts) => {
    if (!pts || pts.length === 0) return 'M0,90 L100,90';
    return pts.reduce((acc, pt, i, arr) => {
      if (i === 0) return `M${pt.x},${pt.y}`;
      const prev = arr[i - 1];
      const cx = (prev.x + pt.x) / 2;
      return `${acc} Q${cx},${prev.y} ${pt.x},${pt.y}`;
    }, '');
  };

  const currentPath = createCurvedPath(currentPoints);
  const prevPath = createCurvedPath(prevPoints);
  const currentAreaPath = `${currentPath} L100,100 L0,100 Z`;

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#c3c5d9]/20">
        <div>
          <h1 className="font-['Geist'] text-3xl md:text-4xl font-bold text-[#1a1c1e] tracking-tight">Overview</h1>
          <p className="text-base text-[#434656] mt-1">Here's what's happening with your laundry business today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#e8e8ea] hover:bg-[#e2e2e5] transition-colors text-[#1a1c1e] font-['Geist'] text-sm font-medium cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
              <span>{dateRange}</span>
              <span className="material-symbols-outlined text-[20px]">expand_more</span>
            </button>

            {isDateDropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-lg border border-[#c3c5d9]/30 py-2 z-50">
                {['Last 7 Days', 'Last 30 Days', 'This Month', 'This Quarter'].map(option => (
                  <button
                    key={option}
                    onClick={() => {
                      setDateRange(option);
                      setIsDateDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm font-['Geist'] hover:bg-[#f3f3f6] ${dateRange === option ? 'text-[#003ec7] font-semibold' : 'text-[#434656]'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('orders')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#003ec7] text-white hover:bg-[#003ec7]/90 transition-colors shadow-sm font-['Geist'] text-sm font-medium cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>View Orders</span>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Orders */}
        <div onClick={() => onNavigateTab('orders')} className="bg-white p-5 rounded-[24px] shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group cursor-pointer border border-[#c3c5d9]/10">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-[#0052ff] flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            </div>
            <span className={`flex items-center gap-1 text-xs font-semibold ${metrics.isPositiveGrowth ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} px-2.5 py-1 rounded-full`}>
              <span className="material-symbols-outlined text-[16px]">{metrics.isPositiveGrowth ? 'trending_up' : 'trending_down'}</span>
              {metrics.growthFormatted}
            </span>
          </div>
          <div className="relative z-10">
            <p className="font-['Geist'] text-xs uppercase tracking-wider font-semibold text-[#434656] mb-1">Total Orders</p>
            <h3 className="font-['Geist'] text-3xl font-bold text-[#1a1c1e]">{metrics.totalOrders}</h3>
          </div>
        </div>

        {/* Pending Processing */}
        <div onClick={() => onNavigateTab('orders')} className="bg-white p-5 rounded-[24px] shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group cursor-pointer border border-[#c3c5d9]/10">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-[#00c1fd] flex items-center justify-center text-[#004b65]">
              <span className="material-symbols-outlined text-[24px]">pending_actions</span>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
              {metrics.urgentPickups > 0 ? `${metrics.urgentPickups} urgent` : 'Active'}
            </span>
          </div>
          <div className="relative z-10">
            <p className="font-['Geist'] text-xs uppercase tracking-wider font-semibold text-[#434656] mb-1">Pending Pickups</p>
            <h3 className="font-['Geist'] text-3xl font-bold text-[#1a1c1e]">{metrics.pendingPickups}</h3>
          </div>
        </div>

        {/* Est. Revenue */}
        <div onClick={() => onNavigateTab('earnings')} className="bg-[#003ec7] p-5 rounded-[24px] shadow-[0_4px_16px_rgba(0,62,199,0.2)] hover:shadow-[0_8px_24px_rgba(0,62,199,0.3)] transition-all duration-300 relative overflow-hidden group cursor-pointer">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <span className="material-symbols-outlined text-[16px]">trending_up</span> {metrics.revenueGrowth}
            </span>
          </div>
          <div className="relative z-10 text-white">
            <p className="font-['Geist'] text-xs uppercase tracking-wider font-semibold opacity-80 mb-1">Weekly Volume</p>
            <h3 className="font-['Geist'] text-3xl font-bold">KES {metrics.currentWeekTotal.toLocaleString()}</h3>
          </div>
        </div>

        {/* In Wash / Delivered */}
        <div onClick={() => onNavigateTab('orders')} className="bg-white p-5 rounded-[24px] shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group cursor-pointer border border-[#c3c5d9]/10">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <span className="material-symbols-outlined text-[24px]">done_all</span>
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
              {metrics.delivered} completed
            </span>
          </div>
          <div className="relative z-10">
            <p className="font-['Geist'] text-xs uppercase tracking-wider font-semibold text-[#434656] mb-1">Ready for Delivery</p>
            <div className="flex items-end gap-2">
              <h3 className="font-['Geist'] text-3xl font-bold text-[#1a1c1e]">{metrics.readyForDelivery}</h3>
              <span className="text-xs text-outline mb-1">({metrics.inWash} in wash)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* SVG Line Chart with Real Weekly Data */}
          <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-xs border border-[#c3c5d9]/10">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
              <div>
                <h2 className="font-['Geist'] text-xl font-semibold text-[#1a1c1e]">Revenue Activity</h2>
                <p className="text-xs text-[#434656] mt-0.5">Daily order volume for current vs previous week</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#003ec7]"></span>
                  <span className="font-['Geist'] text-xs text-[#434656] font-medium">Current Week</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#c3c5d9]"></span>
                  <span className="font-['Geist'] text-xs text-[#434656] font-medium">Previous Week</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full relative">
              <div className="absolute left-0 top-0 bottom-6 w-12 flex flex-col justify-between text-right pr-2">
                <span className="font-['Geist'] text-[10px] text-[#434656]/60 font-semibold">{Math.round(maxVal).toLocaleString()}</span>
                <span className="font-['Geist'] text-[10px] text-[#434656]/60 font-semibold">{Math.round(maxVal * 0.66).toLocaleString()}</span>
                <span className="font-['Geist'] text-[10px] text-[#434656]/60 font-semibold">{Math.round(maxVal * 0.33).toLocaleString()}</span>
                <span className="font-['Geist'] text-[10px] text-[#434656]/60 font-semibold">0</span>
              </div>

              <div className="absolute left-12 right-0 top-0 bottom-6 border-l border-b border-[#c3c5d9]/30">
                <div className="absolute w-full top-0 border-t border-[#c3c5d9]/10"></div>
                <div className="absolute w-full top-[33.33%] border-t border-[#c3c5d9]/10"></div>
                <div className="absolute w-full top-[66.66%] border-t border-[#c3c5d9]/10"></div>

                {/* Previous week line */}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path className="text-[#c3c5d9]" d={prevPath} fill="none" stroke="currentColor" strokeDasharray="4,4" strokeWidth="2.5"></path>
                </svg>

                {/* Current week line + fill */}
                <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="chartGradientPortal" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#003ec7" stopOpacity="0.25"></stop>
                      <stop offset="100%" stopColor="#003ec7" stopOpacity="0"></stop>
                    </linearGradient>
                  </defs>
                  <path d={currentAreaPath} fill="url(#chartGradientPortal)"></path>
                  <path className="text-[#003ec7]" d={currentPath} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5"></path>
                  {currentPoints.map((pt, i) => (
                    <circle key={i} className="fill-white stroke-[#003ec7] stroke-2" cx={pt.x} cy={pt.y} r={pt.val > 0 ? "3" : "1.5"}></circle>
                  ))}
                </svg>

                <div className="absolute right-0 top-[15%] -mt-10 -mr-2 bg-[#2f3133] text-[#f0f0f3] px-3 py-1.5 rounded-lg shadow-lg">
                  <span className="font-['Geist'] text-xs font-semibold block text-center">KES {metrics.currentWeekTotal.toLocaleString()}</span>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2f3133] rotate-45"></div>
                </div>
              </div>

              <div className="absolute left-12 right-0 bottom-0 h-6 flex justify-between items-end px-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <span key={day} className="font-['Geist'] text-xs text-[#434656]/60 font-semibold">{day}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-xs border border-[#c3c5d9]/10">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <h2 className="font-['Geist'] text-xl font-semibold text-[#1a1c1e]">Recent Orders</h2>
              <button onClick={() => onNavigateTab('orders')} className="font-['Geist'] text-xs font-semibold text-[#003ec7] hover:underline cursor-pointer">
                View All Orders ({metrics.totalOrders}) ➔
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[550px]">
                <thead>
                  <tr className="border-b border-[#c3c5d9]/30">
                    <th className="py-3.5 px-4 font-['Geist'] text-xs text-[#434656] uppercase tracking-wider font-semibold">Ref #</th>
                    <th className="py-3.5 px-4 font-['Geist'] text-xs text-[#434656] uppercase tracking-wider font-semibold">Customer</th>
                    <th className="py-3.5 px-4 font-['Geist'] text-xs text-[#434656] uppercase tracking-wider font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-['Geist'] text-xs text-[#434656] uppercase tracking-wider font-semibold text-right">Amount</th>
                    <th className="py-3.5 px-4 font-['Geist'] text-xs text-[#434656] uppercase tracking-wider font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400 font-['Inter'] text-sm">
                        {loading ? 'Loading orders from database...' : 'No orders found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-[#c3c5d9]/10 hover:bg-[#e2e2e5]/20 transition-colors">
                        <td className="py-4 px-4 font-mono text-[#1a1c1e] font-semibold">{order.id}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#0052ff]/10 text-[#003ec7] flex items-center justify-center font-['Geist'] text-xs font-bold">
                              {order.avatarInitials}
                            </div>
                            <div>
                              <span className="block text-[#1a1c1e] font-medium">{order.customer}</span>
                              <span className="block text-xs text-[#434656] truncate w-32">{order.location}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {order.rawStatus === 'Pending' || order.rawStatus === 'Pickup_Scheduled' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-['Geist'] text-xs font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> {order.statusLabel}
                            </span>
                          ) : order.rawStatus === 'Delivered' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-['Geist'] text-xs font-semibold">
                              <span className="material-symbols-outlined text-[14px]">done_all</span> Delivered
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0052ff]/10 text-[#003ec7] font-['Geist'] text-xs font-semibold">
                              <span className="material-symbols-outlined text-[14px]">local_laundry_service</span> {order.statusLabel}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-[#1a1c1e]">{order.amount}</td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="w-8 h-8 rounded-full hover:bg-[#0052ff]/10 text-[#434656] hover:text-[#003ec7] flex items-center justify-center mx-auto transition-colors cursor-pointer"
                            title="View Order Details"
                          >
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Widgets */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-[32px] p-6 shadow-xs border border-[#c3c5d9]/10 flex flex-col h-[320px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-['Geist'] text-xl font-semibold text-[#1a1c1e]">Live Activity</h2>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online
              </span>
            </div>
            <div
              className="w-full flex-1 rounded-2xl bg-[#eeeef0] relative overflow-hidden shadow-inner bg-cover bg-center"
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA6EdW0T55mN0jFSAOMk84uUutt5IDjTrRzhV00ZhToBXKWrJVrhGBzhEzMBt8nYA5WqGIVqKWVfa1KcCQJMKDBVKCo8f-BFMqprwGRQHb1eNxcHDTX7TXM_B_ayWsRUL3Ek59S2RNslCmrm0jGBYQ_bgw6VBbDuex7P4ZBOlbnBa0KzNcHM8cbvyuBxfjIGpBJ95D1efLFgAkn-9TshKxfTkrE44GQybktK_GoOrK51mwKCUd7WNfj7w')" }}
            >
              <div className="absolute inset-0 bg-[#003ec7]/10"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-[#003ec7] z-10 animate-pulse"></div>
                <div className="absolute inset-0 bg-[#003ec7]/30 rounded-full animate-ping"></div>
              </div>
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-['Geist'] font-semibold text-[#1a1c1e] shadow-sm">
                📍 Nairobi, Kenya
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-6 shadow-xs border border-[#c3c5d9]/10 flex-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-['Geist'] text-xl font-semibold text-[#1a1c1e]">Recent Reviews</h2>
              <button onClick={() => onNavigateTab('reviews')} className="w-8 h-8 rounded-full bg-[#f3f3f6] hover:bg-[#e8e8ea] flex items-center justify-center transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[20px] text-[#434656]">arrow_forward</span>
              </button>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#00c1fd]/20 flex items-center justify-center flex-shrink-0 text-[#004b65] font-['Geist'] text-sm font-semibold">
                  SN
                </div>
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-['Geist'] text-sm font-medium text-[#1a1c1e]">Sarah N.</span>
                    <span className="text-[10px] text-[#434656]">Today</span>
                  </div>
                  <div className="flex text-amber-500 mb-1.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <span key={i} className="material-symbols-outlined text-[14px]">star</span>
                    ))}
                  </div>
                  <p className="text-xs text-[#434656] leading-relaxed line-clamp-2">
                    "Extremely fast and clothes smell amazing. The folding was immaculate. Will definitely book again next week!"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Modal with M-Pesa Transaction Code */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-6 right-6 text-[#434656] hover:bg-[#e8e8ea] rounded-full p-1 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-xl font-bold text-[#003ec7]">{selectedOrder.id}</span>
              <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold uppercase ${selectedOrder.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                {selectedOrder.statusLabel}
              </span>
            </div>
            <div className="space-y-3 border-t border-[#c3c5d9]/30 pt-4 text-sm">
              <div>
                <span className="text-xs text-[#434656] block">Customer</span>
                <span className="font-medium text-[#1a1c1e]">{selectedOrder.customer} ({selectedOrder.location})</span>
              </div>
              <div>
                <span className="text-xs text-[#434656] block">Order Items</span>
                <span className="font-medium text-[#1a1c1e]">{selectedOrder.items}</span>
              </div>

              {/* M-Pesa Transaction Code Highlight */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#434656] font-semibold uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-green-600 text-sm">phone_iphone</span>
                    M-Pesa Transaction Code
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedOrder.paymentStatus === 'Paid' || selectedOrder.payment === 'M-Pesa Paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                    }`}>
                    {selectedOrder.paymentStatus === 'Paid' ? 'Paid' : 'Pending'}
                  </span>
                </div>
                {selectedOrder.transactionId ? (
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-mono text-base font-bold text-[#003ec7] tracking-widest bg-white px-3 py-1 rounded border border-[#c3c5d9]/40">
                      {selectedOrder.transactionId}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(selectedOrder.transactionId);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="text-xs bg-[#003ec7]/10 hover:bg-[#003ec7]/20 text-[#003ec7] font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">{copiedCode ? 'check' : 'content_copy'}</span>
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 italic">No M-Pesa code recorded yet</span>
                )}
              </div>

              <div>
                <span className="text-xs text-[#434656] block">Payment Method</span>
                <span className="font-medium text-[#1a1c1e]">{selectedOrder.payment}</span>
              </div>
              <div className="flex justify-between items-center border-t border-[#c3c5d9]/30 pt-3">
                <span className="font-semibold text-[#1a1c1e]">Total Amount:</span>
                <span className="font-bold text-lg text-[#003ec7]">{selectedOrder.amount}</span>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full py-2.5 bg-[#003ec7] text-white rounded-full font-['Geist'] text-sm font-medium hover:bg-[#0038b6] transition-colors cursor-pointer"
              >
                Close Order Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* 2. Orders View */
function OrdersView() {
  return (
    <div className="w-full">
      <ProviderOrders isStandalone={false} />
    </div>
  );
}

/* 3. Services View */
function ServicesView({ onNavigateTab }) {
  return (
    <div className="w-full">
      <ProviderServices isStandalone={false} onNavigateTab={onNavigateTab} />
    </div>
  );
}

/* 4. Reviews View */
function ReviewsView() {
  return (
    <div className="w-full">
      <ProviderReviews isStandalone={false} />
    </div>
  );
}

/* 5. Earnings View */
function EarningsView({ onNavigateTab }) {
  return (
    <div className="w-full">
      <ProviderEarnings isStandalone={false} onNavigateTab={onNavigateTab} />
    </div>
  );
}

/* 6. Payment Channels View */
function PaymentChannelsView() {
  return (
    <div className="w-full">
      <PaymentChannels isStandalone={false} />
    </div>
  );
}

/* 7. Profile View */
function ProfileView() {
  return (
    <div className="w-full">
      <ProviderProfile isStandalone={false} />
    </div>
  );
}

/* 8. Settings View */
function SettingsView() {
  return (
    <div className="w-full">
      <ProviderSettings isStandalone={false} />
    </div>
  );
}

/* 9. Promotions & Growth View */
function PromotionsView() {
  const [loading, setLoading] = useState(true);
  const [promoSettings, setPromoSettings] = useState({
    paybillNumber: '522522',
    accountNumber: 'AURA-PROMO',
    businessName: 'Laundry Platform',
    instructions: 'Pay the promotion fee to the M-Pesa Paybill above, then submit your M-Pesa transaction code for Admin verification.',
    packages: [
      { id: '7_Days', name: '7 Days Featured Placement', days: 7, price: 1000, description: 'Top ranking and Featured Promoted badge for 1 week' },
      { id: '14_Days', name: '14 Days Growth Boost', days: 14, price: 1800, description: 'Top ranking and Featured Promoted badge for 2 weeks' },
      { id: '30_Days', name: '30 Days Premium Dominance', days: 30, price: 3500, description: 'Priority placement across platform for a full month' }
    ]
  });

  const [providerStatus, setProviderStatus] = useState({
    isCurrentlyPromoted: false,
    promotedUntil: null,
    promotionTagline: '',
    promotionPackage: '',
    requests: []
  });

  const [selectedPackage, setSelectedPackage] = useState('7_Days');
  const [mpesaCode, setMpesaCode] = useState('');
  const [customTagline, setCustomTagline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  const fetchPromotionData = useCallback(async () => {
    try {
      setLoading(true);
      const [settingsRes, myRequestsRes] = await Promise.all([
        promotionApi.getPromotionSettings().catch(() => ({ success: false })),
        promotionApi.getMyPromotionRequests().catch(() => ({ success: false }))
      ]);

      if (settingsRes.success && settingsRes.data) {
        setPromoSettings(settingsRes.data);
      }
      if (myRequestsRes.success && myRequestsRes.data) {
        setProviderStatus(myRequestsRes.data);
      }
    } catch (err) {
      console.error('Failed to load promotion data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotionData();
  }, [fetchPromotionData]);

  const handleCopy = (text, fieldName) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const currentPkg = promoSettings.packages?.find(p => p.id === selectedPackage) || promoSettings.packages?.[0] || {
    id: '7_Days',
    name: '7 Days Featured Placement',
    days: 7,
    price: 1000
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    const cleanCode = mpesaCode.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 6) {
      setSubmitError('Please enter a valid M-Pesa transaction code (e.g. UHD2A3L0BX).');
      return;
    }

    try {
      setSubmitting(true);
      const res = await promotionApi.requestPromotion({
        packageId: selectedPackage,
        mpesaTransactionCode: cleanCode,
        tagline: customTagline.trim()
      });

      if (res.success) {
        setSubmitSuccess('Your promotion payment request has been submitted! Admin will verify and activate your spot shortly.');
        setMpesaCode('');
        setCustomTagline('');
        await fetchPromotionData();
      } else {
        setSubmitError(res.message || 'Failed to submit promotion request.');
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Error submitting promotion claim.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#c3c5d9]/20">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-['Geist'] text-3xl md:text-4xl font-bold text-[#1a1c1e] tracking-tight">
              Boost &amp; Promotions
            </h1>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Featured Spot
            </span>
          </div>
          <p className="text-base text-[#434656] mt-1">
            Get top placement on the Laundry homepage and attract 3x more customers.
          </p>
        </div>
      </div>

      {/* Active Promotion Status Banner */}
      {providerStatus.isCurrentlyPromoted ? (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Active Featured Spot</span>
              </div>
              <h2 className="text-2xl font-bold font-['Geist']">Your Business is Currently Promoted!</h2>
              <p className="text-sm text-emerald-100 max-w-xl">
                Tagline: "{providerStatus.promotionTagline || 'Featured Laundry Partner'}"
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center md:text-right shrink-0">
              <span className="text-xs text-emerald-200 uppercase font-semibold block">Expires On</span>
              <span className="text-xl font-bold font-mono">
                {new Date(providerStatus.promotedUntil).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                <span>Grow Your Orders</span>
              </div>
              <h2 className="text-2xl font-bold font-['Geist']">Ready to Stand Out on the Homepage?</h2>
              <p className="text-sm text-blue-100 max-w-xl">
                Featured cleaners receive top ranking and direct customer bookings straight from the homepage hero.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Bento Layout: Plan Selection & Payment Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Choose Package */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#c3c5d9]/30 shadow-xs space-y-6">
            <h3 className="text-lg font-bold text-[#1a1c1e] font-['Geist'] flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">tune</span>
              Step 1: Choose Your Promotion Package
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {promoSettings.packages?.map((pkg) => {
                const isSelected = selectedPackage === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`rounded-2xl p-5 border-2 cursor-pointer transition-all flex flex-col justify-between relative ${isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-[#c3c5d9]/30 hover:border-blue-400 bg-white'
                      }`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 material-symbols-outlined text-blue-600 text-[20px]">
                        check_circle
                      </span>
                    )}
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        {pkg.days} Days
                      </span>
                      <h4 className="font-bold text-[#1a1c1e] text-base mb-1">{pkg.name}</h4>
                      <p className="text-xs text-[#434656] leading-relaxed mb-4">{pkg.description}</p>
                    </div>
                    <div className="pt-3 border-t border-[#c3c5d9]/20">
                      <span className="text-lg font-black font-['Geist'] text-blue-600">
                        KES {pkg.price?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step 2: Payment Instructions Box */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[22px]">
                  {promoSettings.channelType === 'till' ? 'storefront' : promoSettings.channelType === 'phone' ? 'phone_iphone' : 'payments'}
                </span>
                <h4 className="font-bold text-sm text-slate-900">
                  Step 2: Pay via {promoSettings.channelType === 'till' ? 'M-Pesa Buy Goods Till' : promoSettings.channelType === 'phone' ? 'M-Pesa Send Money' : 'M-Pesa Paybill'}
                </h4>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {promoSettings.instructions || 'Pay the promotion fee using the M-Pesa details below, then enter your M-Pesa code.'}
              </p>

              {/* Buy Goods Till Channel */}
              {promoSettings.channelType === 'till' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold uppercase text-slate-400 block">Buy Goods Till Number</span>
                      <span className="font-mono text-base font-bold text-slate-900">
                        {promoSettings.tillNumber || '8995354'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(promoSettings.tillNumber || '8995354', 'till')}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition-colors cursor-pointer"
                      title="Copy Till Number"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {copiedField === 'till' ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold uppercase text-slate-400 block">Store / Merchant Name</span>
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {promoSettings.businessName || 'Laundry Platform'}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-emerald-600 text-[20px]">verified</span>
                  </div>
                </div>
              )}

              {/* Send Money / Phone Number Channel */}
              {promoSettings.channelType === 'phone' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold uppercase text-slate-400 block">M-Pesa Phone Number</span>
                      <span className="font-mono text-base font-bold text-slate-900">
                        {promoSettings.phoneNumber || '0712345678'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(promoSettings.phoneNumber || '0712345678', 'phone')}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition-colors cursor-pointer"
                      title="Copy Phone Number"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {copiedField === 'phone' ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold uppercase text-slate-400 block">Recipient Name</span>
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {promoSettings.recipientName || 'Laundry Admin'}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-emerald-600 text-[20px]">person</span>
                  </div>
                </div>
              )}

              {/* Paybill Channel */}
              {promoSettings.channelType !== 'till' && promoSettings.channelType !== 'phone' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold uppercase text-slate-400 block">Paybill Number</span>
                      <span className="font-mono text-base font-bold text-slate-900">
                        {promoSettings.paybillNumber || '522522'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(promoSettings.paybillNumber || '522522', 'paybill')}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition-colors cursor-pointer"
                      title="Copy Paybill Number"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {copiedField === 'paybill' ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold uppercase text-slate-400 block">Account Number</span>
                      <span className="font-mono text-base font-bold text-slate-900">
                        {promoSettings.accountNumber || 'AURA-PROMO'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(promoSettings.accountNumber || 'AURA-PROMO', 'account')}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition-colors cursor-pointer"
                      title="Copy Account Reference"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {copiedField === 'account' ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                <span className="text-slate-600">Total Payable Amount:</span>
                <span className="font-bold font-mono text-sm text-blue-600">
                  KES {currentPkg.price?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Submission Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#c3c5d9]/30 shadow-xs space-y-5">
            <h3 className="text-lg font-bold text-[#1a1c1e] font-['Geist'] flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">assignment_turned_in</span>
              Step 3: Submit Payment Details
            </h3>

            <form onSubmit={handleSubmitClaim} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#434656] mb-1.5">
                  M-Pesa Transaction Code
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    receipt
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UHD2A3L0BX"
                    value={mpesaCode}
                    onChange={(e) => setMpesaCode(e.target.value)}
                    className="w-full bg-[#f3f3f6] py-3 pl-11 pr-4 rounded-xl text-sm font-mono uppercase text-[#1a1c1e] outline-none border border-transparent focus:border-blue-600 focus:bg-white transition-all placeholder:normal-case placeholder:font-sans"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Copy the 10-character code from your M-Pesa confirmation SMS.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#434656] mb-1.5">
                  Homepage Promotional Headline / Tagline
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Fast 4-hour express dry cleaning & laundry in Kilimani."
                  value={customTagline}
                  onChange={(e) => setCustomTagline(e.target.value)}
                  className="w-full bg-[#f3f3f6] py-3 px-4 rounded-xl text-sm text-[#1a1c1e] outline-none border border-transparent focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-400"
                ></textarea>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  This slogan will be prominently shown on the homepage card.
                </span>
              </div>

              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] shrink-0">check_circle</span>
                  <span>{submitSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !mpesaCode.trim()}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                    <span>Submitting Claim...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>Submit for Admin Approval</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Promotion Request History */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#c3c5d9]/30 shadow-xs space-y-4">
        <h3 className="text-lg font-bold text-[#1a1c1e] font-['Geist']">Promotion History &amp; Status</h3>

        {providerStatus.requests?.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            You have not submitted any promotion requests yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">M-Pesa Code</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Valid Window</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {providerStatus.requests?.map((req) => {
                  const statusColors = {
                    Pending: 'bg-amber-100 text-amber-800',
                    Approved: 'bg-emerald-100 text-emerald-800',
                    Rejected: 'bg-rose-100 text-rose-800',
                    Expired: 'bg-slate-100 text-slate-600'
                  };

                  return (
                    <tr key={req._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{req.packageName}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        KES {req.amount?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-blue-700 font-bold">{req.mpesaTransactionCode}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[req.status] || 'bg-slate-100 text-slate-700'}`}>
                          {req.status === 'Pending' ? 'Pending Admin Review' : req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {req.expiresAt
                          ? `${new Date(req.startsAt).toLocaleDateString()} - ${new Date(req.expiresAt).toLocaleDateString()}`
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
