import React, { useState } from 'react';

export default function cleanersSettings({ isStandalone = true }) {
  const [activeTab, setActiveTab] = useState('account');
  const [savedNotification, setSavedNotification] = useState('');

  // Account State
  const [account, setAccount] = useState({
    businessName: 'Mama Safi Cleaning Services',
    joinedDate: 'August 2022',
    email: 'hello@mamasafi.co.ke',
    phone: '+254 712 345 678',
    language: 'en',
    timezone: 'eat',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBoNdAVC_FcYTnzDIEL06pUVz1IJM1wiR8WzbIFW5odwbaqDGZOggOaNnk2DeJFKaQXtsvkSxDKPHrA4F2GG8sl5KU9Gmdo-AnaYZ6RSqIEXOQFC4o7fjinKznCLdPB2cvYIS0o7YH3GviQNzLW-o-90uAphEucY5Sqe094PpRzTomDcgBycoDasyuwiCpVXdamjsi_RLqwADvAdkMQEh9yGpcjEhoFdvs9VR-jdT7ZBMEsdmFS7VJ0PQ'
  });

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
    setSavedNotification('Settings saved successfully!');
    setTimeout(() => setSavedNotification(''), 3000);
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
              {/* Profile Section */}
              <div className="bg-white rounded-2xl shadow-xs border border-[#c3c5d9]/10 p-6 lg:p-8 flex flex-col gap-6 relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#c2e8ff]/30 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-[#003ec7] text-[24px]">account_circle</span>
                  <h2 className="font-['Geist'] text-xl font-semibold text-[#1a1c1e]">Profile Information</h2>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-[#c3c5d9]/20">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <img
                      className="w-full h-full object-cover rounded-full shadow-md"
                      alt="Mama Safi"
                      src={account.avatar}
                    />
                    <button
                      type="button"
                      onClick={() => alert('Change profile avatar photo clicked.')}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md border border-[#c3c5d9]/30 flex items-center justify-center text-[#003ec7] hover:bg-[#00c1fd] hover:text-[#004b65] transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                  </div>
                  <div className="flex flex-col gap-1 w-full">
                    <p className="font-['Geist'] text-xs font-semibold text-[#434656] uppercase tracking-wider">Business Name</p>
                    <p className="font-['Inter'] text-lg font-medium text-[#1a1c1e]">{account.businessName}</p>
                    <p className="font-['Inter'] text-xs text-[#434656] mt-1">Joined {account.joinedDate}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="flex flex-col gap-2">
                    <label className="font-['Geist'] text-xs font-semibold text-[#434656] uppercase tracking-wider">Email Address</label>
                    <div className="relative w-full">
                      <input
                        type="email"
                        value={account.email}
                        onChange={(e) => setAccount({ ...account, email: e.target.value })}
                        className="w-full bg-[#f3f3f6] border border-[#c3c5d9]/30 text-[#1a1c1e] font-['Inter'] text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50 focus:bg-white transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-['Geist'] text-xs font-semibold text-[#434656] uppercase tracking-wider">Phone Number</label>
                    <input
                      type="tel"
                      value={account.phone}
                      onChange={(e) => setAccount({ ...account, phone: e.target.value })}
                      className="w-full bg-[#f3f3f6] border border-[#c3c5d9]/30 text-[#1a1c1e] font-['Inter'] text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Regional Settings */}
              <div className="bg-white rounded-2xl shadow-xs border border-[#c3c5d9]/10 p-6 lg:p-8 flex flex-col gap-6 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-[#003ec7] text-[24px]">language</span>
                  <h2 className="font-['Geist'] text-xl font-semibold text-[#1a1c1e]">Regional</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="flex flex-col gap-2">
                    <label className="font-['Geist'] text-xs font-semibold text-[#434656] uppercase tracking-wider">Language</label>
                    <div className="relative w-full">
                      <select
                        value={account.language}
                        onChange={(e) => setAccount({ ...account, language: e.target.value })}
                        className="w-full appearance-none bg-[#f3f3f6] border border-[#c3c5d9]/30 text-[#1a1c1e] font-['Inter'] text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50 focus:bg-white transition-all cursor-pointer pr-10"
                      >
                        <option value="en">English (UK)</option>
                        <option value="sw">Swahili</option>
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
                  <p className="font-['Inter'] text-xs text-[#434656]">Temporarily pause your listing on the platform.</p>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Are you sure you want to deactivate your cleaners account?')}
                  className="bg-transparent border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white font-['Geist'] text-sm font-semibold px-6 py-2.5 rounded-full transition-colors whitespace-nowrap cursor-pointer"
                >
                  Deactivate
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
                      <span className="font-['Geist'] text-sm font-semibold text-[#1a1c1e] group-hover:text-[#003ec7] transition-colors">Payout Confirmations</span>
                      <span className="font-['Inter'] text-xs text-[#434656]">Get notified via email when funds are transferred to your M-Pesa.</span>
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
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-[#003ec7] text-[24px]">lock</span>
                  <h2 className="font-['Geist'] text-xl font-semibold text-[#1a1c1e]">Password & Security</h2>
                </div>
                {/* Change Password */}
                <div className="flex flex-col gap-4 max-w-lg w-full mb-4">
                  <h3 className="font-['Geist'] text-sm font-semibold text-[#1a1c1e]">Change Password</h3>
                  <div className="flex flex-col gap-3">
                    <input
                      type="password"
                      placeholder="Current Password"
                      value={security.currentPassword}
                      onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                      className="w-full bg-[#f3f3f6] border border-[#c3c5d9]/30 text-[#1a1c1e] font-['Inter'] text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50 focus:bg-white transition-all"
                    />
                    <input
                      type="password"
                      placeholder="New Password"
                      value={security.newPassword}
                      onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                      className="w-full bg-[#f3f3f6] border border-[#c3c5d9]/30 text-[#1a1c1e] font-['Inter'] text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50 focus:bg-white transition-all"
                    />
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      value={security.confirmPassword}
                      onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                      className="w-full bg-[#f3f3f6] border border-[#c3c5d9]/30 text-[#1a1c1e] font-['Inter'] text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => alert('Password updated successfully!')}
                      className="bg-[#00c1fd] hover:bg-[#75d1ff] text-[#004b65] font-['Geist'] text-sm font-semibold px-6 py-2.5 rounded-full self-start transition-colors mt-2 cursor-pointer"
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
                    onClick={() => alert('Session revoked.')}
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
                <h2 className="font-['Geist'] text-xl font-semibold text-[#1a1c1e]">App Preferences</h2>
                <p className="font-['Inter'] text-sm text-[#434656] max-w-sm">Theme and density settings are currently managed by your system preferences. Custom overrides coming soon.</p>
              </div>
            </div>
          )}
        </div>
      </div>
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

