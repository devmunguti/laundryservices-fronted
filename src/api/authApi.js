import api from './axios';

export const authApi = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  changeInitialPassword: async (newPassword) => {
    const response = await api.post('/auth/change-initial-password', { newPassword });
    return response.data;
  },

  resetProviderPassword: async (id, temporaryPassword) => {
    const response = await api.patch(`/auth/providers/${id}/reset-password`, { temporaryPassword });
    return response.data;
  },
};
