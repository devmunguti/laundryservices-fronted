import axios from 'axios';

const rawUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const API_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send HttpOnly cookies automatically with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      error.response.status === 503 &&
      error.response.data?.code === 'MAINTENANCE_MODE'
    ) {
      window.dispatchEvent(
        new CustomEvent('platform:maintenance', {
          detail: error.response.data?.message || 'Platform is under maintenance.'
        })
      );
    } else if (error.response && error.response.status === 401) {
      // Dispatch unauthorized event if session expired
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/me');
      if (!isAuthEndpoint) {
        window.dispatchEvent(
          new CustomEvent('platform:unauthorized', {
            detail: 'Your session has expired. Please sign in again.'
          })
        );
      }
    } else if (!error.response && error.code === 'ERR_NETWORK') {
      window.dispatchEvent(
        new CustomEvent('platform:network-error', {
          detail: 'Unable to connect to the server. Please check your internet connection.'
        })
      );
    }
    return Promise.reject(error);
  }
);

export default api;

