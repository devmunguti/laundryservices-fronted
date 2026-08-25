import React, { useState, useEffect, useCallback } from 'react';
import { paymentApi } from '../api/paymentApi';
import { useSettings } from '../context/SettingsContext';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ui/ConfirmationModal';

export default function AdminPaymentRecords() {
  const { settings } = useSettings();
  const [filter, setFilter] = useState('All');

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isProcessingPayouts, setIsProcessingPayouts] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Modal State for viewing details
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Invoice Dispatch State & Modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceTargetRecord, setInvoiceTargetRecord] = useState(null);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [invoiceAlertMsg, setInvoiceAlertMsg] = useState(null);
  const [bulkSendingInvoices, setBulkSendingInvoices] = useState(false);
  const [isBulkInvoiceModalOpen, setIsBulkInvoiceModalOpen] = useState(false);

  // Pagination state
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

  // Financial Metrics State
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalCommissions: 0,
    pendingCommissionPayouts: 0,
    pendingCount: 0
  });

  // Table Data & Loading/Error States
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page when filter changes
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  // Fetch Financial Metrics from MongoDB API
  const fetchMetrics = async () => {
    try {
      const res = await paymentApi.getPaymentMetrics();
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch payment metrics:', err);
    }
  };

  // Fetch Payment Ledger from MongoDB API
  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit,
        search: debouncedSearch,
        payoutStatus: filter !== 'All' ? filter : undefined
      };

      const res = await paymentApi.getPaymentRecords(params);
      if (res.success && res.data) {
        setRecords(res.data.payments || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      } else {
        setError(res.message || 'Failed to load payment records.');
      }
    } catch (err) {
      console.error('Error fetching payment records:', err);
      setError(err.response?.data?.message || err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, filter]);

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Send Single Payout Invoice
  const handleSendInvoice = async (record) => {
    try {
      setSendingInvoice(true);
      const res = await paymentApi.sendPayoutInvoice(record._id);
      if (res.success) {
        setInvoiceAlertMsg({ type: 'success', text: `Payout invoice ${res.data?.invoiceReference || ''} dispatched successfully to ${record.cleaners}!` });
        setShowInvoiceModal(false);
        await fetchRecords();
        setTimeout(() => setInvoiceAlertMsg(null), 4000);
      } else {
        setInvoiceAlertMsg({ type: 'error', text: res.message || 'Failed to send invoice.' });
      }
    } catch (err) {
      setInvoiceAlertMsg({ type: 'error', text: err.response?.data?.message || 'Error sending invoice.' });
    } finally {
      setSendingInvoice(false);
    }
  };

  // Send Bulk Payout Invoices
  const handleBulkSendInvoices = async () => {
    try {
      setBulkSendingInvoices(true);
      const res = await paymentApi.sendBulkPayoutInvoices();
      if (res.success) {
        toast.success(res.message || `Dispatched ${res.data?.sentCount || 0} payout invoices successfully!`);
        setInvoiceAlertMsg({ type: 'success', text: res.message || `Dispatched ${res.data?.sentCount || 0} payout invoices successfully!` });
        setIsBulkInvoiceModalOpen(false);
        await fetchRecords();
        setTimeout(() => setInvoiceAlertMsg(null), 4000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send bulk invoices.');
      setInvoiceAlertMsg({ type: 'error', text: err.response?.data?.message || 'Failed to send bulk invoices.' });
    } finally {
      setBulkSendingInvoices(false);
    }
  };

  // Bulk Process Payouts Handler
  const handleProcessPayouts = async () => {
    try {
      setIsProcessingPayouts(true);
      const res = await paymentApi.processBulkPayouts();

      if (res.success) {
        toast.success('Bulk payouts processed successfully!');
        setPayoutSuccess(true);
        await Promise.all([fetchRecords(), fetchMetrics()]);
        setTimeout(() => {
          setPayoutSuccess(false);
        }, 2500);
      } else {
        toast.error(res.message || 'Failed to process bulk payouts.');
      }
    } catch (err) {
      console.error('Error processing bulk payouts:', err);
      toast.error(err.response?.data?.message || 'Error processing payouts.');
    } finally {
      setIsProcessingPayouts(false);
    }
  };

  // Settle Individual Payout Handler
  const handleSettlePayout = async (recordId, orderId) => {
    try {
      const res = await paymentApi.settlePayout(recordId);
      if (res.success) {
        toast.success(`Payout for order ${orderId} settled successfully!`);
        setActiveMenuId(null);
        await Promise.all([fetchRecords(), fetchMetrics()]);
      } else {
        toast.error(res.message || `Failed to settle payout for ${orderId}`);
      }
    } catch (err) {
      console.error('Error settling payout:', err);
      toast.error(err.response?.data?.message || 'Failed to settle payout.');
    }
  };

  // CSV Export Handler
  const handleExportCSV = async () => {
    try {
      const params = {
        search: debouncedSearch,
        payoutStatus: filter !== 'All' ? filter : undefined
      };

      const blobData = await paymentApi.exportPaymentRecords(params);
      const blob = new Blob([blobData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Aura_Laundry_Payment_Records.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Payment records CSV downloaded successfully!');
    } catch (err) {
      console.error('Export CSV failed:', err);
      toast.error('Failed to export CSV report.');
    }
  };

  // Helper for formatting date strings
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }) + `, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  };

  // Helper for formatting KES currency
  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  return (
    <div className="flex flex-col w-full gap-stack-gap-lg">
      {/* Header Section with Key Metrics */}
      <div className="flex flex-col gap-stack-gap-md lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-headline-xl text-on-surface mb-2">Financial Overview</h1>
          <p className="font-body-lg text-on-surface-variant">
            Track payments, monitor commissions, and manage cleaners payouts.
          </p>
        </div>
        <div className="flex items-center gap-stack-gap-sm flex-wrap">
          <button
            onClick={handleExportCSV}
            className="bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md py-2 px-4 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Export Report
          </button>

          <button
            onClick={() => setIsBulkInvoiceModalOpen(true)}
            disabled={bulkSendingInvoices}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-label-md py-2 px-4 rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Dispatch payout settlement receipts to all settled providers"
          >
            <span className="material-symbols-outlined text-[20px]">{bulkSendingInvoices ? 'sync' : 'receipt_long'}</span>
            <span>{bulkSendingInvoices ? 'Sending Invoices...' : 'Send Bulk Invoices'}</span>
          </button>

          <button
            onClick={handleProcessPayouts}
            disabled={isProcessingPayouts}
            className={`font-label-md py-2 px-4 rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer ${payoutSuccess
                ? 'bg-secondary-container text-on-secondary-container'
                : isProcessingPayouts
                  ? 'bg-primary/80 text-on-primary cursor-not-allowed'
                  : 'bg-primary hover:bg-on-primary-fixed-variant text-on-primary'
              }`}
          >
            {isProcessingPayouts ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                Processing...
              </>
            ) : payoutSuccess ? (
              <>
                <span className="material-symbols-outlined text-[20px]">check</span>
                Success
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                Process Payouts
              </>
            )}
          </button>
        </div>
      </div>

      {/* Invoice Alert Banner */}
      {invoiceAlertMsg && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
          invoiceAlertMsg.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-900 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              {invoiceAlertMsg.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{invoiceAlertMsg.text}</span>
          </div>
          <button onClick={() => setInvoiceAlertMsg(null)} className="text-slate-500 hover:text-slate-900">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-gap-md">
        {/* Total Revenue */}
        <div className="bg-surface-container-low rounded-xl p-6 relative overflow-hidden group border border-surface-container/40">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[24px]">payments</span>
              </div>
              <span className="font-label-md text-on-surface-variant uppercase tracking-wider">Total Revenue</span>
            </div>
            <span className="bg-primary/10 text-primary font-label-sm py-1 px-2 rounded-full">Live MongoDB</span>
          </div>
          <div className="relative z-10">
            <div className="font-headline-xl text-on-surface mb-1">KES {formatCurrency(metrics.totalRevenue)}</div>
            <p className="font-body-sm text-on-surface-variant">Gross volume processed on platform</p>
          </div>
        </div>

        {/* Commissions Earned */}
        <div className="bg-surface-container-low rounded-xl p-6 relative overflow-hidden group border border-surface-container/40">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors pointer-events-none" />
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-[24px]">trending_up</span>
              </div>
              <span className="font-label-md text-on-surface-variant uppercase tracking-wider">Commissions</span>
            </div>
            <span className="bg-secondary/10 text-secondary font-label-sm py-1 px-2 rounded-full">Platform Net</span>
          </div>
          <div className="relative z-10">
            <div className="font-headline-xl text-on-surface mb-1">KES {formatCurrency(metrics.totalCommissions)}</div>
            <p className="font-body-sm text-on-surface-variant">Total platform earnings</p>
          </div>
        </div>

        {/* Pending Payouts */}
        <div className="bg-surface-container-low rounded-xl p-6 relative overflow-hidden group border border-error-container/30">
          <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-error/5 rounded-full blur-2xl group-hover:bg-error/10 transition-colors pointer-events-none" />
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-error-container/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-error text-[24px]">hourglass_empty</span>
              </div>
              <span className="font-label-md text-on-surface-variant uppercase tracking-wider">
                Pending Commission Payouts
              </span>
            </div>
          </div>
          <div className="relative z-10">
            <div className="font-headline-xl text-on-surface mb-1">
              KES {formatCurrency(metrics.pendingCommissionPayouts)}
            </div>
            <p className="font-body-sm text-error/80">
              {metrics.pendingCommissionPayouts > 0
                ? `Outstanding payouts for ${metrics.pendingCount || 'pending'} transaction(s)`
                : 'All cleaner payouts settled'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-stack-gap-sm items-center justify-between bg-surface-container-lowest p-2 rounded-xl shadow-xs border border-surface-container/40">
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleFilterChange('All')}
            className={`px-4 py-2 rounded-lg font-label-md transition-colors cursor-pointer ${filter === 'All'
                ? 'bg-surface-container text-on-surface font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange('Pending')}
            className={`px-4 py-2 rounded-lg font-label-md transition-colors cursor-pointer ${filter === 'Pending'
                ? 'bg-error-container/30 text-error font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
          >
            Pending
          </button>
          <button
            onClick={() => handleFilterChange('Completed')}
            className={`px-4 py-2 rounded-lg font-label-md transition-colors cursor-pointer ${filter === 'Completed'
                ? 'bg-primary-container/20 text-primary font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
          >
            Completed
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search Order ID, Cleaner, Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container-low rounded-lg py-2 pl-10 pr-4 font-body-sm text-on-surface outline-none focus:bg-surface-container-highest transition-colors"
          />
        </div>
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between rounded-xl">
          <span>{error}</span>
          <button onClick={fetchRecords} className="underline font-semibold cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs overflow-hidden border border-surface-container/40 relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 bg-surface-container-lowest/70 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="flex items-center gap-3 font-body-md text-primary">
              <span className="material-symbols-outlined animate-spin text-[28px]">sync</span>
              Loading payment ledger from MongoDB...
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider">Cleaners</th>
                <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Amount (KES)</th>
                <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider text-center">Rate</th>
                <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Comm. (KES)</th>
                <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider text-center">Payout Status</th>
                <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-on-surface">
              {records.length === 0 && !loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-on-surface-variant font-body-md">
                    No payment records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                records.map((row) => (
                  <tr
                    key={row._id || row.id}
                    className="hover:bg-surface-container-low/50 transition-colors group cursor-pointer border-b border-surface-container-low/50 last:border-0"
                  >
                    <td className="px-6 py-4 font-label-md font-semibold">{row.id}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{formatDate(row.date)}</td>
                    <td className="px-6 py-4 font-medium">{row.cleaners}</td>
                    <td className="px-6 py-4">{row.customer}</td>
                    <td className="px-6 py-4 text-right font-label-md font-semibold">{formatCurrency(row.amount)}</td>
                    <td className="px-6 py-4 text-center font-mono text-xs">
                      <span className="bg-surface-container px-2 py-1 rounded-md text-on-surface-variant font-semibold">
                        {row.commissionRate !== undefined && row.commissionRate !== null ? `${row.commissionRate}%` : `${settings?.commissionRate ?? 15}%`}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right text-secondary font-label-md font-semibold">{formatCurrency(row.comm)}</td>
                    <td className="px-6 py-4 text-center">
                      {row.status === 'Pending' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-error-container/20 text-error font-label-sm gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-error" /> Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-container/20 text-primary font-label-sm gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Completed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === row.id ? null : row.id);
                        }}
                        className="p-1 rounded hover:bg-surface-container text-on-surface-variant group-hover:text-primary transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>

                      {activeMenuId === row.id && (
                        <div className="absolute right-6 top-12 bg-surface-container-lowest border border-surface-container rounded-lg shadow-lg py-1 w-36 z-30 text-left font-label-sm">
                          <button
                            onClick={() => {
                              setSelectedPayment(row);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-surface-container text-on-surface text-xs flex items-center gap-2 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span> View Details
                          </button>
                          {row.status === 'Pending' && (
                            <button
                              onClick={() => handleSettlePayout(row._id, row.id)}
                              className="w-full px-3 py-1.5 hover:bg-surface-container text-emerald-700 text-xs flex items-center gap-2 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">check_circle</span> Settle Payout
                            </button>
                          )}
                          {row.status === 'Completed' && (
                            <button
                              onClick={() => {
                                setInvoiceTargetRecord(row);
                                setShowInvoiceModal(true);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-surface-container text-indigo-700 text-xs flex items-center gap-2 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                              {row.invoiceSentAt ? 'Resend Invoice' : 'Send Invoice'}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination */}
        <div className="px-6 py-4 border-t border-surface-container-low bg-surface-container-lowest flex items-center justify-between">
          <span className="font-body-sm text-on-surface-variant">
            Showing {records.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} entries
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={!pagination.hasPreviousPage || loading}
              className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
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
                    className={`w-8 h-8 rounded-lg font-label-md flex items-center justify-center transition-colors cursor-pointer ${page === pageNum
                        ? 'bg-primary-container text-on-primary-container font-bold'
                        : 'hover:bg-surface-container text-on-surface'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
              disabled={!pagination.hasNextPage || loading}
              className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Details View Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest border border-surface-container rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-surface-container pb-3 mb-4">
              <h3 className="font-headline-sm text-on-surface">Payment Details</h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3 font-body-sm text-on-surface">
              <div className="flex justify-between py-1 border-b border-surface-container-low">
                <span className="text-on-surface-variant">Order Reference:</span>
                <span className="font-semibold">{selectedPayment.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container-low">
                <span className="text-on-surface-variant">Cleaner Partner:</span>
                <span className="font-medium">{selectedPayment.cleaners}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container-low">
                <span className="text-on-surface-variant">Customer:</span>
                <span>{selectedPayment.customer}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container-low">
                <span className="text-on-surface-variant">Gross Amount:</span>
                <span className="font-bold text-primary">KES {formatCurrency(selectedPayment.amount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container-low">
                <span className="text-on-surface-variant">Platform Commission ({selectedPayment.commissionRate ?? settings?.commissionRate ?? 15}%):</span>
                <span className="font-semibold text-secondary">KES {formatCurrency(selectedPayment.comm ?? (selectedPayment.amount * ((selectedPayment.commissionRate ?? settings?.commissionRate ?? 15) / 100)))}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-surface-container-low">
                <span className="text-on-surface-variant">Cleaner Payout Amount:</span>
                <span className="font-bold text-emerald-700">KES {formatCurrency(selectedPayment.providerPayoutAmount || selectedPayment.amount - selectedPayment.comm)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container-low">
                <span className="text-on-surface-variant">Payout Status:</span>
                <span className={`font-semibold ${selectedPayment.status === 'Completed' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedPayment.status}
                </span>
              </div>
              {selectedPayment.payoutReference && (
                <div className="flex justify-between py-1 border-b border-surface-container-low">
                  <span className="text-on-surface-variant">Payout Ref:</span>
                  <span className="font-mono text-xs">{selectedPayment.payoutReference}</span>
                </div>
              )}
              {selectedPayment.invoiceSentAt && (
                <div className="flex justify-between py-1 border-b border-surface-container-low bg-indigo-50 p-2 rounded-lg">
                  <span className="text-indigo-900 text-xs font-semibold">Invoice Sent:</span>
                  <span className="text-indigo-700 text-xs font-mono">{new Date(selectedPayment.invoiceSentAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-between items-center">
              {selectedPayment.status === 'Completed' ? (
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceTargetRecord(selectedPayment);
                    setShowInvoiceModal(true);
                    setSelectedPayment(null);
                  }}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  <span>{selectedPayment.invoiceSentAt ? 'Resend Invoice' : 'Send Invoice'}</span>
                </button>
              ) : <div />}
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Invoice Preview & Dispatch Modal */}
      {showInvoiceModal && invoiceTargetRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-container-lowest border border-surface-container rounded-3xl max-w-lg w-full p-6 shadow-2xl relative flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">Send Payout Settlement Invoice</h3>
              </div>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-500">
              An official email receipt with full financial breakdown will be sent directly to <strong>{invoiceTargetRecord.cleaners}</strong>.
            </p>

            {/* Itemized Invoice Preview Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5 text-xs text-slate-800">
              <div className="flex justify-between font-mono pb-2 border-b border-slate-200">
                <span className="text-slate-500">Invoice Ref:</span>
                <span className="font-bold text-indigo-700">INV-PO-{invoiceTargetRecord._id?.slice(-8).toUpperCase() || 'PAYOUT'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order Reference:</span>
                <span className="font-semibold">{invoiceTargetRecord.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cleaner / Provider:</span>
                <span className="font-semibold">{invoiceTargetRecord.cleaners}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gross Order Total:</span>
                <span className="font-semibold">KES {formatCurrency(invoiceTargetRecord.amount)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Platform Commission ({invoiceTargetRecord.commissionRate ?? settings?.commissionRate ?? 15}%):</span>
                <span>- KES {formatCurrency(invoiceTargetRecord.comm)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-emerald-800">
                <span>Net Disbursed Amount:</span>
                <span>KES {formatCurrency(invoiceTargetRecord.providerPayoutAmount || invoiceTargetRecord.amount - invoiceTargetRecord.comm)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={sendingInvoice}
                onClick={() => handleSendInvoice(invoiceTargetRecord)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {sendingInvoice ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                    Dispatching Invoice...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    Dispatch Payout Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Bulk Invoice Dispatch */}
      <ConfirmationModal
        isOpen={isBulkInvoiceModalOpen}
        onClose={() => setIsBulkInvoiceModalOpen(false)}
        onConfirm={handleBulkSendInvoices}
        title="Dispatch Bulk Payout Invoices"
        warningMessage="Send official payout settlement PDF invoices to all laundry partners who have received settled payouts?"
        confirmText="Dispatch Invoices"
        type="primary"
        isLoading={bulkSendingInvoices}
      />
    </div>
  );
}
