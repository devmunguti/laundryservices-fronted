import api from './axios';

export const orderApi = {
  /**
   * Place new customer order
   */
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  /**
   * Fetch paginated orders (Role-filtered by backend)
   */
  getOrders: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  /**
   * Get single order by ID
   */
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  /**
   * Admin: Assign order to active provider
   */
  assignProvider: async (id, providerId) => {
    const response = await api.patch(`/orders/${id}/assign-provider`, { providerId });
    return response.data;
  },

  /**
   * Update order status (Provider or Admin)
   */
  updateOrderStatus: async (id, status) => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  }
};
