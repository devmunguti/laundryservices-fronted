import React, { useState, useEffect, useCallback } from 'react';
import { orderApi } from '../api/orderApi';
import { providerApi } from '../api/providerApi';

export default function AdminOrderManagement() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Assign Provider Modal State
  const [assigningOrder, setAssigningOrder] = useState(null);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [activeProviders, setActiveProviders] = useState([]);
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const [orders, setOrders] = useState([]);

  // Fetch active providers for assign modal dropdown
  const fetchActiveProviders = async () => {
    try {
      const res = await providerApi.getProviders({ status: 'Active', limit: 50 });
      if (res.success && res.data) {
        setActiveProviders(res.data.providers || []);
      }
    } catch (err) {
      console.error('Failed to fetch providers for assignment:', err);
    }
  };

  // Fetch real MongoDB orders from Express Backend
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        search: debouncedSearch,
        status: activeTab !== 'All' ? activeTab : undefined
      };

      const res = await orderApi.getOrders(params);
      if (res.success && res.data) {
        const rawList = res.data.orders || [];
        const formattedOrders = rawList.map((o) => ({
          id: o._id,
          displayId: o.orderRef || `#ORD-${o._id.slice(-6).toUpperCase()}`,
          customer: o.customer?.fullName || 'Guest Customer',
          phone: o.customer?.phone || '+254 700 000 000',
          avatar: null,
          initials: (o.customer?.fullName || 'GC').split(' ').map(n => n[0]).join('').slice(0, 2),
          initialsBg: 'bg-primary-container text-on-primary-container',
          cleaners: o.provider?.providerDetails?.businessName || o.provider?.fullName || 'Unassigned Cleaner',
          serviceIcon: 'local_laundry_service',
          serviceType: o.items?.[0]?.name || 'Standard Laundry',
          amount: `KES ${(o.pricing?.grandTotal || o.totalAmount || 0).toLocaleString()}`,
          status: o.status || 'Pending',
          statusType: (o.status || 'Pending').toLowerCase().replace(' ', '_'),
        }));
        setOrders(formattedOrders);
      } else {
        setError(res.message || 'Failed to load orders.');
      }
    } catch (err) {
      console.error('Failed to fetch orders from MongoDB:', err);
      setError(err.response?.data?.message || err.message || 'Error loading orders.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeTab]);

  useEffect(() => {
    fetchOrders();
    fetchActiveProviders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await orderApi.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        await fetchOrders();
      } else {
        alert(res.message || 'Failed to update order status.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating order status.');
    }
  };

  const handleAssignProviderSubmit = async (e) => {
    e.preventDefault();
    if (!assigningOrder || !selectedProviderId) return;

    try {
      setAssignSubmitting(true);
      const res = await orderApi.assignProvider(assigningOrder.id, selectedProviderId);
      if (res.success) {
        alert(res.message || 'Provider assigned successfully!');
        setAssigningOrder(null);
        setSelectedProviderId('');
        await fetchOrders();
      } else {
        alert(res.message || 'Failed to assign provider.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error assigning provider.');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();
    if (!newCustomerName || !newAmount) return;

    try {
      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ name: newServiceType, price: parseFloat(newAmount), quantity: 1 }],
          pickupAddress: { street: 'Admin Created Address', city: 'Nairobi' }
        })
      });
      const json = await res.json();
      if (json.success) {
        fetchOrders();
      }
    } catch (err) {
      console.error('Error creating order in MongoDB:', err);
    }

    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewAmount('1500');
    setIsManualModalOpen(false);
  };


  const filteredOrders = orders.filter((o) => {
    const matchesTab = activeTab === 'All' || o.status === activeTab;
    const matchesSearch =
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.cleaners.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full gap-stack-gap-lg">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-stack-gap-md relative z-10">
        <div className="flex flex-col gap-unit">
          <h1 className="font-headline-xl text-on-surface">Order Management</h1>
          <p className="font-body-md text-on-surface-variant">Track, filter, and manage all active laundry orders.</p>
        </div>
        <button
          onClick={() => setIsManualModalOpen(true)}
          className="bg-primary text-on-primary px-6 py-3 rounded-xl font-label-md shadow-md hover:shadow-lg transition-shadow flex items-center gap-2 relative overflow-hidden group cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] relative z-10">add</span>
          <span className="relative z-10">Create Manual Order</span>
          <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-gap-md relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-container/20 via-transparent to-transparent -z-10 blur-3xl opacity-50 rounded-full pointer-events-none" />

        {/* Active Orders Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col gap-4 relative overflow-hidden group border border-surface-container/40">
          <div className="flex justify-between items-center">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wider">Active Orders</span>
            <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">local_laundry_service</span>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="font-headline-xl text-on-surface">247</span>
            <span className="font-label-sm text-secondary bg-secondary-container/20 px-2 py-1 rounded-full mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> +12%
            </span>
          </div>
          <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mt-2">
            <div className="w-[65%] h-full bg-primary rounded-full" />
          </div>
        </div>

        {/* Avg Order Value Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col gap-4 relative overflow-hidden group border border-surface-container/40">
          <div className="flex justify-between items-center">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wider">Avg. Order Value</span>
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="font-headline-xl text-on-surface">KES 2,450</span>
            <span className="font-label-sm text-error bg-error-container/20 px-2 py-1 rounded-full mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_down</span> -3%
            </span>
          </div>
          <div className="mt-2 h-[12px] flex gap-1">
            <div className="flex-1 bg-secondary rounded-full opacity-40 group-hover:opacity-100 transition-opacity delay-75" />
            <div className="flex-[2] bg-secondary rounded-full opacity-60 group-hover:opacity-100 transition-opacity delay-150" />
            <div className="flex-1 bg-secondary rounded-full opacity-80 group-hover:opacity-100 transition-opacity delay-200" />
            <div className="flex-[1.5] bg-secondary rounded-full opacity-100 group-hover:opacity-100 transition-opacity delay-300" />
          </div>
        </div>

        {/* Already Delivered Card */}
        <div
          onClick={() => setActiveTab('Ready')}
          className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col gap-4 relative overflow-hidden group border border-surface-container/40 cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wider">Already Delivered</span>
            <div className="w-10 h-10 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="font-headline-xl text-on-surface">38</span>
            <span className="font-label-sm text-tertiary bg-tertiary-container/20 px-2 py-1 rounded-full mb-2">
              Requires action
            </span>
          </div>
          <div className="flex gap-[-8px] mt-2 relative w-full h-[24px]">
            <img
              className="w-8 h-8 rounded-full border-2 border-surface-container-lowest object-cover absolute left-0 z-30"
              alt="Customer 1"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB86oivot4-8ASZPP5FeMdNhmw67c_hFzYQKYkJsLWAcAkdfxaneaR54IxhdnUR0uE13tM2YiNBfLA6J_Rlca0KlR8MrBCa1eloLnSScyxKoJ4WdpZsahK3sDmyp-HUMt-7RfTWSeGRQp4QdQb7IuP9gMMwjqldzqvZ5SGhXDyjQwHLDyWZkaBCxvb-Lx7iYXcFZ3cZHeD2ZKfFRrVvadlZLk--P63W-yVVSj6GxYEE4moJOWlaaewJcw"
            />
            <img
              className="w-8 h-8 rounded-full border-2 border-surface-container-lowest object-cover absolute left-5 z-20"
              alt="Customer 2"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQDrHowM9Jow_06x4rnt3rF2m1Jux9tcDMdGUO1RqP77TAsiaa8WKDag_Af3FUgYTSje0J4D4c-RPYJy7IiiAuUDVA_YtcNyE2Y-fpL0urGQjHx7KKZ-LXCb-Zk2wMxPAsZK_cQ2Fq-AzL0BgPvJj1TklBlgHHWBaBwKRI4ITR3-a4_F8oOtSWOUL5xwNI-M3BCkBH4AulhU797PqckDjrg1cylcXeXwIJlS3jsxSw6TvW-nO3o_uomw"
            />
            <img
              className="w-8 h-8 rounded-full border-2 border-surface-container-lowest object-cover absolute left-10 z-10"
              alt="Customer 3"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfdHkIFtL2KW8NNbSH1ksvwuv1mjF-G6gAGKATjExkC2dYf2VZLtrTdHmR6D2aYaIs9nZ-11t-Z0PjLwUNfPUoaCN3mT2iAESUH7tF4HF8dLt_v8wyqyRiPwPBgjOzAr9cInVG4R3WnW5zbWFpA19o7gK0kPN5kzJLoasYo0XYuP4U-3PDT8miykeg12uQJ35Pdr_xhU99R0GebDNLcLk74ED9jUoRrw00Y6XHmHlwAdj_KrKSMlShgQ"
            />
            <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-surface-container flex items-center justify-center font-label-sm text-on-surface-variant absolute left-15 z-0">
              +35
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-xs flex flex-col mt-4 overflow-hidden border border-surface-container/40">
        {/* Toolbar */}
        <div className="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-surface-container/30 border-b border-surface-container/40">
          <div className="flex flex-wrap gap-2">
            {['All', 'Pending', 'In Progress', 'Ready', 'Completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full font-label-md transition-colors cursor-pointer ${activeTab === tab
                  ? 'bg-primary text-on-primary shadow-xs font-semibold'
                  : 'bg-surface-container hover:bg-surface-variant text-on-surface-variant'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            <div className="relative w-full lg:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter orders..."
                className="w-full bg-surface py-2 pl-10 pr-4 rounded-xl font-body-sm text-on-surface outline-none border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <button className="p-2 bg-surface rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant transition-colors flex items-center justify-center cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container/50">
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">Order ID</th>
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">Customer</th>
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">cleaners</th>
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">Service Type</th>
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Amount</th>
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="py-4 px-6" />
              </tr>
            </thead>
            <tbody className="font-body-sm text-on-surface divide-y divide-surface-container/50">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-surface-container/20 transition-colors group">
                  <td className="py-4 px-6 font-label-md text-primary font-semibold">{o.displayId || o.id}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {o.avatar ? (
                        <img className="w-8 h-8 rounded-full object-cover" alt={o.customer} src={o.avatar} />
                      ) : (
                        <div className={`w-8 h-8 rounded-full ${o.initialsBg || 'bg-primary-container text-on-primary-container'} flex items-center justify-center font-label-md`}>
                          {o.initials}
                        </div>
                      )}
                      <div>
                        <div className="font-label-md font-medium">{o.customer}</div>
                        <div className="text-on-surface-variant text-[12px]">{o.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-on-surface-variant font-medium">{o.cleaners}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-tertiary">{o.serviceIcon}</span>
                      <span>{o.serviceType}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right font-label-md font-semibold">{o.amount}</td>
                  <td className="py-4 px-6">
                    {o.statusType === 'in_progress' || o.statusType === 'in_wash' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-secondary-container/30 text-on-secondary-container">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary mr-1.5" /> {o.status}
                      </span>
                    ) : o.statusType === 'pending' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-surface-container text-on-surface-variant">
                        <span className="w-1.5 h-1.5 rounded-full bg-outline mr-1.5" /> Pending
                      </span>
                    ) : o.statusType === 'ready' || o.statusType === 'ready_for_pickup' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-[#10b981]/20 text-[#047857]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] mr-1.5" /> Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-error-container/30 text-error">
                        <span className="w-1.5 h-1.5 rounded-full bg-error mr-1.5" /> {o.status}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === o.id ? null : o.id);
                      }}
                      className="text-on-surface-variant hover:text-primary transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100 p-1 rounded-full cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>

                    {activeMenuId === o.id && (
                      <div className="absolute right-6 top-10 bg-surface-container-lowest border border-surface-container rounded-lg shadow-lg py-1 w-44 z-30 text-left font-label-sm">
                        <button
                          onClick={() => {
                            setAssigningOrder(o);
                            setActiveMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 hover:bg-surface-container text-primary text-xs flex items-center gap-2 cursor-pointer font-semibold"
                        >
                          <span className="material-symbols-outlined text-[16px]">person_add</span> Assign Cleaner
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(o.id, 'In_Wash')}
                          className="w-full px-3 py-1.5 hover:bg-surface-container text-on-surface text-xs flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">local_laundry_service</span> Start Wash
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(o.id, 'Ready_For_Delivery')}
                          className="w-full px-3 py-1.5 hover:bg-surface-container text-on-surface text-xs flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">check_circle</span> Mark Ready
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(o.id, 'Cancelled')}
                          className="w-full px-3 py-1.5 hover:bg-surface-container text-rose-600 text-xs flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">cancel</span> Cancel Order
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-surface-container/30 border-t border-surface-container/50 flex justify-between items-center">
          <span className="font-body-sm text-on-surface-variant">
            Showing 1 to {filteredOrders.length} of 247 entries
          </span>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-outline-variant cursor-not-allowed border border-outline-variant/30">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-label-sm">
              1
            </button>
            <button className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors border border-outline-variant/30 font-label-sm cursor-pointer">
              2
            </button>
            <button className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors border border-outline-variant/30 font-label-sm cursor-pointer">
              3
            </button>
            <span className="w-8 h-8 flex items-center justify-center text-on-surface-variant">...</span>
            <button className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors border border-outline-variant/30 cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Manual Order Creation Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl max-w-md w-full p-6 border border-surface-container/60 space-y-4">
            <div className="flex justify-between items-center border-b border-surface-container/40 pb-3">
              <h3 className="font-headline-md text-on-surface">Create Manual Order</h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateOrderSubmit} className="space-y-4">
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samuel Ochieng"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm text-on-surface outline-none border border-transparent focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Customer Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +254 712 000 111"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm text-on-surface outline-none border border-transparent focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Assigned cleaners</label>
                <select
                  value={newcleaners}
                  onChange={(e) => setNewcleaners(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm text-on-surface outline-none border border-transparent focus:border-primary"
                >
                  <option value="Sparkle Cleaners Ltd">Sparkle Cleaners Ltd</option>
                  <option value="Wash & Fold Hub">Wash & Fold Hub</option>
                  <option value="Pristine Laundry Westlands">Pristine Laundry Westlands</option>
                  <option value="FreshPress Kilimani">FreshPress Kilimani</option>
                </select>
              </div>
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Service Type</label>
                <input
                  type="text"
                  placeholder="e.g. Dry Cleaning (3 Suits)"
                  value={newServiceType}
                  onChange={(e) => setNewServiceType(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm text-on-surface outline-none border border-transparent focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Total Amount (KES)</label>
                <input
                  type="number"
                  required
                  placeholder="1500"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm text-on-surface outline-none border border-transparent focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-label-md bg-primary text-on-primary hover:bg-primary-container shadow-xs"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
