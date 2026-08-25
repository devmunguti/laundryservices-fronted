import React, { useState, useEffect, useCallback } from 'react';
import { systemSettingsApi } from '../api/systemSettingsApi';
import { useSettings } from '../context/SettingsContext';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ui/ConfirmationModal';

export default function AdminSystemSettings() {
  const { refreshSettings } = useSettings();

  const [activeSubTab, setActiveSubTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(null);
  const [deleteLocationTarget, setDeleteLocationTarget] = useState(null);
  const [isDeletingLocation, setIsDeletingLocation] = useState(false);

  // Raw fetched data backup for "Discard Changes"
  const [rawBackupData, setRawBackupData] = useState(null);

  // General Settings State
  const [platformName, setPlatformName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [adminAlertEmail, setAdminAlertEmail] = useState('');
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

  // Campus Locations Management State
  const [campusLocations, setCampusLocations] = useState([]);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [locationForm, setLocationForm] = useState({
    name: '',
    zone: 'Main Campus',
    description: '',
    instructions: '',
    coordinates: { lat: -1.286389, lng: 36.817223 },
    isActive: true
  });
  const [locationActionLoading, setLocationActionLoading] = useState(false);

  // Populate component form state from fetched backend settings
  const applySettingsToForm = useCallback((settingsData) => {
    if (!settingsData) return;

    if (settingsData.general) {
      setPlatformName(settingsData.general.platformName || '');
      setSupportEmail(settingsData.general.supportEmail || '');
      setAdminAlertEmail(settingsData.general.adminAlertEmail || '');
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

    if (settingsData.campusLocations) {
      setCampusLocations(settingsData.campusLocations);
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
        adminAlertEmail,
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
      toast.error(err.response?.data?.message || 'Failed to reveal sensitive key. Admin authorization required.');
    }
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleAddLocationSubmit = async (e) => {
    e.preventDefault();
    if (!locationForm.name.trim()) return;

    try {
      setLocationActionLoading(true);
      const res = await systemSettingsApi.addCampusLocation(locationForm);
      if (res.success && res.data) {
        setCampusLocations(res.data);
        setShowAddLocationModal(false);
        setLocationForm({
          name: '',
          zone: 'Main Campus',
          description: '',
          instructions: '',
          isActive: true
        });
        refreshSettings();
        toast.success('Campus Pickup Hub added successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add campus location.');
    } finally {
      setLocationActionLoading(false);
    }
  };

  const handleToggleLocationActive = async (locId, currentActive) => {
    try {
      const res = await systemSettingsApi.updateCampusLocation(locId, { isActive: !currentActive });
      if (res.success && res.data) {
        setCampusLocations(res.data);
        refreshSettings();
        toast.success(`Campus station ${!currentActive ? 'activated' : 'disabled'}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update campus location status.');
    }
  };

  const handleConfirmDeleteLocation = async () => {
    if (!deleteLocationTarget) return;

    try {
      setIsDeletingLocation(true);
      const res = await systemSettingsApi.deleteCampusLocation(deleteLocationTarget._id || deleteLocationTarget.id);
      if (res.success && res.data) {
        setCampusLocations(res.data);
        setDeleteLocationTarget(null);
        refreshSettings();
        toast.success('Campus pickup station deleted successfully.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete campus location.');
    } finally {
      setIsDeletingLocation(false);
    }
  };

  const navItems = [
    { id: 'general', label: 'General Settings', icon: 'tune' },
    { id: 'campus', label: 'Campus Pickup Hubs', icon: 'location_city' },
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
                    <span className="font-label-sm text-on-surface-variant">Support Email (Customer Facing)</span>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="support@auralaundry.co.ke"
                      className="bg-surface-container-lowest rounded-lg py-3 px-4 font-body-md text-on-surface outline-none border border-outline-variant focus:border-primary transition-all"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="font-label-sm text-on-surface-variant">Admin Alert Email (Notification Destination)</span>
                    <input
                      type="email"
                      value={adminAlertEmail}
                      onChange={(e) => setAdminAlertEmail(e.target.value)}
                      placeholder="admin@auralaundry.co.ke"
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
                        alt="Laundry Logo"
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

          {/* Campus Pickup Hubs Panel */}
          {activeSubTab === 'campus' && (
            <div className="bg-surface-container-lowest rounded-xl shadow-xs p-margin-desktop border border-surface-container/40 animate-fade-in space-y-stack-gap-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-headline-lg text-on-surface">Campus Pickup Stations &amp; Hubs</h2>
                  <p className="font-body-sm text-on-surface-variant text-xs mt-1">
                    Manage the list of official pickup and drop-off spots students can select at checkout.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddLocationModal(true)}
                  className="bg-primary hover:bg-primary/90 text-on-primary font-label-md px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add_location_alt</span>
                  <span>Add Campus Hub</span>
                </button>
              </div>

              {/* Campus Locations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campusLocations.length === 0 ? (
                  <div className="col-span-2 p-8 text-center bg-surface-container-low rounded-xl text-on-surface-variant text-sm">
                    No campus locations configured yet. Click "Add Campus Hub" to add pickup places.
                  </div>
                ) : (
                  campusLocations.map((loc) => (
                    <div
                      key={loc._id || loc.name}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${loc.isActive !== false
                          ? 'bg-surface-container-lowest border-surface-container/60 shadow-xs'
                          : 'bg-surface-container-low/60 border-dashed border-outline-variant/50 opacity-75'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${loc.isActive !== false ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-500'
                            }`}>
                            <span className="material-symbols-outlined text-[20px]">location_on</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-on-surface">{loc.name}</h4>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                              {loc.zone || 'Campus Zone'}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${loc.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                          {loc.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {loc.description && (
                        <p className="text-xs text-on-surface-variant">{loc.description}</p>
                      )}

                      {loc.instructions && (
                        <div className="bg-surface-container-low p-2 rounded-lg text-[11px] text-on-surface-variant flex items-start gap-1">
                          <span className="material-symbols-outlined text-[14px] text-tertiary shrink-0 mt-0.5">info</span>
                          <span>{loc.instructions}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-surface-container/40 mt-1">
                        <button
                          type="button"
                          onClick={() => handleToggleLocationActive(loc._id, loc.isActive !== false)}
                          className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer ${loc.isActive !== false
                              ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                              : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                            }`}
                        >
                          {loc.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteLocationTarget(loc)}
                          className="text-xs text-error hover:bg-error-container/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Financial Rules Panel */}
          {activeSubTab === 'financial' && (
            <div className="bg-surface-container-lowest rounded-xl shadow-xs p-margin-desktop border border-surface-container/40 animate-fade-in space-y-stack-gap-lg">
              <h2 className="font-headline-lg text-on-surface">Commission & Monetization</h2>

              {/* Zero Commission Rule Highlight */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-600 mt-0.5 text-xl">account_tree</span>
                <div className="space-y-1">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                    Platform Commission &amp; Payout Rules
                  </h4>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    • <strong>0% Commission:</strong> When set to 0%, customer funds flow 100% directly to the provider's payment method upon checkout. Payout Destination configuration in provider profiles is automatically disabled as no platform escrow is held.<br />
                    • <strong>Default Platform Till (8995354):</strong> When the default till is used with commission &gt; 0%, the platform collects payments in escrow, takes the commission percentage, and admin processes payouts with automated invoice dispatches.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-margin-desktop">
                <label className="flex flex-col gap-2">
                  <span className="font-label-sm text-on-surface-variant flex items-center justify-between">
                    Platform Commission Rate (%)
                    <span className="material-symbols-outlined text-[16px] text-tertiary cursor-help" title="Percentage deducted from each completed order for cleaners payouts. Set to 0 to disable platform commission.">
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
                    {Number(commissionRate) === 0 ? '✨ 0% Commission Active: Providers receive 100% direct settlement.' : 'Percentage deducted for platform escrow and operations.'}
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

      {/* Add Campus Hub Modal */}
      {showAddLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-md w-full shadow-2xl border border-surface-container/60 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">add_location</span>
                </div>
                <h3 className="font-headline-sm text-on-surface">Add Campus Pickup Hub</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddLocationModal(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container text-on-surface-variant flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleAddLocationSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-on-surface mb-1 block">
                  Location / Station Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hostel Block B (Ladies Residence)"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:bg-white focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface mb-1 block">
                    Campus Zone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hostel Zone"
                    value={locationForm.zone}
                    onChange={(e) => setLocationForm({ ...locationForm, zone: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:bg-white focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-on-surface mb-1 block">
                    Building / Spot
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Block B Entrance"
                    value={locationForm.description}
                    onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:bg-white focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface mb-1 block">
                  Default Drop-off / Collection Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Leave bag with ground floor porter or caretaker."
                  value={locationForm.instructions}
                  onChange={(e) => setLocationForm({ ...locationForm, instructions: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2 text-sm text-on-surface focus:bg-white focus:border-primary outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface mb-1 block">
                    Map Latitude (Optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="-1.28638"
                    value={locationForm.coordinates?.lat ?? ''}
                    onChange={(e) =>
                      setLocationForm({
                        ...locationForm,
                        coordinates: {
                          ...locationForm.coordinates,
                          lat: parseFloat(e.target.value) || 0
                        }
                      })
                    }
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:bg-white focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-on-surface mb-1 block">
                    Map Longitude (Optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="36.81722"
                    value={locationForm.coordinates?.lng ?? ''}
                    onChange={(e) =>
                      setLocationForm({
                        ...locationForm,
                        coordinates: {
                          ...locationForm.coordinates,
                          lng: parseFloat(e.target.value) || 0
                        }
                      })
                    }
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:bg-white focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container/40">
                <button
                  type="button"
                  onClick={() => setShowAddLocationModal(false)}
                  className="px-4 py-2 bg-surface-container text-on-surface rounded-lg text-xs font-semibold hover:bg-surface-container-highest cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={locationActionLoading}
                  className="px-5 py-2 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {locationActionLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      Save Campus Hub
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Campus Location Deletion */}
      <ConfirmationModal
        isOpen={Boolean(deleteLocationTarget)}
        onClose={() => setDeleteLocationTarget(null)}
        onConfirm={handleConfirmDeleteLocation}
        title="Delete Campus Pickup Hub"
        itemName={deleteLocationTarget?.name}
        warningMessage="Are you sure you want to permanently delete this campus pickup station? Students will no longer see it as a pickup option during checkout."
        confirmText="Delete Hub"
        type="danger"
        isLoading={isDeletingLocation}
      />
    </div>
  );
}
