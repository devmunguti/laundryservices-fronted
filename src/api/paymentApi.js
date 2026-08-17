import api from './axios';

export const paymentApi = {
  /**
   * Fetch paginated payment records with search, payoutStatus, and date filters.
   */
  getPaymentRecords: async (params = {}) => {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  /**
   * Fetch real financial overview metrics (Total Revenue, Commissions, Pending Payouts).
   */
  getPaymentMetrics: async () => {
    const response = await api.get('/payments/metrics');
    return response.data;
  },

  /**
   * Fetch details for a specific payment transaction by ID.
   */
  getPaymentById: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  /**
   * Settle an individual provider payout.
   */
  settlePayout: async (id) => {
    const response = await api.post(`/payments/${id}/settle-payout`);
    return response.data;
  },

  /**
   * Process all pending payouts in bulk.
   */
  processBulkPayouts: async () => {
    const response = await api.post('/payments/process-payouts');
    return response.data;
  },

  /**
   * Export filtered payment records to CSV.
   */
  exportPaymentRecords: async (params = {}) => {
    const response = await api.get('/payments/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Customer initiate M-Pesa or COD payment checkout
   */
  checkoutPayment: async (data) => {
    const response = await api.post('/payments/checkout', data);
    return response.data;
  },

  /**
   * Customer confirm manual Till transaction code
   */
  confirmManualPayment: async (data) => {
    const response = await api.post('/payments/confirm-manual', data);
    return response.data;
  },

  /**
   * Customer poll payment status
   */
  getPaymentStatus: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}/status`);
    return response.data;
  },

  /**
   * Retry failed payment
   */
  retryPayment: async (paymentId, data) => {
    const response = await api.post(`/payments/${paymentId}/retry`, data);
    return response.data;
  },

  /**
   * Provider Payout Destination & Channels API
   */
  getProviderPayments: async () => {
    const response = await api.get('/payments/provider');
    return response.data;
  },

  /**
   * Update provider payout M-Pesa destination details
   */
  updateProviderPayoutSettings: async (data) => {
    const response = await api.put('/payments/provider/payout-settings', data);
    return response.data;
  },

  getChannels: async () => {
    const response = await api.get('/payments/channels');
    return response.data;
  },

  addChannel: async (data) => {
    const response = await api.post('/payments/channels', data);
    return response.data;
  },

  deleteChannel: async (id) => {
    const response = await api.delete(`/payments/channels/${id}`);
    return response.data;
  },

  /**
   * Verify manual M-Pesa payment — accepts either transactionCode or full SMS message
   * @param {{ orderId: string, transactionCode?: string, message?: string }} data
   */
  verifyManualPayment: async (data) => {
    const response = await api.post('/payments/verify-manual', data);
    return response.data;
  },

  /**
   * Admin send payout settlement invoice to provider
   */
  sendPayoutInvoice: async (paymentId) => {
    const response = await api.post(`/payments/${paymentId}/send-payout-invoice`);
    return response.data;
  },

  /**
   * Admin send payout invoices in bulk
   */
  sendBulkPayoutInvoices: async (paymentIds) => {
    const response = await api.post('/payments/bulk-send-invoices', { paymentIds });
    return response.data;
  }
};

