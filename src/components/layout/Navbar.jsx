import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../hooks/useAuth';
import { orderApi } from '../../api/orderApi';
import './Navbar.css';

export default function Navbar() {
  const { settings } = useSettings();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Track Order Modal State
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    const cleanQuery = trackingInput.trim();
    if (!cleanQuery) {
      setTrackingError('Please enter your M-Pesa code or Order #');
      return;
    }

    try {
      setTrackingLoading(true);
      setTrackingError('');
      const res = await orderApi.getOrderTracking(cleanQuery);

      if (res.success && res.data?.orderRef) {
        setIsTrackingModalOpen(false);
        setTrackingInput('');
        navigate(`/track-order/${res.data.orderRef}`);
      } else {
        setTrackingError(res.message || 'No order found with this M-Pesa code or Order number.');
      }
    } catch (err) {
      setTrackingError(err.response?.data?.message || 'Order not found. Please verify your M-Pesa transaction code or order number.');
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-brand">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.platformName} className="h-7 w-auto object-contain mr-2" />
            ) : (
              <span className="brand-icon">🧺</span>
            )}
            <span className="brand-name">{settings?.platformName || 'Aura Laundry'}</span>
          </Link>

          <nav className="navbar-links">
            <Link to="/">Home</Link>
            <a href="/#services">Services</a>
            <a href="/#pricing">Pricing</a>
            <Link to="/reviews" className="reviews-link font-semibold flex items-center gap-1">
              ⭐ Reviews &amp; Rankings
            </Link>
          </nav>

          <div className="navbar-actions">
            {/* Prominent Track Order Button */}
            <button
              onClick={() => {
                setIsTrackingModalOpen(true);
                setTrackingError('');
              }}
              className="btn-track"
              title="Track your order using M-Pesa code or Order number"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span>Track Order</span>
            </button>

            <Link to="/login" className="btn-secondary">
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Interactive Track Order Modal */}
      {isTrackingModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-5 relative animate-in fade-in zoom-in duration-200">
            {/* Close Button */}
            <button
              onClick={() => setIsTrackingModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[24px]">local_shipping</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Track Your Order</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Enter your M-Pesa receipt code or Order reference.
                </p>
              </div>
            </div>

            {/* Tracking Search Form */}
            <form onSubmit={handleTrackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  M-Pesa Code or Order #
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    receipt_long
                  </span>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. UHD2A3L0BX or ORD-540631"
                    value={trackingInput}
                    onChange={(e) => {
                      setTrackingInput(e.target.value);
                      if (trackingError) setTrackingError('');
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 py-3 pl-11 pr-4 rounded-xl text-sm font-mono text-slate-900 dark:text-white outline-none border border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all uppercase placeholder:normal-case placeholder:font-sans"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  💡 Tip: You can paste the 10-character M-Pesa code from your SMS.
                </span>
              </div>

              {trackingError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                  <span>{trackingError}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsTrackingModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={trackingLoading || !trackingInput.trim()}
                  className="flex-[2] py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {trackingLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">search</span>
                      <span>Find Order</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

