import React, { useState, useEffect, useCallback } from 'react';
import { ticketApi } from '../api/ticketApi';

export default function AdminTicketManagement() {
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ticket Metrics
  const [metrics, setMetrics] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    urgent: 0
  });

  // Ticket Reply Modal State
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // New Ticket Modal State
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newInitialMessage, setNewInitialMessage] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  });

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchTicketsAndMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit,
        status: filterStatus !== 'All' ? filterStatus : undefined,
        priority: filterPriority !== 'All' ? filterPriority : undefined,
        search: debouncedSearch
      };

      const [ticketsRes, metricsRes] = await Promise.all([
        ticketApi.getTickets(params),
        ticketApi.getTicketMetrics().catch(() => ({ success: false }))
      ]);

      if (ticketsRes.success && ticketsRes.data) {
        setTickets(ticketsRes.data.tickets || []);
        if (ticketsRes.data.pagination) setPagination(ticketsRes.data.pagination);
      } else {
        setError(ticketsRes.message || 'Failed to fetch tickets.');
      }

      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch tickets from MongoDB:', err);
      setError(err.response?.data?.message || err.message || 'Error loading tickets.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterStatus, filterPriority, debouncedSearch]);

  useEffect(() => {
    fetchTicketsAndMetrics();
  }, [fetchTicketsAndMetrics]);

  const handleUpdateStatus = async (ticketId, status) => {
    try {
      const res = await ticketApi.updateTicketStatus(ticketId, { status });
      if (res.success) {
        await fetchTicketsAndMetrics();
        if (activeTicket && activeTicket._id === ticketId) {
          const detailRes = await ticketApi.getTicketById(ticketId);
          if (detailRes.success) setActiveTicket(detailRes.data);
        }
      } else {
        alert(res.message || 'Failed to update ticket status.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status.');
    }
  };

  const handleOpenTicket = async (ticketId) => {
    try {
      const res = await ticketApi.getTicketById(ticketId);
      if (res.success && res.data) {
        setActiveTicket(res.data);
      }
    } catch (err) {
      alert('Failed to load ticket conversation.');
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!activeTicket || !replyMessage.trim()) return;

    try {
      setReplySubmitting(true);
      const res = await ticketApi.addTicketMessage(activeTicket._id, replyMessage.trim());
      if (res.success) {
        setReplyMessage('');
        const detailRes = await ticketApi.getTicketById(activeTicket._id);
        if (detailRes.success) setActiveTicket(detailRes.data);
        await fetchTicketsAndMetrics();
      } else {
        alert(res.message || 'Failed to send message.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error posting reply.');
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newInitialMessage.trim()) return;

    try {
      setCreateSubmitting(true);
      const res = await ticketApi.createTicket({
        subject: newSubject.trim(),
        priority: newPriority,
        initialMessage: newInitialMessage.trim()
      });
      if (res.success) {
        setIsNewTicketModalOpen(false);
        setNewSubject('');
        setNewInitialMessage('');
        setNewPriority('Medium');
        await fetchTicketsAndMetrics();
      } else {
        alert(res.message || 'Failed to create ticket.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating ticket.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-stack-gap-lg relative">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-stack-gap-md relative z-10">
        <div className="flex flex-col gap-unit">
          <h1 className="font-headline-xl text-on-surface">Ticket & Support Management</h1>
          <p className="font-body-md text-on-surface-variant">
            Resolve customer inquiries, order disputes, and cleaner support requests in real time.
          </p>
        </div>
        <button
          onClick={() => setIsNewTicketModalOpen(true)}
          className="bg-primary text-on-primary px-6 py-3 rounded-xl font-label-md shadow-md hover:shadow-lg transition-shadow flex items-center gap-2 relative overflow-hidden group cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] relative z-10">add</span>
          <span className="relative z-10">Open New Ticket</span>
          <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
        </button>
      </div>

      {/* Top 4 Analytics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-gap-md">
        {/* Card 1: Open / Pending */}
        <div
          onClick={() => setFilterStatus('Open')}
          className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container/40 flex flex-col justify-between group hover:-translate-y-1 transition-transform cursor-pointer"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">Open Tickets</span>
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">pending_actions</span>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-headline-lg text-on-surface">{metrics.open}</span>
            {metrics.urgent > 0 && (
              <span className="bg-rose-100 text-rose-800 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">priority_high</span>
                {metrics.urgent} Urgent
              </span>
            )}
          </div>
        </div>

        {/* Card 2: In Progress */}
        <div
          onClick={() => setFilterStatus('In_Progress')}
          className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container/40 flex flex-col justify-between group hover:-translate-y-1 transition-transform cursor-pointer"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">In Progress</span>
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-headline-lg text-on-surface">{metrics.inProgress}</span>
            <span className="text-blue-700 bg-blue-50 text-xs px-2 py-0.5 rounded-full font-medium">Active Discussions</span>
          </div>
        </div>

        {/* Card 3: Resolved */}
        <div
          onClick={() => setFilterStatus('Resolved')}
          className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container/40 flex flex-col justify-between group hover:-translate-y-1 transition-transform cursor-pointer"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">Resolved</span>
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-headline-lg text-on-surface">{metrics.resolved}</span>
            <span className="text-emerald-700 bg-emerald-50 text-xs px-2 py-0.5 rounded-full font-medium">Closed & Solved</span>
          </div>
        </div>

        {/* Card 4: Total Tickets */}
        <div
          onClick={() => setFilterStatus('All')}
          className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container/40 flex flex-col justify-between group hover:-translate-y-1 transition-transform cursor-pointer"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">Total Tickets</span>
            <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-headline-lg text-on-surface">{metrics.total}</span>
            <span className="text-on-surface-variant text-xs font-medium">All Time</span>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-xs border border-surface-container/40 flex flex-col overflow-hidden relative min-h-[350px]">
        {/* Toolbar with Tabs & Search */}
        <div className="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-surface-container/30 border-b border-surface-container/40">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'All', label: 'All Tickets' },
              { id: 'Open', label: 'Open' },
              { id: 'In_Progress', label: 'In Progress' },
              { id: 'Resolved', label: 'Resolved' },
              { id: 'Closed', label: 'Closed' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setFilterStatus(tab.id);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-full font-label-md transition-colors cursor-pointer text-xs ${filterStatus === tab.id
                  ? 'bg-primary text-on-primary shadow-xs font-semibold'
                  : 'bg-surface-container hover:bg-surface-variant text-on-surface-variant'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3 w-full lg:w-auto items-center">
            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => {
                setFilterPriority(e.target.value);
                setPage(1);
              }}
              className="bg-surface py-2 px-3 rounded-xl font-body-sm text-on-surface outline-none border border-outline-variant/30 text-xs cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Search Box */}
            <div className="relative w-full lg:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search ticket ID, subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface py-2 pl-10 pr-4 rounded-xl font-body-sm text-on-surface outline-none border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary transition-all text-xs"
              />
            </div>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="flex items-center gap-3 font-body-md text-primary">
              <span className="material-symbols-outlined animate-spin text-[28px]">sync</span>
              Loading tickets from MongoDB...
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex justify-between items-center">
            <span>{error}</span>
            <button onClick={fetchTicketsAndMetrics} className="underline font-semibold cursor-pointer">Retry</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">Ticket ID</th>
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">User</th>
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">Subject</th>
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">Priority</th>
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 font-label-sm text-on-surface-variant uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-on-surface divide-y divide-surface-container/40">
              {tickets.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant font-body-md">
                    No support tickets found matching this criteria.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t._id} className="hover:bg-surface-container-low/40 transition-colors group">
                    <td className="py-4 px-6 font-label-md font-semibold text-primary font-mono">{t.ticketId || t._id}</td>
                    <td className="py-4 px-6">
                      <div className="font-label-md text-on-surface font-semibold">{t.user?.fullName || 'User'}</div>
                      <div className="font-body-sm text-on-surface-variant text-[11px]">{t.user?.email || t.user?.phone || 'No contact'}</div>
                    </td>
                    <td className="py-4 px-6 font-body-sm font-medium text-on-surface max-w-xs truncate">{t.subject}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        t.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-800'
                          : t.priority === 'High'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        {t.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        t.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'In_Progress'
                          ? 'bg-blue-100 text-blue-800'
                          : t.status === 'Open'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          t.status === 'Resolved' ? 'bg-emerald-600' : t.status === 'In_Progress' ? 'bg-blue-600' : 'bg-amber-600'
                        }`} />
                        {t.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenTicket(t._id)}
                          className="bg-primary hover:bg-primary-container text-on-primary font-label-md text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[16px]">forum</span> View & Reply
                        </button>
                        {t.status !== 'Resolved' && (
                          <button
                            onClick={() => handleUpdateStatus(t._id, 'Resolved')}
                            className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-label-md text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-surface-container-lowest border-t border-surface-container/40 flex justify-between items-center">
          <span className="font-body-sm text-on-surface-variant">
            Showing page <span className="font-semibold">{pagination.page}</span> of <span className="font-semibold">{pagination.totalPages}</span> ({pagination.total} total tickets)
          </span>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!pagination.hasPreviousPage || loading}
              className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded transition-colors disabled:opacity-30 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNextPage || loading}
              className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded transition-colors disabled:opacity-30 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ticket Reply Modal / Drawer */}
      {activeTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-surface-container/60 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-surface-container/40 pb-3">
              <div>
                <h3 className="font-headline-md text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">confirmation_number</span>
                  {activeTicket.ticketId}: {activeTicket.subject}
                </h3>
                <p className="font-body-sm text-on-surface-variant text-xs mt-1">
                  User: <span className="font-semibold">{activeTicket.user?.fullName}</span> ({activeTicket.user?.email || activeTicket.user?.phone}) | Priority: <span className="font-semibold">{activeTicket.priority}</span>
                </p>
              </div>
              <button
                onClick={() => setActiveTicket(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Conversation Messages Thread */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-surface-container-low/50 rounded-2xl max-h-72">
              {activeTicket.messages?.map((msg, i) => {
                const isAdmin = msg.sender?.role === 'admin';
                return (
                  <div
                    key={i}
                    className={`p-3.5 rounded-xl border ${
                      isAdmin
                        ? 'bg-primary/5 border-primary/20 ml-6'
                        : 'bg-surface-container-lowest border-surface-container/40 mr-6'
                    } space-y-1`}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className={`font-semibold flex items-center gap-1 ${isAdmin ? 'text-primary' : 'text-on-surface'}`}>
                        {isAdmin && <span className="material-symbols-outlined text-[14px]">shield_person</span>}
                        {msg.sender?.fullName || 'User'}
                        {isAdmin && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-bold">Admin</span>}
                      </span>
                      <span className="text-on-surface-variant text-[11px]">{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="font-body-sm text-on-surface whitespace-pre-line">{msg.text}</p>
                  </div>
                );
              })}
            </div>

            {/* Admin Reply Form */}
            <form onSubmit={handleSendReply} className="space-y-3">
              <textarea
                required
                rows={3}
                placeholder="Type your response to the user..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="w-full bg-surface-container p-3 rounded-xl font-body-sm text-on-surface outline-none border border-transparent focus:border-primary"
              />
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(activeTicket._id, 'In_Progress')}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 font-label-sm hover:bg-blue-100 cursor-pointer text-xs font-semibold"
                  >
                    Mark In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(activeTicket._id, 'Resolved')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-label-sm hover:bg-emerald-200 cursor-pointer text-xs font-semibold"
                  >
                    Mark Resolved
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(activeTicket._id, 'Closed')}
                    className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant font-label-sm hover:bg-surface-variant cursor-pointer text-xs"
                  >
                    Close Ticket
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={replySubmitting || !replyMessage.trim()}
                  className="px-5 py-2 rounded-lg font-label-md bg-primary text-on-primary hover:bg-primary-container shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  {replySubmitting ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-surface-container/60 space-y-4">
            <div className="flex justify-between items-center border-b border-surface-container/40 pb-3">
              <h3 className="font-headline-md text-on-surface">Open Support Ticket</h3>
              <button
                onClick={() => setIsNewTicketModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateTicketSubmit} className="space-y-4">
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Subject / Issue Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delayed Delivery Investigation"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm text-on-surface outline-none border border-transparent focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Priority Level</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm text-on-surface outline-none border border-transparent focus:border-primary"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Initial Description / Note</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide details regarding the ticket..."
                  value={newInitialMessage}
                  onChange={(e) => setNewInitialMessage(e.target.value)}
                  className="w-full bg-surface-container p-3 rounded-lg font-body-sm text-on-surface outline-none border border-transparent focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2 rounded-lg font-label-md bg-primary text-on-primary hover:bg-primary-container shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {createSubmitting ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
