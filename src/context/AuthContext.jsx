import React, { createContext, useState, useEffect, useContext } from 'react';
import { authApi } from '../api/authApi';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('aura_auth_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Check authentication status on startup via HttpOnly cookie
  const checkAuth = async () => {
    try {
      setLoading(true);
      const res = await authApi.getCurrentUser();
      if (res.success && res.authenticated && res.user) {
        setUser(res.user);
        try {
          localStorage.setItem('aura_auth_user', JSON.stringify(res.user));
        } catch (e) {}
      } else {
        setUser(null);
        try {
          localStorage.removeItem('aura_auth_user');
          localStorage.removeItem('aura_auth_token');
        } catch (e) {}
      }
    } catch (error) {
      setUser(null);
      try {
        localStorage.removeItem('aura_auth_user');
        localStorage.removeItem('aura_auth_token');
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    if (res.success && res.user) {
      setUser(res.user);
      try {
        localStorage.setItem('aura_auth_user', JSON.stringify(res.user));
        if (res.token) {
          localStorage.setItem('aura_auth_token', res.token);
        }
      } catch (e) {}
    }
    return res;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    if (res.success && res.user && !res.requiresApproval) {
      setUser(res.user);
      try {
        localStorage.setItem('aura_auth_user', JSON.stringify(res.user));
        if (res.token) {
          localStorage.setItem('aura_auth_token', res.token);
        }
      } catch (e) {}
    }
    return res;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore logout errors
    } finally {
      setUser(null);
      try {
        localStorage.removeItem('aura_auth_user');
        localStorage.removeItem('aura_auth_token');
      } catch (e) {}
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const changePassword = async (newPassword) => {
    const res = await authApi.changeInitialPassword(newPassword);
    if (res.success && res.user) {
      setUser(res.user);
      try {
        localStorage.setItem('aura_auth_user', JSON.stringify(res.user));
        if (res.token) {
          localStorage.setItem('aura_auth_token', res.token);
        }
      } catch (e) {}
    }
    return res;
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    changePassword,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
