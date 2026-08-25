import api from './axios';

export const notificationApi = {
  /**
   * Fetch paginated user notifications
   */
  getNotifications: async ({ page = 1, limit = 20, read = undefined } = {}) => {
    const params = { page, limit };
    if (read !== undefined) params.read = read;
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  /**
   * Delete / dismiss a notification
   */
  deleteNotification: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  }
};

export default notificationApi;
