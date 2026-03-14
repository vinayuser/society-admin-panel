import React, { useState, useEffect } from 'react';
import { Card, CardBody, Table, Spinner, Badge } from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';

const BillingList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get(ENDPOINTS.BILLING.LIST)
      .then((res) => {
        const data = res.data?.data ?? [];
        setList(Array.isArray(data) ? data : []);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Billing</h1>
      </div>
      <Card className="table-card">
        <CardBody>
          {loading ? (
            <div className="d-flex justify-content-center py-5"><Spinner /></div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Society</th>
                  <th>Invoice</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Billing Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.id}>
                    <td>{row.societyName || row.societyId}</td>
                    <td>{row.invoiceNumber}</td>
                    <td>{row.type}</td>
                    <td>₹{Number(row.amount || 0).toLocaleString()}</td>
                    <td>{row.billingDate ? new Date(row.billingDate).toLocaleDateString() : '-'}</td>
                    <td><Badge color={row.paymentStatus === 'paid' ? 'success' : 'warning'}>{row.paymentStatus}</Badge></td>
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

export default BillingList;
