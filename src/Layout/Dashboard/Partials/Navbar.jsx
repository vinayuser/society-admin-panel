import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { logoutUser } from '../../../store/slices/authSlice';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LogoutIcon from '@mui/icons-material/Logout';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';
import { formatNotificationItem } from '../../../helpers/notificationUtils';

const Navbar = ({ setIsSidebarOpenMobile, isCollapsed, onToggleSidebar }) => {
  const { user } = useSelector((state) => state.auth);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  /** From API when list is paginated; falls back to counting loaded rows */
  const [serverUnreadCount, setServerUnreadCount] = useState(null);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const fetchNotifications = useCallback(() => {
    setNotificationsLoading(true);
    axiosInstance
      .get(ENDPOINTS.NOTIFICATIONS.LIST)
      .then((res) => {
        if (res.data?.success) {
          setNotifications(res.data.data || []);
          setServerUnreadCount(typeof res.data.unreadCount === 'number' ? res.data.unreadCount : null);
        }
      })
      .catch(() => setNotifications([]))
      .finally(() => setNotificationsLoading(false));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    axiosInstance
      .post(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ)
      .then((res) => {
        if (res.data?.success) fetchNotifications();
      })
      .catch(() => {});
  }, [fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (notificationsOpen) fetchNotifications();
  }, [notificationsOpen, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotificationsOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logoutUser();
  };

  const unreadCount =
    serverUnreadCount != null ? serverUnreadCount : notifications.filter((n) => !n.readAt).length;
  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <nav className="dashboard-navbar">
      <div className="navbar-content">
        <button
          type="button"
          className="navbar-hamburger btn btn-link p-0 border-0 d-md-none"
          onClick={() => setIsSidebarOpenMobile(true)}
          aria-label="Open menu"
        >
          <MenuIcon fontSize="medium" />
        </button>
        {onToggleSidebar && (
          <button
            type="button"
            className="navbar-hamburger btn btn-link p-0 border-0 d-none d-md-flex"
            onClick={onToggleSidebar}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button>
        )}
        <div className="navbar-brand">
          <span>Society</span> Management
        </div>
        <div className="navbar-search d-none d-lg-block position-relative">
          <SearchIcon className="position-absolute" style={{ left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 20, color: 'var(--text-muted)' }} />
          <input type="search" className="form-control" placeholder="Search..." aria-label="Search" />
        </div>
        <div className="navbar-actions">
          <div className="position-relative" ref={notifRef}>
            <button
              type="button"
              className="navbar-icon-btn"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label="Notifications"
            >
              <NotificationsNoneIcon fontSize="small" />
              {unreadCount > 0 && (
                <span className="badge bg-danger" style={{ fontSize: '0.7rem' }}>{unreadCount}</span>
              )}
            </button>
            {notificationsOpen && (
              <div
                className="dropdown-menu show position-absolute shadow"
                style={{ right: 0, left: 'auto', minWidth: 320, maxWidth: 360, maxHeight: 400, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                <div className="px-3 py-2 border-bottom bg-light d-flex justify-content-between align-items-center flex-wrap gap-1">
                  <strong className="small">Notifications</strong>
                  {unreadCount > 0 && (
                    <span className="d-flex align-items-center gap-2">
                      <span className="small text-muted">({unreadCount} unread)</span>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 small text-primary"
                        onClick={markAllNotificationsRead}
                      >
                        Mark all read
                      </button>
                    </span>
                  )}
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {notificationsLoading ? (
                    <div className="p-3 text-center text-muted small">Loading…</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-3 text-muted small text-center">No notifications</div>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {notifications.slice(0, 20).map((n) => {
                        const item = formatNotificationItem(n);
                        return (
                          <li
                            key={n.id}
                            className="list-group-item border-0 py-2 px-3 small"
                            style={{ backgroundColor: n.readAt ? undefined : 'rgba(13, 110, 253, 0.06)' }}
                          >
                            <span className={n.readAt ? 'text-muted' : 'fw-medium'}>
                              {item.icon} {item.title}
                            </span>
                            {item.body && (
                              <div className="text-muted mt-1" style={{ fontSize: '0.85em', whiteSpace: 'pre-wrap' }}>
                                {item.body}
                              </div>
                            )}
                            <small className="text-muted d-block mt-1">
                              {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                            </small>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="navbar-user dropdown" ref={dropdownRef}>
            <button
              type="button"
              className="dropdown-toggle"
              onClick={() => setDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
            >
              <span className="navbar-avatar">{initial}</span>
              <span className="d-none d-sm-inline text-start">
                <span className="d-block small fw-semibold" style={{ lineHeight: 1.2 }}>{user?.name || user?.email || 'User'}</span>
                <span className="badge bg-primary small">{user?.role || ''}</span>
              </span>
            </button>
            {isDropdownOpen && (
              <ul className="dropdown-menu show" style={{ right: 0, left: 'auto' }}>
                <li>
                  <button type="button" className="dropdown-item d-flex align-items-center gap-2" onClick={handleLogout}>
                    <LogoutIcon fontSize="small" /> Logout
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
