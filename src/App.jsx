import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import HomePage from './pages/HomePage';
import CheckoutPage from './pages/CheckoutPage';
import TrackOrderPage from './pages/TrackOrderPage';
import ReviewsPage from './pages/ReviewsPage';
import PortalGateway from './pages/PortalGateway';
import ProviderPortal from './pages/ProviderPortal';
import AdminPortal from './pages/AdminPortal';
import ForcePasswordChange from './pages/ForcePasswordChange';
import ProviderNavigationPage from './pages/ProviderNavigationPage';
import './App.css';

function MaintenanceBanner() {
  const { maintenanceTriggered, settings } = useSettings();
  const { user } = useAuth();

  if (!maintenanceTriggered && !settings?.maintenanceMode) return null;
  if (user && user.role === 'admin') return null; // Admins bypass maintenance banner

  return (
    <div className="bg-amber-500 text-slate-900 font-label-md px-4 py-3 text-center flex items-center justify-center gap-2 shadow-md">
      <span className="material-symbols-outlined text-[20px]">engineering</span>
      <span>
        <strong>Scheduled Maintenance:</strong> {settings?.platformName || 'Laundry'} is currently undergoing system updates. Customer order placements are temporarily restricted.
      </span>
    </div>
  );
}

function AppContent() {
  return (
    <>
      <MaintenanceBanner />
      <Router>
        <Routes>
          {/* Customer Facing & Authentication Routes */}
          <Route
            path="/"
            element={
              <div className="app-container">
                <Navbar />
                <main>
                  <HomePage />
                </main>
              </div>
            }
          />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/track-order/:orderRef" element={<TrackOrderPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/login" element={<PortalGateway />} />
          <Route path="/portal" element={<PortalGateway />} />
          <Route
            path="/force-password-change"
            element={
              <ProtectedRoute allowedRoles={['provider']}>
                <ForcePasswordChange />
              </ProtectedRoute>
            }
          />

          {/* Provider Portal Single Unified Page Route (Protected) */}
          <Route
            path="/provider"
            element={
              <ProtectedRoute allowedRoles={['provider', 'cleaner']}>
                <ProviderPortal />
              </ProtectedRoute>
            }
          />
          {/* Provider Live Navigation Route */}
          <Route
            path="/provider/navigate/:orderId"
            element={
              <ProtectedRoute allowedRoles={['provider', 'cleaner', 'admin']}>
                <ProviderNavigationPage />
              </ProtectedRoute>
            }
          />
          <Route path="/provider/portal" element={<Navigate to="/provider" replace />} />
          <Route path="/provider/dashboard" element={<Navigate to="/provider?tab=dashboard" replace />} />
          <Route path="/provider/orders" element={<Navigate to="/provider?tab=orders" replace />} />
          <Route path="/provider/services" element={<Navigate to="/provider?tab=services" replace />} />
          <Route path="/provider/promotions" element={<Navigate to="/provider?tab=promotions" replace />} />
          <Route path="/provider/reviews" element={<Navigate to="/provider?tab=reviews" replace />} />
          <Route path="/provider/earnings" element={<Navigate to="/provider?tab=earnings" replace />} />
          <Route path="/provider/payment-channels" element={<Navigate to="/provider?tab=payment-channels" replace />} />
          <Route path="/provider/profile" element={<Navigate to="/provider?tab=profile" replace />} />
          <Route path="/provider/settings" element={<Navigate to="/provider?tab=settings" replace />} />

          {/* Admin Portal Routes (Protected) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPortal />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/portal" element={<Navigate to="/admin" replace />} />
          <Route path="/admin/overview" element={<Navigate to="/admin?tab=overview" replace />} />
          <Route path="/admin/provider-management" element={<Navigate to="/admin?tab=provider-management" replace />} />
          <Route path="/admin/order-management" element={<Navigate to="/admin?tab=order-management" replace />} />
          <Route path="/admin/ticket-management" element={<Navigate to="/admin?tab=ticket-management" replace />} />
          <Route path="/admin/promotions-management" element={<Navigate to="/admin?tab=promotions-management" replace />} />
          <Route path="/admin/payment-records" element={<Navigate to="/admin?tab=payment-records" replace />} />
          <Route path="/admin/user-logs" element={<Navigate to="/admin?tab=user-logs" replace />} />
          <Route path="/admin/system-settings" element={<Navigate to="/admin?tab=system-settings" replace />} />
        </Routes>
      </Router>
    </>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;


