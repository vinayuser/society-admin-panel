import React, { useEffect, useState } from 'react';
import { Card, CardBody, Table, Spinner, Input } from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';
import { toast } from 'react-toastify';

const DeliveriesList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [flatFilter, setFlatFilter] = useState('');

  const fetchList = () => {
    setLoading(true);
    const params = {};
    if (dateFilter) params.date = dateFilter;
    if (flatFilter) params.flat = flatFilter;
    axiosInstance
      .get(ENDPOINTS.DELIVERIES.LIST, { params })
      .then((res) => {
        const d = res.data?.data ?? [];
        setList(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        toast.error('Failed to load deliveries');
        setList([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, flatFilter]);

  const filtered = list;

  const statusBadge = (s) => {
    if (!s) return <span className="badge bg-secondary">-</span>;
    const t = String(s).toLowerCase();
    if (t === 'received' || t === 'notified') return <span className="badge bg-info">{s}</span>;
    if (t === 'collected') return <span className="badge bg-success">{s}</span>;
    return <span className="badge bg-secondary">{s}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1>Delivery Tracking</h1>
        <p className="page-subtitle mb-0">
          Gate delivery log — filter by date or flat number to track packages.
        </p>
      </div>
      <Card className="table-card">
        <CardBody>
          <div className="d-flex flex-wrap gap-4 mb-4">
            <div>
              <label className="form-label small text-muted">Date</label>
              <Input type="date" className="form-control" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} onBlur={fetchList} style={{ maxWidth: 180 }} />
            </div>
            <div>
              <label className="form-label small text-muted">Flat (e.g. A-101)</label>
              <Input className="form-control" value={flatFilter} onChange={(e) => setFlatFilter(e.target.value)} onBlur={fetchList} placeholder="Tower / flat" style={{ maxWidth: 200 }} />
            </div>
          </div>
          {loading ? (
            <div className="d-flex justify-content-center py-5"><Spinner color="primary" /></div>
          ) : (
            <Table responsive hover className="table-striped">
              <thead>
                <tr>
                  <th>Flat</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Received</th>
                  <th>Collected</th>
                  <th>Guard</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>{row.tower && row.flatNumber ? `${row.tower}-${row.flatNumber}` : row.flatLabel || '-'}</td>
                    <td>{row.deliveryType || row.delivery_type || '-'}</td>
                    <td>{statusBadge(row.status)}</td>
                    <td>{row.receivedAt ? new Date(row.receivedAt).toLocaleString() : '-'}</td>
                    <td>{row.collectedAt ? new Date(row.collectedAt).toLocaleString() : '-'}</td>
                    <td>{row.receivedByGuard || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default DeliveriesList;

