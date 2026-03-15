import { ROLES } from '../constants';

export const getUserRoleInfo = (user) => {
  if (!user?.role) {
    return { isSuperAdmin: false, isSocietyAdmin: false, role: null };
  }
  const role = user.role;
  return {
    isSuperAdmin: role === ROLES.SUPER_ADMIN,
    isSocietyAdmin: role === ROLES.SOCIETY_ADMIN,
    role,
  };
};

export const getNavigationMenu = (user) => {
  const roleInfo = getUserRoleInfo(user);
  if (roleInfo.isSuperAdmin) return getSuperAdminMenu();
  return getSocietyAdminMenu();
};

export const getDefaultPath = (user) => {
  const roleInfo = getUserRoleInfo(user);
  if (roleInfo.isSuperAdmin) return '/admin/dashboard';
  return '/admin/dashboard';
};

export const canAccessRoute = (user, route) => {
  const roleInfo = getUserRoleInfo(user);
  const superAdminPaths = [
    '/admin/dashboard/invites',
    '/admin/dashboard/societies',
    '/admin/dashboard/plans',
    '/admin/dashboard/billing',
    '/admin/dashboard/payments',
    '/admin/dashboard/ads',
    '/admin/dashboard/vendors',
    '/admin/dashboard/deliveries',
    '/admin/dashboard/marketplace',
    '/admin/dashboard/engagement',
    '/admin/dashboard/chat',
    '/admin/dashboard/support',
    '/admin/dashboard/analytics',
    '/admin/dashboard/settings',
  ];
  // Guards: society_admin only (not in superAdminPaths)
  const societyAdminPaths = [
    '/admin/dashboard',
    '/admin/dashboard/residents',
    '/admin/dashboard/members',
    '/admin/dashboard/flats',
    '/admin/dashboard/payments',
    '/admin/dashboard/guards',
    '/admin/dashboard/visitors',
    '/admin/dashboard/complaints',
    '/admin/dashboard/notices',
    '/admin/dashboard/vendors',
    '/admin/dashboard/deliveries',
    '/admin/dashboard/marketplace',
    '/admin/dashboard/engagement',
    '/admin/dashboard/chat',
    '/admin/dashboard/society-settings',
  ];
  if (roleInfo.isSuperAdmin) {
    return route === '/admin/dashboard' || superAdminPaths.some((p) => route.startsWith(p));
  }
  return route === '/admin/dashboard' || societyAdminPaths.some((p) => route.startsWith(p));
};

const getSuperAdminMenu = () => [
  { path: '/admin/dashboard', icon: 'DashboardIcon', label: 'Dashboard', exact: true },
  { path: '/admin/dashboard/invites', icon: 'MailIcon', label: 'Invites' },
  { path: '/admin/dashboard/societies', icon: 'ApartmentIcon', label: 'Societies' },
  { path: '/admin/dashboard/plans', icon: 'CardMembershipIcon', label: 'Plans' },
  { path: '/admin/dashboard/billing', icon: 'ReceiptIcon', label: 'Billing' },
  { path: '/admin/dashboard/payments', icon: 'ReceiptIcon', label: 'Payments' },
  { path: '/admin/dashboard/ads', icon: 'CampaignIcon', label: 'Advertisements' },
  { path: '/admin/dashboard/vendors', icon: 'StorefrontIcon', label: 'Vendor Marketplace' },
  { path: '/admin/dashboard/deliveries', icon: 'LocalShippingIcon', label: 'Deliveries' },
  { path: '/admin/dashboard/marketplace', icon: 'ShoppingCartIcon', label: 'Community Marketplace' },
  { path: '/admin/dashboard/engagement', icon: 'GroupsIcon', label: 'Community Engagement' },
  { path: '/admin/dashboard/chat', icon: 'ChatIcon', label: 'Chat' },
  { path: '/admin/dashboard/support', icon: 'SupportIcon', label: 'Support' },
  { path: '/admin/dashboard/analytics', icon: 'BarChartIcon', label: 'Analytics' },
  { path: '/admin/dashboard/settings', icon: 'SettingsIcon', label: 'Settings' },
];

const getSocietyAdminMenu = () => [
  { path: '/admin/dashboard', icon: 'DashboardIcon', label: 'Dashboard', exact: true },
  { path: '/admin/dashboard/residents', icon: 'PeopleIcon', label: 'Residents' },
  { path: '/admin/dashboard/members', icon: 'PeopleIcon', label: 'Members' },
  { path: '/admin/dashboard/flats', icon: 'ApartmentIcon', label: 'Flats' },
  { path: '/admin/dashboard/payments', icon: 'ReceiptIcon', label: 'Invoices & Payments' },
  { path: '/admin/dashboard/guards', icon: 'SecurityIcon', label: 'Guards' },
  { path: '/admin/dashboard/visitors', icon: 'ExitToAppIcon', label: 'Visitors' },
  { path: '/admin/dashboard/complaints', icon: 'ReportProblemIcon', label: 'Complaints' },
  { path: '/admin/dashboard/notices', icon: 'CampaignIcon', label: 'Notices' },
  { path: '/admin/dashboard/vendors', icon: 'StorefrontIcon', label: 'Vendor Marketplace' },
  { path: '/admin/dashboard/deliveries', icon: 'LocalShippingIcon', label: 'Deliveries' },
  { path: '/admin/dashboard/marketplace', icon: 'ShoppingCartIcon', label: 'Community Marketplace' },
  { path: '/admin/dashboard/engagement', icon: 'GroupsIcon', label: 'Community Engagement' },
  { path: '/admin/dashboard/chat', icon: 'ChatIcon', label: 'Chat' },
  { path: '/admin/dashboard/society-settings', icon: 'SettingsIcon', label: 'Society Settings' },
];
