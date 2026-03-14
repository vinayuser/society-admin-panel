import React, { useState, useEffect } from 'react';
import { Card, CardBody, Row, Col, Spinner } from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';

const AnalyticsView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(ENDPOINTS.ANALYTICS.DASHBOARD)
      .then((res) => { if (res.data?.success) setData(res.data.data); })
      .catch(() => setData({}))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="d-flex justify-content-center py-5"><Spinner /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Analytics</h1>
      </div>
      <Row>
        <Col md={3}><Card><CardBody><div className="text-muted small">Total Societies</div><div className="h4">{data?.totalSocieties ?? 0}</div></CardBody></Card></Col>
        <Col md={3}><Card><CardBody><div className="text-muted small">Total Residents</div><div className="h4">{data?.totalResidents ?? 0}</div></CardBody></Card></Col>
        <Col md={3}><Card><CardBody><div className="text-muted small">Monthly Revenue</div><div className="h4">₹{Number(data?.monthlyRevenue || 0).toLocaleString()}</div></CardBody></Card></Col>
        <Col md={3}><Card><CardBody><div className="text-muted small">New This Month</div><div className="h4">{data?.newSocietiesThisMonth ?? 0}</div></CardBody></Card></Col>
      </Row>
    </div>
  );
};

export default AnalyticsView;
