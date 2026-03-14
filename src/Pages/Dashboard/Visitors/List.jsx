import React, { useState, useEffect } from 'react';
import { Card, CardBody, Table, Spinner } from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';

const VisitorsList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(ENDPOINTS.VISITORS.LIST)
      .then((res) => { const d = res.data?.data ?? []; setList(Array.isArray(d) ? d : []); })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const getStatus = (row) => (row.exitTime ? 'collected' : 'active');
  const statusLabel = (s) => (s === 'active' ? 'Active' : 'Collected');

  return (
    <div>
      <div className="page-header">
        <h1>Visitors</h1>
        <p className="page-subtitle mb-0">Visitor log — entry and exit times.</p>
      </div>
      <Card className="table-card">
        <CardBody>
          {loading ? (
            <div className="d-flex justify-content-center py-5"><Spinner color="primary" /></div>
          ) : (
            <Table responsive hover className="table-striped">
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Tower</th>
                  <th>Flat</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => {
                  const status = getStatus(row);
                  return (
                    <tr key={row.id}>
                      <td>{row.visitorName}</td>
                      <td>{row.tower}</td>
                      <td>{row.flatNumber}</td>
                      <td>{row.entryTime ? new Date(row.entryTime).toLocaleString() : '-'}</td>
                      <td>{row.exitTime ? new Date(row.exitTime).toLocaleString() : '-'}</td>
                      <td>
                        <span className={`badge ${status === 'active' ? 'bg-info' : 'bg-success'}`}>
                          {statusLabel(status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default VisitorsList;
