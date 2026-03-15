import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LandingLayout from './Layout/Landing/LandingLayout';
import AuthLayout from './Layout/Auth/AuthLayout';
import DashboardLayout from './Layout/Dashboard/DashboardLayout';
import LandingHome from './Pages/Landing/Home';
import LandingFeatures from './Pages/Landing/Features';
import LandingContact from './Pages/Landing/Contact';
import Login from './Pages/Auth/Login';
import Home from './Pages/Dashboard/Home';
import InvitesList from './Pages/Dashboard/Invites/List';
import SocietiesList from './Pages/Dashboard/Societies/List';
import BillingList from './Pages/Dashboard/Billing/List';
import PaymentsPage from './Pages/Dashboard/Payments/PaymentsPage';
import PlansList from './Pages/Dashboard/Plans/List';
import AdsList from './Pages/Dashboard/Ads/List';
import Support from './Pages/Dashboard/Support';
import AnalyticsView from './Pages/Dashboard/Analytics/AnalyticsView';
import Settings from './Pages/Dashboard/Settings';
import ResidentsList from './Pages/Dashboard/Residents/List';
import MembersList from './Pages/Dashboard/Members/List';
import MemberDetail from './Pages/Dashboard/Members/Detail';
import FlatsList from './Pages/Dashboard/Flats/List';
import FlatDetail from './Pages/Dashboard/Flats/Detail';
import GuardsList from './Pages/Dashboard/Guards/List';
import GuardProfile from './Pages/Dashboard/Guards/Profile';
import VisitorsList from './Pages/Dashboard/Visitors/List';
import ComplaintsList from './Pages/Dashboard/Complaints/List';
import NoticesList from './Pages/Dashboard/Notices/List';
import SocietySettings from './Pages/Dashboard/SocietySettings';
import VendorsList from './Pages/Dashboard/Vendors/List';
import DeliveriesList from './Pages/Dashboard/Deliveries/List';
import MarketplaceList from './Pages/Dashboard/Marketplace/List';
import EngagementPage from './Pages/Dashboard/Engagement/List';
import ChatList from './Pages/Dashboard/Chat/List';
import ChatRoom from './Pages/Dashboard/Chat/Room';
import Onboarding from './Pages/Invite/Onboarding';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => (
  <Router>
    <ToastContainer position="top-right" autoClose={5000} />
    <Routes>
      <Route path="/invite/:token" element={<Onboarding />} />

      <Route path="/" element={<LandingLayout />}>
        <Route index element={<LandingHome />} />
        <Route path="features" element={<LandingFeatures />} />
        <Route path="contact" element={<LandingContact />} />
      </Route>

      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
      </Route>

      <Route path="/admin" element={<DashboardLayout />}>
        <Route path="dashboard" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="dashboard/invites" element={<ProtectedRoute allowedRoles={['super_admin']}><InvitesList /></ProtectedRoute>} />
        <Route path="dashboard/societies" element={<ProtectedRoute allowedRoles={['super_admin']}><SocietiesList /></ProtectedRoute>} />
        <Route path="dashboard/plans" element={<ProtectedRoute allowedRoles={['super_admin']}><PlansList /></ProtectedRoute>} />
        <Route path="dashboard/billing" element={<ProtectedRoute allowedRoles={['super_admin']}><BillingList /></ProtectedRoute>} />
        <Route path="dashboard/payments" element={<ProtectedRoute allowedRoles={['super_admin', 'society_admin']}><PaymentsPage /></ProtectedRoute>} />
        <Route path="dashboard/ads" element={<ProtectedRoute allowedRoles={['super_admin']}><AdsList /></ProtectedRoute>} />
        <Route path="dashboard/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
        <Route path="dashboard/analytics" element={<ProtectedRoute allowedRoles={['super_admin']}><AnalyticsView /></ProtectedRoute>} />
        <Route path="dashboard/settings" element={<ProtectedRoute allowedRoles={['super_admin']}><Settings /></ProtectedRoute>} />
        <Route path="dashboard/residents" element={<ProtectedRoute><ResidentsList /></ProtectedRoute>} />
        <Route path="dashboard/members" element={<ProtectedRoute><MembersList /></ProtectedRoute>} />
        <Route path="dashboard/members/:id" element={<ProtectedRoute><MemberDetail /></ProtectedRoute>} />
        <Route path="dashboard/flats" element={<ProtectedRoute><FlatsList /></ProtectedRoute>} />
        <Route path="dashboard/flats/:id" element={<ProtectedRoute><FlatDetail /></ProtectedRoute>} />
        <Route path="dashboard/guards" element={<ProtectedRoute allowedRoles={['society_admin']}><GuardsList /></ProtectedRoute>} />
        <Route path="dashboard/guards/:id" element={<ProtectedRoute allowedRoles={['society_admin']}><GuardProfile /></ProtectedRoute>} />
        <Route path="dashboard/visitors" element={<ProtectedRoute><VisitorsList /></ProtectedRoute>} />
        <Route path="dashboard/complaints" element={<ProtectedRoute><ComplaintsList /></ProtectedRoute>} />
        <Route path="dashboard/notices" element={<ProtectedRoute><NoticesList /></ProtectedRoute>} />
        <Route path="dashboard/society-settings" element={<ProtectedRoute><SocietySettings /></ProtectedRoute>} />
        <Route path="dashboard/vendors" element={<ProtectedRoute><VendorsList /></ProtectedRoute>} />
        <Route path="dashboard/deliveries" element={<ProtectedRoute><DeliveriesList /></ProtectedRoute>} />
        <Route path="dashboard/marketplace" element={<ProtectedRoute><MarketplaceList /></ProtectedRoute>} />
        <Route path="dashboard/engagement" element={<ProtectedRoute><EngagementPage /></ProtectedRoute>} />
        <Route path="dashboard/chat" element={<ProtectedRoute><ChatList /></ProtectedRoute>} />
        <Route path="dashboard/chat/:groupId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Router>
);

export default App;
