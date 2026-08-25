import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ui/ConfirmationModal';

export default function ProviderSettings({ isStandalone = true }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [savedNotification, setSavedNotification] = useState('');
  const [deactivating, setDeactivating] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

  // Account State
  const [account, setAccount] = useState({
    businessName: user?.providerDetails?.businessName || user?.fullName || 'Cleaning Services',
    joinedDate: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'August 2024',
    email: user?.email || '',
    phone: user?.phone || '',
    language: 'en',
    timezone: 'eat',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBoNdAVC_FcYTnzDIEL06pUVz1IJM1wiR8WzbIFW5odwbaqDGZOggOaNnk2DeJFKaQXtsvkSxDKPHrA4F2GG8sl5KU9Gmdo-AnaYZ6RSqIEXOQFC4o7fjinKznCLdPB2cvYIS0o7YH3GviQNzLW-o-90uAphEucY5Sqe094PpRzTomDcgBycoDasyuwiCpVXdamjsi_RLqwADvAdkMQEh9yGpcjEhoFdvs9VR-jdT7ZBMEsdmFS7VJ0PQ'
  });

  useEffect(() => {
    if (user) {
      setAccount(prev => ({
        ...prev,
        businessName: user.providerDetails?.businessName || user.fullName || prev.businessName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone
      }));
    }
  }, [user]);

  // Notifications State
  const [notifications, setNotifications] = useState({
    newOrders: true,
    payoutConfirmations: true,
    customerReviews: false,
    marketingPromotions: false
  });

  // Security State
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactor: true
  });

  const handleSave = () => {
    toast.success('Account settings saved successfully!');
    setSavedNotification('Settings saved successfully!');
    setTimeout(() => setSavedNotification(''), 3000);
  };

  const handleConfirmDeactivate = async () => {
    try {
      setDeactivating(true);
      const res = await api.post('/auth/deactivate-account');
      if (res.data?.success) {
        toast.success(res.data.message || 'Account deactivated successfully.');
        setIsDeactivateModalOpen(false);
        await logout();
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate account.');
    } finally {
      setDeactivating(false);
    }
  };

  const navItems = [
    { id: 'account', label: 'Account', icon: 'person' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'security', label: 'Security', icon: 'shield' },
    { id: 'preferences', label: 'App Preferences', icon: 'tune' }
  ];

  const mainContent = (
    <div className="flex flex-col w-full h-full max-w-[1280px] mx-auto gap-6 font-['Inter'] text-[#1a1c1e]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-['Geist'] text-3xl md:text-4xl font-bold text-[#1a1c1e] tracking-tight">Settings</h1>
          <p className="font-['Inter'] text-sm md:text-base text-[#434656]">Manage your account preferences, notifications, and security settings.</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="bg-[#003ec7] hover:bg-[#0052ff] text-white font-['Geist'] text-sm font-semibold px-6 py-2.5 rounded-full shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer"
        >
          Save Changes
        </button>
      </div>

      {savedNotification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-['Geist'] font-semibold flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
          <span>{savedNotification}</span>
        </div>
      )}

      {/* Main Content Area: Sidebar + Panels */}
      <div className="flex flex-col lg:flex-row gap-8 w-full items-start relative">
        {/* Navigation Sidebar (Sticky) */}
        <div className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-24 bg-[#f3f3f6] rounded-2xl p-4 shadow-xs border border-[#c3c5d9]/10">
          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left transition-colors whitespace-nowrap lg:whitespace-normal font-['Geist'] text-sm font-medium cursor-pointer ${isActive
                      ? 'bg-[#00c1fd] text-[#004b65]'
                      : 'text-[#434656] hover:bg-[#e8e8ea] hover:text-[#1a1c1e]'
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span>{item.label}</span>
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#003ec7] rounded-r-full lg:block hidden transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                  ></span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Panels Container */}
        <div className="flex-1 w-full flex flex-col gap-8 min-h-[550px]">
          {/* Account Panel */}
          {activeTab === 'account' && (
            <div className="flex flex-col gap-6 w-full animate-fadeIn">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl shadow-xs border border-[#c3c5d9]/10 p-6 lg:p-8 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#003ec7]/20">
                    <img className="w-full h-full object-cover" alt="Profile" src={account.avatar} />
                  </div>
                  <button className="absolute inset-0 bg-[#2f3133]/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                    <span className="material-symbols-outlined text-white text-[24px]">photo_camera</span>
                  </button>
                </div>
                <div className="flex flex-col items-center sm:items-start gap-1">
                  <h2 className="font-['Geist'] text-xl font-semibold text-[#1a1c1e]">{account.businessName}</h2>
                  <p className="font-['Inter'] text-sm text-[#434656]">Member since {account.joinedDate}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full font-['Geist'] text-xs font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Verified Business
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Details Form */}
              <div className="bg-white rounded-2xl shadow-xs border border-[#c3c5d9]/10 p-6 lg:p-8 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="font-['Geist'] text-xs font-semibold text-[#434656] uppercase tracking-wider">Business / Trade Name</label>
                    <input
                      type="text"
                      value={account.businessName}
                      onChange={(e) => setAccount({ ...account, businessName: e.target.value })}
                      className="bg-[#f3f3f6] border border-[#c3c5d9]/30 text-[#1a1c1e] font-['Inter'] text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-['Geist'] text-xs font-semibold text-[#434656] uppercase tracking-wider">Official Email Address</label>
                    <input
                      type="email"
                      value={account.email}
                      onChange={(e) => setAccount({ ...account, email: e.target.value })}
                      className="bg-[#f3f3f6] border border-[#c3c5d9]/30 text-[#1a1c1e] font-['Inter'] text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-['Geist'] text-xs font-semibold text-[#434656] uppercase tracking-wider">Contact Phone</label>
                    <input
                      type="text"
                      value={account.phone}
                      onChange={(e) => setAccount({ ...account, phone: e.target.value })}
                      className="bg-[#f3f3f6] border border-[#c3c5d9]/30 text-[#1a1c1e] font-['Inter'] text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-['Geist'] text-xs font-semibold text-[#434656] uppercase tracking-wider">Language</label>
                    <div className="relative w-full">
                      <select
                        value={account.language}
                        onChange={(e) => setAccount({ ...account, language: e.target.value })}
                        className="w-full appearance-none bg-[#f3f3f6] border border-[#c3c5d9]/30 text-[#1a1c1e] font-['Inter'] text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50 focus:bg-white transition-all cursor-pointer pr-10"
                      >
                        <option value="en">English (UK / US)</option>
                        <option value="sw">Swahili (Kiswahili)</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#434656] pointer-events-none text-[20px]">expand_more</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-['Geist'] text-xs font-semibold text-[#434656] uppercase tracking-wider">Timezone</label>
                    <div className="relative w-full">
                      <select
                        value={account.timezone}
                        onChange={(e) => setAccount({ ...account, timezone: e.target.value })}
                        className="w-full appearance-none bg-[#f3f3f6] border border-[#c3c5d9]/30 text-[#1a1c1e] font-['Inter'] text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50 focus:bg-white transition-all cursor-pointer pr-10"
                      >
                        <option value="eat">East Africa Time (EAT)</option>
                        <option value="gmt">Greenwich Mean Time (GMT)</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#434656] pointer-events-none text-[20px]">expand_more</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-[#ffdad6]/30 rounded-2xl shadow-xs border border-[#ba1a1a]/20 p-6 lg:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
                <div className="flex flex-col gap-1">
                  <h3 className="font-['Geist'] text-base font-semibold text-[#ba1a1a]">Deactivate Account</h3>
                  <p className="font-['Inter'] text-xs text-[#434656]">Temporarily pause your listing on the platform and hide services from the customer homepage.</p>
                </div>
                <button
                  type="button"
                  disabled={deactivating}
                  onClick={() => setIsDeactivateModalOpen(true)}
                  className="bg-transparent border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white font-['Geist'] text-sm font-semibold px-6 py-2.5 rounded-full transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  {deactivating ? 'Deactivating...' : 'Deactivate Account'}
                </button>
              </div>
            </div>
          )}

          {/* Notifications Panel */}
          {activeTab === 'notifications' && (
            <div className="flex flex-col gap-6 w-full animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-xs border border-[#c3c5d9]/10 p-6 lg:p-8 flex flex-col gap-6 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-[#003ec7] text-[24px]">mark_email_unread</span>
                  <h2 className="font-['Geist'] text-xl font-semibold text-[#1a1c1e]">Communication Preferences</h2>
                </div>
                <div className="flex flex-col gap-0 w-full">
                  {/* Item 1 */}
                  <div
                    onClick={() => setNotifications({ ...notifications, newOrders: !notifications.newOrders })}
                    className="flex flex-row justify-between items-center py-4 border-b border-[#c3c5d9]/20 last:border-0 hover:bg-[#f3f3f6]/50 px-2 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex flex-col gap-1 pr-4">
                      <span className="font-['Geist'] text-sm font-semibold text-[#1a1c1e] group-hover:text-[#003ec7] transition-colors">New Order Alerts</span>
                      <span className="font-['Inter'] text-xs text-[#434656]">Receive push notifications when a customer books a new service.</span>
                    </div>
                    <div className={`relative w-11 h-6 rounded-full shrink-0 transition-colors duration-300 ${notifications.newOrders ? 'bg-[#003ec7]' : 'bg-[#e2e2e5]'}`}>
                      <div className={`absolute top-1 bg-white w-4 h-4 rounded-full shadow-xs transition-transform duration-300 ${notifications.newOrders ? 'left-6' : 'left-1 bg-[#737688]'}`}></div>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div
                    onClick={() => setNotifications({ ...notifications, payoutConfirmations: !notifications.payoutConfirmations })}
                    className="flex flex-row justify-between items-center py-4 border-b border-[#c3c5d9]/20 last:border-0 hover:bg-[#f3f3f6]/50 px-2 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex flex-col gap-1 pr-4">
                      <span className="font-['Geist'] text-sm font-semibold text-[#1a1c1e] group-hover:text-[#003ec7] transition-colors">Payout Invoices</span>
                      <span className="font-['Inter'] text-xs text-[#434656]">Email confirmations when platform settlements are processed.</span>
                    </div>
                    <div className={`relative w-11 h-6 rounded-full shrink-0 transition-colors duration-300 ${notifications.payoutConfirmations ? 'bg-[#003ec7]' : 'bg-[#e2e2e5]'}`}>
                      <div className={`absolute top-1 bg-white w-4 h-4 rounded-full shadow-xs transition-transform duration-300 ${notifications.payoutConfirmations ? 'left-6' : 'left-1 bg-[#737688]'}`}></div>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div
                    onClick={() => setNotifications({ ...notifications, customerReviews: !notifications.customerReviews })}
                    className="flex flex-row justify-between items-center py-4 border-b border-[#c3c5d9]/20 last:border-0 hover:bg-[#f3f3f6]/50 px-2 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex flex-col gap-1 pr-4">
                      <span className="font-['Geist'] text-sm font-semibold text-[#1a1c1e] group-hover:text-[#003ec7] transition-colors">Customer Reviews</span>
                      <span className="font-['Inter'] text-xs text-[#434656]">Alert me when a customer leaves a rating or review.</span>
                    </div>
                    <div className={`relative w-11 h-6 rounded-full shrink-0 transition-colors duration-300 ${notifications.customerReviews ? 'bg-[#003ec7]' : 'bg-[#e2e2e5]'}`}>
                      <div className={`absolute top-1 bg-white w-4 h-4 rounded-full shadow-xs transition-transform duration-300 ${notifications.customerReviews ? 'left-6' : 'left-1 bg-[#737688]'}`}></div>
                    </div>
                  </div>

                  {/* Item 4 */}
                  <div
                    onClick={() => setNotifications({ ...notifications, marketingPromotions: !notifications.marketingPromotions })}
                    className="flex flex-row justify-between items-center py-4 border-b border-[#c3c5d9]/20 last:border-0 hover:bg-[#f3f3f6]/50 px-2 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="flex flex-col gap-1 pr-4">
                      <span className="font-['Geist'] text-sm font-semibold text-[#1a1c1e] group-hover:text-[#003ec7] transition-colors">Marketing & Promotions</span>
                      <span className="font-['Inter'] text-xs text-[#434656]">Updates on Pristine Pro features, tips, and promotional offers.</span>
                    </div>
                    <div className={`relative w-11 h-6 rounded-full shrink-0 transition-colors duration-300 ${notifications.marketingPromotions ? 'bg-[#003ec7]' : 'bg-[#e2e2e5]'}`}>
                      <div className={`absolute top-1 bg-white w-4 h-4 rounded-full shadow-xs transition-transform duration-300 ${notifications.marketingPromotions ? 'left-6' : 'left-1 bg-[#737688]'}`}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Panel */}
          {activeTab === 'security' && (
            <div className="flex flex-col gap-6 w-full animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-xs border border-[#c3c5d9]/10 p-6 lg:p-8 flex flex-col gap-6 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#003ec7] text-[24px]">lock_reset</span>
                  <h2 className="font-['Geist'] text-xl font-semibold text-[#1a1c1e]">Change Password</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="font-['Geist'] text-xs font-semibold text-[#434656] uppercase tracking-wider">Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={security.currentPassword}
                      onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                      className="w-full bg-[#f3f3f6] border border-[#c3c5d9]/30 text-[#1a1c1e] font-['Inter'] text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-['Geist'] text-xs font-semibold text-[#434656] uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={security.newPassword}
                      onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                      className="w-full bg-[#f3f3f6] border border-[#c3c5d9]/30 text-[#1a1c1e] font-['Inter'] text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="font-['Geist'] text-xs font-semibold text-[#434656] uppercase tracking-wider">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={security.confirmPassword}
                      onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                      className="w-full bg-[#f3f3f6] border border-[#c3c5d9]/30 text-[#1a1c1e] font-['Inter'] text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => toast.success('Password updated successfully!')}
                      className="bg-primary hover:bg-primary-container text-white font-['Geist'] text-sm font-semibold px-6 py-2.5 rounded-full self-start transition-colors mt-2 cursor-pointer shadow-xs"
                    >
                      Update Password
                    </button>
                  </div>
                </div>

                <div className="h-px w-full bg-[#c3c5d9]/20"></div>

                {/* 2FA Toggle */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 py-2">
                  <div className="flex flex-col gap-1.5 max-w-md">
                    <div className="flex items-center gap-2">
                      <h3 className="font-['Geist'] text-sm font-semibold text-[#1a1c1e]">Two-Factor Authentication (2FA)</h3>
                      <span className="bg-[#003ec7]/10 text-[#003ec7] text-xs px-2 py-0.5 rounded-full font-['Geist'] font-semibold">Recommended</span>
                    </div>
                    <p className="font-['Inter'] text-xs text-[#434656]">Add an extra layer of security to your account by requiring a code sent to your phone upon login.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-['Geist'] text-xs font-semibold text-[#434656]">
                      {security.twoFactor ? 'Enabled' : 'Disabled'}
                    </span>
                    <div
                      onClick={() => setSecurity({ ...security, twoFactor: !security.twoFactor })}
                      className={`relative w-11 h-6 rounded-full shrink-0 transition-colors duration-300 cursor-pointer ${security.twoFactor ? 'bg-[#003ec7]' : 'bg-[#e2e2e5]'}`}
                    >
                      <div className={`absolute top-1 bg-white w-4 h-4 rounded-full shadow-xs transition-transform duration-300 ${security.twoFactor ? 'left-6' : 'left-1 bg-[#737688]'}`}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="bg-white rounded-2xl shadow-xs border border-[#c3c5d9]/10 p-6 lg:p-8 flex flex-col gap-4 relative overflow-hidden">
                <h3 className="font-['Geist'] text-xl font-semibold text-[#1a1c1e] mb-2">Active Sessions</h3>
                <div className="flex items-center justify-between p-4 bg-[#f3f3f6] rounded-xl border border-[#003ec7]/20 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#003ec7]"></div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xs text-[#434656]">
                      <span className="material-symbols-outlined text-[20px]">laptop_mac</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-['Geist'] text-sm font-semibold text-[#1a1c1e]">Mac OS • Chrome</span>
                      <span className="font-['Inter'] text-xs text-[#434656]">Nairobi, KE • Active now</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-transparent hover:bg-[#f3f3f6]/50 rounded-xl transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#f3f3f6] rounded-full flex items-center justify-center shadow-xs text-[#434656]">
                      <span className="material-symbols-outlined text-[20px]">smartphone</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-['Geist'] text-sm font-semibold text-[#1a1c1e]">iPhone 13 • Safari</span>
                      <span className="font-['Inter'] text-xs text-[#434656]">Mombasa, KE • Last active 2 hours ago</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.success('Session revoked.')}
                    className="text-[#ba1a1a] opacity-0 group-hover:opacity-100 transition-opacity font-['Geist'] text-xs font-semibold px-3 py-1 hover:bg-[#ffdad6] rounded-lg cursor-pointer"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Panel */}
          {activeTab === 'preferences' && (
            <div className="flex flex-col gap-6 w-full animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-xs border border-[#c3c5d9]/10 p-6 lg:p-8 flex flex-col gap-6 relative overflow-hidden min-h-[400px] flex items-center justify-center text-center">
                <span className="material-symbols-outlined text-[#737688] text-[48px] mb-2 opacity-50">construction</span>
                <h3 className="font-['Geist'] text-xl font-bold text-[#1a1c1e]">App Preferences</h3>
                <p className="font-['Inter'] text-sm text-[#434656] max-w-md">Customize your theme, notification sounds, and default currency display.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Account Deactivation */}
      <ConfirmationModal
        isOpen={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Cleaner Account"
        warningMessage="Are you sure you want to deactivate your cleaner account? All your services will immediately be hidden from the customer homepage and your listing will be paused until an administrator re-activates it."
        confirmText="Deactivate Account"
        type="danger"
        isLoading={deactivating}
      />
    </div>
  );

  if (!isStandalone) return mainContent;

  return (
    <div className="bg-[#f9f9fc] font-['Inter'] text-[#1a1c1e] min-h-screen flex flex-col">
      <div className="md:pl-72 flex flex-col min-h-screen">
        <main className="flex-1 bg-[#f9f9fc] p-6 md:p-10">
          {mainContent}
        </main>
      </div>
    </div>
  );
}
