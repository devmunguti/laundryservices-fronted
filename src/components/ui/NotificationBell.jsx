import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../../api/notificationApi';
import { useAuth } from '../../hooks/useAuth';
import './NotificationBell.css';

export default function NotificationBell({ className = '' }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);

  // Fetch unread count badge
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationApi.getUnreadCount();
      if (res.success && res.data) {
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // Quiet fail
    }
  }, [isAuthenticated]);

  // Fetch notifications list
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await notificationApi.getNotifications({
        limit: 30,
        read: activeTab === 'unread' ? false : undefined
      });

      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        if (typeof res.data.unreadCount === 'number') {
          setUnreadCount(res.data.unreadCount);
        }
      }
    } catch (err) {
      // Quiet fail
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, activeTab]);

  // Initial poll and recurring interval
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // When dropdown opens or active tab changes, reload list
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, activeTab, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleItemClick = async (notif) => {
    // Optimistic mark read
    if (!notif.read) {
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      notificationApi.markAsRead(notif._id).catch(() => {});
    }

    setIsOpen(false);

    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      // Quiet
    }
  };

  const handleDeleteItem = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      fetchUnreadCount();
    } catch (err) {
      // Quiet
    }
  };

  const getIconForType = (type = '') => {
    if (type.includes('ORDER')) {
      return { icon: 'local_laundry_service', styleClass: 'order' };
    }
    if (type.includes('PAYMENT')) {
      return { icon: 'payments', styleClass: 'payment' };
    }
    if (type.includes('ADMIN') || type.includes('SECURITY')) {
      return { icon: 'notifications_active', styleClass: 'alert' };
    }
    return { icon: 'notifications', styleClass: 'default' };
  };

  if (!isAuthenticated) return null;

  return (
    <div className={`notification-bell-container ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="notification-bell-btn"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        {unreadCount > 0 && (
          <span className="notification-badge" aria-label={`${unreadCount} unread notifications`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs z-90 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="notification-dropdown">
            {/* Header */}
            <div className="notification-header">
              <span className="notification-title">Notifications</span>
              <div className="notification-actions">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="notification-mark-all-btn"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="notification-tabs">
              <button
                type="button"
                className={`notification-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`notification-tab-btn ${activeTab === 'unread' ? 'active' : ''}`}
                onClick={() => setActiveTab('unread')}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* List */}
            <div className="notification-list">
              {loading && notifications.length === 0 ? (
                <div className="notification-empty">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Loading alerts...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">
                  <span className="material-symbols-outlined notification-empty-icon">
                    notifications_off
                  </span>
                  <span className="text-xs font-semibold text-slate-600">No notifications yet</span>
                  <span className="text-[11px] text-slate-400">
                    {activeTab === 'unread' ? 'You are all caught up!' : 'Updates will appear here.'}
                  </span>
                </div>
              ) : (
                notifications.map((item) => {
                  const { icon, styleClass } = getIconForType(item.type);
                  return (
                    <div
                      key={item._id}
                      className={`notification-item ${!item.read ? 'unread' : ''}`}
                      onClick={() => handleItemClick(item)}
                    >
                      <div className={`notification-icon-wrapper ${styleClass}`}>
                        <span className="material-symbols-outlined text-[18px]">{icon}</span>
                      </div>

                      <div className="notification-content">
                        <div className="notification-item-title">
                          <span>{item.title}</span>
                          {!item.read && <span className="notification-unread-dot" />}
                        </div>
                        <p className="notification-item-msg">{item.message}</p>
                        <span className="notification-item-time">
                          {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteItem(e, item._id)}
                        className="notification-dismiss-btn"
                        title="Dismiss"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
