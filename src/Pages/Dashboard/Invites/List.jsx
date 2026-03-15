import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  CardBody,
  Table,
  Spinner,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
  Label,
  Input,
} from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';
import { toast } from 'react-toastify';

const getInviteLink = (token) => {
  const base = import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/invite/${token}`;
};

const InvitesList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [viewLinkRow, setViewLinkRow] = useState(null);
  const [resendingId, setResendingId] = useState(null);
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({
    societyName: '',
    contactEmail: '',
    contactPhone: '',
    flatCount: 0,
    planType: 'shared_app',
    planId: '',
    setupFee: 0,
    monthlyFee: 0,
    billingCycle: 'monthly',
    yearlyFee: 0,
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchList = () => {
    setLoading(true);
    axiosInstance
      .get(ENDPOINTS.INVITES.LIST)
      .then((res) => {
        const data = res.data?.data ?? [];
        setList(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        toast.error('Failed to load invites');
        setList([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  useEffect(() => {
    if (modal) {
      axiosInstance.get(ENDPOINTS.PLANS.LIST).then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) setPlans(res.data.data);
      }).catch(() => setPlans([]));
    }
  }, [modal]);

  const handlePlanChange = (planId) => {
    const id = planId ? Number(planId) : null;
    setForm((f) => {
      const next = { ...f, planId: planId || '' };
      if (id && plans.length) {
        const plan = plans.find((p) => p.id === id);
        if (plan) {
          next.monthlyFee = plan.monthlyFee;
          next.yearlyFee = plan.yearlyFee;
          next.billingCycle = plan.billingCycle || 'monthly';
        }
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = { ...form };
    if (payload.planId) payload.planId = Number(payload.planId);
    if (!payload.planId) delete payload.planId;
    axiosInstance
      .post(ENDPOINTS.INVITES.CREATE, payload)
      .then((res) => {
        if (res.data?.success) {
          toast.success('Invite created');
          setModal(false);
          setForm({
            societyName: '',
            contactEmail: '',
            contactPhone: '',
            flatCount: 0,
            planType: 'shared_app',
            planId: '',
            setupFee: 0,
            monthlyFee: 0,
            billingCycle: 'monthly',
            yearlyFee: 0,
            address: '',
          });
          fetchList();
        } else {
          toast.error(res.data?.message || 'Failed to create invite');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to create invite'))
      .finally(() => setSubmitting(false));
  };

  const handleResend = (row) => {
    if (row.status !== 'pending') {
      toast.error('Only pending invites can be resent');
      return;
    }
    setResendingId(row.id);
    axiosInstance
      .post(ENDPOINTS.INVITES.RESEND(row.id))
      .then((res) => {
        if (res.data?.success) {
          toast.success('Invite email resent');
        } else {
          toast.error(res.data?.message || 'Failed to resend');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to resend'))
      .finally(() => setResendingId(null));
  };

  const copyInviteLink = (token) => {
    const url = getInviteLink(token);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => toast.success('Link copied to clipboard'));
    } else {
      toast.info(url);
    }
  };

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap">
        <h1>Invites</h1>
        <Button color="primary" onClick={() => setModal(true)}>Create Invite</Button>
      </div>
      <Card className="table-card">
        <CardBody>
          {loading ? (
            <div className="d-flex justify-content-center py-5"><Spinner /></div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Society Name</th>
                  <th>Address</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Billing</th>
                  <th>Flat Count</th>
                  <th>Setup Fee</th>
                  <th>Setup Paid</th>
                  <th>Monthly Fee</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.id}>
                    <td>{row.societyName}</td>
                    <td className="text-muted small" title={row.address || ''}>{row.address ? (row.address.length > 40 ? row.address.slice(0, 40) + '…' : row.address) : '–'}</td>
                    <td>{row.email}</td>
                    <td>{row.planName || row.planType || '–'}</td>
                    <td className="text-capitalize small">{row.billingCycle || 'monthly'}{row.yearlyFee > 0 ? ` · ₹${Number(row.yearlyFee).toLocaleString()}/yr` : ''}</td>
                    <td>{row.flatCount}</td>
                    <td>₹{Number(row.setupFee || 0).toLocaleString()}</td>
                    <td>{row.setupFee > 0 ? (row.setupFeePaid ? <span className="badge bg-success">Paid</span> : <span className="badge bg-warning text-dark">Pending</span>) : '–'}</td>
                    <td>₹{Number(row.monthlyFee || 0).toLocaleString()}</td>
                    <td><span className={`badge ${row.status === 'pending' ? 'bg-warning text-dark' : 'bg-secondary'}`}>{row.status}</span></td>
                    <td>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}</td>
                    <td>
                      {row.status === 'pending' && row.inviteToken && (
                        <>
                          <Button size="sm" color="info" className="me-1" onClick={() => setViewLinkRow(row)} title="View invite link">
                            View link
                          </Button>
                          <Button size="sm" color="primary" onClick={() => handleResend(row)} disabled={resendingId === row.id} title="Resend invite email">
                            {resendingId === row.id ? 'Sending…' : 'Resend'}
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* View invite links modal */}
      <Modal isOpen={!!viewLinkRow} toggle={() => setViewLinkRow(null)} size="md">
        <ModalHeader toggle={() => setViewLinkRow(null)} className="border-0 pb-0">Invite links</ModalHeader>
        <ModalBody className="pt-2">
          {viewLinkRow && (
            <>
              {viewLinkRow.setupFee > 0 ? (
                <>
                  <p className="text-muted small mb-2">Send both links to the user. Link 1: one-time setup fee. Link 2: society setup (logo, details) + first period payment.</p>
                  <FormGroup className="mb-3">
                    <Label className="small fw-medium">Link 1 — Setup fee (one-time)</Label>
                    <div className="input-group input-group-sm">
                      <Input readOnly value={viewLinkRow.linkSetupFee || getInviteLink(viewLinkRow.inviteToken) + '?step=setup_fee'} className="font-monospace small bg-light" />
                      <Button color="primary" size="sm" onClick={() => { const u = viewLinkRow.linkSetupFee || getInviteLink(viewLinkRow.inviteToken) + '?step=setup_fee'; navigator?.clipboard?.writeText(u).then(() => toast.success('Link 1 copied')); }}>Copy</Button>
                    </div>
                  </FormGroup>
                  <FormGroup className="mb-0">
                    <Label className="small fw-medium">Link 2 — Onboarding + first period</Label>
                    <div className="input-group input-group-sm">
                      <Input readOnly value={viewLinkRow.linkOnboarding || getInviteLink(viewLinkRow.inviteToken)} className="font-monospace small bg-light" />
                      <Button color="primary" size="sm" onClick={() => { const u = viewLinkRow.linkOnboarding || getInviteLink(viewLinkRow.inviteToken); navigator?.clipboard?.writeText(u).then(() => toast.success('Link 2 copied')); }}>Copy</Button>
                    </div>
                  </FormGroup>
                </>
              ) : (
                <>
                  <p className="text-muted small mb-3">Share this link to complete onboarding (logo, details + first period payment):</p>
                  <div className="input-group">
                    <Input readOnly value={viewLinkRow.linkOnboarding || getInviteLink(viewLinkRow.inviteToken)} className="font-monospace small bg-light" />
                    <Button color="primary" onClick={() => copyInviteLink(viewLinkRow.inviteToken)}>Copy</Button>
                  </div>
                </>
              )}
            </>
          )}
        </ModalBody>
      </Modal>

      <Modal isOpen={modal} toggle={() => !submitting && setModal(false)} size="lg" className="invite-create-modal">
        <ModalHeader toggle={() => !submitting && setModal(false)} className="border-0 pb-0">
          <span className="h5 mb-0">Create Invite</span>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="pt-3">
            <div className="row g-3">
              <div className="col-12">
                <FormGroup className="mb-0">
                  <Label className="form-label fw-medium">Society Name</Label>
                  <Input required value={form.societyName} onChange={(e) => setForm((f) => ({ ...f, societyName: e.target.value }))} placeholder="e.g. Green Valley Apartments" className="rounded" />
                </FormGroup>
              </div>
              <div className="col-12">
                <FormGroup className="mb-0">
                  <Label className="form-label fw-medium">Society Address</Label>
                  <Input type="textarea" rows={2} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Full address (used everywhere for this society)" className="rounded" />
                </FormGroup>
              </div>
              <div className="col-md-6">
                <FormGroup className="mb-0">
                  <Label className="form-label fw-medium">Contact Email</Label>
                  <Input type="email" required value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} placeholder="admin@society.com" className="rounded" />
                </FormGroup>
              </div>
              <div className="col-md-6">
                <FormGroup className="mb-0">
                  <Label className="form-label fw-medium">Contact Phone</Label>
                  <Input value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} placeholder="+91 98765 43210" className="rounded" />
                </FormGroup>
              </div>
              <div className="col-md-6">
                <FormGroup className="mb-0">
                  <Label className="form-label fw-medium">Flat Count</Label>
                  <Input type="number" min={0} value={form.flatCount} onChange={(e) => setForm((f) => ({ ...f, flatCount: Number(e.target.value) || 0 }))} className="rounded" />
                </FormGroup>
              </div>
              <div className="col-md-6">
                <FormGroup className="mb-0">
                  <Label className="form-label fw-medium">Plan Type</Label>
                  <Input type="select" value={form.planType} onChange={(e) => setForm((f) => ({ ...f, planType: e.target.value }))} className="rounded">
                    <option value="shared_app">Shared App</option>
                    <option value="white_label">White Label</option>
                  </Input>
                </FormGroup>
              </div>
              <div className="col-md-6">
                <FormGroup className="mb-0">
                  <Label className="form-label fw-medium">Society Plan (recurring pricing)</Label>
                  <Input type="select" value={form.planId} onChange={(e) => handlePlanChange(e.target.value)} className="rounded">
                    <option value="">Custom / No plan</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} — {p.billingCycle} · ₹{Number(p.monthlyFee).toLocaleString()}/mo</option>
                    ))}
                  </Input>
                </FormGroup>
              </div>
              <div className="col-md-6">
                <FormGroup className="mb-0">
                  <Label className="form-label fw-medium">Setup Fee (₹) — one-time, optional</Label>
                  <Input type="number" min={0} step={0.01} value={form.setupFee} onChange={(e) => setForm((f) => ({ ...f, setupFee: Number(e.target.value) || 0 }))} className="rounded" />
                </FormGroup>
              </div>
              {!form.planId && (
                <>
                  <div className="col-md-6">
                    <FormGroup className="mb-0">
                      <Label className="form-label fw-medium">Billing cycle</Label>
                      <Input type="select" value={form.billingCycle} onChange={(e) => setForm((f) => ({ ...f, billingCycle: e.target.value }))} className="rounded">
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </Input>
                    </FormGroup>
                  </div>
                  <div className="col-md-6">
                    <FormGroup className="mb-0">
                      <Label className="form-label fw-medium">Monthly Fee (₹)</Label>
                      <Input type="number" min={0} step={0.01} value={form.monthlyFee} onChange={(e) => setForm((f) => ({ ...f, monthlyFee: Number(e.target.value) || 0 }))} className="rounded" />
                    </FormGroup>
                  </div>
                  <div className="col-md-6">
                    <FormGroup className="mb-0">
                      <Label className="form-label fw-medium">Yearly fee (₹) — for quarterly/yearly</Label>
                      <Input type="number" min={0} step={0.01} value={form.yearlyFee} onChange={(e) => setForm((f) => ({ ...f, yearlyFee: Number(e.target.value) || 0 }))} className="rounded" placeholder="e.g. 71988" />
                    </FormGroup>
                  </div>
                </>
              )}
              {form.planId && (
                <div className="col-12">
                  <p className="small text-muted mb-0">
                    Recurring pricing from plan: <strong className="text-capitalize">{form.billingCycle}</strong>
                    {form.monthlyFee > 0 && ` · ₹${Number(form.monthlyFee).toLocaleString()}/mo`}
                    {form.yearlyFee > 0 && (form.billingCycle === 'quarterly' || form.billingCycle === 'yearly') && ` · ₹${Number(form.yearlyFee).toLocaleString()}/yr`}
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter className="border-top pt-3">
            <Button color="secondary" outline onClick={() => !submitting && setModal(false)} disabled={submitting}>Cancel</Button>
            <Button color="primary" type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create Invite'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

export default InvitesList;
