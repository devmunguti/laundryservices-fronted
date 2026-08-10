import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

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

  // Orders State
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/orders');
      const json = await res.json();
      if (json.success && json.data) {
        const formatted = json.data.map((o) => ({
          id: `#ORD-${o._id.slice(-6).toUpperCase()}`,
          rawId: o._id,
          customer: o.customer?.fullName || 'Guest Customer',
          avatarInitials: (o.customer?.fullName || 'GC').split(' ').map(n => n[0]).join('').slice(0, 2),
          avatarBg: 'bg-[#dde1ff] text-[#001452]',
          address: o.pickupAddress?.street || 'Nairobi',
          service: o.items?.[0]?.name || 'Standard Wash',
          serviceIcon: 'local_laundry_service',
          itemCount: `${o.items?.length || 1} item(s)`,
          date: new Date(o.createdAt || Date.now()).toLocaleDateString(),
          time: new Date(o.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: (o.status || 'Pending').toLowerCase().replace(' ', '-'),
          statusLabel: o.status || 'Pending',
          statusBg: o.status === 'Cancelled' ? 'bg-[#eeeef0] text-[#737688]' : 'bg-[#c2e8ff]/40 text-[#004d67]',
          statusDot: o.status === 'Cancelled' ? 'bg-[#737688]' : 'bg-[#006688]',
          amount: `KES ${o.pricing?.grandTotal || o.totalAmount || 0}`
        }));
        setOrders(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch provider orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (rawId, newMongoStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${rawId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newMongoStatus })
      });
      const json = await res.json();
      if (json.success) {
        fetchOrders();
      }
    } catch (err) {
      console.error('Failed to update order status in MongoDB:', err);
    }
    setUpdatingOrderId(null);
  };


  const filteredOrders = orders.filter(ord => {
    const matchesSearch = ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = filterTab === 'all' || ord.status === filterTab;
    return matchesSearch && matchesTab;
  });

  const mainContent = (
    <div className="flex flex-col w-full h-full relative font-['Inter'] text-[#1a1c1e]">
      {/* Top Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group p-6 sm:p-8 border border-[#c3c5d9]/10">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="font-['Geist'] text-xs text-[#434656] uppercase tracking-wider font-semibold mb-2">Today's Orders</p>
              <h3 className="font-['Geist'] text-3xl md:text-4xl font-bold text-[#1a1c1e]">142</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#0052ff]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#0052ff] text-[28px]">receipt_long</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 font-['Geist'] text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px] text-[#008800]">trending_up</span>
            <span className="text-[#008800]">+12%</span>
            <span className="text-[#434656] font-normal">vs yesterday</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group p-6 sm:p-8 border border-[#c3c5d9]/10">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="font-['Geist'] text-xs text-[#434656] uppercase tracking-wider font-semibold mb-2">Pending Pickups</p>
              <h3 className="font-['Geist'] text-3xl md:text-4xl font-bold text-[#1a1c1e]">28</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#00c1fd]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#00c1fd] text-[28px]">local_shipping</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 font-['Geist'] text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px] text-[#ba1a1a]">priority_high</span>
            <span className="text-[#ba1a1a]">5 Urgent</span>
            <span className="text-[#434656] font-normal">require attention</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group p-6 sm:p-8 border border-[#c3c5d9]/10">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="font-['Geist'] text-xs text-[#434656] uppercase tracking-wider font-semibold mb-2">Ready for Delivery</p>
              <h3 className="font-['Geist'] text-3xl md:text-4xl font-bold text-[#1a1c1e]">45</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#61666f]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#61666f] text-[28px]">inventory_2</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 font-['Geist'] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#0052ff]"></span>
            <span className="text-[#434656] font-normal">Ready to dispatch</span>
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
                <span>Today, Oct 24</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'pending', label: 'Pending' },
              { id: 'in-progress', label: 'In Progress' },
              { id: 'ready-for-pickup', label: 'Already Delivered', count: 12 },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' },
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
                  {tab.count && (
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
                          onClick={() => setSelectedOrder(ord)}
                          className="w-8 h-8 rounded-full hover:bg-[#e8e8ea] flex items-center justify-center text-[#434656] hover:text-[#003ec7] transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
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
          <p>Showing 1 to {filteredOrders.length} of 142 entries</p>
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
              <div>
                <span className="text-xs text-[#434656] block">Customer</span>
                <span className="font-medium text-[#1a1c1e]">{selectedOrder.customer} ({selectedOrder.address})</span>
              </div>
              <div>
                <span className="text-xs text-[#434656] block">Service Type</span>
                <span className="font-medium text-[#1a1c1e]">{selectedOrder.service} • {selectedOrder.itemCount}</span>
              </div>
              <div>
                <span className="text-xs text-[#434656] block">Date & Time</span>
                <span className="font-medium text-[#1a1c1e]">{selectedOrder.date} at {selectedOrder.time}</span>
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
            <div className="space-y-2">
              {[
                { status: 'Pending', label: 'Pending Pickup', bg: 'bg-amber-100 text-amber-900', dot: 'bg-amber-600' },
                { status: 'In_Wash', label: 'In Progress', bg: 'bg-[#c2e8ff]/40 text-[#004d67]', dot: 'bg-[#006688]' },
                { status: 'Ready_For_Delivery', label: 'Ready for Delivery', bg: 'bg-[#0052ff]/20 text-[#0038b6]', dot: 'bg-[#0052ff]' },
                { status: 'Delivered', label: 'Completed', bg: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-600' },
                { status: 'Cancelled', label: 'Cancelled', bg: 'bg-[#eeeef0] text-[#737688]', dot: 'bg-[#737688]' },
              ].map(opt => {
                const targetOrd = orders.find(o => o.id === updatingOrderId);
                return (
                  <button
                    key={opt.status}
                    onClick={() => targetOrd && handleUpdateStatus(targetOrd.rawId, opt.status)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-[#c3c5d9]/30 hover:bg-[#f3f3f6] font-['Geist'] text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className={`w-2 h-2 rounded-full ${opt.dot}`}></span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
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
