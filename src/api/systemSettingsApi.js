import api from './axios';

export const systemSettingsApi = {
  /**
   * Retrieves complete System Settings for authenticated admin
   */
  getAdminSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  /**
   * Retrieves complete live overview metrics and stats for Admin Dashboard
   */
  getAdminOverviewMetrics: async () => {
    const response = await api.get('/admin/settings/overview-metrics');
    return response.data;
  },

  /**
   * Updates global System Settings (Singleton document)
   */
  updateAdminSettings: async (settingsPayload) => {
    const response = await api.put('/admin/settings', settingsPayload);
    return response.data;
  },

  /**
   * Privileged action to reveal raw API keys / SIDs for Super Admin
   */
  revealSecretKey: async (keyType) => {
    const response = await api.post('/admin/settings/reveal-key', { keyType });
    return response.data;
  },

  /**
   * Unauthenticated public config endpoint
   */
  getPublicSettings: async () => {
    const response = await api.get('/public/settings');
    return response.data;
  }
};
