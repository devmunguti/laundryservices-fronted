import React, { useState, useEffect, useCallback } from 'react';
import { promotionApi } from '../api/promotionApi';

export default function AdminPromotionsManagement({ isStandalone = true }) {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [metrics, setMetrics] = useState({
    pendingCount: 0,
    approvedCount: 0,
    totalRevenue: 0
  });

  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  // Settings Configuration Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    channelType: 'paybill',
    paybillNumber: '522522',
    accountNumber: 'AURA-PROMO',
    tillNumber: '8995354',
    phoneNumber: '0712345678',
    recipientName: 'Laundry Admin',
    businessName: 'Laundry Platform',
    instructions: 'Pay the promotion fee using the M-Pesa details above, then submit your M-Pesa transaction code for Admin verification.',
    packages: [
      { id: '7_Days', name: '7 Days Featured Placement', days: 7, price: 1000, description: 'Top ranking and Featured Promoted badge for 1 week' },
      { id: '14_Days', name: '14 Days Growth Boost', days: 14, price: 1800, description: 'Top ranking and Featured Promoted badge for 2 weeks' },
      { id: '30_Days', name: '30 Days Premium Dominance', days: 30, price: 3500, description: 'Priority placement across platform for a full month' }
    ]
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Action Loading State
  const [processingId, setProcessingId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  const fetchPromotionsAndSettings = useCallback(async () => {
    try {
      setLoading(true);
      const [promosRes, settingsRes] = await Promise.all([
        promotionApi.getAdminPromotions({
          status: statusFilter !== 'All' ? statusFilter : undefined,
          search: searchQuery
        }),
        promotionApi.getPromotionSettings().catch(() => ({ success: false }))
      ]);

      if (promosRes.success && promosRes.data) {
        setRequests(promosRes.data.requests || []);
        if (promosRes.data.metrics) {
          setMetrics(promosRes.data.metrics);
        }
      }

      if (settingsRes.success && settingsRes.data) {
        setSettingsForm({
          channelType: settingsRes.data.channelType || 'paybill',
          paybillNumber: settingsRes.data.paybillNumber || '522522',
          accountNumber: settingsRes.data.accountNumber || 'AURA-PROMO',
          tillNumber: settingsRes.data.tillNumber || '8995354',
          phoneNumber: settingsRes.data.phoneNumber || '0712345678',
          recipientName: settingsRes.data.recipientName || 'Laundry Admin',
          businessName: settingsRes.data.businessName || 'Laundry Platform',
          instructions: settingsRes.data.instructions || '',
          packages: settingsRes.data.packages?.length > 0 ? settingsRes.data.packages : [
            { id: '7_Days', name: '7 Days Featured Placement', days: 7, price: 1000, description: 'Top ranking and Featured Promoted badge for 1 week' },
            { id: '14_Days', name: '14 Days Growth Boost', days: 14, price: 1800, description: 'Top ranking and Featured Promoted badge for 2 weeks' },
            { id: '30_Days', name: '30 Days Premium Dominance', days: 30, price: 3500, description: 'Priority placement across platform for a full month' }
          ]
        });
      }
    } catch (err) {
      console.error('Failed to load admin promotions:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  const handlePackageChange = (index, field, value) => {
    const updated = [...(settingsForm.packages || [])];
    updated[index] = {
      ...updated[index],
      [field]: field === 'price' || field === 'days' ? Number(value) : value
    };
    setSettingsForm({ ...settingsForm, packages: updated });
  };

  useEffect(() => {
    fetchPromotionsAndSettings();
  }, [fetchPromotionsAndSettings]);

  const handleCopy = (code, id) => {
    if (navigator.clipboard && code) {
      navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const handleApprove = async (id, providerName) => {
    if (!window.confirm(`Are you sure you want to approve the M-Pesa payment and activate the promotion spot for ${providerName}?`)) {
      return;
    }

    try {
      setProcessingId(id);
      const res = await promotionApi.approvePromotion(id);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: `Promotion for ${providerName} approved & activated!` });
        await fetchPromotionsAndSettings();
      } else {
        setFeedbackMsg({ type: 'error', text: res.message || 'Failed to approve promotion.' });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.response?.data?.message || 'Error approving promotion.' });
    } finally {
      setProcessingId(null);
      setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 4000);
    }
  };

  const handleReject = async (id, providerName) => {
    const reason = window.prompt(`Enter reason for rejecting ${providerName}'s promotion claim:`, 'M-Pesa transaction code could not be verified.');
    if (reason === null) return;

    try {
      setProcessingId(id);
      const res = await promotionApi.rejectPromotion(id, { reason });
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: `Promotion claim for ${providerName} marked as rejected.` });
        await fetchPromotionsAndSettings();
      } else {
        setFeedbackMsg({ type: 'error', text: res.message || 'Failed to reject promotion.' });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.response?.data?.message || 'Error rejecting promotion.' });
    } finally {
      setProcessingId(null);
      setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 4000);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await promotionApi.updatePromotionSettings(settingsForm);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: 'Promotion Paybill and receiving settings updated successfully!' });
        setIsSettingsOpen(false);
        await fetchPromotionsAndSettings();
      } else {
        alert(res.message || 'Failed to update promotion settings.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating settings.');
    } finally {
      setSavingSettings(false);
      setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Geist'] text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Promotions &amp; Featured Cleaners
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review manual M-Pesa promotion payments, approve homepage featured spots, and configure Paybill details.
          </p>
        </div>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          <span>Configure Packages &amp; Paybill</span>
        </button>
      </div>

      {/* Alert Feedback Banner */}
      {feedbackMsg.text && (
        <div
          className={`p-4 rounded-2xl text-sm font-medium flex items-center gap-2 ${feedbackMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {feedbackMsg.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {/* Pending Approvals */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Approvals</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-['Geist'] text-amber-600">
                {metrics.pendingCount}
              </span>
              {metrics.pendingCount > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 animate-pulse">
                  Requires Action
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Claims waiting for M-Pesa check</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">hourglass_top</span>
          </div>
        </div>

        {/* Active Featured Cleaners */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Featured</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-['Geist'] text-emerald-600">
                {metrics.approvedCount}
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Live on Homepage
              </span>
            </div>
            <p className="text-xs text-slate-400">Currently boosted providers</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">verified</span>
          </div>
        </div>

        {/* Total Promotion Revenue */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Promotion Revenue</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-black font-['Geist'] text-blue-600">
                KES {metrics.totalRevenue?.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-slate-400">Total collected from featured spots</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">savings</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto">
            {['All', 'Pending', 'Approved', 'Rejected'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${statusFilter === tab
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {tab === 'All' ? 'All Requests' : tab}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px]">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search by cleaner or M-Pesa code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 py-2.5 pl-10 pr-4 rounded-xl text-sm border border-slate-200 outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Requests Table */}
        {loading ? (
          <div className="py-12 text-center text-blue-600 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined animate-spin text-[24px]">sync</span>
            <span>Loading promotion requests...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No promotion requests found matching your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="py-3.5 px-4">Provider / Cleaner</th>
                  <th className="py-3.5 px-4">Package</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">M-Pesa Receipt Code</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Submitted</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => {
                  const isPending = req.status === 'Pending';
                  const isApproved = req.status === 'Approved';

                  return (
                    <tr key={req._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">{req.providerName}</div>
                        <div className="text-xs text-slate-500 line-clamp-1 italic">
                          "{req.tagline}"
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-800">{req.packageName}</span>
                        <span className="block text-xs text-slate-400">{req.durationDays} Days</span>
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-slate-900">
                        KES {req.amount?.toLocaleString()}
                      </td>

                      <td className="py-4 px-4">
                        <div className="inline-flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 text-blue-800 font-mono font-bold text-xs">
                          <span>{req.mpesaTransactionCode}</span>
                          <button
                            onClick={() => handleCopy(req.mpesaTransactionCode, req._id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Copy M-Pesa Code"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {copiedCode === req._id ? 'check' : 'content_copy'}
                            </span>
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${req.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : req.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                            }`}
                        >
                          {req.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-xs text-slate-500">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(req._id, req.providerName)}
                              disabled={processingId === req._id}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[15px]">check</span>
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleReject(req._id, req.providerName)}
                              disabled={processingId === req._id}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : isApproved ? (
                          <span className="text-xs font-medium text-emerald-700">
                            Valid until {new Date(req.expiresAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Rejected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Configure Promotion Settings & Package Pricing Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">tune</span>
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-900 font-['Geist']">
                  Configure Promotion Packages &amp; Paybill
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set promotion tier pricing and your receiving M-Pesa Till / Paybill / Phone details.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* STEP 1: Package Pricing Configuration */}
              <div className="space-y-3 bg-blue-50/40 p-4 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-2 text-blue-900">
                  <span className="material-symbols-outlined text-[20px]">loyalty</span>
                  <h4 className="font-bold text-sm">Step 1: Set Promotion Package Costs &amp; Durations</h4>
                </div>
                <p className="text-xs text-slate-600">
                  Providers choose from these packages when purchasing homepage placement.
                </p>

                <div className="space-y-3 pt-1">
                  {settingsForm.packages?.map((pkg, idx) => (
                    <div key={pkg.id || idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                          Tier {idx + 1}: {pkg.days} Days Boost
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-6">
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                            Package Name
                          </label>
                          <input
                            type="text"
                            required
                            value={pkg.name}
                            onChange={(e) => handlePackageChange(idx, 'name', e.target.value)}
                            className="w-full bg-slate-50 py-2 px-3 rounded-lg text-xs font-medium text-slate-900 border border-slate-200 outline-none focus:border-blue-600 focus:bg-white"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                            Duration (Days)
                          </label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={pkg.days}
                            onChange={(e) => handlePackageChange(idx, 'days', e.target.value)}
                            className="w-full bg-slate-50 py-2 px-3 rounded-lg text-xs font-mono font-bold text-slate-900 border border-slate-200 outline-none focus:border-blue-600 focus:bg-white"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                            Price (KES)
                          </label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={pkg.price}
                            onChange={(e) => handlePackageChange(idx, 'price', e.target.value)}
                            className="w-full bg-slate-50 py-2 px-3 rounded-lg text-xs font-mono font-bold text-blue-600 border border-slate-200 outline-none focus:border-blue-600 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Short benefit summary (e.g. Top ranking and Featured badge)"
                          value={pkg.description || ''}
                          onChange={(e) => handlePackageChange(idx, 'description', e.target.value)}
                          className="w-full bg-slate-50 py-1.5 px-3 rounded-lg text-[11px] text-slate-600 border border-slate-200 outline-none focus:border-blue-600 focus:bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* STEP 2: Payment Channel Configuration */}
              <div className="space-y-4 pt-1">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-emerald-600 text-[20px]">account_balance_wallet</span>
                    <h4 className="font-bold text-sm text-slate-900">Step 2: Choose Receiving Payment Channel</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'paybill', label: 'Paybill', icon: 'account_balance' },
                      { id: 'till', label: 'Buy Goods Till', icon: 'storefront' },
                      { id: 'phone', label: 'Phone / Send Money', icon: 'phone_iphone' }
                    ].map((ch) => {
                      const isSelected = settingsForm.channelType === ch.id;
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setSettingsForm({ ...settingsForm, channelType: ch.id })}
                          className={`p-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${isSelected
                            ? 'border-blue-600 bg-blue-50/60 text-blue-700 font-bold shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                            }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">{ch.icon}</span>
                          <span className="text-xs">{ch.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic Input Fields depending on channelType */}
                {settingsForm.channelType === 'paybill' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                        Paybill Number
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 522522"
                        value={settingsForm.paybillNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, paybillNumber: e.target.value })}
                        className="w-full bg-slate-50 py-2.5 px-3.5 rounded-xl text-sm font-mono font-bold text-slate-900 border border-slate-200 outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                        Account Reference
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. AURA-PROMO"
                        value={settingsForm.accountNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, accountNumber: e.target.value })}
                        className="w-full bg-slate-50 py-2.5 px-3.5 rounded-xl text-sm font-mono font-bold text-slate-900 border border-slate-200 outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>
                )}

                {settingsForm.channelType === 'till' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                        Buy Goods Till Number
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 8995354"
                        value={settingsForm.tillNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, tillNumber: e.target.value })}
                        className="w-full bg-slate-50 py-2.5 px-3.5 rounded-xl text-sm font-mono font-bold text-slate-900 border border-slate-200 outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                        Store / Merchant Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Laundry Hub"
                        value={settingsForm.businessName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, businessName: e.target.value })}
                        className="w-full bg-slate-50 py-2.5 px-3.5 rounded-xl text-sm text-slate-900 border border-slate-200 outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>
                )}

                {settingsForm.channelType === 'phone' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                        M-Pesa Phone Number
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 0712345678"
                        value={settingsForm.phoneNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, phoneNumber: e.target.value })}
                        className="w-full bg-slate-50 py-2.5 px-3.5 rounded-xl text-sm font-mono font-bold text-slate-900 border border-slate-200 outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                        Recipient / Account Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Augustine Munguti"
                        value={settingsForm.recipientName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, recipientName: e.target.value })}
                        className="w-full bg-slate-50 py-2.5 px-3.5 rounded-xl text-sm text-slate-900 border border-slate-200 outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>
                )}

                {settingsForm.channelType === 'paybill' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Business / Display Name
                    </label>
                    <input
                      type="text"
                      value={settingsForm.businessName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, businessName: e.target.value })}
                      className="w-full bg-slate-50 py-2.5 px-3.5 rounded-xl text-sm text-slate-900 border border-slate-200 outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Provider Instructions Note
                  </label>
                  <textarea
                    rows="2"
                    value={settingsForm.instructions}
                    onChange={(e) => setSettingsForm({ ...settingsForm, instructions: e.target.value })}
                    className="w-full bg-slate-50 py-2.5 px-3.5 rounded-xl text-sm text-slate-900 border border-slate-200 outline-none focus:border-blue-600 focus:bg-white"
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="flex-[2] py-3 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {savingSettings ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      <span>Save Package Costs &amp; Paybill Settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
