import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { logoutUser } from '../../../store/slices/authSlice';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LogoutIcon from '@mui/icons-material/Logout';

const Navbar = ({ setIsSidebarOpenMobile, isCollapsed, onToggleSidebar }) => {
  const { user } = useSelector((state) => state.auth);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

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
              <span className="badge bg-danger">3</span>
            </button>
            {notificationsOpen && (
              <div
                className="dropdown-menu show position-absolute"
                style={{ right: 0, left: 'auto', minWidth: 280, marginTop: 8 }}
              >
                <div className="px-3 py-2 border-bottom">
                  <strong className="small">Notifications</strong>
                </div>
                <div className="p-3 text-muted small text-center">No new notifications</div>
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
