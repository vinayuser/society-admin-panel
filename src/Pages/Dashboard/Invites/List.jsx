import React, { useState, useEffect, useCallback } from 'react';
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
  Pagination,
  PaginationItem,
  PaginationLink,
} from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';
import { toast } from 'react-toastify';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import ForwardToInboxOutlinedIcon from '@mui/icons-material/ForwardToInboxOutlined';

const getInviteLink = (token) => {
  const base = import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/invite/${token}`;
};

function formatLocation(row) {
  if (!row) return '–';
  const parts = [row.countryName, row.stateName, row.cityName].filter(Boolean);
  return parts.length ? parts.join(' · ') : '–';
}

const InvitesList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [viewLinkRow, setViewLinkRow] = useState(null);
  const [resendingId, setResendingId] = useState(null);
  const [plans, setPlans] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState({
    societyName: '',
    contactEmail: '',
    contactPhone: '',
    countryId: '',
    stateId: '',
    cityId: '',
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
      .get(`${ENDPOINTS.INVITES.LIST}?${params.toString()}`)
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
        toast.error('Failed to load invites');
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

  useEffect(() => {
    if (!modal) return;
    axiosInstance
      .get(`${ENDPOINTS.LOCATIONS.COUNTRIES}?limit=500`)
      .then((res) => {
        const d = listFromResponse(res);
        setCountries(Array.isArray(d) ? d : []);
      })
      .catch(() => setCountries([]));
    axiosInstance
      .get(`${ENDPOINTS.PLANS.LIST}?limit=100`)
      .then((res) => {
        const d = listFromResponse(res);
        if (res.data?.success !== false && Array.isArray(d)) setPlans(d);
        else setPlans([]);
      })
      .catch(() => setPlans([]));
  }, [modal]);

  useEffect(() => {
    if (!modal || !form.countryId) {
      if (!form.countryId) setStates([]);
      return;
    }
    const cid = Number(form.countryId);
    if (!Number.isFinite(cid)) return;
    axiosInstance
      .get(`${ENDPOINTS.LOCATIONS.STATES}?countryId=${cid}&limit=500`)
      .then((res) => {
        const d = listFromResponse(res);
        setStates(Array.isArray(d) ? d : []);
      })
      .catch(() => setStates([]));
  }, [modal, form.countryId]);

  useEffect(() => {
    if (!modal || !form.stateId) {
      if (!form.stateId) setCities([]);
      return;
    }
    const sid = Number(form.stateId);
    if (!Number.isFinite(sid)) return;
    axiosInstance
      .get(`${ENDPOINTS.LOCATIONS.CITIES}?stateId=${sid}&limit=500`)
      .then((res) => {
        const d = listFromResponse(res);
        setCities(Array.isArray(d) ? d : []);
      })
      .catch(() => setCities([]));
  }, [modal, form.stateId]);

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
    if (!form.countryId || !form.stateId || !form.cityId) {
      toast.error('Select country, state, and city');
      return;
    }
    setSubmitting(true);
    const payload = { ...form };
    payload.countryId = Number(form.countryId);
    payload.stateId = Number(form.stateId);
    payload.cityId = Number(form.cityId);
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
            countryId: '',
            stateId: '',
            cityId: '',
            flatCount: 0,
            planType: 'shared_app',
            planId: '',
            setupFee: 0,
            monthlyFee: 0,
            billingCycle: 'monthly',
            yearlyFee: 0,
            address: '',
          });
          setStates([]);
          setCities([]);
          setPagination((p) => ({ ...p, page: 1 }));
          setListRefresh((n) => n + 1);
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
        <CardBody className="p-0">
          <div className="px-3 py-2 border-bottom d-flex flex-nowrap justify-content-between align-items-center gap-2 overflow-x-auto">
            <div className="small text-muted text-nowrap flex-shrink-0">
              {loading ? 'Loading invites…' : (
                <>
                  Showing {totalNum === 0 ? 0 : start}–{end} of {totalNum} invite{totalNum !== 1 ? 's' : ''}
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
                      <th>Location</th>
                      <th>Email</th>
                      <th>Plan</th>
                      <th className="text-end">Flats</th>
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
                        <td colSpan={11} className="text-center text-muted py-5">
                          No invites yet. Create one to invite a new society.
                        </td>
                      </tr>
                    ) : (
                      list.map((row) => (
                        <tr key={row.id}>
                          <td className="fw-medium text-nowrap">{row.societyName}</td>
                          <td className="text-muted small" style={{ maxWidth: 200 }} title={row.address || ''}>
                            {row.address ? (row.address.length > 48 ? `${row.address.slice(0, 48)}…` : row.address) : '–'}
                          </td>
                          <td className="small text-muted" style={{ maxWidth: 200 }} title={formatLocation(row)}>
                            {formatLocation(row)}
                          </td>
                          <td className="small text-break">{row.email}</td>
                          <td className="small">{row.planName || row.planType || '–'}</td>
                          <td className="text-end">{row.flatCount}</td>
                          <td className="small text-nowrap">
                            <span className="text-capitalize">{(row.billingCycle || 'monthly').replace(/_/g, ' ')}</span>
                            <span className="text-muted"> · </span>
                            ₹{Number(row.monthlyFee || 0).toLocaleString()}/mo
                            {row.yearlyFee > 0 && (
                              <span className="d-block text-muted">₹{Number(row.yearlyFee).toLocaleString()}/yr</span>
                            )}
                          </td>
                          <td className="small text-nowrap">
                            ₹{Number(row.setupFee || 0).toLocaleString()}
                            {row.setupFee > 0 && (
                              <>
                                {' '}
                                {row.setupFeePaid ? (
                                  <span className="badge bg-success">Paid</span>
                                ) : (
                                  <span className="badge bg-warning text-dark">Pending</span>
                                )}
                              </>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${row.status === 'pending' ? 'bg-warning text-dark' : row.status === 'accepted' ? 'bg-success' : 'bg-secondary'}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="text-nowrap small">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '–'}</td>
                          <td className="text-end text-nowrap">
                            {row.status === 'pending' && row.inviteToken && (
                              <div className="d-inline-flex flex-nowrap align-items-center gap-1 text-nowrap">
                                <button
                                  type="button"
                                  className="btn btn-outline-info btn-sm p-1 lh-1"
                                  title="View invite links"
                                  aria-label="View invite links"
                                  onClick={() => setViewLinkRow(row)}
                                >
                                  <LinkOutlinedIcon fontSize="small" />
                                </button>
                                {resendingId === row.id ? (
                                  <span className="d-inline-flex p-1" aria-hidden="true">
                                    <span className="spinner-border spinner-border-sm text-primary" role="status" />
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm p-1 lh-1"
                                    title="Resend invite email"
                                    aria-label="Resend invite email"
                                    onClick={() => handleResend(row)}
                                  >
                                    <ForwardToInboxOutlinedIcon fontSize="small" />
                                  </button>
                                )}
                              </div>
                            )}
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
              <div className="col-md-4">
                <FormGroup className="mb-0">
                  <Label className="form-label fw-medium">Country *</Label>
                  <Input
                    type="select"
                    required
                    value={form.countryId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((f) => ({ ...f, countryId: v, stateId: '', cityId: '' }));
                      setStates([]);
                      setCities([]);
                    }}
                    className="rounded"
                  >
                    <option value="">Select country</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Input>
                </FormGroup>
              </div>
              <div className="col-md-4">
                <FormGroup className="mb-0">
                  <Label className="form-label fw-medium">State *</Label>
                  <Input
                    type="select"
                    required
                    value={form.stateId}
                    disabled={!form.countryId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((f) => ({ ...f, stateId: v, cityId: '' }));
                      setCities([]);
                    }}
                    className="rounded"
                  >
                    <option value="">{form.countryId ? 'Select state' : 'Select country first'}</option>
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </Input>
                </FormGroup>
              </div>
              <div className="col-md-4">
                <FormGroup className="mb-0">
                  <Label className="form-label fw-medium">City *</Label>
                  <Input
                    type="select"
                    required
                    value={form.cityId}
                    disabled={!form.stateId}
                    onChange={(e) => setForm((f) => ({ ...f, cityId: e.target.value }))}
                    className="rounded"
                  >
                    <option value="">{form.stateId ? 'Select city' : 'Select state first'}</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Input>
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
