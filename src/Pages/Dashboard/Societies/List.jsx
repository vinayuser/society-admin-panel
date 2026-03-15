import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, Table, Spinner, Badge, Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input, InputGroup, Row, Col } from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';
import { toast } from 'react-toastify';

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

  useEffect(() => {
    axiosInstance
      .get(ENDPOINTS.SOCIETIES.LIST)
      .then((res) => {
        const data = res.data?.data ?? [];
        setList(Array.isArray(data) ? data : []);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

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
          setLoading(true);
          return axiosInstance.get(ENDPOINTS.SOCIETIES.LIST).then((r) => {
            const data = r.data?.data ?? [];
            setList(Array.isArray(data) ? data : []);
          });
        }
        toast.error(res.data?.message || 'Failed to update society');
        return null;
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to update society');
      })
      .finally(() => {
        setSaving(false);
        setLoading(false);
      });
  };

  const updateStatus = (row, status) => {
    setUpdatingStatusId(row.id);
    axiosInstance
      .patch(ENDPOINTS.SOCIETIES.UPDATE_STATUS(row.id), { status })
      .then((res) => {
        if (res.data?.success) {
          toast.success(`Status changed to ${status}`);
          setLoading(true);
          return axiosInstance.get(ENDPOINTS.SOCIETIES.LIST).then((r) => {
            const data = r.data?.data ?? [];
            setList(Array.isArray(data) ? data : []);
          });
        }
        toast.error(res.data?.message || 'Failed to change status');
        return null;
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to change status');
      })
      .finally(() => {
        setUpdatingStatusId(null);
        setLoading(false);
      });
  };

  return (
    <div className="SocietiesList">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1 fw-semibold">Societies</h1>
          <p className="text-muted small mb-0">Manage societies, view details, payments, and billing.</p>
        </div>
        {!loading && (
          <Badge color="light" className="text-dark border px-3 py-2 fs-6">
            {list.length} {list.length === 1 ? 'society' : 'societies'}
          </Badge>
        )}
      </div>

      <Card className="shadow-sm border-0 rounded-3 overflow-hidden">
        <CardBody className="p-0">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <Spinner color="primary" />
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-5 px-3">
              <p className="text-muted mb-2">No societies yet.</p>
              <p className="small text-muted mb-0">Societies appear here after an invite is accepted and onboarding is completed.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="border-0 ps-4 pt-3 pb-3 fw-semibold">Society</th>
                    <th className="border-0 pt-3 pb-3 fw-semibold">Flats</th>
                    <th className="border-0 pt-3 pb-3 fw-semibold">Plan & billing</th>
                    <th className="border-0 pt-3 pb-3 fw-semibold">Status</th>
                    <th className="border-0 pt-3 pb-3 fw-semibold">Created</th>
                    <th className="border-0 pe-4 pt-3 pb-3 fw-semibold text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row) => (
                    <tr key={row.id}>
                      <td className="ps-4 py-3">
                        <div className="fw-medium">{row.name}</div>
                        <code className="small text-muted">{row.alias}</code>
                      </td>
                      <td className="py-3">{row.flatCount ?? '—'}</td>
                      <td className="py-3">
                        <span className="text-capitalize">{row.planType || '—'}</span>
                        <span className="text-muted mx-1">·</span>
                        <span className="text-capitalize">{row.billingCycle || 'monthly'}</span>
                        <div className="small text-muted mt-0">
                          {row.billingCycle === 'yearly'
                            ? `₹${Number((row.yearlyFee ?? (row.monthlyFee * 12)) || 0).toLocaleString()}/yr`
                            : row.billingCycle === 'quarterly'
                            ? `₹${Number(row.yearlyFee ? row.yearlyFee / 4 : (row.monthlyFee * 3 || 0)).toLocaleString()}/qtr`
                            : `₹${Number(row.monthlyFee || 0).toLocaleString()}/mo`}
                        </div>
                      </td>
                      <td className="py-3">{statusBadge(row.status)}</td>
                      <td className="py-3 small text-muted">
                        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="pe-4 py-3 text-end">
                        <div className="d-flex flex-wrap justify-content-end gap-1">
                          <Button size="sm" color="secondary" outline onClick={() => openDetail(row)}>
                            Details
                          </Button>
                          <Button size="sm" color="info" outline onClick={() => openPayments(row)}>
                            Payments
                          </Button>
                          <Button size="sm" color="primary" outline onClick={() => openEdit(row)}>
                            Edit billing
                          </Button>
                          {row.status !== 'active' && (
                            <Button
                              size="sm"
                              color="success"
                              outline
                              disabled={updatingStatusId === row.id}
                              onClick={() => updateStatus(row, 'active')}
                            >
                              {updatingStatusId === row.id ? '…' : 'Activate'}
                            </Button>
                          )}
                          {row.status === 'active' && (
                            <Button
                              size="sm"
                              color="warning"
                              outline
                              disabled={updatingStatusId === row.id}
                              onClick={() => updateStatus(row, 'suspended')}
                            >
                              {updatingStatusId === row.id ? '…' : 'Suspend'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
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
