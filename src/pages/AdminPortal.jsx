import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import AdminOverview from './AdminOverview';
import AdminProviderManagement from './AdminProviderManagement';
import AdminOrderManagement from './AdminOrderManagement';
import AdminTicketManagement from './AdminTicketManagement';
import AdminPaymentRecords from './AdminPaymentRecords';
import AdminUserLogs from './AdminUserLogs';
import AdminSystemSettings from './AdminSystemSettings';

export default function AdminPortal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'order-management', label: 'Order Management', icon: 'receipt_long' },
    { id: 'ticket-management', label: 'Ticket Management', icon: 'confirmation_number', badge: '146' },
    { id: 'system-settings', label: 'System Settings', icon: 'settings' },
    { id: 'provider-management', label: 'Provider Management', icon: 'dry_cleaning', badge: '2 pending' },
    { id: 'payment-records', label: 'Payment Records', icon: 'payments' },
    { id: 'user-logs', label: 'User Logs', icon: 'history_edu' },
  ];

  return (
    <div className="bg-background font-body-md text-on-surface min-h-screen flex flex-col">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-[280px] bg-surface-container-lowest z-50 flex flex-col shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-surface-container transition-transform duration-300 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-gutter-desktop flex items-center justify-between border-b border-surface-container">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleTabChange('overview')}>
            <img
              alt="Aura Laundry Logo"
              className="h-8 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida/AP1WRLta25wmxF0oJh9s5exB3Ml7fMmY_esGvwYxcKOGZXWLBepx1CHhANhjBXqPbbNnTNm7MIbDRR3Ab1Vj9ov3fBDnLO5WMZag_dDQfQOL4Trb-Yxm9ddXDK3GQcZCyhVXI96L6P4dWgbcfnOjDNoJfkSUIj_KSAzA2jUTk3ZD3csi9B1PcK3Z8tfcLndPQbkxp7gOwemuQOl7rko664DBJXqzta58JFFYVZgGIT-K6ed6EbOP4vs3Fde4xos"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            />
            <span className="font-headline-md text-primary tracking-tight">Aura Laundry</span>
          </div>
          <button
            className="lg:hidden text-on-surface-variant p-1 rounded-lg hover:bg-surface-container"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-stack-gap-lg overflow-y-auto space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 text-left font-label-md cursor-pointer ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-lg'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                      isActive ? 'bg-on-primary/20 text-on-primary' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer / Sign Out */}
        <div className="p-4 border-t border-surface-container">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to log out of Admin Portal?')) {
                navigate('/');
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="font-label-md">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-[280px]">
        {/* Fixed Header */}
        <header className="sticky top-0 right-0 h-16 bg-surface-container-lowest/80 backdrop-blur-xl z-40 px-gutter-desktop shadow-[0_1px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              className="lg:hidden text-on-surface-variant p-2 rounded-lg hover:bg-surface-container"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="relative group w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                search
              </span>
              <input
                className="w-full bg-surface-container rounded-full py-2 pl-10 pr-4 font-body-sm text-on-surface outline-none border border-transparent focus:border-primary focus:bg-surface-container-lowest transition-all"
                placeholder="Search orders, providers, or users..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-stack-gap-md">
            <button
              onClick={() => alert('System Notifications: 2 new provider registration applications pending approval.')}
              className="relative p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-surface-container-lowest" />
            </button>
            <div className="h-8 w-[1px] bg-surface-container mx-2" />
            <div
              onClick={() => handleTabChange('system-settings')}
              className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-surface-container cursor-pointer transition-colors"
            >
              <div className="text-right hidden sm:block">
                <div className="font-label-md text-on-surface leading-none">Admin User</div>
                <div className="font-label-sm text-on-surface-variant">Super Admin</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Tab Body */}
        <main className="w-full bg-background min-h-[calc(100vh-64px)]">
          <div className="max-w-container-max mx-auto px-gutter-desktop py-stack-gap-lg">
            {activeTab === 'overview' && <AdminOverview onNavigateTab={handleTabChange} />}
            {activeTab === 'provider-management' && <AdminProviderManagement />}
            {activeTab === 'order-management' && <AdminOrderManagement />}
            {activeTab === 'ticket-management' && <AdminTicketManagement />}
            {activeTab === 'payment-records' && <AdminPaymentRecords />}
            {activeTab === 'user-logs' && <AdminUserLogs />}
            {activeTab === 'system-settings' && <AdminSystemSettings />}
          </div>
        </main>
      </div>
    </div>
  );
}
