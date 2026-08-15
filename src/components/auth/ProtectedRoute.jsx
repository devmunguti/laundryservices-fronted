import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // If initial auth verification is in flight and no cached session exists
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9fc]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-blue-600 text-4xl">
            sync
          </span>
          <p className="text-sm font-medium text-slate-500">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Redirect to login page
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Forced initial password change workflow
  if (user.role === 'provider' && user.mustChangePassword && location.pathname !== '/force-password-change') {
    return <Navigate to="/force-password-change" replace />;
  }

  // Strict Role-Based Access Control
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === 'provider' || user.role === 'cleaner') {
      return <Navigate to="/provider" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}
