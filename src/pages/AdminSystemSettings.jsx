import React, { useState } from 'react';

export default function AdminSystemSettings() {
  const [activeSubTab, setActiveSubTab] = useState('general');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // General Settings State
  const [platformName, setPlatformName] = useState('Aura Laundry');
  const [supportEmail, setSupportEmail] = useState('support@auralaundry.co.ke');
  const [supportPhone, setSupportPhone] = useState('+254 700 000 000');

  // Financial Rules State
  const [commissionRate, setCommissionRate] = useState('15.0');
  const [minPayout, setMinPayout] = useState('5000');

  // Notification Prefs State
  const [alertNewcleaners, setAlertNewcleaners] = useState(true);
  const [alertHighValue, setAlertHighValue] = useState(true);
  const [alertSystemErrors, setAlertSystemErrors] = useState(false);

  // API Settings State
  const [mpesaKey, setMpesaKey] = useState('ck_7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a');
  const [mapsKey, setMapsKey] = useState('AIzaSyA_bCDeFgHiJkLmNoPqRsTuVwXyZ');
  const [showMpesaKey, setShowMpesaKey] = useState(false);
  const [showMapsKey, setShowMapsKey] = useState(false);

  // Operations State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [smsSid, setSmsSid] = useState('');
  const [smsSenderId, setSmsSenderId] = useState('');
  const [emailAlerts, setEmailAlerts] = useState(true);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const navItems = [
    { id: 'general', label: 'General Settings', icon: 'tune' },
    { id: 'financial', label: 'Financial Rules', icon: 'account_balance' },
    { id: 'notifications', label: 'Notification Prefs', icon: 'notifications_active' },
    { id: 'api', label: 'API & Integration', icon: 'api' },
    { id: 'operations', label: 'Platform Operations', icon: 'settings_applications' },
  ];

  return (
    <div className="flex flex-col w-full gap-stack-gap-lg">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-headline-xl text-on-surface mb-stack-gap-sm">System Settings</h1>
          <p className="font-body-lg text-on-surface-variant">
            Manage core platform configuration, financial rules, and API integrations.
          </p>
        </div>
        <div className="flex gap-stack-gap-md items-center">
          <button
            onClick={() => setActiveSubTab('general')}
            className="bg-surface-container hover:bg-surface-container-highest text-on-surface font-label-md px-6 py-3 rounded-lg transition-colors cursor-pointer"
          >
            Discard Changes
          </button>
          <button
            onClick={handleSave}
            className="bg-primary hover:bg-primary-container text-on-primary font-label-md px-6 py-3 rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">save</span> Save Configuration
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span className="font-label-md">System settings updated successfully!</span>
        </div>
      )}

      {/* Main Settings Container */}
      <div className="flex flex-col md:flex-row gap-margin-desktop min-h-[520px]">
        {/* Left Sub Nav */}
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-label-md cursor-pointer ${isActive
                    ? 'text-primary bg-primary-fixed font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.label}
              </button>
            );
          })}

          <div className="mt-auto p-4 bg-surface-container-low rounded-xl border border-surface-container/40">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-tertiary text-[16px]">info</span>
              <span className="font-label-sm text-tertiary">Environment</span>
            </div>
            <p className="font-body-sm text-on-surface font-medium">Production (v2.4.1)</p>
            <p className="font-body-sm text-outline mt-1 text-xs">Last updated: 2 hours ago</p>
          </div>
        </div>

        {/* Right Content Panels */}
        <div className="flex-1 overflow-y-auto pr-2 relative">
          {/* General Settings Panel */}
          {activeSubTab === 'general' && (
            <div className="bg-surface-container-lowest rounded-xl shadow-xs p-margin-desktop border border-surface-container/40 animate-fade-in space-y-stack-gap-lg">
              <h2 className="font-headline-lg text-on-surface">Platform Identity</h2>
              <div className="flex flex-col md:flex-row gap-margin-desktop mb-margin-desktop">
                <div className="flex-1 flex flex-col gap-stack-gap-md">
                  <label className="flex flex-col gap-2">
                    <span className="font-label-sm text-on-surface-variant">Platform Name</span>
                    <input
                      type="text"
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                      className="bg-surface-container-lowest rounded-lg py-3 px-4 font-body-md text-on-surface outline-none border border-outline-variant focus:border-primary transition-all"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="font-label-sm text-on-surface-variant">Support Email</span>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="bg-surface-container-lowest rounded-lg py-3 px-4 font-body-md text-on-surface outline-none border border-outline-variant focus:border-primary transition-all"
                    />
                  </label>
                </div>
                <div className="w-full md:w-48 flex flex-col items-center gap-4">
                  <span className="font-label-sm text-on-surface-variant self-start">Platform Logo</span>
                  <div className="w-full aspect-square bg-surface-container rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-outline-variant hover:border-primary transition-colors cursor-pointer group p-4">
                    <img
                      className="w-24 h-24 object-contain mb-2 group-hover:scale-105 transition-transform"
                      alt="Aura Laundry Logo"
                      src="https://lh3.googleusercontent.com/aida/AP1WRLta25wmxF0oJh9s5exB3Ml7fMmY_esGvwYxcKOGZXWLBepx1CHhANhjBXqPbbNnTNm7MIbDRR3Ab1Vj9ov3fBDnLO5WMZag_dDQfQOL4Trb-Yxm9ddXDK3GQcZCyhVXI96L6P4dWgbcfnOjDNoJfkSUIj_KSAzA2jUTk3ZD3csi9B1PcK3Z8tfcLndPQbkxp7gOwemuQOl7rko664DBJXqzta58JFFYVZgGIT-K6ed6EbOP4vs3Fde4xos"
                    />
                    <span className="font-label-sm text-primary">Change Logo</span>
                  </div>
                </div>
              </div>
              <label className="flex flex-col gap-2">
                <span className="font-label-sm text-on-surface-variant">Support Phone Number</span>
                <input
                  type="tel"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="max-w-md bg-surface-container-lowest rounded-lg py-3 px-4 font-body-md text-on-surface outline-none border border-outline-variant focus:border-primary transition-all"
                />
              </label>
            </div>
          )}

          {/* Financial Rules Panel */}
          {activeSubTab === 'financial' && (
            <div className="bg-surface-container-lowest rounded-xl shadow-xs p-margin-desktop border border-surface-container/40 animate-fade-in space-y-stack-gap-lg">
              <h2 className="font-headline-lg text-on-surface">Commission & Monetization</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-margin-desktop">
                <label className="flex flex-col gap-2">
                  <span className="font-label-sm text-on-surface-variant flex items-center justify-between">
                    Platform Commission Rate (%)
                    <span className="material-symbols-outlined text-[16px] text-tertiary cursor-help" title="Percentage deducted from each completed order for cleaners payouts.">
                      help
                    </span>
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      className="w-full bg-surface-container-lowest rounded-lg py-3 px-4 font-body-md text-on-surface outline-none border border-outline-variant focus:border-primary transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-body-md text-on-surface-variant">%</span>
                  </div>
                  <p className="font-body-sm text-on-surface-variant text-xs mt-1">
                    Percentage deducted from each completed order for cleaners payouts.
                  </p>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="font-label-sm text-on-surface-variant">Minimum Payout Threshold</span>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body-md text-on-surface-variant">KES</span>
                    <input
                      type="number"
                      value={minPayout}
                      onChange={(e) => setMinPayout(e.target.value)}
                      className="w-full bg-surface-container-lowest rounded-lg py-3 pl-14 pr-4 font-body-md text-on-surface outline-none border border-outline-variant focus:border-primary transition-all"
                    />
                  </div>
                </label>
              </div>

              <div className="p-4 bg-surface-variant rounded-lg flex items-start gap-3">
                <span className="material-symbols-outlined text-on-surface-variant mt-0.5">warning</span>
                <div>
                  <h4 className="font-label-md text-on-surface mb-1">Warning on Rate Changes</h4>
                  <p className="font-body-sm text-on-surface-variant text-xs">
                    Changing the commission rate will only affect future transactions. Existing orders will maintain the rate applied at checkout.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notification Prefs Panel */}
          {activeSubTab === 'notifications' && (
            <div className="bg-surface-container-lowest rounded-xl shadow-xs p-margin-desktop border border-surface-container/40 animate-fade-in space-y-stack-gap-lg">
              <h2 className="font-headline-lg text-on-surface">System Alerts</h2>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
                  <div>
                    <h3 className="font-label-md text-on-surface">New cleaners Registrations</h3>
                    <p className="font-body-sm text-on-surface-variant text-xs">Receive alerts when a new laundry cleaners signs up.</p>
                  </div>
                  <button
                    onClick={() => setAlertNewcleaners(!alertNewcleaners)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${alertNewcleaners ? 'bg-primary' : 'bg-surface-variant'
                      }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${alertNewcleaners ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
                  <div>
                    <h3 className="font-label-md text-on-surface">High-Value Order Alerts</h3>
                    <p className="font-body-sm text-on-surface-variant text-xs">Notify admins for orders exceeding KES 10,000.</p>
                  </div>
                  <button
                    onClick={() => setAlertHighValue(!alertHighValue)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${alertHighValue ? 'bg-primary' : 'bg-surface-variant'
                      }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${alertHighValue ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
                  <div>
                    <h3 className="font-label-md text-on-surface">System Error Reports</h3>
                    <p className="font-body-sm text-on-surface-variant text-xs">Daily digest of critical system errors or API failures.</p>
                  </div>
                  <button
                    onClick={() => setAlertSystemErrors(!alertSystemErrors)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${alertSystemErrors ? 'bg-primary' : 'bg-surface-variant'
                      }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${alertSystemErrors ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* API & Integration Panel */}
          {activeSubTab === 'api' && (
            <div className="bg-surface-container-lowest rounded-xl shadow-xs p-margin-desktop border border-surface-container/40 animate-fade-in space-y-stack-gap-lg">
              <h2 className="font-headline-lg text-on-surface">API Credentials</h2>
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-label-md text-on-surface mb-2">Payment Gateway (M-Pesa Daraja)</h3>
                  <div className="flex gap-2">
                    <input
                      type={showMpesaKey ? 'text' : 'password'}
                      readOnly
                      value={mpesaKey}
                      className="flex-1 bg-surface-container rounded-lg py-3 px-4 font-body-sm text-on-surface outline-none font-mono text-xs"
                    />
                    <button
                      onClick={() => setShowMpesaKey(!showMpesaKey)}
                      className="bg-secondary text-on-secondary px-4 rounded-lg font-label-sm hover:bg-secondary-fixed transition-colors cursor-pointer"
                    >
                      {showMpesaKey ? 'Hide' : 'Reveal'}
                    </button>
                    <button
                      onClick={() => handleCopy(mpesaKey)}
                      className="bg-surface-variant text-on-surface px-4 rounded-lg font-label-sm hover:bg-outline-variant transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-label-md text-on-surface mb-2">Maps API Key</h3>
                  <div className="flex gap-2">
                    <input
                      type={showMapsKey ? 'text' : 'password'}
                      readOnly
                      value={mapsKey}
                      className="flex-1 bg-surface-container rounded-lg py-3 px-4 font-body-sm text-on-surface outline-none font-mono text-xs"
                    />
                    <button
                      onClick={() => setShowMapsKey(!showMapsKey)}
                      className="bg-secondary text-on-secondary px-4 rounded-lg font-label-sm hover:bg-secondary-fixed transition-colors cursor-pointer"
                    >
                      {showMapsKey ? 'Hide' : 'Reveal'}
                    </button>
                    <button
                      onClick={() => handleCopy(mapsKey)}
                      className="bg-surface-variant text-on-surface px-4 rounded-lg font-label-sm hover:bg-outline-variant transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Platform Operations Panel */}
          {activeSubTab === 'operations' && (
            <div className="bg-surface-container-lowest rounded-xl shadow-xs p-margin-desktop border border-surface-container/40 animate-fade-in space-y-stack-gap-lg">
              <h2 className="font-headline-lg text-on-surface">Platform Operations</h2>
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
                  <div>
                    <h3 className="font-label-md text-on-surface">Maintenance Mode</h3>
                    <p className="font-body-sm text-on-surface-variant text-xs">Temporarily disable customer ordering for scheduled maintenance.</p>
                  </div>
                  <button
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${maintenanceMode ? 'bg-primary' : 'bg-surface-variant'
                      }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                  </button>
                </div>

                <div>
                  <h3 className="font-label-md text-on-surface mb-2">SMS Notifications Configuration</h3>
                  <p className="font-body-sm text-on-surface-variant text-xs mb-3">Configure Africa's Talking or Twilio credentials to dispatch transactional SMS updates.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="password"
                      placeholder="API Key / SID"
                      value={smsSid}
                      onChange={(e) => setSmsSid(e.target.value)}
                      className="bg-surface-container rounded-lg py-3 px-4 font-body-sm text-on-surface outline-none border border-transparent focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Sender ID / Phone Number"
                      value={smsSenderId}
                      onChange={(e) => setSmsSenderId(e.target.value)}
                      className="bg-surface-container rounded-lg py-3 px-4 font-body-sm text-on-surface outline-none border border-transparent focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
                  <div>
                    <h3 className="font-label-md text-on-surface">Super Admin Email Alerts</h3>
                    <p className="font-body-sm text-on-surface-variant text-xs">Receive alerts for new cleaners applications and failed payments.</p>
                  </div>
                  <button
                    onClick={() => setEmailAlerts(!emailAlerts)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailAlerts ? 'bg-primary' : 'bg-surface-variant'
                      }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
