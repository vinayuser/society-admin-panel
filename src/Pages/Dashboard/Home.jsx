import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Spinner, Button, Card, CardBody, CardHeader } from 'reactstrap';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import axiosInstance from '../../config/axiosInstance';
import ENDPOINTS from '../../config/apiUrls';
import { getUserRoleInfo } from '../../helpers/roleUtils';

const StatCard = ({ title, value, icon: Icon, variant = 'primary' }) => (
  <div className={`stat-card stat-card-${variant}`}>
    {Icon && (
      <div className={`stat-icon ${variant}`}>
        <Icon style={{ fontSize: 24 }} />
      </div>
    )}
    <div className="stat-value">{value}</div>
    <div className="stat-label">{title}</div>
  </div>
);

const Home = () => {
  const user = useSelector((state) => state.auth.user);
  const roleInfo = getUserRoleInfo(user);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [societyStats, setSocietyStats] = useState({ members: 0, flats: 0, openComplaints: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roleInfo.isSuperAdmin) {
      axiosInstance
        .get(ENDPOINTS.ANALYTICS.DASHBOARD)
        .then((res) => {
          if (res.data?.success && res.data?.data) setStats(res.data.data);
        })
        .catch(() => setStats({}))
        .finally(() => setLoading(false));
      return;
    }
    if (roleInfo.isSocietyAdmin) {
      Promise.all([
        axiosInstance.get(ENDPOINTS.RESIDENTS.LIST),
        axiosInstance.get(ENDPOINTS.FLATS.LIST),
        axiosInstance.get(ENDPOINTS.COMPLAINTS.LIST),
      ])
        .then(([rRes, fRes, cRes]) => {
          const members = Array.isArray(rRes.data?.data) ? rRes.data.data.length : 0;
          const flats = Array.isArray(fRes.data?.data) ? fRes.data.data.length : 0;
          const complaints = Array.isArray(cRes.data?.data) ? cRes.data.data : [];
          const openComplaints = complaints.filter((c) => c.status === 'open').length;
          setSocietyStats({ members, flats, openComplaints });
        })
        .catch(() => setSocietyStats({ members: 0, flats: 0, openComplaints: 0 }))
        .finally(() => setLoading(false));
      return;
    }
    setLoading(false);
  }, [roleInfo.isSuperAdmin, roleInfo.isSocietyAdmin]);

  const recentActivity = [
    { id: 1, title: 'New resident registered', meta: '2 hours ago', icon: 'people' },
    { id: 2, title: 'Complaint #12 resolved', meta: '5 hours ago', icon: 'support' },
    { id: 3, title: 'Notice published', meta: 'Yesterday', icon: 'campaign' },
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner color="primary" style={{ width: '2.5rem', height: '2.5rem' }} />
      </div>
    );
  }

  if (roleInfo.isSuperAdmin && stats) {
    return (
      <div>
        <div className="page-header">
          <h1>Dashboard</h1>
          <p className="page-subtitle">Overview of all societies and revenue</p>
        </div>
        <Row className="g-4 mb-4">
          <Col md={6} lg={3}>
            <StatCard title="Total Societies" value={stats.totalSocieties ?? 0} icon={ApartmentIcon} variant="primary" />
          </Col>
          <Col md={6} lg={3}>
            <StatCard title="Active Societies" value={stats.activeSocieties ?? 0} icon={TrendingUpIcon} variant="success" />
          </Col>
          <Col md={6} lg={3}>
            <StatCard title="Total Residents" value={stats.totalResidents ?? 0} icon={PeopleIcon} variant="info" />
          </Col>
          <Col md={6} lg={3}>
            <StatCard title="Monthly Revenue" value={`₹${Number(stats.monthlyRevenue || 0).toLocaleString()}`} icon={ReceiptIcon} variant="warning" />
          </Col>
        </Row>
        <Row>
          <Col lg={8}>
            <Card className="mb-4">
              <CardHeader>Visitor & complaint trends</CardHeader>
              <CardBody className="text-center text-muted py-5">
                <small>Charts can be wired to analytics API when available.</small>
              </CardBody>
            </Card>
          </Col>
          <Col lg={4}>
            <Card>
              <CardHeader>Recent activity</CardHeader>
              <CardBody className="p-0">
                <ul className="activity-list">
                  {recentActivity.map((a) => (
                    <li key={a.id} className="activity-item">
                      <div className="activity-icon"><PeopleIcon fontSize="small" /></div>
                      <div className="activity-body">
                        <div className="activity-title">{a.title}</div>
                        <div className="activity-meta">{a.meta}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  if (roleInfo.isSocietyAdmin) {
    return (
      <div>
        <div className="page-header">
          <h1>Dashboard</h1>
          <p className="page-subtitle">Welcome, {user?.name || user?.email}. Quick overview of your society.</p>
        </div>
        <Row className="g-4 mb-4">
          <Col md={6} lg={3}>
            <StatCard title="Society members" value={societyStats.members} icon={PeopleIcon} variant="primary" />
          </Col>
          <Col md={6} lg={3}>
            <StatCard title="Flats" value={societyStats.flats} icon={ApartmentIcon} variant="info" />
          </Col>
          <Col md={6} lg={3}>
            <StatCard title="Open complaints" value={societyStats.openComplaints} icon={ReportProblemIcon} variant="warning" />
          </Col>
          <Col md={6} lg={3}>
            <div className="stat-card">
              <div className="stat-icon primary"><PersonAddIcon style={{ fontSize: 24 }} /></div>
              <div className="stat-label mb-3">Add society members</div>
              <Button color="primary" size="sm" className="rounded-2" onClick={() => navigate('/admin/dashboard/residents?add=1')}>
                Add member
              </Button>
            </div>
          </Col>
        </Row>
        <Row>
          <Col lg={4}>
            <Card>
              <CardHeader>Recent activity</CardHeader>
              <CardBody className="p-0">
                <ul className="activity-list">
                  {recentActivity.slice(0, 2).map((a) => (
                    <li key={a.id} className="activity-item">
                      <div className="activity-icon"><PeopleIcon fontSize="small" /></div>
                      <div className="activity-body">
                        <div className="activity-title">{a.title}</div>
                        <div className="activity-meta">{a.meta}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Welcome, {user?.name || user?.email}</p>
      </div>
      <Card>
        <CardBody>
          <p className="text-muted mb-0">Use the sidebar to manage your society.</p>
        </CardBody>
      </Card>
    </div>
  );
};

export default Home;
