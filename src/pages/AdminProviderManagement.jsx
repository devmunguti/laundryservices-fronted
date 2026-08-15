import React, { useState, useEffect, useCallback } from 'react';
import { providerApi } from '../api/providerApi';
import { authApi } from '../api/authApi';
import ConfirmationModal from '../components/ui/ConfirmationModal';

export default function AdmincleanersManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);

  // Deletion Modal State
  const [deleteModalCleaner, setDeleteModalCleaner] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // In-app Toast Notification State
  const [toast, setToast] = useState(null);

  // Auto-dismiss toast after 4.5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  });

  // KPI Stats State
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
    rejected: 0
  });

  // New cleaners Form State
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTemporaryPassword, setNewTemporaryPassword] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Reset Password Modal State
  const [resetModalProvider, setResetModalProvider] = useState(null);
  const [resetTempPassword, setResetTempPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const [cleanerss, setcleanerss] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleOpenResetModal = (cleaner) => {
    setResetModalProvider(cleaner);
    setResetTempPassword('Password@1234');
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetModalProvider || !resetTempPassword) return;

    try {
      setResetSubmitting(true);
      const res = await authApi.resetProviderPassword(resetModalProvider.id, resetTempPassword);
      if (res.success) {
        setToast({
          type: 'success',
          message: res.message || 'Password reset successfully!'
        });
        setResetModalProvider(null);
        setResetTempPassword('');
      } else {
        setToast({
          type: 'error',
          message: res.message || 'Failed to reset password.'
        });
      }
    } catch (err) {
      console.error('Failed to reset provider password:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Error resetting password.'
      });
    } finally {
      setResetSubmitting(false);
    }
  };

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleFilterTabChange = (tab) => {
    setActiveFilterTab(tab);
    setPage(1);
  };

  // Fetch KPI Stats from MongoDB
  const fetchStats = useCallback(async () => {
    try {
      const res = await providerApi.getProviderStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch provider stats:', err);
    }
  }, []);

  // Fetch cleaners/providers from MongoDB API
  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit,
        search: debouncedSearch,
        status: activeFilterTab !== 'All' ? activeFilterTab : undefined
      };

      const res = await providerApi.getProviders(params);
      if (res.success && res.data) {
        const rawList = res.data.providers || [];
        const formatted = rawList.map((p) => ({
          id: p._id,
          name: p.providerDetails?.businessName || p.fullName || 'Sparkle Cleaners Ltd',
          owner: p.fullName || p.firstName || 'Owner',
          email: p.email,
          phone: p.phone,
          location: p.addresses?.[0]?.street || 'Nairobi',
          subLocation: p.addresses?.[0]?.city || 'Nairobi, KE',
          status: p.status || 'Active',
          rating: p.providerDetails?.rating || 5.0,
          reviewsCount: 15,
          totalOrders: '0',
          ordersTrend: 'Active on platform',
          image: null
        }));
        setcleanerss(formatted);

        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      } else {
        setError(res.message || 'Failed to load cleaners.');
      }
    } catch (err) {
      console.error('Failed to fetch providers from MongoDB:', err);
      setError(err.response?.data?.message || err.message || 'Error fetching provider accounts.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, activeFilterTab]);

  useEffect(() => {
    fetchStats();
    fetchProviders();
  }, [fetchProviders, fetchStats]);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await providerApi.updateProviderStatus(id, status);
      if (res.success) {
        setToast({
          type: 'success',
          message: `Cleaner status updated to ${status}.`
        });
        await Promise.all([fetchProviders(), fetchStats()]);
      } else {
        setToast({
          type: 'error',
          message: res.message || 'Failed to update cleaner status.'
        });
      }
    } catch (err) {
      console.error('Failed to update provider status:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update cleaner status.'
      });
    }
  };

  const handleApprove = (id) => handleUpdateStatus(id, 'Active');
  const handleReject = (id) => handleUpdateStatus(id, 'Rejected');
  const handleSuspend = (id) => handleUpdateStatus(id, 'Suspended');
  const handleRestore = (id) => handleUpdateStatus(id, 'Active');

  // Trigger Confirmation Modal for Deletion
  const handleDeleteCleaner = (cleaner) => {
    setDeleteModalCleaner(cleaner);
  };

  // Execute Deletion from Confirmation Modal
  const handleConfirmDelete = async () => {
    if (!deleteModalCleaner) return;

    try {
      setIsDeleting(true);
      const res = await providerApi.deleteProvider(deleteModalCleaner.id);
      if (res.success) {
        setToast({
          type: 'success',
          message: res.message || `Cleaner "${deleteModalCleaner.name}" permanently deleted.`
        });
        setDeleteModalCleaner(null);
        await Promise.all([fetchProviders(), fetchStats()]);
      } else {
        setToast({
          type: 'error',
          message: res.message || 'Failed to delete cleaner.'
        });
      }
    } catch (err) {
      console.error('Error deleting cleaner:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.message || 'Error deleting cleaner account.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Submit Handler for Add New Cleaner or Edit Cleaner
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!newBusinessName || !newLocation) return;

    try {
      setFormSubmitting(true);
      if (editingProvider) {
        const res = await providerApi.updateProvider(editingProvider.id, {
          name: newBusinessName,
          owner: newOwner,
          location: newLocation,
          phone: newPhone
        });
        if (res.success) {
          setToast({
            type: 'success',
            message: 'Cleaner updated successfully.'
          });
          await Promise.all([fetchProviders(), fetchStats()]);
        }
      } else {
        const res = await providerApi.createProvider({
          name: newBusinessName,
          owner: newOwner,
          location: newLocation,
          email: newEmail || undefined,
          phone: newPhone || undefined,
          temporaryPassword: newTemporaryPassword || 'Password@123',
          status: 'Pending'
        });
        if (res.success) {
          setToast({
            type: 'success',
            message: 'Cleaner registered successfully. Pending approval.'
          });
          await Promise.all([fetchProviders(), fetchStats()]);
        }
      }
    } catch (err) {
      console.error('Error saving provider in MongoDB:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.message || 'Error processing cleaner registration.'
      });
    } finally {
      setFormSubmitting(false);
    }

    setNewBusinessName('');
    setNewLocation('');
    setNewOwner('');
    setNewEmail('');
    setNewPhone('');
    setNewTemporaryPassword('');
    setIsAddModalOpen(false);
    setEditingProvider(null);
  };

  const handleEditClick = (cleaner) => {
    setEditingProvider(cleaner);
    setNewBusinessName(cleaner.name || '');
    setNewOwner(cleaner.owner || '');
    setNewLocation(cleaner.location || '');
    setNewEmail(cleaner.email || '');
    setNewPhone(cleaner.phone || '');
    setIsAddModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-stack-gap-lg font-body-md text-on-surface">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`p-4 rounded-2xl shadow-md border flex items-center justify-between transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-[#e6f4ea] border-[#ceead6] text-[#1e8e3e]'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <div className="flex items-center gap-3 font-medium text-sm">
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {toast.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-inherit hover:opacity-70 p-1 rounded-lg cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline-lg text-on-surface m-0">Cleaners Management</h1>
          <p className="font-body-md text-on-surface-variant m-0 mt-1">
            Oversee laundry service providers, approve pending partners, and manage platform listings.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingProvider(null);
            setNewBusinessName('');
            setNewLocation('');
            setNewOwner('');
            setNewEmail('');
            setNewPhone('');
            setNewTemporaryPassword('');
            setIsAddModalOpen(true);
          }}
          className="bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-label-md px-5 py-2.5 rounded-[8px] flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">add</span> Add New Cleaner
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-gap-md">
        {/* Total cleaners */}
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-surface-container/40 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <span className="font-label-md text-on-surface-variant font-semibold">Total Cleaners</span>
            <div className="p-2 rounded-lg bg-surface-container text-primary">
              <span className="material-symbols-outlined">dry_cleaning</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="font-display-md text-on-surface font-bold text-3xl">{stats.total}</div>
            <div className="flex items-center gap-1 font-body-sm text-secondary mt-1 text-[13px]">
              <span className="material-symbols-outlined text-[16px]">groups</span> Registered providers
            </div>
          </div>
        </div>

        {/* Active Cleaners */}
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-surface-container/40 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <span className="font-label-md text-on-surface-variant font-semibold">Active Cleaners</span>
            <div className="p-2 rounded-lg bg-[#e6f4ea] text-[#1e8e3e]">
              <span className="material-symbols-outlined">verified</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="font-display-md text-on-surface font-bold text-3xl">{stats.active}</div>
            <div className="flex items-center gap-1 font-body-sm text-[#1e8e3e] mt-1 text-[13px]">
              <span className="material-symbols-outlined text-[16px]">check_circle</span> Live on homepage
            </div>
          </div>
        </div>

        {/* Pending Cleaners */}
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-surface-container/40 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <span className="font-label-md text-on-surface-variant font-semibold">Pending Approval</span>
            <div className="p-2 rounded-lg bg-[#fff8e1] text-[#f57f17]">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="font-display-md text-on-surface font-bold text-3xl">{stats.pending}</div>
            <div className="flex items-center gap-1 font-body-sm text-[#f57f17] mt-1 text-[13px]">
              <span className="material-symbols-outlined text-[16px]">hourglass_top</span> Needs review
            </div>
          </div>
        </div>

        {/* Suspended Cleaners */}
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-surface-container/40 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <span className="font-label-md text-on-surface-variant font-semibold">Suspended</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <span className="material-symbols-outlined">block</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="font-display-md text-on-surface font-bold text-3xl">{stats.suspended}</div>
            <div className="flex items-center gap-1 font-body-sm text-rose-600 mt-1 text-[13px]">
              <span className="material-symbols-outlined text-[16px]">gavel</span> Paused listings
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container/40 flex flex-col overflow-hidden relative min-h-[350px]">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-surface-container-lowest/70 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="flex items-center gap-3 font-body-md text-primary">
              <span className="material-symbols-outlined animate-spin text-[28px]">sync</span>
              Loading cleaners from MongoDB...
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="p-stack-gap-md border-b border-surface-variant flex flex-col lg:flex-row gap-4 justify-between items-center bg-surface-container-low/50">
          <div className="relative w-full lg:w-96 group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
              search
            </span>
            <input
              className="w-full bg-surface-container-lowest py-2.5 pl-10 pr-4 rounded-[8px] font-body-sm text-on-surface outline-none shadow-xs focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50"
              placeholder="Search by business name or location..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            <button
              onClick={() => handleFilterTabChange('All')}
              className={`font-label-sm px-4 py-2 rounded-full whitespace-nowrap transition-colors cursor-pointer ${activeFilterTab === 'All'
                ? 'bg-primary/10 text-primary font-semibold'
                : 'bg-transparent text-on-surface-variant hover:bg-surface-container border border-outline-variant'
                }`}
            >
              All cleaners ({stats.total})
            </button>
            <button
              onClick={() => handleFilterTabChange('Active')}
              className={`font-label-sm px-4 py-2 rounded-full whitespace-nowrap transition-colors cursor-pointer ${activeFilterTab === 'Active'
                ? 'bg-primary/10 text-primary font-semibold'
                : 'bg-transparent text-on-surface-variant hover:bg-surface-container border border-outline-variant'
                }`}
            >
              Active ({stats.active})
            </button>
            <button
              onClick={() => handleFilterTabChange('Pending')}
              className={`font-label-sm px-4 py-2 rounded-full whitespace-nowrap transition-colors cursor-pointer ${activeFilterTab === 'Pending'
                ? 'bg-amber-100 text-amber-900 font-semibold'
                : 'bg-transparent text-on-surface-variant hover:bg-surface-container border border-outline-variant'
                }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => handleFilterTabChange('Suspended')}
              className={`font-label-sm px-4 py-2 rounded-full whitespace-nowrap transition-colors cursor-pointer ${activeFilterTab === 'Suspended'
                ? 'bg-rose-100 text-rose-900 font-semibold'
                : 'bg-transparent text-on-surface-variant hover:bg-surface-container border border-outline-variant'
                }`}
            >
              Suspended ({stats.suspended})
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchProviders} className="underline font-semibold cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {/* Table Container */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-surface-container-lowest">
              <tr>
                <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold w-1/4">
                  Business Name
                </th>
                <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold w-1/5">
                  Location
                </th>
                <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold w-1/6">
                  Status
                </th>
                <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-right w-1/6">
                  Total Orders
                </th>
                <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-right w-1/4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant bg-surface-container-lowest">
              {cleanerss.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-on-surface-variant font-body-md">
                    No cleaner records found matching criteria.
                  </td>
                </tr>
              ) : (
                cleanerss.map((p) => {
                  if (p.status === 'Pending') {
                    return (
                      <tr key={p.id} className="hover:bg-surface-container-low transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0 text-on-surface-variant">
                              <span className="material-symbols-outlined">local_laundry_service</span>
                            </div>
                            <div>
                              <div className="font-label-md text-on-surface font-semibold">{p.name}</div>
                              <div className="font-body-sm text-on-surface-variant mt-0.5">Owner: {p.owner}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-body-sm text-on-surface">{p.location}</div>
                          <div className="font-body-sm text-on-surface-variant text-[12px] mt-0.5">{p.subLocation}</div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fff8e1] text-[#f57f17]">
                            Pending
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-label-md text-on-surface-variant">--</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2 items-center">
                            <button
                              onClick={() => handleApprove(p.id)}
                              className="px-3 py-1.5 rounded-lg bg-[#e6f4ea] text-[#1e8e3e] hover:bg-[#ceead6] font-label-sm transition-colors flex items-center gap-1 cursor-pointer font-semibold"
                            >
                              <span className="material-symbols-outlined text-[16px]">check</span> Approve
                            </button>
                            <button
                              onClick={() => handleReject(p.id)}
                              className="px-3 py-1.5 rounded-lg bg-error-container text-on-error-container hover:bg-error/20 font-label-sm transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span> Reject
                            </button>
                            <button
                              onClick={() => handleDeleteCleaner(p)}
                              className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer"
                              title="Delete Cleaner Permanently"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  if (p.status === 'Suspended') {
                    return (
                      <tr key={p.id} className="hover:bg-surface-container-low transition-colors group bg-surface-container-lowest/50 opacity-80">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0 text-on-surface-variant grayscale">
                              <span className="material-symbols-outlined">iron</span>
                            </div>
                            <div>
                              <div className="font-label-md text-on-surface font-semibold">{p.name}</div>
                              <div className="font-body-sm text-error mt-0.5 flex items-center gap-1 text-[12px]">
                                <span className="material-symbols-outlined text-[14px]">warning</span> Suspended account
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-body-sm text-on-surface">{p.location}</div>
                          <div className="font-body-sm text-on-surface-variant text-[12px] mt-0.5">{p.subLocation}</div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-error-container text-on-error-container">
                            Suspended
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-label-md text-on-surface">{p.totalOrders}</div>
                          <div className="font-body-sm text-on-surface-variant text-[12px] mt-0.5">Historical</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2 items-center">
                            <button
                              onClick={() => handleRestore(p.id)}
                              className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-variant font-label-sm transition-colors flex items-center gap-1 cursor-pointer font-semibold"
                            >
                              <span className="material-symbols-outlined text-[16px]">restore</span> Restore
                            </button>
                            <button
                              onClick={() => handleDeleteCleaner(p)}
                              className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer"
                              title="Delete Cleaner Permanently"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // Default: Active row
                  return (
                    <tr key={p.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center overflow-hidden flex-shrink-0">
                            {p.image ? (
                              <img className="w-full h-full object-cover" alt={p.name} src={p.image} />
                            ) : (
                              <span className="material-symbols-outlined text-primary">storefront</span>
                            )}
                          </div>
                          <div>
                            <div className="font-label-md text-on-surface font-semibold">{p.name}</div>
                            <div className="font-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                              {p.rating && (
                                <>
                                  <span className="material-symbols-outlined text-[14px] text-amber-500">star</span>
                                  <span>{p.rating} ({p.reviewsCount} reviews)</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-body-sm text-on-surface">{p.location}</div>
                        <div className="font-body-sm text-on-surface-variant text-[12px] mt-0.5">{p.subLocation}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e6f4ea] text-[#1e8e3e]">
                          Active
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-label-md text-on-surface">{p.totalOrders}</div>
                        <div className="font-body-sm text-secondary text-[12px] mt-0.5">{p.ordersTrend}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity items-center">
                          <button
                            onClick={() => handleSuspend(p.id)}
                            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-error transition-colors cursor-pointer"
                            title="Suspend Cleaner"
                          >
                            <span className="material-symbols-outlined text-[18px]">block</span>
                          </button>
                          <button
                            onClick={() => handleOpenResetModal(p)}
                            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-amber-600 transition-colors cursor-pointer"
                            title="Reset Password"
                          >
                            <span className="material-symbols-outlined text-[18px]">key</span>
                          </button>
                          <button
                            onClick={() => handleEditClick(p)}
                            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-primary transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCleaner(p)}
                            className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Delete Cleaner Permanently"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination */}
        <div className="p-stack-gap-md border-t border-surface-variant flex items-center justify-between bg-surface-container-lowest">
          <div className="font-body-sm text-on-surface-variant">
            Showing <span className="font-semibold text-on-surface">{cleanerss.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> to{' '}
            <span className="font-semibold text-on-surface">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-semibold text-on-surface">{pagination.total.toLocaleString()}</span> cleaners
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={!pagination.hasPreviousPage || loading}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-label-sm transition-colors cursor-pointer ${page === pageNum
                      ? 'bg-primary text-on-primary font-bold'
                      : 'text-on-surface hover:bg-surface-container'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(prev => Math.min(prev + 1, pagination.totalPages))}
              disabled={!pagination.hasNextPage || loading}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Cleaner Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl max-w-md w-full p-6 border border-surface-container/60 space-y-4">
            <div className="flex justify-between items-center border-b border-surface-container/40 pb-3">
              <h3 className="font-headline-md text-on-surface">
                {editingProvider ? 'Edit Cleaner Details' : 'Add New Laundry Cleaner'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wash & Go Kilimani"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm text-on-surface outline-none border border-transparent focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Owner / Contact Person</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm text-on-surface outline-none border border-transparent focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Location / Area</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Westlands, Nairobi"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm text-on-surface outline-none border border-transparent focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. cleaner@laundry.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm text-on-surface outline-none border border-transparent focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. +254700000000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm text-on-surface outline-none border border-transparent focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Temporary One-Time Password</label>
                <input
                  type="text"
                  required={!editingProvider}
                  placeholder="e.g. Password@1234 (Default if left empty)"
                  value={newTemporaryPassword}
                  onChange={(e) => setNewTemporaryPassword(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm text-on-surface outline-none border border-transparent focus:border-primary font-mono text-xs"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-lg font-label-md bg-primary text-on-primary hover:bg-primary-container shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : editingProvider ? 'Save Changes' : 'Register Cleaner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Reset Password Modal */}
      {resetModalProvider && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl max-w-md w-full p-6 border border-surface-container/60 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-surface-container/40 pb-3">
              <h3 className="font-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600">key</span>
                Reset Cleaner Password
              </h3>
              <button
                onClick={() => setResetModalProvider(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="font-body-sm text-on-surface-variant">
              Reset temporary password for <span className="font-semibold text-on-surface">{resetModalProvider.name}</span> ({resetModalProvider.email}). The cleaner will be required to create a new password on their next login.
            </p>
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block font-label-sm text-on-surface mb-1">New Temporary Password</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Password@9876"
                  value={resetTempPassword}
                  onChange={(e) => setResetTempPassword(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm text-on-surface outline-none border border-transparent focus:border-primary font-mono text-xs"
                />
              </div>
              <div className="bg-surface-container-low p-3 rounded-xl space-y-1">
                <p className="font-label-sm text-on-surface font-semibold">Password Policy:</p>
                <ul className="text-[11px] text-on-surface-variant space-y-0.5 list-disc pl-4">
                  <li>Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char</li>
                </ul>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalProvider(null)}
                  className="px-4 py-2 rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="px-5 py-2 rounded-lg font-label-md bg-amber-600 text-white hover:bg-amber-700 shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  {resetSubmitting ? 'Resetting...' : 'Reset & Force Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable System Confirmation Modal for Cleaner Deletion */}
      <ConfirmationModal
        isOpen={!!deleteModalCleaner}
        onClose={() => !isDeleting && setDeleteModalCleaner(null)}
        onConfirm={handleConfirmDelete}
        title="Permanent Deletion"
        subtitle="Irreversible Cleaner Account Deletion"
        itemName={deleteModalCleaner?.name}
        warningMessage="This will remove the cleaner account and all associated services, orders, promotions, and listings from the platform."
        auditNote="Audit logs and system activity records will be preserved."
        confirmText="Delete Permanently"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
        icon="delete_forever"
      />
    </div>
  );
}

