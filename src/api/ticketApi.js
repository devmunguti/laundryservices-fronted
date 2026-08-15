import api from './axios';

export const ticketApi = {
  /**
   * Fetch ticket metrics and counts
   */
  getTicketMetrics: async () => {
    const response = await api.get('/tickets/metrics');
    return response.data;
  },

  /**
   * Fetch support tickets
   */
  getTickets: async (params = {}) => {
    const response = await api.get('/tickets', { params });
    return response.data;
  },

  /**
   * Fetch single ticket by ID
   */
  getTicketById: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  /**
   * Create new support ticket
   */
  createTicket: async (ticketData) => {
    const response = await api.post('/tickets', ticketData);
    return response.data;
  },

  /**
   * Post message reply to ticket thread
   */
  addTicketMessage: async (id, text) => {
    const response = await api.post(`/tickets/${id}/messages`, { text });
    return response.data;
  },

  /**
   * Update ticket status or priority
   */
  updateTicketStatus: async (id, statusData) => {
    const response = await api.patch(`/tickets/${id}/status`, statusData);
    return response.data;
  }
};
