import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ApartmentIcon from '@mui/icons-material/Apartment';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CampaignIcon from '@mui/icons-material/Campaign';
import SupportIcon from '@mui/icons-material/Support';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import GroupsIcon from '@mui/icons-material/Groups';
import ChatIcon from '@mui/icons-material/Chat';
import { getNavigationMenu } from '../../../helpers/roleUtils';

const iconMap = {
  ChatIcon,
  DashboardIcon,
  MailIcon: MailOutlineIcon,
  ApartmentIcon,
  CardMembershipIcon,
  ReceiptIcon,
  CampaignIcon,
  SupportIcon,
  BarChartIcon,
  SettingsIcon,
  PeopleIcon,
  SecurityIcon,
  ExitToAppIcon,
  ReportProblemIcon,
  StorefrontIcon,
  LocalShippingIcon,
  ShoppingCartIcon,
  GroupsIcon,
};

const Sidebar = ({ isCollapsed, isSidebarOpenMobile, setIsSidebarOpenMobile }) => {
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const menuItems = getNavigationMenu(user || {}).map((item) => ({
    ...item,
    icon: iconMap[item.icon] || SettingsIcon,
  }));

  const sidebarClass = [
    'Sidebar',
    isCollapsed ? 'collapsed' : '',
    isSidebarOpenMobile ? 'open-mobile' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={sidebarClass} style={isSidebarOpenMobile ? { zIndex: 1100 } : {}}>
      {isSidebarOpenMobile && (
        <button
          type="button"
          className="sidebar-mobile-close"
          onClick={() => setIsSidebarOpenMobile(false)}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'none',
            border: 'none',
            fontSize: 28,
            color: '#fff',
            zIndex: 1201,
            cursor: 'pointer',
          }}
          aria-label="Close menu"
        >
          ×
        </button>
      )}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.path} className="nav-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  end={item.exact}
                >
                  <IconComponent className="nav-icon" />
                  {!isCollapsed && <span className="nav-label">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="sidebar-bottom">
        Society Management Admin
      </div>
    </div>
  );
};

export default Sidebar;
