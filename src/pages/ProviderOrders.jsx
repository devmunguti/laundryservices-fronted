import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderApi } from '../api/orderApi';

export default function cleanersOrders({ isStandalone = true }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Orders & Metrics State
  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState({
    todayOrders: 0,
    yesterdayOrders: 0,
    growthFormatted: '+0%',
    isPositiveGrowth: true,
    pendingPickups: 0,
    urgentPickups: 0,
    inWash: 0,
    readyForDelivery: 0,
    outForDelivery: 0,
    delivered: 0,
    totalOrders: 0
  });

  const fetchOrdersAndMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const [ordersRes, metricsRes] = await Promise.all([
        orderApi.getOrders({
          search: searchQuery,
          status: filterTab !== 'all' ? filterTab : undefined
        }),
        orderApi.getOrderMetrics().catch(() => ({ success: false }))
      ]);

      if (ordersRes.success && ordersRes.data) {
        const rawList = ordersRes.data.orders || [];
        const formatted = rawList.map((o) => {
          const custName = o.customerDetails?.fullName || o.customer?.fullName || 'Guest Customer';
          const custPhone = o.customerDetails?.phone || o.customer?.phone || o.payment?.phoneNumber || '';
          const custEmail = o.customerDetails?.email || o.customer?.email || '';
          const campusLoc = o.pickupAddress?.campusLocation || o.pickupAddress?.street || 'Nairobi';
          const roomNo = o.pickupAddress?.houseNumber || '';
          const instruct = o.pickupAddress?.instructions || o.notes || '';
          const coords = o.pickupAddress?.coordinates || null;
          const mapUrl = o.pickupAddress?.liveLocationUrl || (coords?.lat ? `https://maps.google.com/?q=${coords.lat},${coords.lng}` : '');

          return {
            id: o.orderRef || `#ORD-${o._id.slice(-6).toUpperCase()}`,
            rawId: o._id,
            customer: custName,
            customerPhone: custPhone,
            customerEmail: custEmail,
            campusLocation: campusLoc,
            houseNumber: roomNo,
            instructions: instruct,
            coordinates: coords,
            liveLocationUrl: mapUrl,
            avatarInitials: custName.split(' ').map(n => n[0]).join('').slice(0, 2),
            avatarBg: 'bg-[#dde1ff] text-[#001452]',
            address: roomNo ? `${campusLoc} (${roomNo})` : campusLoc,
            service: o.items?.[0]?.name || 'Standard Wash',
            serviceIcon: 'local_laundry_service',
            itemCount: `${o.items?.length || 1} item(s)`,
            date: new Date(o.createdAt || Date.now()).toLocaleDateString(),
            time: new Date(o.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: (o.status || 'Pending').toLowerCase().replace(/_/g, '-'),
            rawStatus: o.status || 'Pending',
            statusLabel: (o.status || 'Pending').replace(/_/g, ' '),
            statusBg: o.status === 'Cancelled' ? 'bg-[#eeeef0] text-[#737688]' : o.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-[#c2e8ff]/40 text-[#004d67]',
            statusDot: o.status === 'Cancelled' ? 'bg-[#737688]' : o.status === 'Delivered' ? 'bg-emerald-600' : 'bg-[#006688]',
            amount: `KES ${(o.pricing?.grandTotal || o.totalAmount || 0).toLocaleString()}`,
            transactionId: o.payment?.transactionId || null,
            paymentStatus: o.paymentStatus || 'Pending'
          };
        });
        setOrders(formatted);
      }

      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch provider orders & metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterTab]);

  useEffect(() => {
    fetchOrdersAndMetrics();
  }, [fetchOrdersAndMetrics]);

  const handleUpdateStatus = async (rawId, newMongoStatus) => {
    try {
      setUpdatingOrderId(rawId);
      const res = await orderApi.updateOrderStatus(rawId, newMongoStatus);
      if (res.success) {
        await fetchOrdersAndMetrics();
      } else {
        alert(res.message || 'Failed to update order status.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating order status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const filteredOrders = orders.filter(ord => {
    const matchesSearch = ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = filterTab === 'all' || ord.rawStatus === filterTab || ord.status === filterTab;
    return matchesSearch && matchesTab;
  });

  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const mainContent = (
    <div className="flex flex-col w-full h-full relative font-['Inter'] text-[#1a1c1e]">
      {/* Top Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Today's Orders */}
        <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group p-6 sm:p-8 border border-[#c3c5d9]/10">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="font-['Geist'] text-xs text-[#434656] uppercase tracking-wider font-semibold mb-2">Today's Orders</p>
              <h3 className="font-['Geist'] text-3xl md:text-4xl font-bold text-[#1a1c1e]">
                {metrics.todayOrders}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#0052ff]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#0052ff] text-[28px]">receipt_long</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 font-['Geist'] text-xs font-semibold">
            <span className={`material-symbols-outlined text-[16px] ${metrics.isPositiveGrowth ? 'text-[#008800]' : 'text-[#ba1a1a]'}`}>
              {metrics.isPositiveGrowth ? 'trending_up' : 'trending_down'}
            </span>
            <span className={metrics.isPositiveGrowth ? 'text-[#008800]' : 'text-[#ba1a1a]'}>
              {metrics.growthFormatted}
            </span>
            <span className="text-[#434656] font-normal">vs yesterday ({metrics.yesterdayOrders})</span>
          </div>
        </div>

        {/* Card 2: Pending Pickups */}
        <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group p-6 sm:p-8 border border-[#c3c5d9]/10">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="font-['Geist'] text-xs text-[#434656] uppercase tracking-wider font-semibold mb-2">Pending Pickups</p>
              <h3 className="font-['Geist'] text-3xl md:text-4xl font-bold text-[#1a1c1e]">
                {metrics.pendingPickups}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#00c1fd]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#00c1fd] text-[28px]">local_shipping</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 font-['Geist'] text-xs font-semibold">
            {metrics.urgentPickups > 0 ? (
              <>
                <span className="material-symbols-outlined text-[16px] text-[#ba1a1a]">priority_high</span>
                <span className="text-[#ba1a1a]">{metrics.urgentPickups} Urgent</span>
                <span className="text-[#434656] font-normal">require attention</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px] text-[#008800]">check_circle</span>
                <span className="text-[#008800]">All on schedule</span>
              </>
            )}
          </div>
        </div>

        {/* Card 3: Ready for Delivery */}
        <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group p-6 sm:p-8 border border-[#c3c5d9]/10">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="font-['Geist'] text-xs text-[#434656] uppercase tracking-wider font-semibold mb-2">Ready for Delivery</p>
              <h3 className="font-['Geist'] text-3xl md:text-4xl font-bold text-[#1a1c1e]">
                {metrics.readyForDelivery}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#61666f]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#61666f] text-[28px]">inventory_2</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 font-['Geist'] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#0052ff]"></span>
            <span className="text-[#434656] font-normal">
              {metrics.readyForDelivery > 0 ? `${metrics.readyForDelivery} ready to dispatch` : 'No orders awaiting dispatch'}
            </span>
          </div>
        </div>
      </div>

      {/* Orders Management Container */}
      <div className="bg-white rounded-3xl shadow-xs flex flex-col overflow-hidden border border-[#c3c5d9]/10">
        <div className="p-6 sm:p-8 bg-white border-b border-[#c3c5d9]/20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <h1 className="font-['Geist'] text-2xl font-bold text-[#1a1c1e]">Orders Management</h1>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#434656] text-[20px]">search</span>
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#f3f3f6] text-[#1a1c1e] placeholder:text-[#434656] font-['Inter'] text-sm pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50"
                />
              </div>
              <button className="flex items-center gap-2 bg-[#f3f3f6] hover:bg-[#e8e8ea] transition-colors text-[#1a1c1e] font-['Geist'] text-sm font-medium px-4 py-2.5 rounded-xl whitespace-nowrap">
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                <span>Today, {todayFormatted}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All Orders', count: metrics.totalOrders },
              { id: 'Pending', label: 'Pending Pickups', count: metrics.pendingPickups },
              { id: 'In_Wash', label: 'In Wash / Cleaning', count: metrics.inWash },
              { id: 'Ready_For_Delivery', label: 'Ready for Delivery', count: metrics.readyForDelivery },
              { id: 'Delivered', label: 'Delivered', count: metrics.delivered },
              { id: 'Cancelled', label: 'Cancelled', count: metrics.cancelled },
            ].map((tab) => {
              const isSelected = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id)}
                  className={`px-4 py-2 rounded-full font-['Geist'] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${isSelected
                    ? 'bg-[#0052ff] text-[#dfe3ff] shadow-xs'
                    : 'bg-[#f3f3f6] text-[#434656] hover:bg-[#e8e8ea] hover:text-[#1a1c1e]'
                    }`}
                >
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isSelected ? 'bg-[#dfe3ff] text-[#0038b6]' : 'bg-[#0052ff] text-white'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-[#f9f9fc] border-b border-[#c3c5d9]/30">
              <tr>
                <th className="font-['Geist'] text-xs text-[#434656] uppercase tracking-wider font-semibold px-6 py-4">Order ID</th>
                <th className="font-['Geist'] text-xs text-[#434656] uppercase tracking-wider font-semibold px-6 py-4">Customer</th>
                <th className="font-['Geist'] text-xs text-[#434656] uppercase tracking-wider font-semibold px-6 py-4">Service</th>
                <th className="font-['Geist'] text-xs text-[#434656] uppercase tracking-wider font-semibold px-6 py-4">Date & Time</th>
                <th className="font-['Geist'] text-xs text-[#434656] uppercase tracking-wider font-semibold px-6 py-4">Status</th>
                <th className="font-['Geist'] text-xs text-[#434656] uppercase tracking-wider font-semibold text-right px-6 py-4">Amount</th>
                <th className="font-['Geist'] text-xs text-[#434656] uppercase tracking-wider font-semibold text-center w-28 px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c3c5d9]/10 text-sm">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#434656] font-['Inter'] text-sm">
                    No orders found matching your search.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#f3f3f6]/40 transition-colors group cursor-pointer">
                    <td className="font-mono text-[#1a1c1e] font-bold px-6 py-6">{ord.id}</td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${ord.avatarBg} flex items-center justify-center font-['Geist'] text-xs font-bold`}>
                          {ord.avatarInitials}
                        </div>
                        <div>
                          <p className="font-['Geist'] text-sm font-semibold text-[#1a1c1e]">{ord.customer}</p>
                          <p className="font-['Inter'] text-xs text-[#434656]">{ord.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-[#494e57]">{ord.serviceIcon}</span>
                        <span className="font-['Inter'] text-sm text-[#1a1c1e] font-medium">{ord.service}</span>
                      </div>
                      <p className="font-['Inter'] text-xs text-[#434656] mt-0.5">{ord.itemCount}</p>
                    </td>
                    <td className="px-6 py-6">
                      <p className="font-['Inter'] text-sm text-[#1a1c1e] font-medium">{ord.date}</p>
                      <p className="font-['Inter'] text-xs text-[#434656]">{ord.time}</p>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${ord.statusBg} font-['Geist'] text-xs font-semibold`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${ord.statusDot}`}></span>
                        {ord.statusLabel}
                      </span>
                    </td>
                    <td className="text-right font-['Geist'] font-semibold text-[#1a1c1e] px-6 py-6">{ord.amount}</td>
                    <td className="px-6 py-6">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedOrder(ord);
                            setIsDetailsModalOpen(true);
                          }}
                          className="w-8 h-8 rounded-full hover:bg-[#e8e8ea] flex items-center justify-center text-[#434656] hover:text-[#003ec7] transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button
                          onClick={() => navigate(`/provider/navigate/${ord.rawId || ord.id}`)}
                          className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors cursor-pointer shadow-2xs"
                          title="Start Live In-App Navigation"
                        >
                          <span className="material-symbols-outlined text-[18px]">navigation</span>
                        </button>
                        <button
                          onClick={() => setUpdatingOrderId(ord.id)}
                          className="w-8 h-8 rounded-full hover:bg-[#e8e8ea] flex items-center justify-center text-[#434656] hover:text-[#003ec7] transition-colors cursor-pointer"
                          title="Update Status"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="border-t border-[#c3c5d9]/30 flex flex-col sm:flex-row items-center justify-between text-[#434656] font-['Inter'] text-sm p-6 gap-4">
          <p>Showing 1 to {filteredOrders.length} of {metrics.totalOrders || filteredOrders.length} entries</p>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="w-8 h-8 rounded-lg bg-[#f3f3f6] hover:bg-[#e8e8ea] flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

            {[1, 2, 3].map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg font-['Geist'] text-xs font-semibold flex items-center justify-center transition-all ${currentPage === page ? 'bg-[#0052ff] text-white shadow-xs' : 'bg-white hover:bg-[#f3f3f6] text-[#1a1c1e]'
                  }`}
              >
                {page}
              </button>
            ))}
            <span className="px-1 text-xs">...</span>
            <button
              onClick={() => setCurrentPage(15)}
              className="w-8 h-8 rounded-lg bg-white hover:bg-[#f3f3f6] font-['Geist'] text-xs font-semibold flex items-center justify-center transition-colors text-[#1a1c1e]"
            >
              15
            </button>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, 15))}
              className="w-8 h-8 rounded-lg bg-[#f3f3f6] hover:bg-[#e8e8ea] flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-6 right-6 text-[#434656] hover:bg-[#e8e8ea] rounded-full p-1 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-xl font-bold text-[#003ec7]">{selectedOrder.id}</span>
              <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold uppercase ${selectedOrder.statusBg}`}>
                {selectedOrder.statusLabel}
              </span>
            </div>
            <div className="space-y-3 border-t border-[#c3c5d9]/30 pt-4 text-sm font-['Inter']">
              {/* Customer Contact & Live House Destination */}
              <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-200/70 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-blue-700 font-bold uppercase tracking-wider block">Customer &amp; Location</span>
                    <h4 className="font-bold text-slate-900 text-sm">{selectedOrder.customer}</h4>
                  </div>
                  {selectedOrder.customerPhone && (
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${selectedOrder.customerPhone}`}
                        className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-xs"
                        title="Direct Call"
                      >
                        <span className="material-symbols-outlined text-[16px]">call</span>
                      </a>
                      <a
                        href={`https://wa.me/${selectedOrder.customerPhone.replace(/[^0-9]/g, '')}`}
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
                    <span><strong>Pickup Station:</strong> {selectedOrder.campusLocation}</span>
                  </p>
                  {selectedOrder.houseNumber && (
                    <p className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-indigo-600">meeting_room</span>
                      <span><strong>Room / House / Floor:</strong> {selectedOrder.houseNumber}</span>
                    </p>
                  )}
                  {selectedOrder.instructions && (
                    <p className="flex items-center gap-1.5 text-slate-600 italic">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">notes</span>
                      <span>"{selectedOrder.instructions}"</span>
                    </p>
                  )}
                  {selectedOrder.customerPhone && (
                    <p className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-slate-500">phone</span>
                      <span>{selectedOrder.customerPhone}</span>
                    </p>
                  )}
                  {selectedOrder.customerEmail && (
                    <p className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-slate-500">mail</span>
                      <span>{selectedOrder.customerEmail}</span>
                    </p>
                  )}
                </div>

                {/* In-System Live Navigation & External Map Buttons */}
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => navigate(`/provider/navigate/${selectedOrder.rawId || selectedOrder.id}`)}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">navigation</span>
                    <span>Start In-App Live Navigation (Uber Mode)</span>
                  </button>

                  {selectedOrder.liveLocationUrl ? (
                    <a
                      href={selectedOrder.liveLocationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      <span>Open External Google Maps</span>
                    </a>
                  ) : null}
                </div>
              </div>

              <div>
                <span className="text-xs text-[#434656] block">Service Type</span>
                <span className="font-medium text-[#1a1c1e]">{selectedOrder.service} • {selectedOrder.itemCount}</span>
              </div>
              <div>
                <span className="text-xs text-[#434656] block">Date &amp; Time</span>
                <span className="font-medium text-[#1a1c1e]">{selectedOrder.date} at {selectedOrder.time}</span>
              </div>

              {/* M-Pesa Transaction Code Highlight */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#434656] font-semibold uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-green-600 text-sm">phone_iphone</span>
                    M-Pesa Transaction Code
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedOrder.paymentStatus === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedOrder.paymentStatus === 'Paid' ? 'Paid' : 'Pending'}
                  </span>
                </div>
                {selectedOrder.transactionId ? (
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-mono text-base font-bold text-[#003ec7] tracking-widest bg-white px-3 py-1 rounded border border-[#c3c5d9]/40">
                      {selectedOrder.transactionId}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(selectedOrder.transactionId);
                        alert('M-Pesa Code Copied!');
                      }}
                      className="text-xs bg-[#003ec7]/10 hover:bg-[#003ec7]/20 text-[#003ec7] font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                      <span>Copy</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 italic">No M-Pesa code recorded</span>
                )}
              </div>

              <div className="flex justify-between items-center border-t border-[#c3c5d9]/30 pt-3">
                <span className="font-semibold text-[#1a1c1e]">Total Amount:</span>
                <span className="font-bold text-lg text-[#003ec7]">{selectedOrder.amount}</span>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full py-2.5 bg-[#003ec7] text-white rounded-full font-['Geist'] text-sm font-medium hover:bg-[#0038b6] transition-colors"
              >
                Close Order Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {updatingOrderId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setUpdatingOrderId(null)}
              className="absolute top-6 right-6 text-[#434656] hover:bg-[#e8e8ea] rounded-full p-1 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="font-['Geist'] text-xl font-bold text-[#1a1c1e] mb-4">Update Status for {updatingOrderId}</h3>
              {[
                { status: 'Pending', label: '1. Order Placed / Pending', bg: 'bg-amber-100 text-amber-900', dot: 'bg-amber-600' },
                { status: 'Pickup_Scheduled', label: '2. Pickup Scheduled', bg: 'bg-blue-100 text-blue-900', dot: 'bg-blue-600' },
                { status: 'Picked_Up', label: '3. Picked Up', bg: 'bg-indigo-100 text-indigo-900', dot: 'bg-indigo-600' },
                { status: 'In_Wash', label: '4. In Wash / Cleaning', bg: 'bg-[#c2e8ff]/40 text-[#004d67]', dot: 'bg-[#006688]' },
                { status: 'Ready_For_Delivery', label: '5. Ready for Delivery', bg: 'bg-[#0052ff]/20 text-[#0038b6]', dot: 'bg-[#0052ff]' },
                { status: 'Out_For_Delivery', label: '6. Out for Delivery', bg: 'bg-purple-100 text-purple-900', dot: 'bg-purple-600' },
                { status: 'Delivered', label: '7. Delivered / Completed', bg: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-600' },
                { status: 'Cancelled', label: 'Cancelled', bg: 'bg-[#eeeef0] text-[#737688]', dot: 'bg-[#737688]' },
              ].map(opt => {
                const targetOrd = orders.find(o => o.id === updatingOrderId);
                const isCurrent = targetOrd && targetOrd.statusLabel === opt.status;
                return (
                  <button
                    key={opt.status}
                    onClick={() => targetOrd && handleUpdateStatus(targetOrd.rawId, opt.status)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border font-['Geist'] text-sm font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      isCurrent
                        ? 'border-[#0052ff] bg-[#0052ff]/5 text-[#0052ff]'
                        : 'border-[#c3c5d9]/30 hover:bg-[#f3f3f6] text-[#1a1c1e]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${opt.dot}`}></span>
                      <span>{opt.label}</span>
                    </div>
                    {isCurrent && (
                      <span className="text-xs bg-[#0052ff] text-white px-2 py-0.5 rounded-full font-normal">Current</span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      )}

    </div>
  );

  if (!isStandalone) {
    return mainContent;
  }

  return (
    <div className="bg-[#f9f9fc] font-['Inter'] text-[#1a1c1e] min-h-screen flex flex-col">
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      <aside className={`fixed left-0 top-0 h-full w-72 bg-[#f3f3f6] z-50 flex flex-col shadow-[1px_0_0_0_rgba(0,0,0,0.05)] transition-transform duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="px-8 py-6 flex items-center justify-end md:hidden">
          <button
            className="text-[#434656] p-1 rounded-lg hover:bg-[#e8e8ea]"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <nav className="flex-1 px-4 mt-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all gap-3 text-left font-['Geist'] text-sm font-medium ${activeTab === item.id ? 'bg-[#0052ff] text-[#dfe3ff]' : 'text-[#434656] hover:bg-[#e8e8ea]'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </button>
          ))}
        </nav>
      </aside>
      <div className="md:pl-72 flex flex-col min-h-screen">
        <main className="flex-1 bg-[#f9f9fc] p-6 md:p-10">
          {mainContent}
        </main>
      </div>
    </div>
  );
}
