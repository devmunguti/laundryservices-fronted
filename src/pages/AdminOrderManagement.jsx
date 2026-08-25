import React, { useState, useEffect, useCallback } from 'react';
import { orderApi } from '../api/orderApi';
import { providerApi } from '../api/providerApi';
import { systemSettingsApi } from '../api/systemSettingsApi';
import toast from 'react-hot-toast';

export default function AdminOrderManagement() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Order Details Modal State
  const [viewingOrder, setViewingOrder] = useState(null);

  // Assign Provider Modal State
  const [assigningOrder, setAssigningOrder] = useState(null);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [activeProviders, setActiveProviders] = useState([]);
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  // Manual Order State
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newcleaners, setNewcleaners] = useState('');
  const [newServiceType, setNewServiceType] = useState('Standard Wash');
  const [newAmount, setNewAmount] = useState('1500');

  // Metrics State
  const [metrics, setMetrics] = useState({
    activeOrders: 0,
    activeOrdersGrowth: '+0% vs last week',
    avgOrderValue: 0,
    avgOrderValueFormatted: 'KES 0',
    readyOrders: 0,
    totalOrders: 0
  });

  const [orders, setOrders] = useState([]);

  // Fetch active providers for assign modal dropdown
  const fetchActiveProviders = async () => {
    try {
      const res = await providerApi.getProviders({ status: 'Active', limit: 50 });
      if (res.success && res.data) {
        const list = res.data.providers || [];
        setActiveProviders(list);
        if (list.length > 0) {
          setNewcleaners(list[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch providers for assignment:', err);
    }
  };

  // Fetch live metrics and real MongoDB orders
  const fetchOrdersAndMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        search: searchTerm,
        status: activeTab !== 'All' ? activeTab : undefined
      };

      const [ordersRes, metricsRes] = await Promise.all([
        orderApi.getOrders(params),
        systemSettingsApi.getAdminOverviewMetrics().catch(() => ({ success: false }))
      ]);

      if (ordersRes.success && ordersRes.data) {
        const rawList = ordersRes.data.orders || [];
        const formattedOrders = rawList.map((o) => {
          const custName = o.customerDetails?.fullName || o.customer?.fullName || 'Guest Customer';
          const custPhone = o.customerDetails?.phone || o.customer?.phone || o.payment?.phoneNumber || '';
          const custEmail = o.customerDetails?.email || o.customer?.email || '';
          const campusLoc = o.pickupAddress?.campusLocation || o.pickupAddress?.street || 'Nairobi';
          const roomNo = o.pickupAddress?.houseNumber || '';
          const instruct = o.pickupAddress?.instructions || o.notes || '';
          const coords = o.pickupAddress?.coordinates || null;
          const mapUrl = o.pickupAddress?.liveLocationUrl || (coords?.lat ? `https://maps.google.com/?q=${coords.lat},${coords.lng}` : '');

          return {
            id: o._id,
            displayId: o.orderRef || `#ORD-${o._id.slice(-6).toUpperCase()}`,
            customer: custName,
            customerPhone: custPhone,
            customerEmail: custEmail,
            campusLocation: campusLoc,
            houseNumber: roomNo,
            instructions: instruct,
            coordinates: coords,
            liveLocationUrl: mapUrl,
            phone: custPhone || '+254 700 000 000',
            address: roomNo ? `${campusLoc} (${roomNo})` : campusLoc,
            avatar: null,
            initials: custName.split(' ').map(n => n[0]).join('').slice(0, 2),
            initialsBg: 'bg-primary-container text-on-primary-container',
            cleaners: o.provider?.providerDetails?.businessName || o.provider?.fullName || 'Unassigned Cleaner',
            serviceIcon: 'local_laundry_service',
            serviceType: o.items?.[0]?.name || 'Standard Laundry',
            items: o.items?.map(it => `${it.quantity || 1}x ${it.name || 'Laundry'}`).join(', ') || '1x Laundry Service',
            amount: `KES ${(o.pricing?.grandTotal || o.totalAmount || 0).toLocaleString()}`,
            status: o.status || 'Pending',
            statusType: (o.status || 'Pending').toLowerCase().replace(/_/g, '-'),
            statusLabel: (o.status || 'Pending').replace(/_/g, ' '),
            transactionId: o.transactionId || o.payment?.transactionId || null,
            paymentStatus: o.paymentStatus || o.payment?.status || 'Pending',
            paymentMethod: o.payment?.method || 'M-Pesa',
            date: new Date(o.createdAt || Date.now()).toLocaleDateString(),
            time: new Date(o.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        });
        setOrders(formattedOrders);
      }

      if (metricsRes.success && metricsRes.data) {
        setMetrics({
          activeOrders: metricsRes.data.activeOrders || 0,
          activeOrdersGrowth: metricsRes.data.activeOrdersGrowth || '+0% vs last week',
          avgOrderValue: metricsRes.data.avgOrderValue || 0,
          avgOrderValueFormatted: metricsRes.data.avgOrderValueFormatted || 'KES 0',
          readyOrders: metricsRes.data.readyOrders || 0,
          totalOrders: metricsRes.data.totalOrders || 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch orders from MongoDB:', err);
      setError(err.response?.data?.message || err.message || 'Error loading orders.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, activeTab]);

  useEffect(() => {
    fetchOrdersAndMetrics();
    fetchActiveProviders();
  }, [fetchOrdersAndMetrics]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await orderApi.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        toast.success(`Order status updated to ${newStatus.replace(/_/g, ' ')}`);
        await fetchOrdersAndMetrics();
      } else {
        toast.error(res.message || 'Failed to update order status.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating order status.');
    }
  };

  const handleAssignProviderSubmit = async (e) => {
    e.preventDefault();
    if (!assigningOrder || !selectedProviderId) return;

    try {
      setAssignSubmitting(true);
      const res = await orderApi.assignProvider(assigningOrder.id, selectedProviderId);
      if (res.success) {
        toast.success(res.message || 'Provider assigned successfully!');
        setAssigningOrder(null);
        setSelectedProviderId('');
        await fetchOrdersAndMetrics();
      } else {
        toast.error(res.message || 'Failed to assign provider.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error assigning provider.');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();
    if (!newCustomerName || !newAmount) return;

    try {
      const res = await orderApi.createOrder({
        items: [{ name: newServiceType, price: parseFloat(newAmount), quantity: 1 }],
        pickupAddress: { street: 'Admin Created Order', city: 'Nairobi' }
      });
      if (res.success) {
        toast.success('Manual order created successfully!');
        await fetchOrdersAndMetrics();
        setIsManualModalOpen(false);
        setNewCustomerName('');
        setNewCustomerPhone('');
        setNewAmount('1500');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating manual order.');
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesTab = activeTab === 'All' || o.status === activeTab;
    const matchesSearch =
      o.displayId.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          <p className="font-body-md text-on-surface-variant">Track, filter, and manage all active laundry orders platform-wide.</p>
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
            <span className="font-headline-xl text-on-surface">{metrics.activeOrders}</span>
            <span className="font-label-sm text-secondary bg-secondary-container/20 px-2 py-1 rounded-full mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> {metrics.activeOrdersGrowth}
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
            <span className="font-headline-xl text-on-surface">{metrics.avgOrderValueFormatted}</span>
            <span className="font-label-sm text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">insights</span> Platform Avg
            </span>
          </div>
          <div className="mt-2 h-[12px] flex gap-1">
            <div className="flex-1 bg-secondary rounded-full opacity-40 group-hover:opacity-100 transition-opacity delay-75" />
            <div className="flex-[2] bg-secondary rounded-full opacity-60 group-hover:opacity-100 transition-opacity delay-150" />
            <div className="flex-1 bg-secondary rounded-full opacity-80 group-hover:opacity-100 transition-opacity delay-200" />
            <div className="flex-[1.5] bg-secondary rounded-full opacity-100 group-hover:opacity-100 transition-opacity delay-300" />
          </div>
        </div>

        {/* Already Delivered / Ready Card */}
        <div
          onClick={() => setActiveTab('Ready_For_Delivery')}
          className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col gap-4 relative overflow-hidden group border border-surface-container/40 cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wider">Ready for Dispatch / Completed</span>
            <div className="w-10 h-10 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="font-headline-xl text-on-surface">{metrics.readyOrders}</span>
            <span className="font-label-sm text-tertiary bg-tertiary-container/20 px-2 py-1 rounded-full mb-2">
              Ready / Delivered
            </span>
          </div>
          <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mt-2">
            <div className="w-[85%] h-full bg-tertiary rounded-full" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-xs flex flex-col mt-4 overflow-hidden border border-surface-container/40">
        {/* Toolbar */}
        <div className="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-surface-container/30 border-b border-surface-container/40">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'All', label: 'All Orders' },
              { id: 'Pending', label: 'Pending / Placed' },
              { id: 'Pickup_Scheduled', label: 'Pickup Scheduled' },
              { id: 'In_Wash', label: 'In Wash / Cleaning' },
              { id: 'Ready_For_Delivery', label: 'Ready for Dispatch' },
              { id: 'Delivered', label: 'Delivered' },
              { id: 'Cancelled', label: 'Cancelled' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full font-label-md transition-colors cursor-pointer text-xs ${activeTab === tab.id
                  ? 'bg-primary text-on-primary shadow-xs font-semibold'
                  : 'bg-surface-container hover:bg-surface-variant text-on-surface-variant'
                  }`}
              >
                {tab.label}
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
                placeholder="Search orders, customers..."
                className="w-full bg-surface py-2 pl-10 pr-4 rounded-xl font-body-sm text-on-surface outline-none border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-surface-container/50">
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">Order ID</th>
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">Customer</th>
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">Assigned Cleaner</th>
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">Service Type</th>
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider text-right">Amount</th>
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-on-surface divide-y divide-surface-container/50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant font-body-sm">
                    {loading ? 'Loading orders from database...' : 'No orders found matching this filter.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-surface-container/20 transition-colors group">
                    <td className="py-4 px-6 font-label-md text-primary font-semibold font-mono">{o.displayId || o.id}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${o.initialsBg || 'bg-primary-container text-on-primary-container'} flex items-center justify-center font-label-md`}>
                          {o.initials}
                        </div>
                        <div>
                          <div className="font-label-md font-medium">{o.customer}</div>
                          <div className="text-on-surface-variant text-[12px]">{o.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-on-surface-variant font-medium">
                      <span className={o.cleaners.includes('Unassigned') ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs font-semibold' : 'text-on-surface'}>
                        {o.cleaners}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-tertiary">{o.serviceIcon}</span>
                        <span>{o.serviceType}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-label-md font-semibold">{o.amount}</td>
                    <td className="py-4 px-6">
                      {o.statusType === 'in-progress' || o.statusType === 'in-wash' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-secondary-container/30 text-on-secondary-container">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary mr-1.5" /> In Wash
                        </span>
                      ) : o.statusType === 'pending' || o.statusType === 'pickup-scheduled' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-amber-50 text-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" /> {o.statusLabel}
                        </span>
                      ) : o.statusType === 'ready-for-delivery' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-blue-50 text-blue-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5" /> Ready for Delivery
                        </span>
                      ) : o.statusType === 'delivered' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-emerald-100 text-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" /> Delivered
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-error-container/30 text-error">
                          <span className="w-1.5 h-1.5 rounded-full bg-error mr-1.5" /> {o.statusLabel}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center relative">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingOrder(o)}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                          title="View Order Details & M-Pesa Code"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === o.id ? null : o.id);
                          }}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                      </div>

                      {activeMenuId === o.id && (
                        <div className="absolute right-6 top-10 bg-surface-container-lowest border border-surface-container rounded-xl shadow-xl py-1 w-52 z-30 text-left font-label-sm">
                          <div className="px-3 py-2 border-b border-surface-container/40 mb-1 bg-surface-container/30">
                            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">M-Pesa Code</p>
                            {o.transactionId ? (
                              <p className="font-mono text-xs font-bold text-primary mt-0.5">{o.transactionId}</p>
                            ) : (
                              <p className="text-xs text-on-surface-variant italic">No code recorded</p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setViewingOrder(o);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-surface-container text-on-surface text-xs flex items-center gap-2 cursor-pointer font-medium"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span> View Full Details
                          </button>
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
                            onClick={() => {
                              handleUpdateStatus(o.id, 'In_Wash');
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-surface-container text-on-surface text-xs flex items-center gap-2 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">local_laundry_service</span> Start Wash
                          </button>
                          <button
                            onClick={() => {
                              handleUpdateStatus(o.id, 'Ready_For_Delivery');
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-surface-container text-on-surface text-xs flex items-center gap-2 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">check_circle</span> Mark Ready
                          </button>
                          <button
                            onClick={() => {
                              handleUpdateStatus(o.id, 'Delivered');
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-surface-container text-emerald-700 text-xs flex items-center gap-2 cursor-pointer font-medium"
                          >
                            <span className="material-symbols-outlined text-[16px]">done_all</span> Mark Delivered
                          </button>
                          <button
                            onClick={() => {
                              handleUpdateStatus(o.id, 'Cancelled');
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-surface-container text-rose-600 text-xs flex items-center gap-2 cursor-pointer border-t border-surface-container/30 mt-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">cancel</span> Cancel Order
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-surface-container/30 border-t border-surface-container/50 flex justify-between items-center">
          <span className="font-body-sm text-on-surface-variant">
            Showing 1 to {filteredOrders.length} of {filteredOrders.length} entries
          </span>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-outline-variant cursor-not-allowed border border-outline-variant/30">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-label-sm">
              1
            </button>
            <button className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors border border-outline-variant/30 cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Order Details Modal with M-Pesa Transaction Code */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-surface-container/60">
            <button
              onClick={() => setViewingOrder(null)}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full p-1 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-xl font-bold text-primary">{viewingOrder.displayId}</span>
              <span className="px-2.5 py-0.5 text-xs rounded-full bg-secondary-container/40 text-on-secondary-container font-semibold uppercase">
                {viewingOrder.statusLabel}
              </span>
            </div>
            <div className="space-y-3 border-t border-surface-container/40 pt-4 text-sm font-body-sm">
              {/* Customer Contact & Live Location Destination Card */}
              <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-200/70 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-blue-700 font-bold uppercase tracking-wider block">Customer &amp; Location</span>
                    <h4 className="font-bold text-slate-900 text-sm">{viewingOrder.customer}</h4>
                  </div>
                  {viewingOrder.customerPhone && (
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${viewingOrder.customerPhone}`}
                        className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-xs"
                        title="Direct Call"
                      >
                        <span className="material-symbols-outlined text-[16px]">call</span>
                      </a>
                      <a
                        href={`https://wa.me/${viewingOrder.customerPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors shadow-xs"
                        title="WhatsApp Chat"
                      >
                        <span className="material-symbols-outlined text-[16px]">chat</span>
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-xs text-slate-700">
                  <p className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-blue-600">location_city</span>
                    <span><strong>Pickup Station:</strong> {viewingOrder.campusLocation}</span>
                  </p>
                  {viewingOrder.houseNumber && (
                    <p className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-indigo-600">meeting_room</span>
                      <span><strong>Room / House / Floor:</strong> {viewingOrder.houseNumber}</span>
                    </p>
                  )}
                  {viewingOrder.instructions && (
                    <p className="flex items-center gap-1.5 text-slate-600 italic">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">notes</span>
                      <span>"{viewingOrder.instructions}"</span>
                    </p>
                  )}
                  {viewingOrder.customerPhone && (
                    <p className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-slate-500">phone</span>
                      <span>{viewingOrder.customerPhone}</span>
                    </p>
                  )}
                  {viewingOrder.customerEmail && (
                    <p className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-slate-500">mail</span>
                      <span>{viewingOrder.customerEmail}</span>
                    </p>
                  )}
                </div>

                {/* Google Maps Turn-by-Turn GPS Button */}
                {viewingOrder.liveLocationUrl ? (
                  <a
                    href={viewingOrder.liveLocationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">directions</span>
                    <span>Navigate in Google Maps</span>
                  </a>
                ) : viewingOrder.address ? (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(viewingOrder.address + ', Nairobi')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">map</span>
                    <span>Search Pickup Point on Maps</span>
                  </a>
                ) : null}
              </div>

              <div>
                <span className="text-xs text-on-surface-variant block">Assigned Cleaner</span>
                <span className="font-medium text-on-surface">{viewingOrder.cleaners}</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant block">Service Items</span>
                <span className="font-medium text-on-surface">{viewingOrder.items}</span>
              </div>

              {/* M-Pesa Transaction Code Highlight */}
              <div className="bg-surface-container/50 border border-surface-container rounded-xl p-3.5 mt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-emerald-600 text-sm">phone_iphone</span>
                    M-Pesa Transaction Code
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    viewingOrder.paymentStatus === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {viewingOrder.paymentStatus === 'Paid' ? 'Paid' : 'Pending'}
                  </span>
                </div>
                {viewingOrder.transactionId ? (
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-mono text-base font-bold text-primary tracking-widest bg-surface px-3 py-1.5 rounded-lg border border-surface-container">
                      {viewingOrder.transactionId}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(viewingOrder.transactionId);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="text-xs bg-primary/10 hover:bg-primary/20 text-primary font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">{copiedCode ? 'check' : 'content_copy'}</span>
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-outline-variant italic">No M-Pesa transaction code recorded</span>
                )}
              </div>

              <div>
                <span className="text-xs text-on-surface-variant block">Date & Time</span>
                <span className="font-medium text-on-surface">{viewingOrder.date} at {viewingOrder.time}</span>
              </div>
              <div className="flex justify-between items-center border-t border-surface-container/40 pt-3">
                <span className="font-semibold text-on-surface">Total Amount:</span>
                <span className="font-bold text-lg text-primary">{viewingOrder.amount}</span>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  setAssigningOrder(viewingOrder);
                  setViewingOrder(null);
                }}
                className="flex-1 py-2.5 bg-secondary text-on-secondary rounded-full font-label-md hover:bg-secondary/90 transition-colors cursor-pointer"
              >
                Assign Cleaner
              </button>
              <button
                onClick={() => setViewingOrder(null)}
                className="flex-1 py-2.5 bg-primary text-on-primary rounded-full font-label-md hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Provider Modal */}
      {assigningOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl max-w-md w-full p-6 border border-surface-container/60 space-y-4">
            <div className="flex justify-between items-center border-b border-surface-container/40 pb-3">
              <h3 className="font-headline-md text-on-surface">Assign Cleaner / Provider</h3>
              <button
                onClick={() => setAssigningOrder(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="font-body-sm text-on-surface-variant">
              Select an active service provider to fulfill order <strong className="text-primary font-mono">{assigningOrder.displayId}</strong> ({assigningOrder.customer}).
            </p>
            <form onSubmit={handleAssignProviderSubmit} className="space-y-4">
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Select Active Cleaner</label>
                <select
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                  required
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm text-on-surface outline-none border border-transparent focus:border-primary"
                >
                  <option value="">-- Choose a verified cleaner --</option>
                  {activeProviders.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.providerDetails?.businessName || p.fullName} ({p.phone || p.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningOrder(null)}
                  className="px-4 py-2 rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting || !selectedProviderId}
                  className="px-5 py-2 rounded-lg font-label-md bg-primary text-on-primary hover:bg-primary-container shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {assignSubmitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  className="px-4 py-2 rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-label-md bg-primary text-on-primary hover:bg-primary-container shadow-xs cursor-pointer"
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
