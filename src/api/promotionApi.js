import api from './axios';

export const promotionApi = {
  /**
   * Get public promotion instructions, paybill number, and package rates
   */
  getPromotionSettings: async () => {
    const response = await api.get('/promotions/settings');
    return response.data;
  },

  /**
   * Get active featured provider(s) for homepage
   */
  getFeaturedProviders: async () => {
    const response = await api.get('/promotions/featured');
    return response.data;
  },

  /**
   * Provider: Submit a manual promotion claim with M-Pesa transaction code
   */
  requestPromotion: async (payload) => {
    const response = await api.post('/promotions/request', payload);
    return response.data;
  },

  /**
   * Provider: Get list of own promotion claims and current active status
   */
  getMyPromotionRequests: async () => {
    const response = await api.get('/promotions/my-requests');
    return response.data;
  },

  /**
   * Admin: List all provider promotion requests
   */
  getAdminPromotions: async (params = {}) => {
    const response = await api.get('/promotions/admin', { params });
    return response.data;
  },

  /**
   * Admin: Approve a promotion request & activate provider spot
   */
  approvePromotion: async (id, payload = {}) => {
    const response = await api.patch(`/promotions/admin/${id}/approve`, payload);
    return response.data;
  },

  /**
   * Admin: Reject a promotion request
   */
  rejectPromotion: async (id, payload = {}) => {
    const response = await api.patch(`/promotions/admin/${id}/reject`, payload);
    return response.data;
  },

  /**
   * Admin: Update promotion paybill, account no, and packages
   */
  updatePromotionSettings: async (settingsData) => {
    const response = await api.put('/promotions/admin/settings', settingsData);
    return response.data;
  }
};
