import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardBody,
  Table,
  Spinner,
  Badge,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
  Label,
  Input,
  InputGroup,
  Row,
  Col,
  Pagination,
  PaginationItem,
  PaginationLink,
} from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';
import { toast } from 'react-toastify';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';

const statusBadge = (status) => {
  if (status === 'active') return <Badge color="success">Active</Badge>;
  if (status === 'onboarding_completed') return <Badge color="info">Onboarding</Badge>;
  if (status === 'suspended') return <Badge color="secondary">Suspended</Badge>;
  return <Badge color="light" className="text-dark">{status || '—'}</Badge>;
};

const DetailRow = ({ label, value }) => (
  <div className="mb-2">
    <small className="text-muted d-block">{label}</small>
    <span>{value != null && value !== '' ? value : '–'}</span>
  </div>
);

const SocietiesList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ flatCount: '', setupFee: '', monthlyFee: '', billingCycle: 'monthly', yearlyFee: '' });
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [paymentsModal, setPaymentsModal] = useState(null);
  const [paymentsList, setPaymentsList] = useState([]);
  const [paymentsSummary, setPaymentsSummary] = useState(null);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [reminderSending, setReminderSending] = useState(false);
  const [reminderMonth, setReminderMonth] = useState(new Date().getMonth() + 1);
  const [reminderYear, setReminderYear] = useState(new Date().getFullYear());
  const [detailModal, setDetailModal] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [listRefresh, setListRefresh] = useState(0);

  const listFromResponse = (res) => {
    const raw = res?.data;
    if (!raw || typeof raw !== 'object') return [];
    if (Array.isArray(raw.data)) return raw.data;
    if (raw.Collection && Array.isArray(raw.Collection.data)) return raw.Collection.data;
    return [];
  };

  const fetchList = useCallback(() => {
    const { page, limit } = pagination;
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    axiosInstance
      .get(`${ENDPOINTS.SOCIETIES.LIST}?${params.toString()}`)
      .then((res) => {
        const data = listFromResponse(res);
        setList(Array.isArray(data) ? data : []);
        const p = res.data?.pagination ?? {};
        const total = res.data?.total ?? p.total ?? 0;
        setPagination((prev) => ({
          ...prev,
          page: p.page ?? page,
          limit: p.limit ?? prev.limit,
          total: Number(total) || 0,
        }));
      })
      .catch(() => {
        toast.error('Failed to load societies');
        setList([]);
      })
      .finally(() => setLoading(false));
  }, [pagination.page, pagination.limit, listRefresh]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const limitNum = Math.max(1, Number(pagination.limit) || 20);
  const totalNum = Number(pagination.total) || 0;
  const totalPages = Math.max(1, Math.ceil(totalNum / limitNum));
  const start = totalNum === 0 ? 0 : (pagination.page - 1) * limitNum + 1;
  const end = Math.min(pagination.page * limitNum, totalNum);

  const openPayments = useCallback((row) => {
    setPaymentsModal(row);
    setPaymentsList([]);
    setPaymentsSummary(null);
    setReminderMonth(new Date().getMonth() + 1);
    setReminderYear(new Date().getFullYear());
    setPaymentsLoading(true);
    axiosInstance
      .get(ENDPOINTS.BILLING.LIST, { params: { societyId: row.id } })
      .then((res) => {
        if (res.data?.success) {
          setPaymentsList(res.data.data || []);
          setPaymentsSummary(res.data.billingSummary || null);
        }
      })
      .catch(() => {
        toast.error('Failed to load payments');
        setPaymentsList([]);
      })
      .finally(() => setPaymentsLoading(false));
  }, []);

  const sendReminder = () => {
    if (!paymentsModal) return;
    setReminderSending(true);
    axiosInstance
      .post(ENDPOINTS.PAYMENTS.SEND_REMINDER, {
        societyId: paymentsModal.id,
        year: reminderYear,
        month: reminderMonth,
      })
      .then((res) => {
        if (res.data?.success) {
          toast.success(res.data?.data?.message || 'Reminder sent');
        } else {
          toast.error(res.data?.message || 'Failed to send reminder');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to send reminder'))
      .finally(() => setReminderSending(false));
  };

  const openDetail = useCallback((row) => {
    setDetailModal(row);
    setDetailData(null);
    setDetailLoading(true);
    axiosInstance
      .get(ENDPOINTS.SOCIETIES.GET(row.id))
      .then((res) => {
        if (res.data?.success) setDetailData(res.data.data);
        else toast.error('Failed to load society details');
      })
      .catch(() => toast.error('Failed to load society details'))
      .finally(() => setDetailLoading(false));
  }, []);

  const openEdit = (row) => {
    setEditing(row);
    setEditForm({
      flatCount: row.flatCount ?? '',
      setupFee: row.setupFee ?? '',
      monthlyFee: row.monthlyFee ?? '',
      billingCycle: row.billingCycle || 'monthly',
      yearlyFee: row.yearlyFee ?? '',
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    axiosInstance
      .patch(ENDPOINTS.SOCIETIES.UPDATE(editing.id), {
        flatCount: Number(editForm.flatCount) || 0,
        setupFee: Number(editForm.setupFee) || 0,
        monthlyFee: Number(editForm.monthlyFee) || 0,
        billingCycle: editForm.billingCycle || 'monthly',
        yearlyFee: Number(editForm.yearlyFee) || 0,
      })
      .then((res) => {
        if (res.data?.success) {
          toast.success('Society updated');
          setEditing(null);
          setListRefresh((n) => n + 1);
        } else {
          toast.error(res.data?.message || 'Failed to update society');
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to update society');
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const updateStatus = (row, status) => {
    setUpdatingStatusId(row.id);
    axiosInstance
      .patch(ENDPOINTS.SOCIETIES.UPDATE_STATUS(row.id), { status })
      .then((res) => {
        if (res.data?.success) {
          toast.success(`Status changed to ${status}`);
          setListRefresh((n) => n + 1);
        } else {
          toast.error(res.data?.message || 'Failed to change status');
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to change status');
      })
      .finally(() => {
        setUpdatingStatusId(null);
      });
  };

  const recurringLabel = (row) => {
    const cycle = (row.billingCycle || 'monthly').toLowerCase();
    if (cycle === 'yearly') {
      return `₹${Number((row.yearlyFee ?? (row.monthlyFee * 12)) || 0).toLocaleString()}/yr`;
    }
    if (cycle === 'quarterly') {
      return `₹${Number(row.yearlyFee ? row.yearlyFee / 4 : (row.monthlyFee * 3 || 0)).toLocaleString()}/qtr`;
    }
    return `₹${Number(row.monthlyFee || 0).toLocaleString()}/mo`;
  };

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap">
        <div>
          <h1 className="mb-0">Societies</h1>
          <p className="text-muted small mb-0 mt-1">Manage societies, view details, payments, and billing.</p>
        </div>
      </div>

      <Card className="table-card">
        <CardBody className="p-0">
          <div className="px-3 py-2 border-bottom d-flex flex-nowrap justify-content-between align-items-center gap-2 overflow-x-auto">
            <div className="small text-muted text-nowrap flex-shrink-0">
              {loading ? 'Loading societies…' : (
                <>
                  Showing {totalNum === 0 ? 0 : start}–{end} of {totalNum} {totalNum !== 1 ? 'societies' : 'society'}
                </>
              )}
            </div>
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <Label className="small text-muted mb-0 text-nowrap">Per page</Label>
              <Input
                type="select"
                className="form-select form-select-sm"
                style={{ width: 'auto', minWidth: 72 }}
                value={pagination.limit}
                onChange={(e) => {
                  const limit = Number(e.target.value);
                  setPagination((p) => ({ ...p, limit, page: 1 }));
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </Input>
            </div>
          </div>
          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <Spinner color="primary" />
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover size="sm" className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Society</th>
                      <th>Address</th>
                      <th>Contact</th>
                      <th className="text-end">Flats</th>
                      <th>Plan</th>
                      <th>Recurring</th>
                      <th>Setup</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center text-muted py-5">
                          <p className="mb-1">No societies yet.</p>
                          <p className="small mb-0">Societies appear here after an invite is accepted and onboarding is completed.</p>
                        </td>
                      </tr>
                    ) : (
                      list.map((row) => (
                        <tr key={row.id}>
                          <td className="fw-medium text-nowrap">
                            <div>{row.name}</div>
                            <code className="small text-muted">{row.alias}</code>
                          </td>
                          <td className="text-muted small" style={{ maxWidth: 200 }} title={row.address || ''}>
                            {row.address ? (row.address.length > 48 ? `${row.address.slice(0, 48)}…` : row.address) : '–'}
                          </td>
                          <td className="small">
                            <div className="text-break">{row.email || '–'}</div>
                            {row.phone ? <div className="text-muted">{row.phone}</div> : null}
                          </td>
                          <td className="text-end">{row.flatCount ?? '—'}</td>
                          <td className="small text-capitalize">{row.planType || '—'}</td>
                          <td className="small text-nowrap">
                            <span className="text-capitalize">{(row.billingCycle || 'monthly').replace(/_/g, ' ')}</span>
                            <span className="text-muted"> · </span>
                            {recurringLabel(row)}
                            {row.yearlyFee > 0 && row.billingCycle !== 'yearly' && (
                              <span className="d-block text-muted">₹{Number(row.yearlyFee).toLocaleString()}/yr</span>
                            )}
                          </td>
                          <td className="small text-nowrap">
                            {Number(row.setupFee) > 0 ? `₹${Number(row.setupFee).toLocaleString()}` : '–'}
                          </td>
                          <td>{statusBadge(row.status)}</td>
                          <td className="text-nowrap small">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}</td>
                          <td className="text-end text-nowrap">
                            <div className="d-inline-flex flex-nowrap justify-content-end align-items-center gap-1 text-nowrap">
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm p-1 lh-1"
                                title="Society details"
                                aria-label="Society details"
                                onClick={() => openDetail(row)}
                              >
                                <InfoOutlinedIcon fontSize="small" />
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-info btn-sm p-1 lh-1"
                                title="Payments & invoices"
                                aria-label="Payments and invoices"
                                onClick={() => openPayments(row)}
                              >
                                <ReceiptLongOutlinedIcon fontSize="small" />
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm p-1 lh-1"
                                title="Edit billing"
                                aria-label="Edit billing"
                                onClick={() => openEdit(row)}
                              >
                                <EditOutlinedIcon fontSize="small" />
                              </button>
                              {row.status !== 'active' && (
                                updatingStatusId === row.id ? (
                                  <span className="d-inline-flex p-1" aria-hidden="true">
                                    <span className="spinner-border spinner-border-sm text-success" role="status" />
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn btn-outline-success btn-sm p-1 lh-1"
                                    title="Activate society"
                                    aria-label="Activate society"
                                    onClick={() => updateStatus(row, 'active')}
                                  >
                                    <CheckCircleOutlineIcon fontSize="small" />
                                  </button>
                                )
                              )}
                              {row.status === 'active' && (
                                updatingStatusId === row.id ? (
                                  <span className="d-inline-flex p-1" aria-hidden="true">
                                    <span className="spinner-border spinner-border-sm text-warning" role="status" />
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn btn-outline-warning btn-sm p-1 lh-1"
                                    title="Suspend society"
                                    aria-label="Suspend society"
                                    onClick={() => updateStatus(row, 'suspended')}
                                  >
                                    <PauseCircleOutlineIcon fontSize="small" />
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center px-3 py-2 border-top gap-2">
                  <span className="small text-muted order-2 order-sm-1 text-center text-sm-start">
                    Page {pagination.page} of {totalPages}
                  </span>
                  <Pagination size="sm" className="mb-0 justify-content-center justify-content-sm-end order-1 order-sm-2 flex-wrap">
                    <PaginationItem disabled={pagination.page <= 1}>
                      <PaginationLink
                        previous
                        tag="button"
                        type="button"
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = pagination.page <= 3 ? i + 1 : Math.max(1, pagination.page - 2 + i);
                      if (p > totalPages) return null;
                      return (
                        <PaginationItem key={p} active={p === pagination.page}>
                          <PaginationLink tag="button" type="button" onClick={() => setPagination((prev) => ({ ...prev, page: p }))}>
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem disabled={pagination.page >= totalPages}>
                      <PaginationLink
                        next
                        tag="button"
                        type="button"
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                      />
                    </PaginationItem>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={!!editing} toggle={() => !saving && setEditing(null)}>
        <ModalHeader toggle={() => !saving && setEditing(null)}>Edit billing</ModalHeader>
        <form onSubmit={handleSave}>
          <ModalBody>
            {editing && (
              <>
                <p className="text-muted small mb-3">
                  {editing.name} (<code>{editing.alias}</code>)
                </p>
                <FormGroup>
                  <Label>Flat count</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editForm.flatCount}
                    onChange={(e) => setEditForm((f) => ({ ...f, flatCount: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Setup fee</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={editForm.setupFee}
                    onChange={(e) => setEditForm((f) => ({ ...f, setupFee: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Monthly fee (₹)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={editForm.monthlyFee}
                    onChange={(e) => setEditForm((f) => ({ ...f, monthlyFee: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Billing cycle</Label>
                  <Input
                    type="select"
                    value={editForm.billingCycle}
                    onChange={(e) => setEditForm((f) => ({ ...f, billingCycle: e.target.value }))}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label>Yearly fee (₹) — used for quarterly/yearly amount</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={editForm.yearlyFee}
                    onChange={(e) => setEditForm((f) => ({ ...f, yearlyFee: e.target.value }))}
                    placeholder="e.g. 71988 for ₹5999/mo × 12"
                  />
                </FormGroup>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button color="primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Payments & transactions modal */}
      <Modal isOpen={!!paymentsModal} toggle={() => setPaymentsModal(null)} size="lg">
        <ModalHeader toggle={() => setPaymentsModal(null)}>
          Payments & transactions {paymentsModal ? `— ${paymentsModal.name}` : ''}
        </ModalHeader>
        <ModalBody>
          {paymentsModal && (
            <>
              {paymentsLoading ? (
                <div className="d-flex justify-content-center py-5"><Spinner /></div>
              ) : (
                <>
                  {paymentsSummary && (
                    <Card className="mb-3 bg-light border-0">
                      <CardBody className="py-2">
                        <small className="text-muted">Recurring plan</small>
                        <div className="fw-medium">
                          {paymentsSummary.periodLabel} · ₹{Number(paymentsSummary.periodAmount || 0).toLocaleString()}/{paymentsSummary.billingCycle === 'yearly' ? 'yr' : paymentsSummary.billingCycle === 'quarterly' ? 'qtr' : 'mo'}
                        </div>
                      </CardBody>
                    </Card>
                  )}
                  <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <span className="small text-muted">Transactions</span>
                    <span className="small">
                      {paymentsList.filter((b) => b.paymentStatus === 'pending').length} pending
                      (₹{paymentsList.filter((b) => b.paymentStatus === 'pending').reduce((s, b) => s + (b.amount || 0), 0).toLocaleString()} due)
                      · {paymentsList.filter((b) => b.paymentStatus === 'paid').length} paid
                    </span>
                  </div>
                  {paymentsList.length === 0 ? (
                    <p className="text-muted small mb-0">No invoices yet for this society.</p>
                  ) : (
                    <Table size="sm" responsive hover className="mb-0">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Invoice #</th>
                          <th>Amount</th>
                          <th>Due date</th>
                          <th>Status</th>
                          <th>Paid at</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentsList.map((b) => (
                          <tr key={b.id}>
                            <td className="text-capitalize">{b.type || '–'}</td>
                            <td className="font-monospace small">{b.invoiceNumber || '–'}</td>
                            <td>₹{Number(b.amount || 0).toLocaleString()}</td>
                            <td>{b.dueDate ? new Date(b.dueDate).toLocaleDateString() : '–'}</td>
                            <td>
                              <Badge color={b.paymentStatus === 'paid' ? 'success' : b.paymentStatus === 'overdue' ? 'danger' : 'warning'}>
                                {b.paymentStatus === 'paid' ? 'Paid' : b.paymentStatus === 'overdue' ? 'Overdue' : 'Pending'}
                              </Badge>
                            </td>
                            <td>{b.paidAt ? new Date(b.paidAt).toLocaleString() : '–'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                  <hr className="my-3" />
                  <div className="d-flex flex-wrap align-items-end gap-2">
                    <FormGroup className="mb-0">
                      <Label className="small mb-1">Send payment reminder for</Label>
                      <InputGroup size="sm">
                        <Input
                          type="select"
                          value={reminderMonth}
                          onChange={(e) => setReminderMonth(Number(e.target.value))}
                          style={{ width: 100 }}
                        >
                          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                            <option key={m} value={i + 1}>{m}</option>
                          ))}
                        </Input>
                        <Input
                          type="select"
                          value={reminderYear}
                          onChange={(e) => setReminderYear(Number(e.target.value))}
                          style={{ width: 80 }}
                        >
                          {(() => {
                            const y = new Date().getFullYear();
                            return [y - 1, y, y + 1].map((yr) => (
                              <option key={yr} value={yr}>{yr}</option>
                            ));
                          })()}
                        </Input>
                        <Button color="primary" size="sm" onClick={sendReminder} disabled={reminderSending}>
                          {reminderSending ? 'Sending…' : 'Send reminder'}
                        </Button>
                      </InputGroup>
                    </FormGroup>
                  </div>
                  <p className="small text-muted mb-0 mt-1">Reminder will be sent to the society contact email for the selected period.</p>
                </>
              )}
            </>
          )}
        </ModalBody>
      </Modal>

      {/* Society detail modal */}
      <Modal isOpen={!!detailModal} toggle={() => setDetailModal(null)} size="lg">
        <ModalHeader toggle={() => setDetailModal(null)}>
          Society details {detailModal ? `— ${detailModal.name}` : ''}
        </ModalHeader>
        <ModalBody>
          {detailLoading ? (
            <div className="d-flex justify-content-center py-5"><Spinner /></div>
          ) : detailData ? (
            <>
              <h6 className="text-muted text-uppercase small mb-2">Basic info</h6>
              <Row>
                <Col md={6}>
                  <DetailRow label="Name" value={detailData.name} />
                  <DetailRow label="Alias" value={detailData.alias} />
                  <DetailRow label="Status" value={detailData.status} />
                  <DetailRow label="Plan type" value={detailData.planType} />
                  <DetailRow label="Flat count" value={detailData.flatCount} />
                  <DetailRow label="Created" value={detailData.createdAt ? new Date(detailData.createdAt).toLocaleString() : ''} />
                </Col>
                <Col md={6}>
                  <DetailRow label="Contact email" value={detailData.email} />
                  <DetailRow label="Contact phone" value={detailData.phone} />
                  <DetailRow label="Billing cycle" value={detailData.billingCycle} />
                  <DetailRow label="Monthly fee" value={detailData.monthlyFee != null ? `₹${Number(detailData.monthlyFee).toLocaleString()}` : ''} />
                  <DetailRow label="Yearly fee" value={detailData.yearlyFee != null && detailData.yearlyFee > 0 ? `₹${Number(detailData.yearlyFee).toLocaleString()}` : ''} />
                  <DetailRow label="Setup fee" value={detailData.setupFee != null && detailData.setupFee > 0 ? `₹${Number(detailData.setupFee).toLocaleString()}` : ''} />
                </Col>
              </Row>

              <hr className="my-3" />
              <h6 className="text-muted text-uppercase small mb-2">Onboarding / setup (entered at setup)</h6>
              <Row>
                <Col md={6}>
                  <DetailRow label="Address" value={detailData.address} />
                  <DetailRow label="Total flats" value={detailData.totalFlats} />
                  <DetailRow label="Theme color" value={detailData.themeColor ? (
                    <span className="d-flex align-items-center gap-2">
                      <span className="rounded border" style={{ width: 20, height: 20, backgroundColor: detailData.themeColor }} />
                      {detailData.themeColor}
                    </span>
                  ) : ''} />
                  {detailData.towersBlocks && (Array.isArray(detailData.towersBlocks) ? detailData.towersBlocks.length : 0) > 0 && (
                    <DetailRow label="Towers / blocks" value={Array.isArray(detailData.towersBlocks) ? detailData.towersBlocks.join(', ') : String(detailData.towersBlocks)} />
                  )}
                </Col>
                <Col md={6}>
                  {detailData.logo && (
                    <div className="mb-2">
                      <small className="text-muted d-block">Logo</small>
                      <img src={detailData.logo.startsWith('http') ? detailData.logo : `${import.meta.env.VITE_API_URL || ''}${detailData.logo.startsWith('/') ? '' : '/'}${detailData.logo}`} alt="Logo" style={{ maxHeight: 48, maxWidth: 120, objectFit: 'contain' }} />
                    </div>
                  )}
                  <DetailRow label="Admin contact name" value={detailData.adminContactName} />
                  <DetailRow label="Admin contact phone" value={detailData.adminContactPhone} />
                </Col>
              </Row>

              {detailData.adminUsers && detailData.adminUsers.length > 0 && (
                <>
                  <hr className="my-3" />
                  <h6 className="text-muted text-uppercase small mb-2">Admin login account(s)</h6>
                  <p className="small text-muted mb-2">User(s) who can sign in as society admin.</p>
                  <Table size="sm" className="mb-0">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Login email</th>
                        <th>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailData.adminUsers.map((u) => (
                        <tr key={u.id}>
                          <td>{u.name || '–'}</td>
                          <td><code className="small">{u.email || '–'}</code></td>
                          <td><Badge color="info" className="text-capitalize">{u.role || 'society_admin'}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
            </>
          ) : (
            <p className="text-muted mb-0">No details available.</p>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
};

export default SocietiesList;
