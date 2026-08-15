import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentApi } from '../api/paymentApi';

export default function ProviderEarnings({ isStandalone = true, onNavigateTab }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: {
      grossRevenue: 0,
      platformCommission: 0,
      netEarnings: 0
    },
    payments: []
  });

  const fetchEarnings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await paymentApi.getProviderPayments();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load provider earnings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const summary = data.summary || { grossRevenue: 0, platformCommission: 0, netEarnings: 0 };
  const payments = data.payments || [];

  const mainContent = (
    <div className="flex flex-col w-full h-full font-['Inter'] text-[#1a1c1e] gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#c3c5d9]/20">
        <div>
          <h1 className="font-['Geist'] text-3xl md:text-4xl font-bold text-[#1a1c1e] tracking-tight">
            Earnings &amp; Payouts
          </h1>
          <p className="text-base text-[#434656] mt-1">
            Real-time financial breakdown of your completed customer orders and take-home revenue.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab ? onNavigateTab('payment-channels') : navigate('/provider?tab=payment-channels')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
          <span>Payout Settings</span>
        </button>
      </div>

      {/* 3-Card Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Net Take-Home Earnings */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between h-[160px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-100">Net Take-Home Earnings</span>
              <span className="material-symbols-outlined text-blue-200 text-[22px]">payments</span>
            </div>
            <div className="font-['Geist'] text-3xl font-black mt-2 font-mono">
              KES {summary.netEarnings.toLocaleString()}
            </div>
          </div>
          <div className="text-xs text-blue-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Available for automated/manual payout</span>
          </div>
        </div>

        {/* Gross Revenue */}
        <div className="bg-white rounded-3xl p-6 border border-[#c3c5d9]/30 shadow-xs flex flex-col justify-between h-[160px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Processed Revenue</span>
              <span className="material-symbols-outlined text-slate-400 text-[22px]">trending_up</span>
            </div>
            <div className="font-['Geist'] text-3xl font-black mt-2 text-[#1a1c1e] font-mono">
              KES {summary.grossRevenue.toLocaleString()}
            </div>
          </div>
          <div className="text-xs text-[#434656]">
            Total value of customer orders assigned to you
          </div>
        </div>

        {/* Platform Commission */}
        <div className="bg-white rounded-3xl p-6 border border-[#c3c5d9]/30 shadow-xs flex flex-col justify-between h-[160px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Platform Commission</span>
              <span className="material-symbols-outlined text-slate-400 text-[22px]">percent</span>
            </div>
            <div className="font-['Geist'] text-3xl font-black mt-2 text-rose-600 font-mono">
              KES {summary.platformCommission.toLocaleString()}
            </div>
          </div>
          <div className="text-xs text-[#434656]">
            Standard platform service &amp; hosting fee
          </div>
        </div>
      </div>

      {/* Transaction Records Table */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#c3c5d9]/30 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-['Geist'] text-lg font-bold text-[#1a1c1e]">Completed Order Settlements</h3>
            <p className="text-xs text-[#434656]">Payments processed from your customers</p>
          </div>
          <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
            {payments.length} Transactions
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-blue-600 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined animate-spin text-[24px]">sync</span>
            <span>Loading earnings records...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm space-y-2">
            <span className="material-symbols-outlined text-4xl text-slate-300 block mx-auto">receipt_long</span>
            <p>No settled customer payments found for your cleaner account yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">M-Pesa Code</th>
                  <th className="py-3 px-4">Gross Amount</th>
                  <th className="py-3 px-4">Commission</th>
                  <th className="py-3 px-4">Net Payout</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {p.orderId || `#ORD-${p.order?.slice(-6).toUpperCase()}`}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-blue-700 font-semibold">
                      {p.transactionId || p.gatewayMeta?.mpesaReceiptNumber || 'M-PESA'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-900">
                      KES {(p.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-rose-600 text-xs">
                      - KES {(p.commissionAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      KES {(p.providerPayoutAmount || p.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        {p.status || 'Paid'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  if (!isStandalone) return mainContent;

  return (
    <div className="bg-[#f9f9fc] font-['Inter'] text-[#1a1c1e] min-h-screen flex flex-col">
      <div className="md:pl-72 flex flex-col min-h-screen">
        <main className="flex-1 bg-[#f9f9fc] p-6 md:p-10">
          {mainContent}
        </main>
      </div>
    </div>
  );
}
