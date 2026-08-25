import React, { useState, useEffect, useCallback } from 'react';
import { auditLogApi } from '../api/auditLogApi';
import toast from 'react-hot-toast';

export default function AdminUserLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [timeRange, setTimeRange] = useState('Today');
  const [selectedDate, setSelectedDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

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

  // Data & Loading states
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState({
    totalEventsToday: 0,
    failedLoginAttempts: 0,
    criticalActions: 0
  });
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

  // Reset page to 1 when filters change
  const handleStatusFilter = (newStatus) => {
    setStatusFilter(newStatus);
    setPage(1);
  };

  const handleTimeRangeFilter = (newRange) => {
    setTimeRange(newRange);
    setSelectedDate('');
    setPage(1);
  };

  const handleDateChange = (e) => {
    const dateVal = e.target.value;
    setSelectedDate(dateVal);
    if (dateVal) setTimeRange('');
    setPage(1);
  };

  // Fetch Audit Metrics
  const fetchMetrics = async () => {
    try {
      const res = await auditLogApi.getAuditMetrics();
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Failed to load audit metrics:', err);
    }
  };

  // Fetch Audit Logs from Backend API
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        timeRange: !selectedDate ? timeRange : undefined,
        date: selectedDate || undefined
      };

      const res = await auditLogApi.getAuditLogs(params);
      if (res.success && res.data) {
        setLogs(res.data.logs || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      } else {
        setError(res.message || 'Failed to load audit logs.');
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.response?.data?.message || err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, categoryFilter, timeRange, selectedDate]);

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // CSV Export Handler
  const handleExportCSV = async () => {
    try {
      const params = {
        search: debouncedSearch,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        timeRange: !selectedDate ? timeRange : undefined,
        date: selectedDate || undefined
      };

      const blobData = await auditLogApi.exportAuditLogs(params);
      const blob = new Blob([blobData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Aura_Laundry_System_Logs.csv');
      window.URL.revokeObjectURL(url);
      toast.success('Audit logs CSV downloaded successfully!');
    } catch (err) {
      console.error('CSV Export failed:', err);
      toast.error('Failed to export CSV. Please check permissions.');
    }
  };

  // Helper for formatting date timestamp into local EAT string
  const formatTimestamp = (dateStr) => {
    if (!dateStr) return { date: '-', time: '-' };
    const d = new Date(dateStr);
    const dateFormatted = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const timeFormatted = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + ' EAT';

    return { date: dateFormatted, time: timeFormatted };
  };

  // Helper for rendering user initials or icons
  const getUserAvatar = (log) => {
    if (log.role === 'Bot') {
      return (
        <div className="w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-label-sm">
          <span className="material-symbols-outlined text-[16px]">smart_toy</span>
        </div>
      );
    }

    if (log.role === 'Unauthenticated' || !log.user) {
      return (
        <div className="w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-label-sm">
          ?
        </div>
      );
    }

    const name = log.userName || 'User';
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const bgClass =
      log.role === 'Admin'
        ? 'bg-primary-container text-on-primary-container'
        : log.role === 'Support'
          ? 'bg-tertiary-container text-on-tertiary-container'
          : 'bg-secondary-container text-on-secondary-container';

    return (
      <div className={`w-8 h-8 rounded-full ${bgClass} flex items-center justify-center font-label-sm font-semibold`}>
        {initials}
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full gap-stack-gap-lg">
      {/* Header Section */}
      <div className="flex flex-col gap-stack-gap-sm md:flex-row md:items-center justify-between">
        <div>
          <h1 className="font-headline-xl text-on-surface">System Audit & User Logs</h1>
          <p className="font-body-md text-on-surface-variant">
            Track administrative actions and system-wide events.
          </p>
        </div>
        <div className="flex items-center gap-stack-gap-sm">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-lg font-label-md text-on-surface hover:bg-surface-container-high transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-primary rounded-lg font-label-md text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Advanced Filters
          </button>
        </div>
      </div>

      {/* Advanced Filter Drawer */}
      {showAdvancedFilters && (
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container/40 flex flex-wrap items-center gap-4">
          <span className="font-label-sm text-on-surface-variant">Filter Status:</span>
          <button
            onClick={() => handleStatusFilter('All')}
            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${statusFilter === 'All' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'
              }`}
          >
            All
          </button>
          <button
            onClick={() => handleStatusFilter('Success')}
            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${statusFilter === 'Success' ? 'bg-emerald-600 text-white' : 'bg-surface-container text-on-surface'
              }`}
          >
            Success Only
          </button>
          <button
            onClick={() => handleStatusFilter('Failed')}
            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${statusFilter === 'Failed' ? 'bg-rose-600 text-white' : 'bg-surface-container text-on-surface'
              }`}
          >
            Failed Only
          </button>

          <span className="font-label-sm text-on-surface-variant ml-4">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-surface-container text-on-surface outline-none cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Authentication">Authentication</option>
            <option value="User Management">User Management</option>
            <option value="Order">Order</option>
            <option value="Payment">Payment</option>
            <option value="Provider">Provider</option>
            <option value="Driver">Driver</option>
            <option value="System">System</option>
            <option value="Security">Security</option>
            <option value="Backup">Backup</option>
          </select>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-stack-gap-md">
        {/* Total Events Today */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xs border border-surface-container/40 flex flex-col gap-2 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">Total Events Today</span>
            <span className="material-symbols-outlined text-primary">data_usage</span>
          </div>
          <div className="font-headline-lg text-on-surface">{metrics.totalEventsToday.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-secondary">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span className="font-body-sm">Live MongoDB count</span>
          </div>
        </div>

        {/* Failed Login Attempts */}
        <div
          onClick={() => handleStatusFilter(statusFilter === 'Failed' ? 'All' : 'Failed')}
          className="bg-surface-container-lowest p-6 rounded-xl shadow-xs border border-surface-container/40 flex flex-col gap-2 relative overflow-hidden group cursor-pointer hover:border-rose-400 transition-colors"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-error/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">Failed Login Attempts</span>
            <span className="material-symbols-outlined text-error">gpp_bad</span>
          </div>
          <div className="font-headline-lg text-on-surface">{metrics.failedLoginAttempts}</div>
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="font-body-sm">Last 24 hours</span>
          </div>
        </div>

        {/* Critical Actions */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xs border border-surface-container/40 flex flex-col gap-2 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">Critical Actions</span>
            <span className="material-symbols-outlined text-secondary">warning</span>
          </div>
          <div className="font-headline-lg text-on-surface">{metrics.criticalActions}</div>
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="font-body-sm">Requires review</span>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xs border border-surface-container/40 flex flex-col gap-2 relative overflow-hidden group">
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
              <path className="text-primary" d="M0 30 Q 25 10, 50 25 T 100 20 L 100 40 L 0 40 Z" fill="currentColor" />
            </svg>
          </div>
          <div className="flex items-center justify-between relative z-10">
            <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">System Health</span>
            <span className="material-symbols-outlined text-primary">health_and_safety</span>
          </div>
          <div className="font-headline-lg text-on-surface relative z-10">99.9%</div>
          <div className="flex items-center gap-1 text-secondary relative z-10">
            <span className="font-body-sm">Optimal Performance</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-md overflow-hidden flex flex-col border border-surface-container/40">
        {/* Toolbar */}
        <div className="p-6 bg-surface-container-lowest flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-container/30">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search logs by user, action, or IP..."
                className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-lg font-body-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-surface-container rounded-lg p-1">
              <button
                onClick={() => handleTimeRangeFilter('Today')}
                className={`px-3 py-1.5 rounded-md font-label-sm transition-colors cursor-pointer ${timeRange === 'Today' && !selectedDate
                    ? 'bg-surface-container-lowest shadow-xs text-on-surface'
                    : 'hover:bg-surface-container-high text-on-surface-variant'
                  }`}
              >
                Today
              </button>
              <button
                onClick={() => handleTimeRangeFilter('7d')}
                className={`px-3 py-1.5 rounded-md font-label-sm transition-colors cursor-pointer ${timeRange === '7d' && !selectedDate
                    ? 'bg-surface-container-lowest shadow-xs text-on-surface'
                    : 'hover:bg-surface-container-high text-on-surface-variant'
                  }`}
              >
                7d
              </button>
              <button
                onClick={() => handleTimeRangeFilter('30d')}
                className={`px-3 py-1.5 rounded-md font-label-sm transition-colors cursor-pointer ${timeRange === '30d' && !selectedDate
                    ? 'bg-surface-container-lowest shadow-xs text-on-surface'
                    : 'hover:bg-surface-container-high text-on-surface-variant'
                  }`}
              >
                30d
              </button>
            </div>

            <div className="flex items-center bg-surface-container rounded-lg overflow-hidden">
              <span className="material-symbols-outlined p-2 text-on-surface-variant text-[18px]">
                calendar_month
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="bg-transparent font-body-sm text-on-surface outline-none pr-3 py-1.5 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Loading / Error Banner */}
        {error && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchLogs} className="underline font-semibold cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {/* Logs Table */}
        <div className="overflow-x-auto min-h-[300px] relative">
          {loading && (
            <div className="absolute inset-0 bg-surface-container-lowest/70 backdrop-blur-xs flex items-center justify-center z-10">
              <div className="flex items-center gap-3 font-body-md text-primary">
                <span className="material-symbols-outlined animate-spin text-[28px]">sync</span>
                Loading system audit logs...
              </div>
            </div>
          )}

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Timestamp
                </th>
                <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  User / Role
                </th>
                <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Action Performed
                </th>
                <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  IP Address
                </th>
                <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Status
                </th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody className="align-top divide-y divide-surface-variant">
              {logs.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-on-surface-variant font-body-md">
                    No audit logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const { date: formattedDate, time: formattedTime } = formatTimestamp(log.createdAt);
                  const isError = log.status === 'Failed';

                  return (
                    <tr
                      key={log._id || log.id}
                      className={`hover:bg-surface-container-lowest/50 transition-colors group cursor-pointer ${isError ? 'bg-error-container/10' : ''
                        }`}
                    >
                      <td className="p-4">
                        <div className="font-body-sm text-on-surface">{formattedDate}</div>
                        <div className="font-label-sm text-on-surface-variant">{formattedTime}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {getUserAvatar(log)}
                          <div>
                            <div className="font-label-md text-on-surface">{log.userName || 'Unknown User'}</div>
                            <div className="font-label-sm text-on-surface-variant">{log.role || 'Unauthenticated'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div
                          className={`font-body-sm font-medium ${isError ? 'text-error' : 'text-on-surface'}`}
                        >
                          {log.action}
                        </div>
                        <div className="font-label-sm text-on-surface-variant truncate max-w-xs">{log.details}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-body-sm text-on-surface font-mono text-xs bg-surface-container px-2 py-1 rounded w-fit">
                          {log.ipAddress || 'Unknown'}
                        </div>
                      </td>
                      <td className="p-4">
                        {log.status === 'Success' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container/20 text-on-secondary-container font-label-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-error-container/20 text-on-error-container font-label-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-error" /> Failed
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button className="p-1.5 text-on-surface-variant hover:text-primary transition-colors opacity-0 group-hover:opacity-100 cursor-pointer">
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic MongoDB Pagination */}
        <div className="p-4 border-t border-surface-variant flex items-center justify-between bg-surface-container-lowest">
          <span className="font-body-sm text-on-surface-variant">
            Showing {logs.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} logs
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={!pagination.hasPreviousPage || loading}
              className="p-1 text-on-surface-variant hover:bg-surface-container rounded transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded flex items-center justify-center font-label-sm cursor-pointer transition-colors ${page === pageNum
                        ? 'bg-primary text-on-primary font-bold'
                        : 'text-on-surface hover:bg-surface-container'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {pagination.totalPages > 5 && (
                <>
                  <span className="font-label-sm text-on-surface-variant px-1">...</span>
                  <button
                    onClick={() => setPage(pagination.totalPages)}
                    className={`w-8 h-8 rounded flex items-center justify-center font-label-sm text-on-surface hover:bg-surface-container transition-colors cursor-pointer ${page === pagination.totalPages ? 'bg-primary text-on-primary font-bold' : ''
                      }`}
                  >
                    {pagination.totalPages}
                  </button>
                </>
              )}
            </div>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
              disabled={!pagination.hasNextPage || loading}
              className="p-1 text-on-surface-variant hover:bg-surface-container rounded transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
