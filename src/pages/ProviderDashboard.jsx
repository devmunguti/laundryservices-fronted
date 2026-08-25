import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderFilter, setOrderFilter] = useState('all');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/cleaners/dashboard' },
    { id: 'orders', label: 'Orders', icon: 'receipt_long', badge: '12', path: '/cleaners/dashboard' },
    { id: 'services', label: 'Services', icon: 'local_laundry_service', path: '/cleaners/dashboard' },
    { id: 'reviews', label: 'Reviews', icon: 'star_rate', path: '/cleaners/dashboard' },
    { id: 'earnings', label: 'Earnings', icon: 'payments', path: '/cleaners/dashboard' },
    { id: 'payment-channels', label: 'Payment Channels', icon: 'account_balance_wallet', path: '/cleaners/payment-channels' },
  ];

  const secondaryNavItems = [
    { id: 'profile', label: 'Profile', icon: 'person', path: '/cleaners/dashboard' },
    { id: 'settings', label: 'Settings', icon: 'settings', path: '/cleaners/dashboard' },
  ];


  const recentOrders = [
    {
      id: '#ORD-9921',
      time: '2 mins ago',
      customer: 'Akinyi Omondi',
      location: 'Kilimani, Court A',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWRBTU9ep0shsLnFX6u26nZ9h6hCGrNfyFn5pjHjCsWPDYSoLzPxsm4tk4u6BZtajoYp0BwkAf57qH-uDmV_L-YnvF1JLDXNRbGgMBl8YBcp-aFIi2gA6nPqXGycSjjmyQ4oIQkWMMIx0b2bU0iaymjAMPhvnP-HAP-rTVixIdm51SSRXHcX2frZkClBQzvp2gv36TKkNhz4MOEb9K-L5UhQxTODm5W5iAYf6DkyxPyofzbQgCfaMj-w',
      status: 'pending',
      amount: 'KSh 1,250',
      items: '2x Suit Dry Clean, 5kg Wash & Fold',
      payment: 'M-Pesa Paid'
    },
    {
      id: '#ORD-9920',
      time: '45 mins ago',
      customer: 'Maina Kamau',
      location: 'Lavington',
      avatarInitials: 'MK',
      status: 'processing',
      amount: 'KSh 3,400',
      items: '12kg Heavy Laundry, Duvet Wash',
      payment: 'M-Pesa Paid'
    },
    {
      id: '#ORD-9919',
      time: '2 hours ago',
      customer: 'Brian Mwangi',
      location: 'Westlands',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBevt-uO2KqVEwQ4IVld5XSJJ0DtJC1rUn79Gj68cU0U3t1t9GYlPEYWD_iwvfJZ7M_Wro9lSfTWXzGqW4jgSZlaufOHAaWAczr68eWIuipPyn6vhx6XDz0i3HvkAPTFXzoV8PtVjFGsgFL2xPl_TtMSIUCNGZhCWO4FcuukHfbMwxP2MjG_5Z8LkAhNLR1vmFzCB3t43nqFvpjgWqbDDg35n0IjECo0sXMYXx7YfBXdOzyFAAOBr1IPw',
      status: 'processing',
      amount: 'KSh 850',
      items: '3x Iron & Press Shirts',
      payment: 'Card Paid'
    },
  ];

  const filteredOrders = recentOrders.filter(order => {
    if (orderFilter === 'all') return true;
    return order.status === orderFilter;
  });

  return (
    <div className="bg-[#f9f9fc] font-['Inter'] text-[#1a1c1e] min-h-screen flex flex-col">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed left-0 top-0 h-full w-72 bg-[#f3f3f6] z-50 flex flex-col shadow-[1px_0_0_0_rgba(0,0,0,0.05)] transition-transform duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="px-8 py-6 flex items-center justify-end md:hidden">
          <button
            className="text-[#434656] p-1 rounded-lg hover:bg-[#e8e8ea]"
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
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileSidebarOpen(false);
                  if (item.path) navigate(item.path);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all gap-3 text-left font-['Geist'] text-sm font-medium ${isActive
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
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all gap-3 text-left font-['Geist'] text-sm font-medium ${isActive
                  ? 'bg-[#0052ff] text-[#dfe3ff]'
                  : 'text-[#434656] hover:bg-[#e8e8ea] hover:text-[#1a1c1e]'
                  }`}
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Wrapper */}
      <div className="md:pl-72 flex flex-col min-h-screen">
        {/* Header Bar */}
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

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-[#434656] hover:bg-[#e8e8ea] rounded-full transition-colors">
              <span className="material-symbols-outlined text-[24px]">notifications</span>
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full ring-2 ring-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-[#c3c5d9]/40">
              <div className="text-right hidden sm:block">
                <p className="font-['Geist'] font-medium text-sm text-[#1a1c1e]">Mama Safi Cleaning</p>
                <p className="font-['Geist'] text-xs text-[#434656]">cleaners Account</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#003ec7] flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-white text-[24px]">person</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 bg-[#f9f9fc] p-6 md:p-10">
          <div className="flex flex-col w-full gap-6 max-w-[1280px] mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#c3c5d9]/20">
              <div>
                <h1 className="font-['Geist'] text-3xl md:text-4xl font-bold text-[#1a1c1e] tracking-tight">Overview</h1>
                <p className="text-base text-[#434656] mt-1">Here's what's happening with your business today.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#e8e8ea] hover:bg-[#e2e2e5] transition-colors text-[#1a1c1e] font-['Geist'] text-sm font-medium"
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
                  onClick={() => toast('Direct order creation modal available in Orders view')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#003ec7] text-white hover:bg-[#003ec7]/90 transition-colors shadow-sm font-['Geist'] text-sm font-medium"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  <span>New Order</span>
                </button>
              </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* KPI 1: Total Orders */}
              <div className="bg-white p-5 rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#0052ff]/10 rounded-full blur-2xl group-hover:bg-[#0052ff]/20 transition-colors"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-[#0052ff] flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span> 12%
                  </span>
                </div>
                <div className="relative z-10">
                  <p className="font-['Geist'] text-xs uppercase tracking-wider font-semibold text-[#434656] mb-1">Total Orders</p>
                  <h3 className="font-['Geist'] text-3xl font-bold text-[#1a1c1e]">254</h3>
                </div>
              </div>

              {/* KPI 2: Pending Processing */}
              <div className="bg-white p-5 rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#00c1fd]/20 rounded-full blur-2xl group-hover:bg-[#00c1fd]/30 transition-colors"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-[#00c1fd] flex items-center justify-center text-[#004b65]">
                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>pending_actions</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                    4 urgent
                  </span>
                </div>
                <div className="relative z-10">
                  <p className="font-['Geist'] text-xs uppercase tracking-wider font-semibold text-[#434656] mb-1">Pending Processing</p>
                  <h3 className="font-['Geist'] text-3xl font-bold text-[#1a1c1e]">12</h3>
                </div>
              </div>

              {/* KPI 3: Est Revenue */}
              <div className="bg-[#003ec7] p-5 rounded-[24px] shadow-[0_4px_16px_rgba(0,62,199,0.2)] hover:shadow-[0_8px_24px_rgba(0,62,199,0.3)] transition-all duration-300 relative overflow-hidden group">
                <div className="absolute -right-12 -top-12 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
                <svg className="absolute bottom-0 right-0 w-32 h-24 text-white/10" preserveAspectRatio="none" viewBox="0 0 100 50">
                  <path d="M0,50 L0,40 Q25,30 50,45 T100,20 L100,50 Z" fill="currentColor"></path>
                </svg>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span> 8.4%
                  </span>
                </div>
                <div className="relative z-10 text-white">
                  <p className="font-['Geist'] text-xs uppercase tracking-wider font-semibold opacity-80 mb-1">Est. Revenue</p>
                  <h3 className="font-['Geist'] text-3xl font-bold">KSh 45,000</h3>
                </div>
              </div>

              {/* KPI 4: Avg Rating */}
              <div className="bg-white p-5 rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-100/50 rounded-full blur-2xl group-hover:bg-amber-100 transition-colors"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-[#434656] bg-[#eeeef0] px-2.5 py-1 rounded-full">
                    128 reviews
                  </span>
                </div>
                <div className="relative z-10">
                  <p className="font-['Geist'] text-xs uppercase tracking-wider font-semibold text-[#434656] mb-1">Avg Rating</p>
                  <div className="flex items-end gap-2">
                    <h3 className="font-['Geist'] text-3xl font-bold text-[#1a1c1e]">4.9</h3>
                    <div className="flex text-amber-500 mb-1.5">
                      {[1, 2, 3, 4].map(i => (
                        <span key={i} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      ))}
                      <span className="material-symbols-outlined text-[18px]">star_half</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area: Chart and Table Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Chart & Table */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* Revenue Chart Section */}
                <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] relative overflow-hidden group">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                    <div>
                      <h2 className="font-['Geist'] text-xl font-semibold text-[#1a1c1e]">Revenue Growth</h2>
                      <p className="text-xs text-[#434656] mt-0.5">Weekly performance over the last month</p>
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

                  {/* SVG Line Chart */}
                  <div className="h-64 w-full relative">
                    {/* Y-Axis Labels */}
                    <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-right pr-2">
                      <span className="font-['Geist'] text-xs text-[#434656]/60 font-semibold">15k</span>
                      <span className="font-['Geist'] text-xs text-[#434656]/60 font-semibold">10k</span>
                      <span className="font-['Geist'] text-xs text-[#434656]/60 font-semibold">5k</span>
                      <span className="font-['Geist'] text-xs text-[#434656]/60 font-semibold">0</span>
                    </div>

                    {/* Chart Area */}
                    <div className="absolute left-10 right-0 top-0 bottom-6 border-l border-b border-[#c3c5d9]/30">
                      {/* Grid Lines */}
                      <div className="absolute w-full top-0 border-t border-[#c3c5d9]/10"></div>
                      <div className="absolute w-full top-[33.33%] border-t border-[#c3c5d9]/10"></div>
                      <div className="absolute w-full top-[66.66%] border-t border-[#c3c5d9]/10"></div>

                      {/* Previous Week Line (Faded Dotted) */}
                      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path className="text-[#c3c5d9]" d="M0,80 Q10,75 20,85 T40,60 T60,65 T80,40 T100,50" fill="none" stroke="currentColor" strokeDasharray="4,4" strokeWidth="2.5"></path>
                      </svg>

                      {/* Current Week Line with Gradient */}
                      <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#003ec7" stopOpacity="0.25"></stop>
                            <stop offset="100%" stopColor="#003ec7" stopOpacity="0"></stop>
                          </linearGradient>
                        </defs>
                        <path d="M0,90 Q10,80 20,60 T40,50 T60,30 T80,35 T100,10 L100,100 L0,100 Z" fill="url(#chartGradient)"></path>
                        <path className="text-[#003ec7] drop-shadow-[0_4px_8px_rgba(0,62,199,0.3)]" d="M0,90 Q10,80 20,60 T40,50 T60,30 T80,35 T100,10" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5"></path>
                        <circle className="fill-white stroke-[#003ec7] stroke-2" cx="20" cy="60" r="2"></circle>
                        <circle className="fill-white stroke-[#003ec7] stroke-2" cx="40" cy="50" r="2"></circle>
                        <circle className="fill-white stroke-[#003ec7] stroke-2" cx="60" cy="30" r="2"></circle>
                        <circle className="fill-white stroke-[#003ec7] stroke-2" cx="80" cy="35" r="2"></circle>
                        <circle className="fill-[#003ec7]" cx="100" cy="10" r="3"></circle>
                      </svg>

                      {/* Hover Tooltip */}
                      <div className="absolute right-0 top-[10%] -mt-10 -mr-6 bg-[#2f3133] text-[#f0f0f3] px-3 py-1.5 rounded-lg shadow-lg">
                        <span className="font-['Geist'] text-xs font-semibold block text-center">KSh 14,200</span>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2f3133] rotate-45"></div>
                      </div>
                    </div>

                    {/* X-Axis Labels */}
                    <div className="absolute left-10 right-0 bottom-0 h-6 flex justify-between items-end px-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <span key={day} className="font-['Geist'] text-xs text-[#434656]/60 font-semibold">{day}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Orders Table */}
                <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                    <h2 className="font-['Geist'] text-xl font-semibold text-[#1a1c1e]">Recent Orders</h2>

                    <div className="flex items-center gap-2">
                      <div className="bg-[#f3f3f6] p-1 rounded-xl flex gap-1">
                        {['all', 'pending', 'processing'].map(filter => (
                          <button
                            key={filter}
                            onClick={() => setOrderFilter(filter)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-['Geist'] font-medium capitalize transition-all ${orderFilter === filter ? 'bg-white text-[#003ec7] shadow-xs' : 'text-[#434656] hover:text-[#1a1c1e]'
                              }`}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    </div>
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
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="border-b border-[#c3c5d9]/10 hover:bg-[#e2e2e5]/20 transition-colors">
                            <td className="py-4 px-4">
                              <span className="font-mono text-[#1a1c1e] font-semibold">{order.id}</span>
                              <span className="block text-xs text-[#434656] mt-0.5">{order.time}</span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                {order.avatar ? (
                                  <img
                                    src={order.avatar}
                                    alt={order.customer}
                                    className="w-8 h-8 rounded-full object-cover shadow-xs"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-[#61666f] text-white flex items-center justify-center font-['Geist'] text-xs font-bold">
                                    {order.avatarInitials}
                                  </div>
                                )}
                                <div>
                                  <span className="block text-[#1a1c1e] font-medium">{order.customer}</span>
                                  <span className="block text-xs text-[#434656] truncate w-32">{order.location}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {order.status === 'pending' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-['Geist'] text-xs font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Pending
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0052ff]/10 text-[#003ec7] font-['Geist'] text-xs font-semibold">
                                  <span className="material-symbols-outlined text-[14px]">local_laundry_service</span> Processing
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right font-medium text-[#1a1c1e]">{order.amount}</td>
                            <td className="py-4 px-4 text-center">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="w-8 h-8 rounded-full bg-transparent hover:bg-[#0052ff]/10 text-[#434656] hover:text-[#003ec7] flex items-center justify-center mx-auto transition-colors"
                              >
                                <span className="material-symbols-outlined text-[20px]">visibility</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Map & Reviews */}
              <div className="flex flex-col gap-6">
                {/* Live Activity Map */}
                <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col h-[320px]">
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
                      <div className="w-4 h-4 rounded-full bg-[#003ec7] shadow-[0_0_0_4px_rgba(0,62,199,0.2)] z-10 animate-pulse"></div>
                      <div className="absolute inset-0 bg-[#003ec7]/30 rounded-full animate-ping"></div>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-['Geist'] font-semibold text-[#1a1c1e] shadow-sm">
                      📍 Nairobi, Kenya
                    </div>
                  </div>
                </div>

                {/* Recent Reviews */}
                <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex-1">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="font-['Geist'] text-xl font-semibold text-[#1a1c1e]">Recent Reviews</h2>
                    <button className="w-8 h-8 rounded-full bg-[#f3f3f6] hover:bg-[#e8e8ea] flex items-center justify-center transition-colors">
                      <span className="material-symbols-outlined text-[20px] text-[#434656]">arrow_forward</span>
                    </button>
                  </div>
                  <div className="space-y-6">
                    {/* Review 1 */}
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
                            <span key={i} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          ))}
                        </div>
                        <p className="text-xs text-[#434656] leading-relaxed line-clamp-2">
                          "Extremely fast and clothes smell amazing. The folding was immaculate. Will definitely book again next week!"
                        </p>
                      </div>
                    </div>

                    {/* Review 2 */}
                    <div className="flex gap-4">
                      <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJCo4QwaeIUqgOKjM0nVdLIWu_csFmmgMITQvKBsicbHKIiBdpvi7-XHw-NgChKnD_aSzvwx7_ljwBXSDdeRRgrRYPHfvPWvwjJ1phXvAg7zsUB7wk5JRdiR9qZBE7S4w6kgf7Onlv_8V6hVY_72-ZI49gCrYsscGjC_JlmoA1c46JbKAjFHwoJiHu8A5o07dxtXaU1DhIlbaXjohtF_m-c5tJAtf4ouTbSv31S1TeL4RUPS--de2jKQ"
                        alt="David W."
                        className="w-10 h-10 rounded-full object-cover shadow-xs flex-shrink-0"
                      />
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-['Geist'] text-sm font-medium text-[#1a1c1e]">David W.</span>
                          <span className="text-[10px] text-[#434656]">Yesterday</span>
                        </div>
                        <div className="flex text-amber-500 mb-1.5">
                          {[1, 2, 3, 4].map(i => (
                            <span key={i} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          ))}
                          <span className="material-symbols-outlined text-[14px]">star</span>
                        </div>
                        <p className="text-xs text-[#434656] leading-relaxed line-clamp-2">
                          "Good service for the suits. Took a bit longer than expected to pick up, but quality of dry cleaning is top tier."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-6 right-6 text-[#434656] hover:bg-[#e8e8ea] rounded-full p-1 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-xl font-bold text-[#003ec7]">{selectedOrder.id}</span>
              <span className="px-2.5 py-0.5 text-xs rounded-full bg-amber-50 text-amber-700 font-semibold uppercase">
                {selectedOrder.status}
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
              <div>
                <span className="text-xs text-[#434656] block">Payment Method</span>
                <span className="font-medium text-[#1a1c1e]">{selectedOrder.payment}</span>
              </div>
              <div className="flex justify-between items-center border-t border-[#c3c5d9]/30 pt-3">
                <span className="font-semibold text-[#1a1c1e]">Total Amount:</span>
                <span className="font-bold text-lg text-[#003ec7]">{selectedOrder.amount}</span>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  toast.success(`Order ${selectedOrder.id} status updated to Processing`);
                  setSelectedOrder(null);
                }}
                className="flex-1 py-2.5 bg-[#003ec7] text-white rounded-full font-['Geist'] text-sm font-medium hover:bg-[#003ec7]/90 transition-colors"
              >
                Accept & Process
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
