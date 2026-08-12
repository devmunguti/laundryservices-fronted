import React, { useState, useEffect, useCallback } from 'react';
import { systemSettingsApi } from '../api/systemSettingsApi';
import { useSettings } from '../context/SettingsContext';

export default function AdminSystemSettings() {
  const { refreshSettings } = useSettings();

  const [activeSubTab, setActiveSubTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(null);

  // Raw fetched data backup for "Discard Changes"
  const [rawBackupData, setRawBackupData] = useState(null);

  // General Settings State
  const [platformName, setPlatformName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Financial Rules State
  const [commissionRate, setCommissionRate] = useState('15');
  const [minPayout, setMinPayout] = useState('5000');

  // Notification Prefs State
  const [alertNewcleaners, setAlertNewcleaners] = useState(true);
  const [alertHighValue, setAlertHighValue] = useState(true);
  const [alertSystemErrors, setAlertSystemErrors] = useState(false);

  // API Settings State
  const [mpesaKey, setMpesaKey] = useState('');
  const [mapsKey, setMapsKey] = useState('');
  const [showMpesaKey, setShowMpesaKey] = useState(false);
  const [showMapsKey, setShowMapsKey] = useState(false);
  const [revealedMpesaKey, setRevealedMpesaKey] = useState(null);
  const [revealedMapsKey, setRevealedMapsKey] = useState(null);

  // Operations State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [smsSid, setSmsSid] = useState('');
  const [smsSenderId, setSmsSenderId] = useState('');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [showSmsSid, setShowSmsSid] = useState(false);
  const [revealedSmsSid, setRevealedSmsSid] = useState(null);

  // Populate component form state from fetched backend settings
  const applySettingsToForm = useCallback((settingsData) => {
    if (!settingsData) return;

    if (settingsData.general) {
      setPlatformName(settingsData.general.platformName || '');
      setSupportEmail(settingsData.general.supportEmail || '');
      setSupportPhone(settingsData.general.supportPhone || '');
      setLogoUrl(settingsData.general.logoUrl || '');
    }

    if (settingsData.financial) {
      setCommissionRate(settingsData.financial.commissionRate?.toString() || '15');
      setMinPayout(settingsData.financial.minimumPayoutThreshold?.toString() || '5000');
    }

    if (settingsData.notifications) {
      setAlertNewcleaners(!!settingsData.notifications.newCleanerRegistrations);
      setAlertHighValue(!!settingsData.notifications.highValueOrders);
      setAlertSystemErrors(!!settingsData.notifications.systemErrorReports);
    }

    if (settingsData.api) {
      setMpesaKey(settingsData.api.mpesaKeyMasked || '');
      setMapsKey(settingsData.api.mapsKeyMasked || '');
    }

    if (settingsData.operations) {
      setMaintenanceMode(!!settingsData.operations.maintenanceMode);
      setSmsSid(settingsData.operations.smsSidMasked || '');
      setSmsSenderId(settingsData.operations.smsSenderId || '');
      setEmailAlerts(settingsData.operations.superAdminEmailAlerts ?? true);
    }

    if (settingsData.updatedAt) {
      setLastUpdatedTime(new Date(settingsData.updatedAt).toLocaleString());
    }
  }, []);

  // Fetch settings from MongoDB backend on mount
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await systemSettingsApi.getAdminSettings();
      if (response && response.success && response.data) {
        setRawBackupData(response.data);
        applySettingsToForm(response.data);
      }
    } catch (err) {
      console.error('Error fetching admin system settings:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to load system settings from backend.');
    } finally {
      setLoading(false);
    }
  }, [applySettingsToForm]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Handle Save Configuration
  const handleSave = async () => {
    setSaving(true);
    setErrorMessage(null);

    // Client-side validation
    const parsedCommission = parseFloat(commissionRate);
    if (isNaN(parsedCommission) || parsedCommission < 0 || parsedCommission > 100) {
      setErrorMessage('Commission rate must be a valid percentage between 0 and 100.');
      setSaving(false);
      return;
    }

    const parsedMinPayout = parseFloat(minPayout);
    if (isNaN(parsedMinPayout) || parsedMinPayout < 0) {
      setErrorMessage('Minimum payout threshold must be a non-negative number.');
      setSaving(false);
      return;
    }

    const payload = {
      general: {
        platformName,
        supportEmail,
        supportPhone,
        logoUrl
      },
      financial: {
        commissionRate: parsedCommission,
        minimumPayoutThreshold: parsedMinPayout
      },
      notifications: {
        newCleanerRegistrations: alertNewcleaners,
        highValueOrders: alertHighValue,
        systemErrorReports: alertSystemErrors
      },
      api: {
        // Send unmasked key strings if modified, avoiding sending masked placeholder strings
        ...(mpesaKey && !mpesaKey.includes('***') ? { mpesaKey } : {}),
        ...(mapsKey && !mapsKey.includes('***') ? { mapsKey } : {})
      },
      operations: {
        maintenanceMode,
        ...(smsSid && !smsSid.includes('***') ? { smsSid } : {}),
        smsSenderId,
        superAdminEmailAlerts: emailAlerts
      }
    };

    try {
      const response = await systemSettingsApi.updateAdminSettings(payload);
      if (response && response.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
        // Refresh backend settings & global app context
        await fetchSettings();
        await refreshSettings();
      }
    } catch (err) {
      console.error('Error updating system settings:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to save system settings.');
    } finally {
      setSaving(false);
    }
  };

  // Discard local edits and restore state from backend
  const handleDiscard = () => {
    if (rawBackupData) {
      applySettingsToForm(rawBackupData);
      setErrorMessage(null);
      setShowMpesaKey(false);
      setShowMapsKey(false);
      setShowSmsSid(false);
    }
  };

  // Reveal Key privileged handler
  const handleReveal = async (keyType) => {
    try {
      const response = await systemSettingsApi.revealSecretKey(keyType);
      if (response && response.success && response.rawKey) {
        if (keyType === 'mpesaKey') {
          setRevealedMpesaKey(response.rawKey);
          setShowMpesaKey(true);
        } else if (keyType === 'mapsKey') {
          setRevealedMapsKey(response.rawKey);
          setShowMapsKey(true);
        } else if (keyType === 'smsSid') {
          setRevealedSmsSid(response.rawKey);
          setShowSmsSid(true);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reveal sensitive key. Admin authorization required.');
    }
  };

  const handleCopy = (text) => {
    if (!text) return;
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="font-label-md text-on-surface-variant">Loading system configuration from MongoDB...</p>
      </div>
    );
  }

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
            onClick={handleDiscard}
            disabled={saving}
            className="bg-surface-container hover:bg-surface-container-highest text-on-surface font-label-md px-6 py-3 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Discard Changes
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary-container text-on-primary font-label-md px-6 py-3 rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">{saving ? 'sync' : 'save'}</span>
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span className="font-label-md">System settings updated successfully and persisted to MongoDB!</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-100 border border-rose-300 text-rose-800 px-4 py-3 rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="font-label-md">{errorMessage}</span>
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
            <p className="font-body-sm text-on-surface font-medium">Production (MongoDB Connected)</p>
            <p className="font-body-sm text-outline mt-1 text-xs">
              Last updated: {lastUpdatedTime || 'Just now'}
            </p>
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
                  <span className="font-label-sm text-on-surface-variant self-start">Platform Logo URL</span>
                  <div className="w-full aspect-square bg-surface-container rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-outline-variant hover:border-primary transition-colors p-4">
                    {logoUrl ? (
                      <img
                        className="w-24 h-24 object-contain mb-2 transition-transform"
                        alt="Aura Laundry Logo"
                        src={logoUrl}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="material-symbols-outlined text-[48px] text-outline-variant mb-2">local_laundry_service</span>
                    )}
                    <input
                      type="text"
                      placeholder="Logo URL"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full bg-surface-container-lowest rounded py-1 px-2 font-body-sm text-xs border border-outline-variant outline-none mt-2"
                    />
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
                      min="0"
                      max="100"
                      step="0.1"
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
                      min="0"
                      step="100"
                      value={minPayout}
                      onChange={(e) => setMinPayout(e.target.value)}
                      className="w-full bg-surface-container-lowest rounded-lg py-3 pl-14 pr-4 font-body-md text-on-surface outline-none border border-outline-variant focus:border-primary transition-all"
                    />
                  </div>
                  <p className="font-body-sm text-on-surface-variant text-xs mt-1">
                    Minimum balance required before a provider can request a payout.
                  </p>
                </label>
              </div>

              <div className="p-4 bg-surface-variant rounded-lg flex items-start gap-3">
                <span className="material-symbols-outlined text-on-surface-variant mt-0.5">warning</span>
                <div>
                  <h4 className="font-label-md text-on-surface mb-1">Warning on Rate Changes</h4>
                  <p className="font-body-sm text-on-surface-variant text-xs">
                    Changing the commission rate will only affect future transactions. Existing orders will maintain the historical rate applied at checkout.
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
                    <p className="font-body-sm text-on-surface-variant text-xs">Receive alerts when a new laundry cleaner/provider signs up.</p>
                  </div>
                  <button
                    onClick={() => setAlertNewcleaners(!alertNewcleaners)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${alertNewcleaners ? 'bg-primary' : 'bg-surface-variant'
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
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${alertHighValue ? 'bg-primary' : 'bg-surface-variant'
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
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${alertSystemErrors ? 'bg-primary' : 'bg-surface-variant'
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
                      value={showMpesaKey && revealedMpesaKey ? revealedMpesaKey : mpesaKey}
                      onChange={(e) => setMpesaKey(e.target.value)}
                      className="flex-1 bg-surface-container rounded-lg py-3 px-4 font-body-sm text-on-surface outline-none font-mono text-xs border border-transparent focus:border-primary"
                    />
                    <button
                      onClick={() => {
                        if (showMpesaKey) {
                          setShowMpesaKey(false);
                        } else {
                          handleReveal('mpesaKey');
                        }
                      }}
                      className="bg-secondary text-on-secondary px-4 rounded-lg font-label-sm hover:bg-secondary-fixed transition-colors cursor-pointer"
                    >
                      {showMpesaKey ? 'Hide' : 'Reveal'}
                    </button>
                    <button
                      onClick={() => handleCopy(showMpesaKey && revealedMpesaKey ? revealedMpesaKey : mpesaKey)}
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
                      value={showMapsKey && revealedMapsKey ? revealedMapsKey : mapsKey}
                      onChange={(e) => setMapsKey(e.target.value)}
                      className="flex-1 bg-surface-container rounded-lg py-3 px-4 font-body-sm text-on-surface outline-none font-mono text-xs border border-transparent focus:border-primary"
                    />
                    <button
                      onClick={() => {
                        if (showMapsKey) {
                          setShowMapsKey(false);
                        } else {
                          handleReveal('mapsKey');
                        }
                      }}
                      className="bg-secondary text-on-secondary px-4 rounded-lg font-label-sm hover:bg-secondary-fixed transition-colors cursor-pointer"
                    >
                      {showMapsKey ? 'Hide' : 'Reveal'}
                    </button>
                    <button
                      onClick={() => handleCopy(showMapsKey && revealedMapsKey ? revealedMapsKey : mapsKey)}
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
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${maintenanceMode ? 'bg-primary' : 'bg-surface-variant'
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
                    <div className="flex gap-2">
                      <input
                        type={showSmsSid ? 'text' : 'password'}
                        placeholder="API Key / SID"
                        value={showSmsSid && revealedSmsSid ? revealedSmsSid : smsSid}
                        onChange={(e) => setSmsSid(e.target.value)}
                        className="flex-1 bg-surface-container rounded-lg py-3 px-4 font-body-sm text-on-surface outline-none border border-transparent focus:border-primary"
                      />
                      <button
                        onClick={() => {
                          if (showSmsSid) {
                            setShowSmsSid(false);
                          } else {
                            handleReveal('smsSid');
                          }
                        }}
                        className="bg-secondary text-on-secondary px-3 rounded-lg font-label-sm hover:bg-secondary-fixed transition-colors cursor-pointer text-xs"
                      >
                        {showSmsSid ? 'Hide' : 'Reveal'}
                      </button>
                    </div>
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
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${emailAlerts ? 'bg-primary' : 'bg-surface-variant'
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
