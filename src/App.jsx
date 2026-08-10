import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import HomePage from './pages/HomePage';
import ProviderPortal from './pages/ProviderPortal';
import AdminPortal from './pages/AdminPortal';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Customer Facing Routes */}
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

        {/* Provider Portal Single Unified Page Route */}
        <Route path="/provider" element={<ProviderPortal />} />
        <Route path="/provider/portal" element={<ProviderPortal />} />
        <Route path="/provider/dashboard" element={<Navigate to="/provider?tab=dashboard" replace />} />
        <Route path="/provider/orders" element={<Navigate to="/provider?tab=orders" replace />} />
        <Route path="/provider/services" element={<Navigate to="/provider?tab=services" replace />} />
        <Route path="/provider/reviews" element={<Navigate to="/provider?tab=reviews" replace />} />
        <Route path="/provider/earnings" element={<Navigate to="/provider?tab=earnings" replace />} />
        <Route path="/provider/payment-channels" element={<Navigate to="/provider?tab=payment-channels" replace />} />
        <Route path="/provider/profile" element={<Navigate to="/provider?tab=profile" replace />} />
        <Route path="/provider/settings" element={<Navigate to="/provider?tab=settings" replace />} />

        {/* Admin Portal Routes */}
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="/admin/portal" element={<AdminPortal />} />
        <Route path="/admin/overview" element={<Navigate to="/admin?tab=overview" replace />} />
        <Route path="/admin/provider-management" element={<Navigate to="/admin?tab=provider-management" replace />} />
        <Route path="/admin/order-management" element={<Navigate to="/admin?tab=order-management" replace />} />
        <Route path="/admin/ticket-management" element={<Navigate to="/admin?tab=ticket-management" replace />} />
        <Route path="/admin/payment-records" element={<Navigate to="/admin?tab=payment-records" replace />} />
        <Route path="/admin/user-logs" element={<Navigate to="/admin?tab=user-logs" replace />} />
        <Route path="/admin/system-settings" element={<Navigate to="/admin?tab=system-settings" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
