import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import './App.css';

// Lazy-loaded pages for bundle optimization & performance
const HomePage = lazy(() => import('./pages/HomePage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage'));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'));
const PortalGateway = lazy(() => import('./pages/PortalGateway'));
const ProviderPortal = lazy(() => import('./pages/ProviderPortal'));
const AdminPortal = lazy(() => import('./pages/AdminPortal'));
const ForcePasswordChange = lazy(() => import('./pages/ForcePasswordChange'));
const ProviderNavigationPage = lazy(() => import('./pages/ProviderNavigationPage'));
const CleanerShopPage = lazy(() => import('./pages/CleanerShopPage'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
      <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
      <p className="font-headline-md text-sm font-semibold text-on-surface">Loading page...</p>
    </div>
  );
}

function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Internet connection restored.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Internet connection lost. You are currently offline.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-amber-600 text-white font-label-md px-4 py-2.5 text-center flex items-center justify-center gap-2 shadow-md z-50 sticky top-0">
      <span className="material-symbols-outlined text-[18px]">wifi_off</span>
      <span>
        <strong>You are offline:</strong> Some real-time order updates and payment operations may be delayed.
      </span>
    </div>
  );
}

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
  useEffect(() => {
    const handleUnauthorized = (e) => {
      toast.error(e.detail || 'Session expired. Please sign in again.', { id: 'unauthorized-toast' });
    };
    const handleNetworkError = (e) => {
      toast.error(e.detail || 'Network error. Please check your connection.', { id: 'network-error-toast' });
    };

    window.addEventListener('platform:unauthorized', handleUnauthorized);
    window.addEventListener('platform:network-error', handleNetworkError);

    return () => {
      window.removeEventListener('platform:unauthorized', handleUnauthorized);
      window.removeEventListener('platform:network-error', handleNetworkError);
    };
  }, []);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            borderRadius: '16px',
            fontSize: '13px',
            fontWeight: '500',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
            padding: '12px 18px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
      <OfflineBanner />
      <MaintenanceBanner />
      <Router>
        <Suspense fallback={<PageLoader />}>
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
            <Route path="/cleaner/:providerId" element={<CleanerShopPage />} />
            <Route path="/shop/:providerId" element={<CleanerShopPage />} />
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
        </Suspense>
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


