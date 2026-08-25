import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../hooks/useAuth';
import { orderApi } from '../../api/orderApi';
import toast from 'react-hot-toast';
import './Navbar.css';

export default function Navbar() {
  const { settings } = useSettings();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mobile Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Track Order Modal State
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is active
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

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
        toast.success(`Found order ${res.data.orderRef}`);
        navigate(`/track-order/${res.data.orderRef}`);
      } else {
        setTrackingError(res.message || 'No order found with this M-Pesa code or Order number.');
      }
    } catch (err) {
      setTrackingError(
        err.response?.data?.message ||
          'Order not found. Please verify your M-Pesa transaction code or order number.'
      );
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <>
      <header className="navbar-root">
        <div className="navbar-container">
          {/* Brand Logo & Home Link */}
          <Link to="/" className="navbar-brand" aria-label={`${settings?.platformName || 'Oduori Laundry'} Home`}>
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings?.platformName || 'Logo'}
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <span className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shadow-xs">
                <span className="material-symbols-outlined text-[20px]">local_laundry_service</span>
              </span>
            )}
            <span className="brand-name">{settings?.platformName || 'Oduori Laundry'}</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="navbar-desktop-nav" aria-label="Main Navigation">
            <Link
              to="/"
              className={`nav-link flex items-center gap-1.5 ${location.pathname === '/' ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              <span>Home</span>
            </Link>
            <Link
              to="/reviews"
              className={`nav-link flex items-center gap-1.5 ${
                location.pathname === '/reviews' ? 'active' : ''
              }`}
            >
              <span className="material-symbols-outlined text-[16px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              <span>Reviews &amp; Rankings</span>
            </Link>
          </nav>

          {/* Actions & Buttons */}
          <div className="navbar-actions-group">
            {/* Prominent Track Order Button */}
            <button
              type="button"
              onClick={() => {
                setIsTrackingModalOpen(true);
                setTrackingError('');
              }}
              className="btn-track"
              title="Track your order using M-Pesa code or Order number"
              aria-label="Track order"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span className="hidden sm:inline">Track Order</span>
            </button>

            {/* User Session or Portal Login */}
            {isAuthenticated && user ? (
              user.role === 'admin' ? (
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="btn-portal admin"
                >
                  <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                  <span className="hidden sm:inline">Super Admin</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/provider')}
                  className="btn-portal provider"
                >
                  <span className="material-symbols-outlined text-[16px]">dry_cleaning</span>
                  <span className="hidden sm:inline">Cleaner Portal</span>
                </button>
              )
            ) : (
              <Link to="/login" className="btn-login" aria-label="Portal Login">
                <span className="material-symbols-outlined text-[18px]">person</span>
                <span className="hidden sm:inline">Login</span>
              </Link>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="navbar-mobile-toggle md:hidden"
              aria-label="Open mobile menu"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="mobile-drawer-backdrop md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div
            className="mobile-drawer-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
          >
            {/* Drawer Header */}
            <div className="mobile-drawer-header">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[20px]">local_laundry_service</span>
                </span>
                <span className="font-headline-md text-base font-bold text-on-surface">
                  {settings?.platformName || 'Oduori Laundry'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container"
                aria-label="Close menu"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Drawer Links */}
            <nav className="mobile-drawer-nav">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`mobile-nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined">home</span>
                <span>Home</span>
              </Link>

              <Link
                to="/reviews"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`mobile-nav-link ${location.pathname === '/reviews' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined text-amber-500">rate_review</span>
                <span>Ratings &amp; Reviews</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsTrackingModalOpen(true);
                }}
                className="mobile-nav-link text-left"
              >
                <span className="material-symbols-outlined text-primary">local_shipping</span>
                <span>Track Order (M-Pesa / Ref)</span>
              </button>

              <div className="pt-4 border-t border-surface-container mt-2">
                {isAuthenticated && user ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2 bg-surface-container rounded-xl">
                      <p className="font-bold text-xs text-on-surface">{user.fullName || 'User'}</p>
                      <p className="text-[11px] text-on-surface-variant capitalize">{user.role}</p>
                    </div>
                    {user.role === 'admin' ? (
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="mobile-nav-link active"
                      >
                        <span className="material-symbols-outlined">admin_panel_settings</span>
                        <span>Super Admin Command</span>
                      </Link>
                    ) : (
                      <Link
                        to="/provider"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="mobile-nav-link active"
                      >
                        <span className="material-symbols-outlined">dry_cleaning</span>
                        <span>Cleaner Partner Portal</span>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="mobile-nav-link text-error hover:bg-error-container/20 w-full"
                    >
                      <span className="material-symbols-outlined">logout</span>
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="mobile-nav-link bg-primary text-white hover:bg-primary-container justify-center font-bold"
                  >
                    <span className="material-symbols-outlined">login</span>
                    <span>Portal Login</span>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Interactive Track Order Modal */}
      {isTrackingModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-5 relative animate-in fade-in zoom-in duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsTrackingModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs shrink-0">
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
                  className="flex-[2] py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-container shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
