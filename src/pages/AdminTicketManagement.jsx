import React, { useState, useEffect, useCallback } from 'react';
import { ticketApi } from '../api/ticketApi';

export default function AdminTicketManagement() {
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ticket Reply Drawer Modal State
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

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

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit,
        status: filterStatus !== 'All' ? filterStatus : undefined,
        search: debouncedSearch
      };
      const res = await ticketApi.getTickets(params);
      if (res.success && res.data) {
        setTickets(res.data.tickets || []);
        if (res.data.pagination) setPagination(res.data.pagination);
      } else {
        setError(res.message || 'Failed to fetch tickets.');
      }
    } catch (err) {
      console.error('Failed to fetch tickets from MongoDB:', err);
      setError(err.response?.data?.message || err.message || 'Error loading tickets.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterStatus, debouncedSearch]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleUpdateStatus = async (ticketId, status) => {
    try {
      const res = await ticketApi.updateTicketStatus(ticketId, { status });
      if (res.success) {
        await fetchTickets();
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
        await fetchTickets();
      } else {
        alert(res.message || 'Failed to send message.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error posting reply.');
    } finally {
      setReplySubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-stack-gap-lg relative">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-xs border border-surface-container/40">
        <div>
          <h1 className="font-headline-xl text-on-surface">Ticket & Support Management</h1>
          <p className="font-body-md text-on-surface-variant mt-1">
            Review and resolve support tickets, dispute inquiries, and client messages from MongoDB.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search Ticket ID or Subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surface-container py-2 pl-9 pr-4 rounded-full text-xs font-body-sm text-on-surface outline-none border border-transparent focus:border-primary"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md py-2 px-4 rounded-full outline-none cursor-pointer border border-transparent focus:border-primary text-xs"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In_Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-xs border border-surface-container/40 flex flex-col overflow-hidden relative min-h-[350px]">
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
            <button onClick={fetchTickets} className="underline font-semibold cursor-pointer">Retry</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
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
                    No support tickets found.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t._id} className="hover:bg-surface-container-low/40 transition-colors group">
                    <td className="py-4 px-6 font-label-md font-semibold text-primary">{t.ticketId || t._id}</td>
                    <td className="py-4 px-6">
                      <div className="font-label-md text-on-surface font-semibold">{t.user?.fullName || 'User'}</div>
                      <div className="font-body-sm text-on-surface-variant text-[11px]">{t.user?.email}</div>
                    </td>
                    <td className="py-4 px-6 font-body-sm font-medium text-on-surface max-w-xs truncate">{t.subject}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${t.priority === 'Urgent' || t.priority === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-surface-container text-on-surface-variant'
                        }`}>
                        {t.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${t.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : t.status === 'In_Progress' ? 'bg-amber-100 text-amber-800' : 'bg-surface-container text-on-surface-variant'
                        }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenTicket(t._id)}
                          className="bg-primary hover:bg-primary-container text-on-primary font-label-md text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
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
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-surface-container/60 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-surface-container/40 pb-3">
              <div>
                <h3 className="font-headline-md text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">confirmation_number</span>
                  {activeTicket.ticketId}: {activeTicket.subject}
                </h3>
                <p className="font-body-sm text-on-surface-variant text-xs mt-1">
                  User: <span className="font-semibold">{activeTicket.user?.fullName}</span> ({activeTicket.user?.email}) | Priority: <span className="font-semibold">{activeTicket.priority}</span>
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
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-surface-container-low/50 rounded-xl max-h-72">
              {activeTicket.messages?.map((msg, i) => (
                <div key={i} className="bg-surface-container-lowest p-3 rounded-lg border border-surface-container/40 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-primary">{msg.sender?.fullName || 'User'}</span>
                    <span className="text-on-surface-variant text-[11px]">{new Date(msg.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="font-body-sm text-on-surface whitespace-pre-line">{msg.text}</p>
                </div>
              ))}
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
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(activeTicket._id, 'Resolved')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-label-sm hover:bg-emerald-200 cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(activeTicket._id, 'Closed')}
                    className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant font-label-sm hover:bg-surface-variant cursor-pointer"
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
    </div>
  );
}
