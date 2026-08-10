import React, { useState } from 'react';

export default function AdminPaymentRecords() {
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessingPayouts, setIsProcessingPayouts] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const [records, setRecords] = useState([
    { id: '#ORD-9921', date: 'Oct 24, 14:30', cleaners: 'Sparkle Dry Cleaners', customer: 'Jane Wanjiku', amount: '2,500', comm: '375', status: 'Pending' },
    { id: '#ORD-9920', date: 'Oct 24, 11:15', cleaners: 'Nairobi Fresh Wash', customer: 'David Omondi', amount: '1,800', comm: '270', status: 'Completed' },
    { id: '#ORD-9919', date: 'Oct 23, 16:45', cleaners: 'Sparkle Dry Cleaners', customer: 'Mary Kamau', amount: '4,200', comm: '630', status: 'Pending' },
    { id: '#ORD-9918', date: 'Oct 23, 09:00', cleaners: 'Westlands Laundry Hub', customer: 'Peter Njoroge', amount: '950', comm: '142.5', status: 'Completed' },
    { id: '#ORD-9917', date: 'Oct 22, 18:20', cleaners: 'FreshPress Kilimani', customer: 'Alice Kamau', amount: '3,400', comm: '510', status: 'Completed' },
    { id: '#ORD-9916', date: 'Oct 22, 15:10', cleaners: 'CleanCraft Karen', customer: 'Brian Otieno', amount: '5,100', comm: '765', status: 'Pending' },
  ]);

  const handleProcessPayouts = () => {
    setIsProcessingPayouts(true);
    setTimeout(() => {
      setIsProcessingPayouts(false);
      setPayoutSuccess(true);
      // Update pending items to completed
      setRecords(prev => prev.map(r => ({ ...r, status: 'Completed' })));
      setTimeout(() => {
        setPayoutSuccess(false);
      }, 2500);
    }, 1500);
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + ["Order ID,Date,cleaners,Customer,Amount (KES),Commission (KES),Payout Status"]
        .concat(records.map(r => `${r.id},${r.date},${r.cleaners},${r.customer},${r.amount},${r.comm},${r.status}`))
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Aura_Laundry_Payment_Records.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecords = records.filter(r => {
    const matchesFilter = filter === 'All' || r.status === filter;
    const matchesSearch = r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.cleaners.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
        <div className="flex items-center gap-stack-gap-sm">
          <button
            onClick={handleExportCSV}
            className="bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md py-2 px-4 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Export Report
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
            <span className="bg-primary/10 text-primary font-label-sm py-1 px-2 rounded-full">+12.5%</span>
          </div>
          <div className="relative z-10">
            <div className="font-headline-xl text-on-surface mb-1">KES 1,245,000</div>
            <p className="font-body-sm text-on-surface-variant">Gross volume processed this month</p>
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
            <span className="bg-secondary/10 text-secondary font-label-sm py-1 px-2 rounded-full">+8.2%</span>
          </div>
          <div className="relative z-10">
            <div className="font-headline-xl text-on-surface mb-1">KES 186,750</div>
            <p className="font-body-sm text-on-surface-variant">Total platform earnings (15% avg)</p>
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
              {records.some(r => r.status === 'Pending') ? 'KES 425,000' : 'KES 0'}
            </div>
            <p className="font-body-sm text-error/80">
              {records.some(r => r.status === 'Pending')
                ? 'Outstanding commissions to collect from 12 cleanerss'
                : 'All cleaners payouts settled'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-stack-gap-sm items-center justify-between bg-surface-container-lowest p-2 rounded-xl shadow-xs border border-surface-container/40">
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilter('All')}
            className={`px-4 py-2 rounded-lg font-label-md transition-colors cursor-pointer ${filter === 'All'
                ? 'bg-surface-container text-on-surface font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('Pending')}
            className={`px-4 py-2 rounded-lg font-label-md transition-colors cursor-pointer ${filter === 'Pending'
                ? 'bg-error-container/30 text-error font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('Completed')}
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
            placeholder="Search Order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container-low rounded-lg py-2 pl-10 pr-4 font-body-sm text-on-surface outline-none focus:bg-surface-container-highest transition-colors"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs overflow-hidden border border-surface-container/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider">cleaners</th>
                <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Amount (KES)</th>
                <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Comm. (KES)</th>
                <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider text-center">Payout Status</th>
                <th className="px-6 py-4 font-label-sm text-on-surface-variant uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-on-surface">
              {filteredRecords.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-surface-container-low/50 transition-colors group cursor-pointer border-b border-surface-container-low/50 last:border-0"
                >
                  <td className="px-6 py-4 font-label-md font-semibold">{row.id}</td>
                  <td className="px-6 py-4 text-on-surface-variant">{row.date}</td>
                  <td className="px-6 py-4 font-medium">{row.cleaners}</td>
                  <td className="px-6 py-4">{row.customer}</td>
                  <td className="px-6 py-4 text-right font-label-md font-semibold">{row.amount}</td>
                  <td className="px-6 py-4 text-right text-secondary font-label-md font-semibold">{row.comm}</td>
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
                            alert(`View receipt for ${row.id}`);
                            setActiveMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 hover:bg-surface-container text-on-surface text-xs flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span> View Details
                        </button>
                        {row.status === 'Pending' && (
                          <button
                            onClick={() => {
                              setRecords(prev => prev.map(r => r.id === row.id ? { ...r, status: 'Completed' } : r));
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-surface-container text-emerald-700 text-xs flex items-center gap-2 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">check_circle</span> Settle Payout
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-surface-container-low bg-surface-container-lowest flex items-center justify-between">
          <span className="font-body-sm text-on-surface-variant">
            Showing 1 to {filteredRecords.length} of 245 entries
          </span>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors disabled:opacity-50 cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button className="p-2 rounded-lg bg-primary-container text-on-primary-container font-label-md transition-colors w-8 h-8 flex items-center justify-center">
              1
            </button>
            <button className="p-2 rounded-lg hover:bg-surface-container text-on-surface font-label-md transition-colors w-8 h-8 flex items-center justify-center cursor-pointer">
              2
            </button>
            <button className="p-2 rounded-lg hover:bg-surface-container text-on-surface font-label-md transition-colors w-8 h-8 flex items-center justify-center cursor-pointer">
              3
            </button>
            <button className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
