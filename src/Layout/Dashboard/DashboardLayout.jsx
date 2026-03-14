import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import useAuthMiddleware from '../../useAuthMiddleware';
import Navbar from './Partials/Navbar';
import Sidebar from './Partials/Sidebar';
import Footer from './Partials/Footer';

const DashboardLayout = () => {
  const { loading } = useAuthMiddleware();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255,255,255,0.9)',
          zIndex: 9999,
        }}
      >
        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <div className="dashboard-top">
        <Navbar
          setIsSidebarOpenMobile={setIsSidebarOpenMobile}
          isCollapsed={isCollapsed}
          onToggleSidebar={() => setIsCollapsed((c) => !c)}
        />
      </div>
      <div className="dashboard-body">
        {isSidebarOpenMobile && (
          <div
            className="sidebar-overlay"
            onClick={() => setIsSidebarOpenMobile(false)}
            onKeyDown={(e) => e.key === 'Escape' && setIsSidebarOpenMobile(false)}
            role="button"
            tabIndex={0}
            aria-label="Close sidebar"
          />
        )}
        <div className="sidebar-container">
          <Sidebar
            isCollapsed={isCollapsed}
            isSidebarOpenMobile={isSidebarOpenMobile}
            setIsSidebarOpenMobile={setIsSidebarOpenMobile}
          />
        </div>
        <div className="dashboard-main-wrapper">
          <main className="dashboard-main" id="main-content">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
