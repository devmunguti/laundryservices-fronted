import React, { useState } from 'react';

export default function AdminTicketManagement() {
  const [filterStatus, setFilterStatus] = useState('All');
  const [activeMenuId, setActiveMenuId] = useState(null);

  const [tickets, setTickets] = useState([
    {
      id: '#TK-8902',
      client: 'Jane Doe',
      initials: 'JD',
      avatarBg: 'bg-primary-container text-on-primary-container',
      avatarUrl: null,
      paymentRef: 'MPESA-X7Y8Z9',
      amount: '1,450.00',
      timestamp: 'Oct 24, 14:30',
      status: 'Pending Verification',
      statusType: 'pending',
    },
    {
      id: '#TK-8901',
      client: 'Wanjiku Kamau',
      initials: 'WK',
      avatarBg: 'bg-secondary-container text-on-secondary-container',
      avatarUrl: null,
      paymentRef: 'MPESA-A1B2C3',
      amount: '3,200.00',
      timestamp: 'Oct 24, 11:15',
      status: 'Paid & Resolved',
      statusType: 'resolved',
    },
    {
      id: '#TK-8899',
      client: 'David Ochieng',
      initials: null,
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQDrHowM9Jow_06x4rnt3rF2m1Jux9tcDMdGUO1RqP77TAsiaa8WKDag_Af3FUgYTSje0J4D4c-RPYJy7IiiAuUDVA_YtcNyE2Y-fpL0urGQjHx7KKZ-LXCb-Zk2wMxPAsZK_cQ2Fq-AzL0BgPvJj1TklBlgHHWBaBwKRI4ITR3-a4_F8oOtSWOUL5xwNI-M3BCkBH4AulhU797PqckDjrg1cylcXeXwIJlS3jsxSw6TvW-nO3o_uomw',
      paymentRef: 'CARD-4490-X',
      amount: '850.00',
      timestamp: 'Oct 23, 16:45',
      status: 'Pending Verification',
      statusType: 'pending',
    },
    {
      id: '#TK-8895',
      client: "Aisha Ndung'u",
      initials: 'AN',
      avatarBg: 'bg-tertiary-container text-on-tertiary-container',
      avatarUrl: null,
      paymentRef: 'MPESA-M9N8P7',
      amount: '2,100.00',
      timestamp: 'Oct 23, 09:20',
      status: 'Disputed',
      statusType: 'disputed',
    },
  ]);

  const handleVerifyPayment = (id) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'Paid & Resolved', statusType: 'resolved' } : t))
    );
  };

  const handleReviewIssue = (id) => {
    alert(`Reviewing dispute for ticket ${id}. Contacting customer support and gateway logs.`);
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Ticket ID,Client Name,Payment Ref,Amount (KES),Timestamp,Status']
        .concat(
          filteredTickets.map(
            (t) => `${t.id},"${t.client}",${t.paymentRef},${t.amount},"${t.timestamp}",${t.status}`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Aura_Laundry_Payment_Tickets.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === 'All') return true;
    if (filterStatus === 'Pending') return t.statusType === 'pending';
    if (filterStatus === 'Resolved') return t.statusType === 'resolved';
    if (filterStatus === 'Disputed') return t.statusType === 'disputed';
    return true;
  });

  return (
    <div className="flex flex-col w-full gap-stack-gap-lg">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-gap-md">
        {/* Card 1 */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-xs border border-surface-container/40 flex flex-col justify-between group">
          <div className="flex items-start justify-between mb-2">
            <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">TOTAL TICKETS RAISED</span>
            <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
            </div>
          </div>
          <div>
            <div className="font-headline-xl text-on-surface mb-1">1,248</div>
            <div className="flex items-center gap-1 text-secondary font-label-sm">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span>+12% this week</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-xs border border-surface-container/40 flex flex-col justify-between group">
          <div className="flex items-start justify-between mb-2">
            <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">PAID TICKETS</span>
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
          </div>
          <div>
            <div className="font-headline-xl text-on-surface mb-1">1,102</div>
            <div className="flex items-center gap-1 text-secondary font-label-sm">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>88% resolution rate</span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-xs border border-error-container/40 flex flex-col justify-between group">
          <div className="flex items-start justify-between mb-2">
            <span className="font-label-sm text-error uppercase tracking-wider font-semibold">UNRESOLVED PAYMENTS</span>
            <div className="w-10 h-10 rounded-full bg-error-container/30 text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">money_off</span>
            </div>
          </div>
          <div>
            <div className="font-headline-xl text-on-surface mb-1">146</div>
            <div className="flex items-center gap-1 text-error font-label-sm">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              <span>Requires attention</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-xs border border-surface-container/40 flex flex-col overflow-hidden">
        {/* Table Header */}
        <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest border-b border-surface-container/40">
          <div>
            <h3 className="font-headline-md text-on-surface">Recent Payment Tickets</h3>
            <p className="font-body-sm text-on-surface-variant mt-0.5">
              Manage and resolve client payment disputes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md py-2 px-4 rounded-full outline-none cursor-pointer border border-transparent focus:border-primary"
            >
              <option value="All">Filter: All Status</option>
              <option value="Pending">Pending Verification</option>
              <option value="Resolved">Paid & Resolved</option>
              <option value="Disputed">Disputed</option>
            </select>
            <button
              onClick={handleExportCSV}
              className="bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md py-2 px-4 rounded-full transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">TICKET ID</th>
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">CLIENT NAME</th>
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">PAYMENT REF</th>
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">AMOUNT (KES)</th>
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">TIMESTAMP</th>
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">STATUS</th>
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-on-surface divide-y divide-surface-container/40">
              {filteredTickets.map((t) => (
                <tr key={t.id} className="hover:bg-surface-container-low/40 transition-colors group">
                  <td className="py-4 px-6 font-label-md font-semibold text-on-surface">{t.id}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {t.avatarUrl ? (
                        <img className="w-8 h-8 rounded-full object-cover" alt={t.client} src={t.avatarUrl} />
                      ) : (
                        <div className={`w-8 h-8 rounded-full ${t.avatarBg} flex items-center justify-center font-label-md font-semibold text-xs`}>
                          {t.initials}
                        </div>
                      )}
                      <span className="font-label-md font-medium text-on-surface">{t.client}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-on-surface-variant font-medium">{t.paymentRef}</td>
                  <td className="py-4 px-6 font-label-md font-semibold text-on-surface">{t.amount}</td>
                  <td className="py-4 px-6 text-on-surface-variant">{t.timestamp}</td>
                  <td className="py-4 px-6">
                    {t.statusType === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant">
                        <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant" />
                        Pending Verification
                      </span>
                    )}
                    {t.statusType === 'resolved' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-container/20 text-primary">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Paid & Resolved
                      </span>
                    )}
                    {t.statusType === 'disputed' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-error-container/20 text-error">
                        <span className="w-1.5 h-1.5 rounded-full bg-error" />
                        Disputed
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {t.statusType === 'pending' && (
                      <button
                        onClick={() => handleVerifyPayment(t.id)}
                        className="bg-primary hover:bg-primary-container text-on-primary font-label-md text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
                      >
                        Verify Payment
                      </button>
                    )}
                    {t.statusType === 'disputed' && (
                      <button
                        onClick={() => handleReviewIssue(t.id)}
                        className="bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Review Issue
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-surface-container-lowest border-t border-surface-container/40 flex justify-between items-center">
          <span className="font-body-sm text-on-surface-variant">
            Showing 1 to {filteredTickets.length} of 146 pending tickets
          </span>
          <div className="flex gap-2 items-center">
            <button className="p-1 text-on-surface-variant hover:bg-surface-container rounded transition-colors disabled:opacity-50 cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
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
            <button className="p-1 text-on-surface-variant hover:bg-surface-container rounded transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
