import React, { useState, useEffect } from 'react';
import { Button, Card, CardBody, Table, Spinner } from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';
import { toast } from 'react-toastify';

const statusColors = { open: 'warning', in_progress: 'info', resolved: 'success' };

const ComplaintsList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchList = () => {
    setLoading(true);
    axiosInstance
      .get(ENDPOINTS.COMPLAINTS.LIST)
      .then((res) => {
        const d = res.data?.data ?? [];
        setList(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        toast.error('Failed to load complaints');
        setList([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleStatusChange = (row, newStatus) => {
    setUpdatingId(row.id);
    axiosInstance
      .patch(ENDPOINTS.COMPLAINTS.UPDATE_STATUS(row.id), { status: newStatus })
      .then((res) => {
        if (res.data?.success) {
          toast.success('Status updated');
          fetchList();
        } else {
          toast.error(res.data?.message || 'Failed to update');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to update'))
      .finally(() => setUpdatingId(null));
  };

  const statusBadgeClass = (s) => {
    if (s === 'resolved') return 'bg-success';
    if (s === 'in_progress') return 'bg-info';
    return 'bg-warning';
  };

  return (
    <div>
      <div className="page-header">
        <h1>Complaints</h1>
        <p className="page-subtitle mb-0">Manage and resolve resident complaints.</p>
      </div>
      <Card className="table-card">
        <CardBody>
          {loading ? (
            <div className="d-flex justify-content-center py-5"><Spinner color="primary" /></div>
          ) : (
            <Table responsive hover className="table-striped">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Raised by</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.id}>
                    <td><strong>{row.title}</strong></td>
                    <td className="text-muted small" style={{ maxWidth: 200 }}>{row.description || '-'}</td>
                    <td>{row.userName || '-'}<br /><small className="text-muted">{row.userPhone || ''}</small></td>
                    <td>{row.category || '-'}</td>
                    <td>
                      <span className={`badge ${statusBadgeClass(row.status)}`}>{row.status?.replace('_', ' ') || row.status}</span>
                    </td>
                    <td>{row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {row.status !== 'open' && (
                          <Button size="sm" color="warning" outline className="rounded-2" onClick={() => handleStatusChange(row, 'open')} disabled={updatingId === row.id}>Open</Button>
                        )}
                        {row.status !== 'in_progress' && (
                          <Button size="sm" color="info" outline className="rounded-2" onClick={() => handleStatusChange(row, 'in_progress')} disabled={updatingId === row.id}>In progress</Button>
                        )}
                        {row.status !== 'resolved' && (
                          <Button size="sm" color="success" outline className="rounded-2" onClick={() => handleStatusChange(row, 'resolved')} disabled={updatingId === row.id}>Resolve</Button>
                        )}
                        {updatingId === row.id && <span className="text-muted align-self-center">…</span>}
                      </div>
                    </td>
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

export default ComplaintsList;
