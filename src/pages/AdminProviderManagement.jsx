import React, { useState, useEffect } from 'react';

export default function AdmincleanersManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // New cleaners Form State
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newOwner, setNewOwner] = useState('');

  const [cleanerss, setcleanerss] = useState([]);

  // Fetch cleaners/providers from MongoDB
  const fetchProviders = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/auth/providers');
      const json = await res.json();
      if (json.success && json.data) {
        const formatted = json.data.map((p) => ({
          id: p._id,
          name: p.fullName || 'Sparkle Cleaners Ltd',
          owner: p.fullName,
          location: p.addresses?.[0]?.street || 'Nairobi',
          subLocation: p.addresses?.[0]?.city || 'Nairobi, KE',
          status: p.status || 'Active',
          rating: p.rating || 4.8,
          reviewsCount: p.reviewsCount || 15,
          totalOrders: '0',
          ordersTrend: 'Active on platform',
          image: null,
        }));
        setcleanerss(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch providers from MongoDB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/providers/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (json.success) {
        fetchProviders();
      }
    } catch (err) {
      console.error('Failed to update provider status:', err);
    }
  };

  const handleApprove = (id) => handleUpdateStatus(id, 'Active');
  const handleReject = (id) => handleUpdateStatus(id, 'Rejected');
  const handleSuspend = (id) => handleUpdateStatus(id, 'Suspended');
  const handleRestore = (id) => handleUpdateStatus(id, 'Active');

  const handleAddcleanersSubmit = async (e) => {
    e.preventDefault();
    if (!newBusinessName || !newLocation) return;

    try {
      const res = await fetch('http://localhost:5000/api/auth/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBusinessName,
          owner: newOwner,
          location: newLocation
        })
      });
      const json = await res.json();
      if (json.success) {
        fetchProviders();
      }
    } catch (err) {
      console.error('Error creating provider in MongoDB:', err);
    }

    setNewBusinessName('');
    setNewLocation('');
    setNewOwner('');
    setIsAddModalOpen(false);
  };


  // Filtered cleanerss calculation
  const filteredcleanerss = cleanerss.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.owner && p.owner.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = activeFilterTab === 'All' || p.status === activeFilterTab;
    return matchesSearch && matchesStatus;
  });

  const totalCount = cleanerss.length;
  const activeCount = cleanerss.filter(p => p.status === 'Active').length;
  const pendingCount = cleanerss.filter(p => p.status === 'Pending').length;
  const suspendedCount = cleanerss.filter(p => p.status === 'Suspended').length;

  return (
    <div className="flex flex-col gap-stack-gap-lg">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-stack-gap-md bg-surface-container-lowest p-stack-gap-lg rounded-xl shadow-xs border border-surface-container/40">
        <div className="flex flex-col">
          <h1 className="font-headline-lg text-on-surface m-0">cleaners Management</h1>
          <p className="font-body-md text-on-surface-variant m-0 mt-1">
            Manage and monitor all laundry service cleanerss across the platform.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary hover:bg-primary-container text-on-primary font-label-md py-3 px-6 rounded-[16px] transition-colors flex items-center gap-2 shadow-md w-full sm:w-auto justify-center group cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110">
            add_business
          </span>
          Add New cleaners
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-gap-md">
        {/* Total cleanerss */}
        <div className="bg-surface-container-lowest p-stack-gap-lg rounded-xl shadow-xs border border-surface-container/40 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col">
              <span className="font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Total cleanerss</span>
              <span className="font-headline-xl text-on-surface">1,248</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">storefront</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-secondary">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span className="font-label-sm">+12% this month</span>
          </div>
        </div>

        {/* Pending Approval */}
        <div
          onClick={() => setActiveFilterTab('Pending')}
          className="bg-surface-container-lowest p-stack-gap-lg rounded-xl shadow-xs border border-surface-container/40 relative overflow-hidden group cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary-container/5 rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col">
              <span className="font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Pending Approval</span>
              <span className="font-headline-xl text-on-surface">42</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary-container">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span className="font-label-sm">Needs action</span>
          </div>
        </div>

        {/* Suspended */}
        <div
          onClick={() => setActiveFilterTab('Suspended')}
          className="bg-surface-container-lowest p-stack-gap-lg rounded-xl shadow-xs border border-surface-container/40 relative overflow-hidden group cursor-pointer hover:border-rose-400 transition-colors"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-error/5 rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col">
              <span className="font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Suspended</span>
              <span className="font-headline-xl text-error">15</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error">
              <span className="material-symbols-outlined">block</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">gavel</span>
            <span className="font-label-sm">Under review</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container/40 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-stack-gap-md border-b border-surface-variant flex flex-col lg:flex-row gap-4 justify-between items-center bg-surface-container-low/50">
          <div className="relative w-full lg:w-96 group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
              search
            </span>
            <input
              className="w-full bg-surface-container-lowest py-2.5 pl-10 pr-4 rounded-[8px] font-body-sm text-on-surface outline-none shadow-xs focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50"
              placeholder="Search by business name or location..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            <button
              onClick={() => setActiveFilterTab('All')}
              className={`font-label-sm px-4 py-2 rounded-full whitespace-nowrap transition-colors cursor-pointer ${activeFilterTab === 'All'
                ? 'bg-primary/10 text-primary font-semibold'
                : 'bg-transparent text-on-surface-variant hover:bg-surface-container border border-outline-variant'
                }`}
            >
              All cleanerss
            </button>
            <button
              onClick={() => setActiveFilterTab('Active')}
              className={`font-label-sm px-4 py-2 rounded-full whitespace-nowrap transition-colors cursor-pointer ${activeFilterTab === 'Active'
                ? 'bg-primary/10 text-primary font-semibold'
                : 'bg-transparent text-on-surface-variant hover:bg-surface-container border border-outline-variant'
                }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setActiveFilterTab('Pending')}
              className={`font-label-sm px-4 py-2 rounded-full whitespace-nowrap transition-colors cursor-pointer ${activeFilterTab === 'Pending'
                ? 'bg-amber-100 text-amber-900 font-semibold'
                : 'bg-transparent text-on-surface-variant hover:bg-surface-container border border-outline-variant'
                }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setActiveFilterTab('Suspended')}
              className={`font-label-sm px-4 py-2 rounded-full whitespace-nowrap transition-colors cursor-pointer ${activeFilterTab === 'Suspended'
                ? 'bg-rose-100 text-rose-900 font-semibold'
                : 'bg-transparent text-on-surface-variant hover:bg-surface-container border border-outline-variant'
                }`}
            >
              Suspended ({suspendedCount})
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-surface-container-lowest">
              <tr>
                <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold w-1/4">
                  Business Name
                </th>
                <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold w-1/5">
                  Location
                </th>
                <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold w-1/6">
                  Status
                </th>
                <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-right w-1/6">
                  Total Orders
                </th>
                <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold text-right w-1/4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant bg-surface-container-lowest">
              {filteredcleanerss.map((p) => {
                if (p.status === 'Pending') {
                  return (
                    <tr key={p.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0 text-on-surface-variant">
                            <span className="material-symbols-outlined">local_laundry_service</span>
                          </div>
                          <div>
                            <div className="font-label-md text-on-surface font-semibold">{p.name}</div>
                            <div className="font-body-sm text-on-surface-variant mt-0.5">{p.ordersTrend}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-body-sm text-on-surface">{p.location}</div>
                        <div className="font-body-sm text-on-surface-variant text-[12px] mt-0.5">{p.subLocation}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fff8e1] text-[#f57f17]">
                          Pending
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-label-md text-on-surface-variant">--</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(p.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#e6f4ea] text-[#1e8e3e] hover:bg-[#ceead6] font-label-sm transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">check</span> Approve
                          </button>
                          <button
                            onClick={() => handleReject(p.id)}
                            className="px-3 py-1.5 rounded-lg bg-error-container text-on-error-container hover:bg-error/20 font-label-sm transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                if (p.status === 'Suspended') {
                  return (
                    <tr key={p.id} className="hover:bg-surface-container-low transition-colors group bg-surface-container-lowest/50 opacity-80">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0 text-on-surface-variant grayscale">
                            <span className="material-symbols-outlined">iron</span>
                          </div>
                          <div>
                            <div className="font-label-md text-on-surface font-semibold">{p.name}</div>
                            <div className="font-body-sm text-error mt-0.5 flex items-center gap-1 text-[12px]">
                              <span className="material-symbols-outlined text-[14px]">warning</span> {p.ordersTrend}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-body-sm text-on-surface">{p.location}</div>
                        <div className="font-body-sm text-on-surface-variant text-[12px] mt-0.5">{p.subLocation}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-error-container text-on-error-container">
                          Suspended
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-label-md text-on-surface">{p.totalOrders}</div>
                        <div className="font-body-sm text-on-surface-variant text-[12px] mt-0.5">Historical</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleRestore(p.id)}
                            className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-variant font-label-sm transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">restore</span> Restore
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                // Default: Active row
                return (
                  <tr key={p.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center overflow-hidden flex-shrink-0">
                          {p.image ? (
                            <img className="w-full h-full object-cover" alt={p.name} src={p.image} />
                          ) : (
                            <span className="material-symbols-outlined text-primary">storefront</span>
                          )}
                        </div>
                        <div>
                          <div className="font-label-md text-on-surface font-semibold">{p.name}</div>
                          <div className="font-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                            {p.rating && (
                              <>
                                <span className="material-symbols-outlined text-[14px] text-amber-500">star</span>
                                <span>{p.rating} ({p.reviewsCount} reviews)</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-body-sm text-on-surface">{p.location}</div>
                      <div className="font-body-sm text-on-surface-variant text-[12px] mt-0.5">{p.subLocation}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e6f4ea] text-[#1e8e3e]">
                        Active
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-label-md text-on-surface">{p.totalOrders}</div>
                      <div className="font-body-sm text-secondary text-[12px] mt-0.5">{p.ordersTrend}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleSuspend(p.id)}
                          className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-error transition-colors cursor-pointer"
                          title="Suspend"
                        >
                          <span className="material-symbols-outlined text-[18px]">block</span>
                        </button>
                        <button
                          onClick={() => alert(`Editing cleaners details for ${p.name}`)}
                          className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-primary transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-stack-gap-md border-t border-surface-variant flex items-center justify-between bg-surface-container-lowest">
          <div className="font-body-sm text-on-surface-variant">
            Showing <span className="font-semibold text-on-surface">1</span> to{' '}
            <span className="font-semibold text-on-surface">{filteredcleanerss.length}</span> of{' '}
            <span className="font-semibold text-on-surface">1,248</span> cleanerss
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-on-primary font-label-sm text-label-sm transition-colors">
              1
            </button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-container font-label-sm text-label-sm transition-colors">
              2
            </button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-container font-label-sm text-label-sm transition-colors">
              3
            </button>
            <span className="w-8 h-8 flex items-center justify-center text-on-surface-variant">...</span>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add New cleaners Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl max-w-md w-full p-6 border border-surface-container/60 space-y-4">
            <div className="flex justify-between items-center border-b border-surface-container/40 pb-3">
              <h3 className="font-headline-md text-on-surface">Add New Laundry cleaners</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddcleanersSubmit} className="space-y-4">
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wash & Go Kilimani"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm text-on-surface outline-none border border-transparent focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Owner / Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm text-on-surface outline-none border border-transparent focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Location / Area</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Westlands, Nairobi"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm text-on-surface outline-none border border-transparent focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-label-md bg-primary text-on-primary hover:bg-primary-container shadow-xs"
                >
                  Register cleaners
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
