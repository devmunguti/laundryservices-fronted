import api from './axios';

export const auditLogApi = {
  /**
   * Fetch paginated audit logs with search, status, category, action, and date filters.
   */
  getAuditLogs: async (params = {}) => {
    const response = await api.get('/audit-logs', { params });
    return response.data;
  },

  /**
   * Fetch real-time audit metric counters (Events Today, Failed Logins, Critical Actions).
   */
  getAuditMetrics: async () => {
    const response = await api.get('/audit-logs/metrics');
    return response.data;
  },

  /**
   * Export filtered audit logs to CSV file.
   */
  exportAuditLogs: async (params = {}) => {
    const response = await api.get('/audit-logs/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};
