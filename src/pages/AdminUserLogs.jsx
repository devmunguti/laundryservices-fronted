import React, { useState } from 'react';

export default function AdminUserLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('Today');
  const [selectedDate, setSelectedDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  const [logs, setLogs] = useState([
    {
      id: 1,
      date: 'Oct 24, 2023',
      time: '14:32:01 EAT',
      user: 'Jane Smith',
      role: 'Admin',
      initials: 'JS',
      avatarBg: 'bg-primary-container text-on-primary-container',
      action: 'cleaners Approved',
      details: "Approved 'Sparkle Cleaners' onboarding request.",
      ip: '192.168.1.104',
      status: 'Success',
      isError: false,
    },
    {
      id: 2,
      date: 'Oct 24, 2023',
      time: '12:15:45 EAT',
      user: 'System Auto',
      role: 'Bot',
      initials: null,
      icon: 'smart_toy',
      avatarBg: 'bg-surface-variant text-on-surface-variant',
      action: 'Daily Backup',
      details: 'Completed database snapshot to S3.',
      ip: '10.0.0.52',
      status: 'Success',
      isError: false,
    },
    {
      id: 3,
      date: 'Oct 24, 2023',
      time: '09:05:12 EAT',
      user: 'Unknown User',
      role: 'Unauthenticated',
      initials: '?',
      avatarBg: 'bg-surface-variant text-on-surface-variant',
      action: 'Failed Login',
      details: 'Invalid password for admin@auralaundry.co.ke',
      ip: '41.80.12.221',
      status: 'Failed',
      isError: true,
    },
    {
      id: 4,
      date: 'Oct 23, 2023',
      time: '16:45:00 EAT',
      user: 'Mike Waweru',
      role: 'Support',
      initials: 'MW',
      avatarBg: 'bg-tertiary-container text-on-tertiary-container',
      action: 'Refund Processed',
      details: 'Order #ORD-8821 full refund (KSH 1,500).',
      ip: '192.168.1.112',
      status: 'Success',
      isError: false,
    },
  ]);

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Date,Time,User,Role,Action,Details,IP,Status']
        .concat(
          filteredLogs.map(
            (l) => `${l.date},${l.time},"${l.user}",${l.role},"${l.action}","${l.details}",${l.ip},${l.status}`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Aura_Laundry_System_Logs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            onClick={() => setStatusFilter('All')}
            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${statusFilter === 'All' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('Success')}
            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${statusFilter === 'Success' ? 'bg-emerald-600 text-white' : 'bg-surface-container text-on-surface'
              }`}
          >
            Success Only
          </button>
          <button
            onClick={() => setStatusFilter('Failed')}
            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${statusFilter === 'Failed' ? 'bg-rose-600 text-white' : 'bg-surface-container text-on-surface'
              }`}
          >
            Failed Only
          </button>
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
          <div className="font-headline-lg text-on-surface">1,248</div>
          <div className="flex items-center gap-1 text-secondary">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span className="font-body-sm">+12% vs yesterday</span>
          </div>
        </div>

        {/* Failed Login Attempts */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'Failed' ? 'All' : 'Failed')}
          className="bg-surface-container-lowest p-6 rounded-xl shadow-xs border border-surface-container/40 flex flex-col gap-2 relative overflow-hidden group cursor-pointer hover:border-rose-400 transition-colors"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-error/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">Failed Login Attempts</span>
            <span className="material-symbols-outlined text-error">gpp_bad</span>
          </div>
          <div className="font-headline-lg text-on-surface">24</div>
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
          <div className="font-headline-lg text-on-surface">8</div>
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
                onClick={() => setTimeRange('Today')}
                className={`px-3 py-1.5 rounded-md font-label-sm transition-colors cursor-pointer ${timeRange === 'Today'
                    ? 'bg-surface-container-lowest shadow-xs text-on-surface'
                    : 'hover:bg-surface-container-high text-on-surface-variant'
                  }`}
              >
                Today
              </button>
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-3 py-1.5 rounded-md font-label-sm transition-colors cursor-pointer ${timeRange === '7d'
                    ? 'bg-surface-container-lowest shadow-xs text-on-surface'
                    : 'hover:bg-surface-container-high text-on-surface-variant'
                  }`}
              >
                7d
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-1.5 rounded-md font-label-sm transition-colors cursor-pointer ${timeRange === '30d'
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
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-body-sm text-on-surface outline-none pr-3 py-1.5 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
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
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className={`hover:bg-surface-container-lowest/50 transition-colors group cursor-pointer ${log.isError ? 'bg-error-container/10' : ''
                    }`}
                >
                  <td className="p-4">
                    <div className="font-body-sm text-on-surface">{log.date}</div>
                    <div className="font-label-sm text-on-surface-variant">{log.time}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full ${log.avatarBg} flex items-center justify-center font-label-sm`}
                      >
                        {log.icon ? (
                          <span className="material-symbols-outlined text-[16px]">{log.icon}</span>
                        ) : (
                          log.initials
                        )}
                      </div>
                      <div>
                        <div className="font-label-md text-on-surface">{log.user}</div>
                        <div className="font-label-sm text-on-surface-variant">{log.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div
                      className={`font-body-sm font-medium ${log.isError ? 'text-error' : 'text-on-surface'}`}
                    >
                      {log.action}
                    </div>
                    <div className="font-label-sm text-on-surface-variant truncate max-w-xs">{log.details}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-body-sm text-on-surface font-mono text-xs bg-surface-container px-2 py-1 rounded w-fit">
                      {log.ip}
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-surface-variant flex items-center justify-between bg-surface-container-lowest">
          <span className="font-body-sm text-on-surface-variant">
            Showing 1-{filteredLogs.length} of 1,248 logs
          </span>
          <div className="flex items-center gap-2">
            <button className="p-1 text-on-surface-variant hover:bg-surface-container rounded transition-colors disabled:opacity-50 cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 rounded flex items-center justify-center font-label-sm bg-primary text-on-primary">
                1
              </button>
              <button className="w-8 h-8 rounded flex items-center justify-center font-label-sm text-on-surface hover:bg-surface-container transition-colors cursor-pointer">
                2
              </button>
              <button className="w-8 h-8 rounded flex items-center justify-center font-label-sm text-on-surface hover:bg-surface-container transition-colors cursor-pointer">
                3
              </button>
              <span className="font-label-sm text-on-surface-variant px-1">...</span>
              <button className="w-8 h-8 rounded flex items-center justify-center font-label-sm text-on-surface hover:bg-surface-container transition-colors cursor-pointer">
                312
              </button>
            </div>
            <button className="p-1 text-on-surface-variant hover:bg-surface-container rounded transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
