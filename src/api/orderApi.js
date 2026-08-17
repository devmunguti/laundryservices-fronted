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
   * Fetch live order analytics and metrics (Today's orders, pending pickups, ready for delivery)
   */
  getOrderMetrics: async () => {
    const response = await api.get('/orders/metrics');
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
  },

  /**
   * Get order tracking data by orderRef (customer, provider, admin, guest)
   */
  getOrderTracking: async (orderRef) => {
    const response = await api.get(`/orders/track/${orderRef}`);
    return response.data;
  },

  /**
   * Update real-time GPS live location / directions for an active order
   */
  updateOrderLiveLocation: async (orderRef, locationData) => {
    const response = await api.patch(`/orders/track/${orderRef}/live-location`, locationData);
    return response.data;
  },

  /**
   * Provider/Driver streams real-time moving coordinates during live navigation
   */
  updateProviderLiveLocation: async (orderIdOrRef, locationData) => {
    const response = await api.patch(`/orders/track/${orderIdOrRef}/provider-location`, locationData);
    return response.data;
  }
};
