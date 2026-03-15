import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardBody,
  Table,
  Spinner,
  Button,
  Badge,
  ListGroup,
  ListGroupItem,
} from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';
import { formatNotificationItem } from '../../../helpers/notificationUtils';
import { toast } from 'react-toastify';

const SocietyPayments = () => {
  const [list, setList] = useState([]);
  const [billingSummary, setBillingSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  const fetchList = useCallback(() => {
    setLoading(true);
    axiosInstance
      .get(ENDPOINTS.BILLING.LIST)
      .then((res) => {
        if (res.data?.success) {
          setList(res.data.data || []);
          setBillingSummary(res.data.billingSummary || null);
        }
      })
      .catch(() => {
        toast.error('Failed to load payments');
        setList([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchNotifications = useCallback(() => {
    axiosInstance
      .get(ENDPOINTS.NOTIFICATIONS.LIST)
      .then((res) => {
        if (res.data?.success) setNotifications(res.data.data || []);
      })
      .catch(() => setNotifications([]));
  }, []);

  const markAllRead = () => {
    axiosInstance
      .post(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ)
      .then((res) => {
        if (res.data?.success) {
          toast.success('All marked as read');
          fetchNotifications();
        }
      })
      .catch(() => toast.error('Failed to update'));
  };

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (typeof window.Razorpay !== 'undefined') return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      try {
        document.body.removeChild(script);
      } catch (_) {}
    };
  }, []);

  const handlePay = (row) => {
    if (!row?.id || payingId) return;
    setPayingId(row.id);
    axiosInstance
      .post(ENDPOINTS.BILLING.CREATE_ORDER(row.id))
      .then((res) => {
        if (!res.data?.success || !res.data?.data?.orderId || !res.data?.data?.keyId) {
          toast.error(res.data?.message || 'Could not create payment');
          setPayingId(null);
          return;
        }
        const { orderId, keyId, amount } = res.data.data;
        if (typeof window.Razorpay === 'undefined') {
          toast.error('Payment script not loaded. Refresh and try again.');
          setPayingId(null);
          return;
        }
        const options = {
          key: keyId,
          amount,
          currency: 'INR',
          name: row.societyName || 'Society',
          description: row.invoiceNumber || 'Invoice',
          order_id: orderId,
          handler: function (response) {
            axiosInstance
              .post(ENDPOINTS.BILLING.VERIFY_PAYMENT, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
              })
              .then((ver) => {
                if (ver.data?.success) {
                  toast.success('Payment recorded.');
                  fetchList();
                } else {
                  toast.error(ver.data?.message || 'Verification failed');
                }
                setPayingId(null);
              })
              .catch(() => {
                toast.error('Verification failed');
                setPayingId(null);
              });
          },
          theme: { color: '#1a237e' },
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', () => {
          toast.error('Payment failed or cancelled');
          setPayingId(null);
        });
        rzp.open();
        setPayingId(null);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Could not start payment');
        setPayingId(null);
      });
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '–');
  const typeLabel = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : '–');
  const statusBadge = (s) => {
    if (s === 'paid') return <Badge color="success">Paid</Badge>;
    if (s === 'overdue') return <Badge color="danger">Overdue</Badge>;
    return <Badge color="warning">Pending</Badge>;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner color="primary" style={{ width: '2.5rem', height: '2.5rem' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Invoices & Payments</h1>
        <p className="page-subtitle">Invoices generated by admin for your society. View status, pay pending ones, and see notifications.</p>
      </div>
      {notifications.length > 0 && (
        <Card className="mb-3 border-info">
          <CardBody className="py-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <strong className="small text-uppercase text-muted">Recent notifications</strong>
              <Button color="link" size="sm" className="p-0" onClick={markAllRead}>Mark all as read</Button>
            </div>
            <p className="small text-muted mb-2">Headings and messages include full detail (society, period, amount, due date).</p>
            <ListGroup flush className="small">
              {notifications.slice(0, 10).map((n) => {
                const item = formatNotificationItem(n);
                return (
                  <ListGroupItem key={n.id} className="px-0 py-2 border-0" style={{ backgroundColor: n.readAt ? 'transparent' : 'rgba(13, 110, 253, 0.06)' }}>
                    <span className={n.readAt ? 'text-muted' : 'fw-medium'}>
                      {item.icon} {item.title}
                    </span>
                    {item.body && (
                      <div className="text-muted mt-1" style={{ whiteSpace: 'pre-wrap' }}>{item.body}</div>
                    )}
                    <small className="text-muted d-block mt-1">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</small>
                  </ListGroupItem>
                );
              })}
            </ListGroup>
          </CardBody>
        </Card>
      )}
      {billingSummary && (
        <Card className="mb-3 border-0 bg-light">
          <CardBody className="py-3">
            <strong>Recurring plan:</strong>{' '}
            <span className="text-capitalize">{billingSummary.periodLabel}</span>
            {' · '}
            ₹{Number(billingSummary.periodAmount || 0).toLocaleString()}
            {billingSummary.billingCycle === 'yearly' ? '/year' : billingSummary.billingCycle === 'quarterly' ? '/quarter' : '/month'}
          </CardBody>
        </Card>
      )}
      <Card>
        <CardBody className="p-0">
          <div className="px-3 py-2 border-bottom bg-light">
            <strong>Invoices generated by admin</strong>
            <span className="text-muted small ms-2">— Pay pending invoices below.</span>
          </div>
          {list.length === 0 ? (
            <div className="text-center text-muted py-5">No invoices yet. Admin will generate them from Billing → Generate for month.</div>
          ) : (
            <Table responsive className="table-light mb-0">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Due date</th>
                  <th>Status</th>
                  <th>Reminder sent</th>
                  <th>Paid at</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.id}>
                    <td>{row.invoiceNumber || '–'}</td>
                    <td>{typeLabel(row.type)}</td>
                    <td>₹{Number(row.amount).toLocaleString()}</td>
                    <td>{formatDate(row.dueDate)}</td>
                    <td>{statusBadge(row.paymentStatus)}</td>
                    <td className="small">{row.reminderSentAt ? new Date(row.reminderSentAt).toLocaleString() : '–'}</td>
                    <td>{formatDate(row.paidAt)}</td>
                    <td>
                      {row.paymentStatus !== 'paid' && (
                        <Button
                          color="primary"
                          size="sm"
                          disabled={payingId === row.id}
                          onClick={() => handlePay(row)}
                        >
                          {payingId === row.id ? 'Opening…' : 'Pay'}
                        </Button>
                      )}
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

export default SocietyPayments;
