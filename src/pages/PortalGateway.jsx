import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../context/SettingsContext';

export default function PortalGateway() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, login, register } = useAuth();
  const { settings } = useSettings();

  const tabParam = searchParams.get('portal') || searchParams.get('tab') || searchParams.get('role');
  const [activePortal, setActivePortal] = useState(tabParam === 'admin' ? 'admin' : 'provider');
  const [providerMode, setProviderMode] = useState('login');

  // If already logged in, automatically redirect directly to the appropriate dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'provider' || user.role === 'cleaner') {
        navigate('/provider', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    fullName: '',
    businessName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    adminAccessKey: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
    setSuccessMsg('');
  };

  const validatePasswordRequirements = (pass) => {
    if (pass.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(pass)) return 'Password must contain at least 1 uppercase letter.';
    if (!/[a-z]/.test(pass)) return 'Password must contain at least 1 lowercase letter.';
    if (!/[0-9]/.test(pass)) return 'Password must contain at least 1 number.';
    if (!/[^A-Za-z0-9]/.test(pass)) return 'Password must contain at least 1 special character.';
    return null;
  };

  const redirectByRole = (loggedInUser, requiresPasswordChange) => {
    if (requiresPasswordChange) {
      setSuccessMsg('Temporary password detected. Redirecting to password setup...');
      setTimeout(() => navigate('/force-password-change'), 800);
      return;
    }

    if (loggedInUser?.role === 'admin') {
      setSuccessMsg('Super Admin verified! Redirecting to Admin Command Center...');
      setTimeout(() => navigate('/admin'), 800);
    } else if (loggedInUser?.role === 'provider' || loggedInUser?.role === 'cleaner') {
      setSuccessMsg('Cleaner verified! Redirecting to Provider Portal...');
      setTimeout(() => navigate('/provider'), 800);
    } else {
      setSuccessMsg('Welcome back! Redirecting...');
      setTimeout(() => navigate('/'), 800);
    }
  };

  const handleProviderSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (providerMode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          setErrorMsg('Passwords do not match');
          setLoading(false);
          return;
        }

        const passErr = validatePasswordRequirements(formData.password);
        if (passErr) {
          setErrorMsg(passErr);
          setLoading(false);
          return;
        }

        // Register cleaner / provider
        const payload = {
          firstName: formData.firstName || formData.fullName.split(' ')[0] || 'Cleaner',
          lastName: formData.lastName || formData.fullName.split(' ').slice(1).join(' ') || '',
          name: formData.fullName || formData.businessName,
          email: formData.email,
          phone: formData.phone || '',
          password: formData.password,
          role: 'provider'
        };

        const res = await register(payload);

        if (res && res.success) {
          if (res.requiresApproval) {
            setSuccessMsg(res.message || 'Registration submitted! Your account is pending administrator verification before you can access the dashboard.');
            setProviderMode('login');
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
          } else {
            setSuccessMsg('Cleaner account registered successfully! Redirecting...');
            redirectByRole(res.user, res.requiresPasswordChange);
          }
        }
      } else {
        // Login cleaner / provider
        const res = await login({
          email: formData.email,
          password: formData.password,
        });

        if (res && res.success) {
          redirectByRole(res.user, res.requiresPasswordChange);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Authentication failed';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await login({
        email: formData.email,
        password: formData.password,
      });

      if (res && res.success) {
        redirectByRole(res.user, res.requiresPasswordChange);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Admin authentication failed';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-background font-body-md text-on-background min-h-screen flex items-center justify-center py-12 px-4">
      <main className="flex flex-col w-full max-w-4xl items-center justify-center relative overflow-hidden bg-background">
        {/* Ambient Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-fixed-dim/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-fixed-dim/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-container-high mb-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] cursor-pointer" onClick={() => navigate('/')}>
              <span
                className="material-symbols-outlined text-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_laundry_service
              </span>
            </div>
            <h1 className="font-headline-xl text-3xl font-bold text-on-background mb-2">
              {settings?.platformName || 'Aura Laundry'} Portal
            </h1>

            <p className="font-body-lg text-on-surface-variant max-w-lg mx-auto text-sm md:text-base">
              Sign in or register your account to manage cleaning services or access administrative controls.
            </p>
          </div>

          {/* Portal Switcher Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-surface-container p-1 rounded-2xl flex border border-outline-variant/30 shadow-inner max-w-md w-full">
              <button
                type="button"
                onClick={() => { setActivePortal('provider'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${activePortal === 'provider'
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-background'
                  }`}
              >
                <span className="material-symbols-outlined text-lg">cleaning_services</span>
                <span>Cleaners & Providers</span>
              </button>
              <button
                type="button"
                onClick={() => { setActivePortal('admin'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${activePortal === 'admin'
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-background'
                  }`}
              >
                <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                <span>Platform Admin</span>
              </button>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="max-w-md mx-auto mb-6 p-4 bg-error-container text-on-error-container text-sm rounded-xl flex items-center gap-3 border border-error/20">
              <span className="material-symbols-outlined text-error">error</span>
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="max-w-md mx-auto mb-6 p-4 bg-primary/10 text-primary text-sm rounded-xl flex items-center gap-3 border border-primary/20">
              <span className="material-symbols-outlined text-primary">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Dynamic Card Container */}
          <div className="max-w-md mx-auto bg-surface-container-lowest rounded-[24px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-outline-variant/20 relative overflow-hidden transition-all">
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${activePortal === 'provider' ? 'from-secondary-fixed-dim via-primary to-secondary' : 'from-primary via-tertiary to-primary'} transition-all`}></div>

            {/* Provider Section */}
            {activePortal === 'provider' && (
              <div>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant/20">
                  <div>
                    <h2 className="text-xl font-bold text-on-background">Cleaner Access</h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">Facility & Service Partner Portal</p>
                  </div>
                  {/* Mode switcher (Login / Register) */}
                  <div className="flex bg-surface-container rounded-lg p-0.5 border border-outline-variant/30">
                    <button
                      type="button"
                      onClick={() => { setProviderMode('login'); setErrorMsg(''); }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${providerMode === 'login'
                          ? 'bg-surface-container-lowest text-primary shadow-xs'
                          : 'text-on-surface-variant hover:text-on-background'
                        }`}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => { setProviderMode('register'); setErrorMsg(''); }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${providerMode === 'register'
                          ? 'bg-surface-container-lowest text-primary shadow-xs'
                          : 'text-on-surface-variant hover:text-on-background'
                        }`}
                    >
                      Register
                    </button>
                  </div>
                </div>

                <form onSubmit={handleProviderSubmit} className="space-y-4">
                  {providerMode === 'register' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                          Full Name / Contact Person
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg">person</span>
                          <input
                            type="text"
                            name="fullName"
                            required
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="e.g. Jane Doe"
                            className="w-full pl-10 pr-4 py-2.5 bg-surface-container/50 border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                          Facility / Business Name
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg">storefront</span>
                          <input
                            type="text"
                            name="businessName"
                            required
                            value={formData.businessName}
                            onChange={handleChange}
                            placeholder="e.g. Sparkle Clean Laundry Hub"
                            className="w-full pl-10 pr-4 py-2.5 bg-surface-container/50 border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                          Phone Number
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg">call</span>
                          <input
                            type="tel"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+254 700 000 000"
                            className="w-full pl-10 pr-4 py-2.5 bg-surface-container/50 border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg">mail</span>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="cleaner@laundry.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-container/50 border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg">lock</span>
                      <input
                        type="password"
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-container/50 border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
                      />
                    </div>
                  </div>

                  {providerMode === 'register' && (
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg">lock_reset</span>
                        <input
                          type="password"
                          name="confirmPassword"
                          required
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-2.5 bg-surface-container/50 border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 px-4 bg-primary hover:bg-primary-fixed-dim text-on-primary font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="material-symbols-outlined animate-spin text-base">sync</span>
                    ) : (
                      <>
                        <span>{providerMode === 'register' ? 'Register Cleaner Account' : 'Sign In as Cleaner'}</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-outline-variant/20 text-center">
                  <p className="text-xs text-on-surface-variant">
                    {providerMode === 'login' ? (
                      <>
                        New service provider?{' '}
                        <button
                          type="button"
                          onClick={() => setProviderMode('register')}
                          className="text-primary font-semibold hover:underline"
                        >
                          Register your facility here
                        </button>
                      </>
                    ) : (
                      <>
                        Already registered?{' '}
                        <button
                          type="button"
                          onClick={() => setProviderMode('login')}
                          className="text-primary font-semibold hover:underline"
                        >
                          Sign in to your account
                        </button>
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Admin Section */}
            {activePortal === 'admin' && (
              <div>
                <div className="mb-6 pb-4 border-b border-outline-variant/20">
                  <h2 className="text-xl font-bold text-on-background">Admin Portal Login</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">Central Command System & Analytics</p>
                </div>

                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Admin Email Address
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg">badge</span>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="admin@aura.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-container/50 border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Master Password
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg">shield</span>
                      <input
                        type="password"
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-container/50 border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Security Verification Key (Optional)
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg">key</span>
                      <input
                        type="password"
                        name="adminAccessKey"
                        value={formData.adminAccessKey}
                        onChange={handleChange}
                        placeholder="Key or Auth token"
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-container/50 border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 px-4 bg-on-background hover:bg-black text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="material-symbols-outlined animate-spin text-base">sync</span>
                    ) : (
                      <>
                        <span>Access Command Center</span>
                        <span className="material-symbols-outlined text-sm">login</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-outline-variant/20 text-center">
                  <p className="text-xs text-on-surface-variant">
                    Restricted access. All administrative access attempts are logged and monitored.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <a
              className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors mx-3"
              href="#privacy"
              onClick={(e) => e.preventDefault()}
            >
              Privacy Policy
            </a>
            <span className="text-outline-variant">•</span>
            <a
              className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors mx-3"
              href="#status"
              onClick={(e) => e.preventDefault()}
            >
              System Telemetry Status
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

