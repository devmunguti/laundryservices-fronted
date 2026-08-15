import React, { useState, useEffect, useCallback } from 'react';
import { systemSettingsApi } from '../api/systemSettingsApi';

export default function AdminOverview({ onNavigateTab }) {
  const [timeFilter, setTimeFilter] = useState('This Week');
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    revenueFormatted: 'KES 0',
    revenueGrowth: '+0% vs last mo',
    activeOrders: 0,
    activeOrdersGrowth: '+0% vs last week',
    totalProviders: 0,
    pendingProviders: 0,
    ticketsCompletedToday: 0,
    ticketsGrowth: '+0% vs yesterday',
    openTickets: 0,
    chartData: {
      'This Week': [
        { day: 'Mon', count: 0, heightPct: '20%' },
        { day: 'Tue', count: 0, heightPct: '20%' },
        { day: 'Wed', count: 0, heightPct: '20%' },
        { day: 'Thu', count: 0, heightPct: '20%' },
        { day: 'Fri', count: 0, heightPct: '20%' },
        { day: 'Sat', count: 0, heightPct: '20%' },
        { day: 'Sun', count: 0, heightPct: '20%' },
      ],
      'Last Week': [
        { day: 'Mon', count: 0, heightPct: '20%' },
        { day: 'Tue', count: 0, heightPct: '20%' },
        { day: 'Wed', count: 0, heightPct: '20%' },
        { day: 'Thu', count: 0, heightPct: '20%' },
        { day: 'Fri', count: 0, heightPct: '20%' },
        { day: 'Sat', count: 0, heightPct: '20%' },
        { day: 'Sun', count: 0, heightPct: '20%' },
      ],
      'This Month': [
        { day: 'Wk 1', count: 0, heightPct: '20%' },
        { day: 'Wk 2', count: 0, heightPct: '20%' },
        { day: 'Wk 3', count: 0, heightPct: '20%' },
        { day: 'Wk 4', count: 0, heightPct: '20%' },
      ],
    },
    activities: []
  });

  const fetchOverviewMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await systemSettingsApi.getAdminOverviewMetrics();
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch admin overview metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverviewMetrics();
  }, [fetchOverviewMetrics]);

  const currentPoints = metrics.chartData?.[timeFilter] || metrics.chartData?.['This Week'] || [];
  const maxChartCount = Math.max(...currentPoints.map(p => p.count || 0), 10);

  // Dynamic SVG curve generation
  const pts = currentPoints.map((pt, i, arr) => {
    const x = arr.length > 1 ? (i / (arr.length - 1)) * 1000 : 500;
    const countVal = pt.count || 0;
    const y = 260 - (countVal / maxChartCount) * 200;
    return { x, y };
  });

  const getSvgPath = (pointsList) => {
    if (!pointsList || pointsList.length === 0) return 'M0 260 L1000 260';
    let path = `M ${pointsList[0].x} ${pointsList[0].y}`;
    for (let i = 0; i < pointsList.length - 1; i++) {
      const p0 = pointsList[i];
      const p1 = pointsList[i + 1];
      const cx = (p0.x + p1.x) / 2;
      path += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const svgCurve = getSvgPath(pts);
  const svgFill = `${svgCurve} L 1000 300 L 0 300 Z`;

  return (
    <div className="flex flex-col w-full space-y-stack-gap-lg">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-stack-gap-md bg-surface-container rounded-xl p-stack-gap-lg shadow-xs relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <h1 className="font-headline-xl text-on-surface">System Overview</h1>
          <p className="font-body-md text-on-surface-variant mt-1">Platform performance and live operational metrics.</p>
        </div>
        <div className="flex items-center gap-3 bg-surface-container-lowest py-2 px-4 rounded-full shadow-xs">
          <div className="relative flex items-center justify-center w-3 h-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-secondary-container opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
          </div>
          <span className="font-label-md text-on-surface">System Health: Optimal</span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-gap-lg">
        {/* Metric 1: Total Revenue */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('payment-records')}
          className="bg-surface-container-lowest rounded-xl p-stack-gap-lg shadow-xs flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 border border-surface-container/40 cursor-pointer"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
            </div>
            <span className="bg-surface-container py-1 px-2 rounded-md font-label-sm text-on-surface-variant">
              {metrics.revenueGrowth}
            </span>
          </div>
          <div>
            <p className="font-body-sm text-on-surface-variant uppercase tracking-wider mb-1">Total Platform Revenue</p>
            <h2 className="font-headline-lg text-on-surface">{metrics.revenueFormatted}</h2>
          </div>
        </div>

        {/* Metric 2: Active Orders */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('order-management')}
          className="bg-surface-container-lowest rounded-xl p-stack-gap-lg shadow-xs flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 border border-surface-container/40 cursor-pointer"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
              <span className="material-symbols-outlined text-[24px]">local_laundry_service</span>
            </div>
            <span className="bg-surface-container py-1 px-2 rounded-md font-label-sm text-on-surface-variant">
              {metrics.activeOrdersGrowth}
            </span>
          </div>
          <div>
            <p className="font-body-sm text-on-surface-variant uppercase tracking-wider mb-1">Active Orders</p>
            <h2 className="font-headline-lg text-on-surface">{metrics.activeOrders.toLocaleString()}</h2>
          </div>
        </div>

        {/* Metric 3: Total Cleaners/Providers */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('cleaners-management')}
          className="bg-surface-container-lowest rounded-xl p-stack-gap-lg shadow-xs flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 border border-surface-container/40 cursor-pointer"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary group-hover:bg-tertiary group-hover:text-on-tertiary transition-colors">
              <span className="material-symbols-outlined text-[24px]">storefront</span>
            </div>
            {metrics.pendingProviders > 0 ? (
              <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 py-1 px-2 rounded-md font-label-sm font-semibold">
                {metrics.pendingProviders} pending
              </span>
            ) : (
              <span className="bg-surface-container py-1 px-2 rounded-md font-label-sm text-on-surface-variant">
                All Verified
              </span>
            )}
          </div>
          <div>
            <p className="font-body-sm text-on-surface-variant uppercase tracking-wider mb-1">Total Cleaners</p>
            <h2 className="font-headline-lg text-on-surface">{metrics.totalProviders}</h2>
          </div>
        </div>

        {/* Metric 4: Tickets / Delivered Today */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('ticket-management')}
          className="bg-surface-container-lowest rounded-xl p-stack-gap-lg shadow-xs flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 border border-surface-container/40 cursor-pointer"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-error-container/20 flex items-center justify-center text-error group-hover:bg-error group-hover:text-on-error transition-colors">
              <span className="material-symbols-outlined text-[24px]">confirmation_number</span>
            </div>
            <span className="bg-surface-container py-1 px-2 rounded-md font-label-sm text-on-surface-variant">
              {metrics.ticketsGrowth}
            </span>
          </div>
          <div>
            <p className="font-body-sm text-on-surface-variant uppercase tracking-wider mb-1">Completed Today</p>
            <h2 className="font-headline-lg text-on-surface">{metrics.ticketsCompletedToday}</h2>
          </div>
        </div>
      </div>

      {/* Chart & Activity Section */}
      <div className="grid grid-cols-12 gap-stack-gap-lg">
        {/* Chart Column */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-xl shadow-xs overflow-hidden flex flex-col border border-surface-container/40">
          <div className="p-stack-gap-lg flex justify-between items-center bg-surface-container-low border-b border-surface-container/30">
            <div>
              <h3 className="font-headline-md text-on-surface">Daily Order Volume</h3>
              <p className="font-body-sm text-on-surface-variant">Platform-wide orders ({timeFilter})</p>
            </div>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-surface-container-lowest text-on-surface font-body-sm px-3 py-2 rounded-md shadow-xs outline-none focus:ring-2 focus:ring-primary appearance-none pr-8 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231a1c1e%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[length:12px_12px] bg-[right_10px_center] cursor-pointer"
            >
              <option value="This Week">This Week</option>
              <option value="Last Week">Last Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>

          <div className="p-stack-gap-lg flex-1 min-h-[320px] relative w-full flex items-end justify-between gap-2 px-8 pb-10 pt-16">
            {/* SVG Chart Line & Gradient */}
            <svg
              className="absolute inset-0 w-full h-full text-primary"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 1000 300"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d={svgFill}
                fill="url(#paint0_linear)"
                opacity="0.12"
              />
              <path
                className="transition-all duration-500 ease-out"
                d={svgCurve}
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
              />
              <defs>
                <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear" x1="500" x2="500" y1="0" y2="300">
                  <stop stopColor="currentColor" />
                  <stop offset="1" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* Y-Axis Labels */}
            <div className="absolute left-3 top-8 bottom-10 flex flex-col justify-between font-label-sm text-on-surface-variant pointer-events-none">
              <span>{maxChartCount}</span>
              <span>{Math.round(maxChartCount / 2)}</span>
              <span>0</span>
            </div>

            {/* X-Axis Labels */}
            <div className="absolute bottom-2 left-8 right-8 flex justify-between font-label-sm text-on-surface-variant pointer-events-none">
              {currentPoints.map((pt) => (
                <span key={pt.day}>{pt.day}</span>
              ))}
            </div>

            {/* Interactive Data Point Columns */}
            <div className="z-10 w-full h-full flex items-end justify-between px-2 pb-6">
              {currentPoints.map((pt, idx) => (
                <div
                  key={idx}
                  style={{ height: pt.heightPct }}
                  className="w-12 bg-transparent hover:bg-primary/10 cursor-pointer rounded-t-md transition-colors relative group flex items-end justify-center"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-primary mb-[-5px] shadow-xs group-hover:scale-125 transition-transform" />
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-2.5 py-1 rounded-md text-xs font-medium shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                    {pt.count} Orders
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Feed Column */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-xl shadow-xs overflow-hidden flex flex-col border border-surface-container/40">
          <div className="p-stack-gap-lg bg-surface-container-low flex justify-between items-center border-b border-surface-container/30">
            <h3 className="font-headline-md text-on-surface">Recent Activity</h3>
            <button
              onClick={() => onNavigateTab && onNavigateTab('user-logs')}
              className="text-primary hover:text-primary-container font-label-md transition-colors cursor-pointer"
            >
              View Logs
            </button>
          </div>

          <div className="p-stack-gap-lg flex-1 overflow-y-auto space-y-6 max-h-[380px]">
            {metrics.activities.length === 0 ? (
              <p className="text-center text-on-surface-variant font-body-sm py-8">
                {loading ? 'Loading live activity...' : 'No recent system activity recorded.'}
              </p>
            ) : (
              metrics.activities.map((act, index) => (
                <div key={act.id || index} className="flex gap-4 items-start relative group">
                  {index !== metrics.activities.length - 1 && (
                    <div className="absolute left-[19px] top-10 bottom-[-24px] w-[2px] bg-surface-container" />
                  )}
                  <div className={`w-10 h-10 rounded-full ${act.iconBg || 'bg-primary-container/20'} flex items-center justify-center ${act.iconColor || 'text-primary'} shrink-0 z-10 relative`}>
                    <span className="material-symbols-outlined text-[20px]">{act.icon || 'history'}</span>
                  </div>
                  <div>
                    <p className="font-body-md text-on-surface">
                      <span className="font-label-md font-semibold">{act.title}: </span>
                      {act.details}
                    </p>
                    <p className="font-body-sm text-on-surface-variant mt-1">{act.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
