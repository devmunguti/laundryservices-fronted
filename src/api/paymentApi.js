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
  }
};
