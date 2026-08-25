import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { paymentApi } from '../api/paymentApi';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ui/ConfirmationModal';

export default function PaymentChannels({ isStandalone = true }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('payment-channels');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [deleteTargetChannel, setDeleteTargetChannel] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newChannel, setNewChannel] = useState({
    type: 'mpesa',
    title: '',
    subtitle: '',
    accountName: '',
    businessNo: '',
    accountNo: ''
  });

  const fetchChannels = useCallback(async () => {
    try {
      setLoading(true);
      const res = await paymentApi.getChannels();
      if (res.success && res.data) {
        setChannels(res.data.map(ch => ({
          ...ch,
          id: ch._id,
          iconColor: ch.type === 'mpesa' ? '#00a859' : ch.type === 'bank' ? '#003ec7' : '#006688',
          bgColor: ch.type === 'mpesa' ? 'bg-[#00a859]/10' : ch.type === 'bank' ? 'bg-[#003ec7]/10' : 'bg-[#006688]/10'
        })));
      }
    } catch (err) {
      console.error('Failed to fetch payment channels:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleSetDefault = (id) => {
    setChannels(prev => prev.map(ch => ({
      ...ch,
      isDefault: ch.id === id
    })));
    toast.success('Default payout channel updated');
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetChannel) return;
    try {
      setIsDeleting(true);
      const res = await paymentApi.deleteChannel(deleteTargetChannel.id || deleteTargetChannel._id);
      if (res.success) {
        toast.success(`Payment channel removed`);
        setDeleteTargetChannel(null);
        await fetchChannels();
      } else {
        toast.error(res.message || 'Failed to delete channel');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting payment channel');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddChannel = async (e) => {
    e.preventDefault();
    if (!newChannel.accountName) return;

    try {
      const res = await paymentApi.addChannel({
        type: newChannel.type,
        title: newChannel.type === 'mpesa' ? 'M-Pesa Paybill' : newChannel.type === 'bank' ? 'Bank Account' : 'Cash Payment',
        subtitle: newChannel.type === 'mpesa' ? 'Paybill' : 'Account',
        accountName: newChannel.accountName,
        businessNo: newChannel.businessNo || '',
        accountNo: newChannel.accountNo || ''
      });

      if (res.success) {
        toast.success('Payment channel added successfully!');
        await fetchChannels();
        setIsAddModalOpen(false);
        setNewChannel({ type: 'mpesa', title: '', subtitle: '', accountName: '', businessNo: '', accountNo: '' });
      } else {
        toast.error(res.message || 'Failed to add payment channel');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding payment channel');
    }
  };

  const mainContent = (
    <div className="flex flex-col w-full h-full relative font-['Inter'] text-[#1a1c1e]">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-['Geist'] text-3xl md:text-4xl font-bold text-[#1a1c1e] tracking-tight">Payment Channels</h1>
          <p className="text-base text-[#434656] mt-1">Configure and manage payout and collection methods for your customers.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#003ec7] text-white hover:bg-[#003ec7]/90 transition-all shadow-md font-['Geist'] text-sm font-semibold cursor-pointer self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>Add Payment Method</span>
        </button>
      </div>

      {/* Payment Channel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {channels.map((channel) => (
          <div key={channel.id} className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#c3c5d9]/10 flex flex-col justify-between relative group hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl ${channel.bgColor} flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-[28px]" style={{ color: channel.iconColor }}>
                    {channel.type === 'mpesa' ? 'smartphone' : channel.type === 'bank' ? 'account_balance' : 'payments'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {channel.isDefault && (
                    <span className="px-3 py-1 bg-[#dde1ff] text-[#001452] font-['Geist'] text-xs font-bold rounded-full">
                      Default
                    </span>
                  )}
                  {channel.isVerified && (
                    <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold" title="Verified Account">
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                    </span>
                  )}
                </div>
              </div>

              <h3 className="font-['Geist'] text-xl font-bold text-[#1a1c1e]">{channel.title}</h3>
              <p className="font-['Inter'] text-xs text-[#434656] mb-4">{channel.subtitle}</p>

              <div className="space-y-2 border-t border-[#c3c5d9]/20 pt-4 text-xs font-['Inter']">
                <div className="flex justify-between">
                  <span className="text-[#434656]">Account Name:</span>
                  <span className="font-semibold text-[#1a1c1e]">{channel.accountName}</span>
                </div>
                {channel.businessNo && (
                  <div className="flex justify-between">
                    <span className="text-[#434656]">Business No (Paybill):</span>
                    <span className="font-mono font-semibold text-[#003ec7]">{channel.businessNo}</span>
                  </div>
                )}
                {channel.accountNo && (
                  <div className="flex justify-between">
                    <span className="text-[#434656]">Account No:</span>
                    <span className="font-mono font-semibold text-[#1a1c1e]">{channel.accountNo}</span>
                  </div>
                )}
                {channel.branch && (
                  <div className="flex justify-between">
                    <span className="text-[#434656]">Branch:</span>
                    <span className="font-semibold text-[#1a1c1e]">{channel.branch}</span>
                  </div>
                )}
                {channel.instructions && (
                  <p className="text-[11px] text-[#434656] italic mt-2">{channel.instructions}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#c3c5d9]/20 pt-4 mt-6">
              {!channel.isDefault ? (
                <button
                  onClick={() => handleSetDefault(channel.id)}
                  className="text-xs font-['Geist'] font-semibold text-[#003ec7] hover:underline cursor-pointer"
                >
                  Make Default
                </button>
              ) : (
                <span className="text-xs font-['Geist'] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active Payout Method
                </span>
              )}

              <button
                onClick={() => setDeleteTargetChannel(channel)}
                className="text-[#ba1a1a] hover:bg-red-50 p-2 rounded-full transition-colors cursor-pointer"
                title="Delete channel"
                aria-label={`Delete ${channel.title}`}
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Modal for Channel Deletion */}
      <ConfirmationModal
        isOpen={Boolean(deleteTargetChannel)}
        onClose={() => setDeleteTargetChannel(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Payment Method"
        itemName={deleteTargetChannel?.title}
        warningMessage="Are you sure you want to remove this payment payout method from your account?"
        confirmText="Remove Method"
        type="danger"
        isLoading={isDeleting}
      />

      {/* Modal for Adding Payment Method */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-fadeIn">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 text-[#434656] hover:bg-[#e8e8ea] rounded-full p-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="font-['Geist'] text-xl font-bold text-[#1a1c1e] mb-4">Add Payment Method</h3>

            <form onSubmit={handleAddChannel} className="space-y-4 font-['Inter'] text-sm">
              <div>
                <label className="block text-xs font-semibold text-[#434656] mb-1">Channel Type</label>
                <select
                  value={newChannel.type}
                  onChange={(e) => setNewChannel({ ...newChannel, type: e.target.value })}
                  className="w-full p-3 rounded-xl border border-[#c3c5d9]/30 bg-[#f3f3f6] text-[#1a1c1e] focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50"
                >
                  <option value="mpesa">M-Pesa Paybill / Till</option>
                  <option value="bank">Bank Account Transfer</option>
                  <option value="cash">Cash Collection</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#434656] mb-1">Account Holder Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Mama Safi Laundries"
                  value={newChannel.accountName}
                  onChange={(e) => setNewChannel({ ...newChannel, accountName: e.target.value })}
                  className="w-full p-3 rounded-xl border border-[#c3c5d9]/30 bg-[#f3f3f6] text-[#1a1c1e] focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50"
                />
              </div>

              {newChannel.type === 'mpesa' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#434656] mb-1">Business / Paybill Number</label>
                    <input 
                      type="text"
                      placeholder="e.g. 890123"
                      value={newChannel.businessNo}
                      onChange={(e) => setNewChannel({ ...newChannel, businessNo: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#c3c5d9]/30 bg-[#f3f3f6] text-[#1a1c1e] focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#434656] mb-1">Account Number Reference</label>
                    <input 
                      type="text"
                      placeholder="e.g. MAMA-SAFI-01"
                      value={newChannel.accountNo}
                      onChange={(e) => setNewChannel({ ...newChannel, accountNo: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#c3c5d9]/30 bg-[#f3f3f6] text-[#1a1c1e] focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50"
                    />
                  </div>
                </>
              )}

              {newChannel.type === 'bank' && (
                <div>
                  <label className="block text-xs font-semibold text-[#434656] mb-1">Bank Account Number</label>
                  <input 
                    type="text"
                    placeholder="e.g. 0110928374910"
                    value={newChannel.accountNo}
                    onChange={(e) => setNewChannel({ ...newChannel, accountNo: e.target.value })}
                    className="w-full p-3 rounded-xl border border-[#c3c5d9]/30 bg-[#f3f3f6] text-[#1a1c1e] focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-['Geist'] font-semibold text-[#434656] hover:bg-[#f3f3f6] cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-xs font-['Geist'] font-semibold bg-[#003ec7] text-white hover:bg-[#0038b6] transition-colors shadow-sm cursor-pointer"
                >
                  Save Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
