import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    }
    return Promise.reject(error);
  }
);

export default api;

