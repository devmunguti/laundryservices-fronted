import React, { useState } from 'react';

export default function AdminOverview({ onNavigateTab }) {
  const [timeFilter, setTimeFilter] = useState('This Week');

  // Chart data mapping based on filter selection
  const chartData = {
    'This Week': [
      { day: 'Mon', count: 120, heightPct: '30%' },
      { day: 'Tue', count: 250, heightPct: '50%' },
      { day: 'Wed', count: 400, heightPct: '80%' },
      { day: 'Thu', count: 300, heightPct: '60%' },
      { day: 'Fri', count: 380, heightPct: '75%' },
      { day: 'Sat', count: 450, heightPct: '90%' },
      { day: 'Sun', count: 520, heightPct: '100%' },
    ],
    'Last Week': [
      { day: 'Mon', count: 110, heightPct: '28%' },
      { day: 'Tue', count: 210, heightPct: '45%' },
      { day: 'Wed', count: 350, heightPct: '70%' },
      { day: 'Thu', count: 290, heightPct: '58%' },
      { day: 'Fri', count: 360, heightPct: '72%' },
      { day: 'Sat', count: 410, heightPct: '82%' },
      { day: 'Sun', count: 480, heightPct: '92%' },
    ],
    'This Month': [
      { day: 'Wk 1', count: 1400, heightPct: '40%' },
      { day: 'Wk 2', count: 2100, heightPct: '60%' },
      { day: 'Wk 3', count: 3200, heightPct: '85%' },
      { day: 'Wk 4', count: 4100, heightPct: '98%' },
    ],
  };

  const currentPoints = chartData[timeFilter] || chartData['This Week'];

  return (
    <div className="flex flex-col w-full space-y-stack-gap-lg">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-stack-gap-md bg-surface-container rounded-xl p-stack-gap-lg shadow-xs relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <h1 className="font-headline-xl text-on-surface">System Overview</h1>
          <p className="font-body-md text-on-surface-variant mt-1">Platform performance and health at a glance.</p>
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
        {/* Metric 1 */}
        <div className="bg-surface-container-lowest rounded-xl p-stack-gap-lg shadow-xs flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 border border-surface-container/40">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span class="material-symbols-outlined text-[24px]">account_balance_wallet</span>
            </div>
            <span className="bg-surface-container py-1 px-2 rounded-md font-label-sm text-on-surface-variant">+12% vs last mo</span>
          </div>
          <div>
            <p className="font-body-sm text-on-surface-variant uppercase tracking-wider mb-1">Total Platform Revenue</p>
            <h2 className="font-headline-lg text-on-surface">KES 4.2M</h2>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-surface-container-lowest rounded-xl p-stack-gap-lg shadow-xs flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 border border-surface-container/40">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
              <span class="material-symbols-outlined text-[24px]">local_laundry_service</span>
            </div>
            <span className="bg-surface-container py-1 px-2 rounded-md font-label-sm text-on-surface-variant">+5% vs last week</span>
          </div>
          <div>
            <p className="font-body-sm text-on-surface-variant uppercase tracking-wider mb-1">Active Orders</p>
            <h2 className="font-headline-lg text-on-surface">1,248</h2>
          </div>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('cleaners-management')}
          className="bg-surface-container-lowest rounded-xl p-stack-gap-lg shadow-xs flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 border border-surface-container/40 cursor-pointer"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary group-hover:bg-tertiary group-hover:text-on-tertiary transition-colors">
              <span class="material-symbols-outlined text-[24px]">storefront</span>
            </div>
            <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 py-1 px-2 rounded-md font-label-sm font-semibold">2 pending</span>
          </div>
          <div>
            <p className="font-body-sm text-on-surface-variant uppercase tracking-wider mb-1">Total cleanerss</p>
            <h2 className="font-headline-lg text-on-surface">86</h2>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-surface-container-lowest rounded-xl p-stack-gap-lg shadow-xs flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 border border-surface-container/40">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-error-container/20 flex items-center justify-center text-error group-hover:bg-error group-hover:text-on-error transition-colors">
              <span class="material-symbols-outlined text-[24px]">group_add</span>
            </div>
            <span className="bg-surface-container py-1 px-2 rounded-md font-label-sm text-on-surface-variant">+12% vs yesterday</span>
          </div>
          <div>
            <p className="font-body-sm text-on-surface-variant uppercase tracking-wider mb-1">Tickets Completed Today</p>
            <h2 className="font-headline-lg text-on-surface">142</h2>
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
              <p className="font-body-sm text-on-surface-variant">Last 7 Days (Platform-wide)</p>
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
                d="M0 250 C 150 200, 250 280, 400 150 C 550 20, 650 180, 800 120 C 900 80, 950 100, 1000 60 L 1000 300 L 0 300 Z"
                fill="url(#paint0_linear)"
                opacity="0.1"
              />
              <path
                className="animate-[dash_3s_ease-out_forwards]"
                d="M0 250 C 150 200, 250 280, 400 150 C 550 20, 650 180, 800 120 C 900 80, 950 100, 1000 60"
                stroke="currentColor"
                strokeDasharray="1500"
                strokeDashoffset="0"
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
              <span>500</span>
              <span>250</span>
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
                  className="w-12 bg-transparent hover:bg-primary/10 cursor-pointer rounded-t-md transition-colors relative group"
                >
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
              View All
            </button>
          </div>

          <div className="p-stack-gap-lg flex-1 overflow-y-auto space-y-6">
            {/* Activity Item 1 */}
            <div className="flex gap-4 items-start relative group">
              <div className="absolute left-[19px] top-10 bottom-[-24px] w-[2px] bg-surface-container group-last:hidden" />
              <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary shrink-0 z-10 relative">
                <span class="material-symbols-outlined text-[20px]">assignment_ind</span>
              </div>
              <div>
                <p className="font-body-md text-on-surface">
                  <span className="font-label-md font-semibold">New cleaners Application</span> received from "FreshPress Kilimani".
                </p>
                <p className="font-body-sm text-on-surface-variant mt-1">10 mins ago</p>
              </div>
            </div>

            {/* Activity Item 2 */}
            <div className="flex gap-4 items-start relative group">
              <div className="absolute left-[19px] top-10 bottom-[-24px] w-[2px] bg-surface-container group-last:hidden" />
              <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary shrink-0 z-10 relative">
                <span class="material-symbols-outlined text-[20px]">check_circle</span>
              </div>
              <div>
                <p className="font-body-md text-on-surface">
                  <span className="font-label-md font-semibold">Large Order Completed</span> (KES 15,400) by "Wash & Go Westlands".
                </p>
                <p className="font-body-sm text-on-surface-variant mt-1">45 mins ago</p>
              </div>
            </div>

            {/* Activity Item 3 */}
            <div className="flex gap-4 items-start relative group">
              <div className="absolute left-[19px] top-10 bottom-[-24px] w-[2px] bg-surface-container group-last:hidden" />
              <div className="w-10 h-10 rounded-full bg-error-container/20 flex items-center justify-center text-error shrink-0 z-10 relative">
                <span class="material-symbols-outlined text-[20px]">warning</span>
              </div>
              <div>
                <p className="font-body-md text-on-surface">
                  <span className="font-label-md font-semibold">Payment Failed</span> for Order #ORD-88392. Retry scheduled.
                </p>
                <p className="font-body-sm text-on-surface-variant mt-1">2 hours ago</p>
              </div>
            </div>

            {/* Activity Item 4 */}
            <div className="flex gap-4 items-start relative group">
              <div className="w-10 h-10 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary shrink-0 z-10 relative">
                <span class="material-symbols-outlined text-[20px]">stars</span>
              </div>
              <div>
                <p className="font-body-md text-on-surface">
                  <span className="font-label-md font-semibold">New Milestone</span>: Platform reached 10,000 total users!
                </p>
                <p className="font-body-sm text-on-surface-variant mt-1">5 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
