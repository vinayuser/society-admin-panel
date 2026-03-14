import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Input,
  Badge,
} from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';
import { toast } from 'react-toastify';

const ResidentsList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [list, setList] = useState([]);
  const [flats, setFlats] = useState([]);
  const [signupRequests, setSignupRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [passwordModal, setPasswordModal] = useState(null);
  const [passwordValue, setPasswordValue] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    flatId: '',
    password: '',
    isPrimary: false,
  });

  const fetchFlats = () => {
    axiosInstance.get(ENDPOINTS.FLATS.LIST).then((res) => {
      const d = res.data?.data ?? [];
      setFlats(Array.isArray(d) ? d : []);
    }).catch(() => setFlats([]));
  };

  const fetchList = () => {
    setLoading(true);
    axiosInstance
      .get(ENDPOINTS.RESIDENTS.LIST)
      .then((res) => {
        const d = res.data?.data ?? [];
        setList(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        toast.error('Failed to load residents');
        setList([]);
      })
      .finally(() => setLoading(false));
  };

  const fetchSignupRequests = () => {
    axiosInstance
      .get(ENDPOINTS.SIGNUP_REQUESTS.LIST + '?status=pending')
      .then((res) => {
        const d = res.data?.data ?? [];
        setSignupRequests(Array.isArray(d) ? d : []);
      })
      .catch(() => setSignupRequests([]));
  };

  useEffect(() => {
    fetchList();
    fetchFlats();
    fetchSignupRequests();
  }, []);

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setModal(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const flatId = form.flatId ? Number(form.flatId) : null;
    if (!flatId) {
      toast.error('Please select a flat');
      return;
    }
    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      flatId,
      isPrimary: !!form.isPrimary,
    };
    if (form.password.trim()) payload.password = form.password;
    axiosInstance
      .post(ENDPOINTS.RESIDENTS.CREATE, payload)
      .then((res) => {
        if (res.data?.success) {
          toast.success('Resident added');
          setModal(false);
          setForm({ name: '', email: '', phone: '', flatId: '', password: '', isPrimary: false });
          fetchList();
        } else {
          toast.error(res.data?.message || 'Failed to add resident');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to add resident'))
      .finally(() => setSubmitting(false));
  };

  const handleDelete = (row) => {
    if (!window.confirm(`Remove resident "${row.name}"? This will delete their user account.`)) return;
    setDeletingId(row.id);
    axiosInstance
      .delete(ENDPOINTS.RESIDENTS.DELETE(row.id))
      .then((res) => {
        if (res.data?.success) {
          toast.success('Resident removed');
          fetchList();
        } else {
          toast.error(res.data?.message || 'Failed to remove');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to remove'))
      .finally(() => setDeletingId(null));
  };

  const handleSetPassword = (e) => {
    e.preventDefault();
    if (!passwordModal || !passwordValue || passwordValue.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setPasswordSubmitting(true);
    axiosInstance
      .patch(ENDPOINTS.RESIDENTS.SET_PASSWORD(passwordModal.id), { password: passwordValue })
      .then((res) => {
        if (res.data?.success) {
          toast.success('Password set');
          setPasswordModal(null);
          setPasswordValue('');
        } else {
          toast.error(res.data?.message || 'Failed to set password');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to set password'))
      .finally(() => setPasswordSubmitting(false));
  };

  const handleReviewSignup = (requestId, status) => {
    setReviewingId(requestId);
    const body = status === 'rejected' ? { status: 'rejected', rejectionReason: rejectReason } : { status: 'approved' };
    axiosInstance
      .patch(ENDPOINTS.SIGNUP_REQUESTS.REVIEW(requestId), body)
      .then((res) => {
        if (res.data?.success) {
          toast.success(status === 'approved' ? 'Request approved. Member can now sign in.' : 'Request rejected');
          fetchSignupRequests();
          fetchList();
        } else {
          toast.error(res.data?.message || 'Failed');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed'))
      .finally(() => {
        setReviewingId(null);
        setRejectReason('');
      });
  };

  const avatarInitial = (name) => (name || '?').charAt(0).toUpperCase();

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1>Residents</h1>
          <p className="page-subtitle mb-0">Society members — add residents and assign them to flats.</p>
        </div>
        <Button color="primary" className="rounded-2" onClick={() => setModal(true)}>Add Resident</Button>
      </div>

      {signupRequests.length > 0 && (
        <Card className="mb-4 border-warning">
          <CardBody>
            <h5 className="mb-3"><Badge color="warning">Pending signup requests</Badge> — Approve so the member can sign in</h5>
            <Table responsive size="sm">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Flat</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {signupRequests.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.email}</td>
                    <td>{r.phone || '-'}</td>
                    <td>{r.tower}-{r.flatNumber}</td>
                    <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}</td>
                    <td>
                      <Button size="sm" color="success" className="me-2 rounded-2" onClick={() => handleReviewSignup(r.id, 'approved')} disabled={reviewingId === r.id}>
                        Approve
                      </Button>
                      <Button size="sm" color="danger" outline className="rounded-2" onClick={() => handleReviewSignup(r.id, 'rejected')} disabled={reviewingId === r.id}>
                        Reject
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <small className="text-muted">Reject optionally saves a reason; member can submit a new request later.</small>
          </CardBody>
        </Card>
      )}

      <Card className="table-card">
        <CardBody>
          {loading ? (
            <div className="d-flex justify-content-center py-5"><Spinner color="primary" /></div>
          ) : (
            <Table responsive hover className="table-striped">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Tower / Flat</th>
                  <th>Primary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <span className="navbar-avatar" style={{ width: 36, height: 36, fontSize: '0.875rem' }}>
                          {avatarInitial(row.name)}
                        </span>
                        <span>{row.name}</span>
                      </div>
                    </td>
                    <td>{row.email || '-'}</td>
                    <td>{row.phone || '-'}</td>
                    <td>{row.tower} / {row.flatNumber}</td>
                    <td>{row.isPrimary ? <Badge className="bg-primary">Primary</Badge> : '-'}</td>
                    <td>
                      <Button size="sm" color="secondary" outline className="rounded-2 me-2" onClick={() => setPasswordModal(row)}>Set password</Button>
                      <Button size="sm" color="danger" outline className="rounded-2" onClick={() => handleDelete(row)} disabled={deletingId === row.id}>
                        {deletingId === row.id ? '…' : 'Delete'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={!!passwordModal} toggle={() => !passwordSubmitting && setPasswordModal(null)} className="rounded-3">
        <ModalHeader toggle={() => !passwordSubmitting && setPasswordModal(null)}>Set password for {passwordModal?.name}</ModalHeader>
        <form onSubmit={handleSetPassword}>
          <ModalBody>
            <div className="mb-3">
              <label className="form-label">New password (min 6 characters) *</label>
              <Input type="password" className="form-control" value={passwordValue} onChange={(e) => setPasswordValue(e.target.value)} minLength={6} required placeholder="••••••••" />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setPasswordModal(null)} disabled={passwordSubmitting}>Cancel</Button>
            <Button color="primary" type="submit" disabled={passwordSubmitting || passwordValue.length < 6}>{passwordSubmitting ? 'Saving…' : 'Set password'}</Button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal isOpen={modal} toggle={() => !submitting && setModal(false)} className="rounded-3">
        <ModalHeader toggle={() => !submitting && setModal(false)}>Add Resident</ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div className="mb-3">
              <label className="form-label">Name *</label>
              <Input className="form-control" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <Input type="email" className="form-control" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="form-label">Phone</label>
              <Input className="form-control" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="form-label">Flat *</label>
              <Input type="select" className="form-select" required value={form.flatId} onChange={(e) => setForm((f) => ({ ...f, flatId: e.target.value }))}>
                <option value="">Select flat</option>
                {flats.map((f) => (
                  <option key={f.id} value={f.id}>{f.tower} - {f.flat_number}</option>
                ))}
              </Input>
            </div>
            <div className="mb-3">
              <label className="form-label">Password (optional, min 6 chars)</label>
              <Input type="password" className="form-control" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Leave blank to set later" />
            </div>
            <div className="form-check mb-3">
              <Input type="checkbox" className="form-check-input" id="res-primary" checked={form.isPrimary} onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))} />
              <label className="form-check-label" htmlFor="res-primary">Primary resident for this flat</label>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setModal(false)} disabled={submitting}>Cancel</Button>
            <Button color="primary" type="submit" disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

export default ResidentsList;
