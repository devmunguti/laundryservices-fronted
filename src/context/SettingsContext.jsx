import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { systemSettingsApi } from '../api/systemSettingsApi';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    platformName: 'Laundry',
    supportEmail: 'support@auralaundry.co.ke',
    supportPhone: '+254 700 000 000',
    logoUrl: '',
    commissionRate: 15,
    minimumPayoutThreshold: 5000,
    maintenanceMode: false
  });
  const [loading, setLoading] = useState(true);
  const [maintenanceTriggered, setMaintenanceTriggered] = useState(false);

  const refreshSettings = useCallback(async () => {
    try {
      const response = await systemSettingsApi.getPublicSettings();
      if (response && response.success && response.data) {
        setSettings(response.data);
        if (response.data.maintenanceMode) {
          setMaintenanceTriggered(true);
        } else {
          setMaintenanceTriggered(false);
        }
      }
    } catch (error) {
      console.error('Failed to load public platform settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();

    // Listen for HTTP 503 MAINTENANCE_MODE interceptor events
    const handleMaintenanceEvent = (event) => {
      setMaintenanceTriggered(true);
    };

    window.addEventListener('platform:maintenance', handleMaintenanceEvent);
    return () => {
      window.removeEventListener('platform:maintenance', handleMaintenanceEvent);
    };
  }, [refreshSettings]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        maintenanceTriggered,
        setMaintenanceTriggered,
        refreshSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
