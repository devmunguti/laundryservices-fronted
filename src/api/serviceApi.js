import api from './axios';

export const serviceApi = {
  /**
   * Fetch services catalog
   */
  getServices: async (params = {}) => {
    const response = await api.get('/services', { params });
    return response.data;
  },

  /**
   * Fetch single service by ID
   */
  getServiceById: async (id) => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  /**
   * Create new service
   */
  createService: async (serviceData) => {
    const response = await api.post('/services', serviceData);
    return response.data;
  },

  /**
   * Update service details
   */
  updateService: async (id, serviceData) => {
    const response = await api.put(`/services/${id}`, serviceData);
    return response.data;
  },

  /**
   * Toggle service active status
   */
  toggleServiceStatus: async (id, isActive) => {
    const response = await api.patch(`/services/${id}/status`, { isActive });
    return response.data;
  },

  /**
   * Delete service
   */
  deleteService: async (id) => {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  }
};
