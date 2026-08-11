import api from './axios';

export const providerApi = {
  /**
   * Fetch paginated providers list with search & status filters.
   */
  getProviders: async (params = {}) => {
    const response = await api.get('/auth/providers', { params });
    return response.data;
  },

  /**
   * Fetch provider count statistics (Total, Active, Pending, Suspended, Rejected).
   */
  getProviderStats: async () => {
    const response = await api.get('/auth/providers/stats');
    return response.data;
  },

  /**
   * Fetch single provider by ID.
   */
  getProviderById: async (id) => {
    const response = await api.get(`/auth/providers/${id}`);
    return response.data;
  },

  /**
   * Create a new provider/cleaner account.
   */
  createProvider: async (providerData) => {
    const response = await api.post('/auth/providers', providerData);
    return response.data;
  },

  /**
   * Update provider details.
   */
  updateProvider: async (id, providerData) => {
    const response = await api.patch(`/auth/providers/${id}`, providerData);
    return response.data;
  },

  /**
   * Update provider status (Active, Pending, Suspended, Rejected).
   */
  updateProviderStatus: async (id, status) => {
    const response = await api.patch(`/auth/providers/${id}/status`, { status });
    return response.data;
  },

  /**
   * Delete provider account.
   */
  deleteProvider: async (id) => {
    const response = await api.delete(`/auth/providers/${id}`);
    return response.data;
  }
};
