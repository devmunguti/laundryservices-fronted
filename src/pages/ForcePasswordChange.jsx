import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ForcePasswordChange() {
  const { user, changePassword } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (pass) => {
    if (pass.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(pass)) return 'Password must contain at least 1 uppercase letter.';
    if (!/[a-z]/.test(pass)) return 'Password must contain at least 1 lowercase letter.';
    if (!/[0-9]/.test(pass)) return 'Password must contain at least 1 number.';
    if (!/[^A-Za-z0-9]/.test(pass)) return 'Password must contain at least 1 special character.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    const policyError = validatePassword(newPassword);
    if (policyError) {
      setErrorMsg(policyError);
      return;
    }

    try {
      setLoading(true);
      const res = await changePassword(newPassword);
      if (res.success) {
        // Redirect to provider portal dashboard
        navigate('/provider');
      } else {
        setErrorMsg(res.message || 'Failed to update password.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Error changing password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-surface-container-lowest border border-surface-container rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[28px]">lock_reset</span>
          </div>
          <h2 className="font-headline-md text-on-surface">Create Your New Password</h2>
          <p className="font-body-sm text-on-surface-variant">
            Welcome, <span className="font-semibold text-on-surface">{user?.fullName || user?.email}</span>! For security purposes, you must replace your temporary password before accessing your dashboard.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-label-sm text-on-surface mb-1">New Permanent Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="e.g. Password@1234"
              className="w-full bg-surface-container py-2.5 px-4 rounded-xl font-body-sm text-on-surface outline-none border border-transparent focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="block font-label-sm text-on-surface mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full bg-surface-container py-2.5 px-4 rounded-xl font-body-sm text-on-surface outline-none border border-transparent focus:border-primary transition-all"
            />
          </div>

          <div className="bg-surface-container-low p-3 rounded-xl space-y-1">
            <p className="font-label-sm text-on-surface font-semibold">Password Requirements:</p>
            <ul className="text-[11px] text-on-surface-variant space-y-0.5 list-disc pl-4">
              <li>At least 8 characters long</li>
              <li>At least 1 uppercase & 1 lowercase letter</li>
              <li>At least 1 number and 1 special character</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-on-primary font-label-md font-semibold rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                Saving New Password...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                Create New Password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
