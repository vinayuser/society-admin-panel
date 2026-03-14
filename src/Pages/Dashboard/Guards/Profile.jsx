import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Table,
  Spinner,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Nav,
  NavItem,
  NavLink,
} from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_URL || '';

const ROLES = [{ value: 'guard', label: 'Guard' }, { value: 'head_guard', label: 'Head Guard' }, { value: 'supervisor', label: 'Supervisor' }];
const LEAVE_TYPES = ['sick', 'casual', 'vacation', 'emergency'];

const VALID_TABS = ['personal', 'shifts', 'leaves', 'documents'];

export default function GuardProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const initialTab = VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'personal';
  const [guard, setGuard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [shifts, setShifts] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [shiftModal, setShiftModal] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);
  const [leaveApproveModal, setLeaveApproveModal] = useState(null);
  const [docUploadModal, setDocUploadModal] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const [shiftForm, setShiftForm] = useState({ shiftStart: '', shiftEnd: '', assignedGate: '' });
  const [leaveForm, setLeaveForm] = useState({ leaveType: 'casual', startDate: '', endDate: '', notes: '' });
  const [docForm, setDocForm] = useState({ documentName: '', documentType: 'id_proof', expiryDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axiosInstance.get(ENDPOINTS.GUARDS.GET(id))
      .then((res) => { if (res.data?.success) setGuard(res.data.data); })
      .catch(() => toast.error('Guard not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (VALID_TABS.includes(t) && t !== activeTab) setActiveTab(t);
  }, [searchParams]);

  const setTab = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'personal' ? {} : { tab });
  };

  useEffect(() => {
    if (!id || activeTab !== 'shifts') return;
    setLoadingShifts(true);
    axiosInstance.get(ENDPOINTS.GUARDS.SHIFTS(id))
      .then((res) => setShifts(res.data?.data ?? []))
      .catch(() => setShifts([]))
      .finally(() => setLoadingShifts(false));
  }, [id, activeTab]);

  useEffect(() => {
    if (!id || activeTab !== 'leaves') return;
    setLoadingLeaves(true);
    axiosInstance.get(ENDPOINTS.GUARDS.LEAVES(id))
      .then((res) => setLeaves(res.data?.data ?? []))
      .catch(() => setLeaves([]))
      .finally(() => setLoadingLeaves(false));
  }, [id, activeTab]);

  useEffect(() => {
    if (!id || activeTab !== 'documents') return;
    setLoadingDocs(true);
    axiosInstance.get(ENDPOINTS.GUARDS.DOCUMENTS(id))
      .then((res) => setDocuments(res.data?.data ?? []))
      .catch(() => setDocuments([]))
      .finally(() => setLoadingDocs(false));
  }, [id, activeTab]);

  const profileUrl = guard?.profilePicture || guard?.profile_picture;
  const avatarSrc = profileUrl ? (profileUrl.startsWith('http') ? profileUrl : `${API_BASE}${profileUrl}`) : null;

  const handleProfilePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setProfileUploading(true);
    const fd = new FormData();
    fd.append('profile', file);
    axiosInstance.post(ENDPOINTS.GUARDS.PROFILE_PICTURE(id), fd, { headers: { 'Content-Type': undefined } })
      .then((res) => {
        if (res.data?.success && res.data?.data?.profilePicture) {
          setGuard((g) => ({ ...g, profilePicture: res.data.data.profilePicture }));
          toast.success('Photo updated');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Upload failed'))
      .finally(() => setProfileUploading(false));
  };

  const handleShiftSubmit = (e) => {
    e.preventDefault();
    if (!shiftForm.shiftStart || !shiftForm.shiftEnd || !id) return;
    setSubmitting(true);
    const payload = {
      shiftStart: new Date(shiftForm.shiftStart).toISOString(),
      shiftEnd: new Date(shiftForm.shiftEnd).toISOString(),
      assignedGate: shiftForm.assignedGate || null,
    };
    const req = editingShiftId
      ? axiosInstance.patch(ENDPOINTS.GUARDS.SHIFT_UPDATE(id, editingShiftId), payload)
      : axiosInstance.post(ENDPOINTS.GUARDS.SHIFTS(id), payload);
    req
      .then((res) => {
        if (res.data?.success) {
          toast.success(editingShiftId ? 'Shift updated' : 'Shift added');
          setShiftModal(false);
          setEditingShiftId(null);
          setShiftForm({ shiftStart: '', shiftEnd: '', assignedGate: '' });
          if (activeTab === 'shifts') setLoadingShifts(true);
          axiosInstance.get(ENDPOINTS.GUARDS.SHIFTS(id)).then((r) => setShifts(r.data?.data ?? [])).finally(() => setLoadingShifts(false));
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed'))
      .finally(() => setSubmitting(false));
  };

  const handleShiftDelete = (shiftId) => {
    if (!window.confirm('Remove this shift?')) return;
    axiosInstance.delete(ENDPOINTS.GUARDS.SHIFT_DELETE(id, shiftId))
      .then((res) => { if (res.data?.success) { toast.success('Shift removed'); setShifts((s) => s.filter((x) => x.id !== shiftId)); } })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed'));
  };

  const openEditShift = (s) => {
    setEditingShiftId(s.id);
    setShiftForm({
      shiftStart: (s.shiftStart || s.shift_start || '').slice(0, 16),
      shiftEnd: (s.shiftEnd || s.shift_end || '').slice(0, 16),
      assignedGate: s.assignedGate || s.assigned_gate || '',
    });
    setShiftModal(true);
  };

  const handleLeaveSubmit = (e) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !id) return;
    setSubmitting(true);
    axiosInstance.post(ENDPOINTS.GUARDS.LEAVES(id), {
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      notes: leaveForm.notes || null,
    })
      .then((res) => {
        if (res.data?.success) {
          toast.success('Leave request added');
          setLeaveModal(false);
          setLeaveForm({ leaveType: 'casual', startDate: '', endDate: '', notes: '' });
          axiosInstance.get(ENDPOINTS.GUARDS.LEAVES(id)).then((r) => setLeaves(r.data?.data ?? [])).finally(() => setLoadingLeaves(false));
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed'))
      .finally(() => setSubmitting(false));
  };

  const handleLeaveStatus = (leaveId, status) => {
    axiosInstance.patch(ENDPOINTS.GUARDS.LEAVE_STATUS(id, leaveId), { status })
      .then((res) => {
        if (res.data?.success) {
          toast.success(status === 'approved' ? 'Leave approved' : 'Leave rejected');
          setLeaveApproveModal(null);
          axiosInstance.get(ENDPOINTS.GUARDS.LEAVES(id)).then((r) => setLeaves(r.data?.data ?? []));
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed'));
  };

  const handleDocUpload = (e) => {
    e.preventDefault();
    const file = docForm.file;
    if (!file || !id) { toast.error('Select a file'); return; }
    setSubmitting(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('documentName', docForm.documentName || file.name);
    fd.append('documentType', docForm.documentType || '');
    if (docForm.expiryDate) fd.append('expiryDate', docForm.expiryDate);
    axiosInstance.post(ENDPOINTS.GUARDS.DOCUMENTS(id), fd, { headers: { 'Content-Type': undefined } })
      .then((res) => {
        if (res.data?.success) {
          toast.success('Document uploaded');
          setDocUploadModal(false);
          setDocForm({ documentName: '', documentType: 'id_proof', expiryDate: '', file: null });
          axiosInstance.get(ENDPOINTS.GUARDS.DOCUMENTS(id)).then((r) => setDocuments(r.data?.data ?? [])).finally(() => setLoadingDocs(false));
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Upload failed'))
      .finally(() => setSubmitting(false));
  };

  const docUrl = (doc) => {
    const u = doc.fileUrl || doc.file_url;
    return u?.startsWith('http') ? u : `${API_BASE}${u}`;
  };

  const handleDocDelete = (docId) => {
    if (!window.confirm('Delete this document?')) return;
    axiosInstance.delete(ENDPOINTS.GUARDS.DOCUMENT_DELETE(id, docId))
      .then((res) => { if (res.data?.success) { toast.success('Document deleted'); setDocuments((d) => d.filter((x) => x.id !== docId)); } })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed'));
  };

  if (loading && !guard) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner color="primary" />
      </div>
    );
  }
  if (!guard) {
    return (
      <div>
        <Button color="secondary" className="rounded-2 mb-3" onClick={() => navigate('/admin/dashboard/guards')}>Back to Guards</Button>
        <Card><CardBody className="text-center text-muted">Guard not found.</CardBody></Card>
      </div>
    );
  }

  return (
    <div>
      <Button color="secondary" className="rounded-2 mb-3" onClick={() => navigate('/admin/dashboard/guards')}>Back to Guards</Button>

      <Card className="mb-4">
        <CardBody className="d-flex flex-wrap align-items-center gap-4">
          <div className="position-relative">
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className="rounded-circle" style={{ width: 80, height: 80, objectFit: 'cover' }} />
            ) : (
              <span className="navbar-avatar d-inline-flex align-items-center justify-content-center" style={{ width: 80, height: 80, fontSize: '2rem' }}>{(guard.name || '?').charAt(0).toUpperCase()}</span>
            )}
            <label className="position-absolute bottom-0 end-0 rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mb-0" style={{ width: 28, height: 28, cursor: 'pointer' }}>
              <input type="file" accept="image/*" className="d-none" onChange={handleProfilePhoto} disabled={profileUploading} />
              {profileUploading ? <Spinner className="spinner-border-sm" /> : <span>+</span>}
            </label>
          </div>
          <div>
            <h2 className="h4 mb-1">{guard.name}</h2>
            <p className="text-muted small mb-1">{guard.phone}</p>
            {guard.email && <p className="text-muted small mb-1">{guard.email}</p>}
            <span className="badge bg-secondary me-1">{ROLES.find((r) => r.value === guard.role)?.label || guard.role}</span>
            {(guard.assignedBlocks || guard.assigned_blocks) && <span className="badge bg-info">{(guard.assignedBlocks || guard.assigned_blocks)}</span>}
          </div>
        </CardBody>
      </Card>

      <Nav pills className="nav-pills-custom mb-4">
        {['personal', 'shifts', 'leaves', 'documents'].map((tab) => (
          <NavItem key={tab}>
            <NavLink active={activeTab === tab} href="#" onClick={(e) => { e.preventDefault(); setTab(tab); }}>
              {tab === 'shifts' ? 'Shift schedule' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </NavLink>
          </NavItem>
        ))}
      </Nav>

      {activeTab === 'personal' && (
        <Card>
          <CardHeader>Personal Info</CardHeader>
          <CardBody>
            <dl className="row mb-0">
              <dt className="col-sm-3">Name</dt><dd className="col-sm-9">{guard.name}</dd>
              <dt className="col-sm-3">Phone</dt><dd className="col-sm-9">{guard.phone || '-'}</dd>
              <dt className="col-sm-3">Email</dt><dd className="col-sm-9">{guard.email || '-'}</dd>
              <dt className="col-sm-3">Employee ID</dt><dd className="col-sm-9">{guard.employeeId || guard.employee_id || '-'}</dd>
              <dt className="col-sm-3">Role</dt><dd className="col-sm-9">{ROLES.find((r) => r.value === guard.role)?.label || guard.role}</dd>
              <dt className="col-sm-3">Assigned blocks / gates</dt><dd className="col-sm-9">{(guard.assignedBlocks || guard.assigned_blocks) || '-'}</dd>
              <dt className="col-sm-3">Joining date</dt><dd className="col-sm-9">{(guard.joiningDate || guard.joining_date) ? (guard.joiningDate || guard.joining_date).toString().slice(0, 10) : '-'}</dd>
              <dt className="col-sm-3">Status</dt><dd className="col-sm-9"><span className={`badge ${guard.isActive !== false && guard.is_active !== 0 ? 'bg-success' : 'bg-secondary'}`}>{guard.isActive !== false && guard.is_active !== 0 ? 'Active' : 'Inactive'}</span></dd>
            </dl>
            <Button color="primary" className="rounded-2 mt-2" onClick={() => navigate('/admin/dashboard/guards')}>Edit in list</Button>
          </CardBody>
        </Card>
      )}

      {activeTab === 'shifts' && (
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center">
            <span>Shift Schedule</span>
            <Button color="primary" size="sm" className="rounded-2" onClick={() => { setEditingShiftId(null); setShiftForm({ shiftStart: '', shiftEnd: '', assignedGate: '' }); setShiftModal(true); }}>Add Shift</Button>
          </CardHeader>
          <CardBody>
            {loadingShifts ? <Spinner /> : (
              shifts.length === 0 ? <p className="text-muted mb-0">No shifts assigned.</p> : (
                <Table responsive hover className="table-striped">
                  <thead><tr><th>Start</th><th>End</th><th>Gate</th><th>Actions</th></tr></thead>
                  <tbody>
                    {shifts.map((s) => (
                      <tr key={s.id}>
                        <td>{new Date(s.shiftStart || s.shift_start).toLocaleString()}</td>
                        <td>{new Date(s.shiftEnd || s.shift_end).toLocaleString()}</td>
                        <td>{s.assignedGate || s.assigned_gate || '-'}</td>
                        <td>
                          <Button size="sm" color="secondary" outline className="rounded-2 me-1" onClick={() => openEditShift(s)}>Edit</Button>
                          <Button size="sm" color="danger" outline className="rounded-2" onClick={() => handleShiftDelete(s.id)}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'leaves' && (
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center">
            <span>Leaves</span>
            <Button color="primary" size="sm" className="rounded-2" onClick={() => setLeaveModal(true)}>Request Leave</Button>
          </CardHeader>
          <CardBody>
            {loadingLeaves ? <Spinner /> : (
              leaves.length === 0 ? <p className="text-muted mb-0">No leave records.</p> : (
                <Table responsive hover className="table-striped">
                  <thead><tr><th>Type</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {leaves.map((l) => (
                      <tr key={l.id}>
                        <td>{l.leaveType || l.leave_type}</td>
                        <td>{(l.startDate || l.start_date).toString().slice(0, 10)}</td>
                        <td>{(l.endDate || l.end_date).toString().slice(0, 10)}</td>
                        <td>
                          <span className={`badge ${(l.status || '') === 'approved' ? 'bg-success' : (l.status || '') === 'rejected' ? 'bg-danger' : 'bg-warning'}`}>{l.status}</span>
                        </td>
                        <td>
                          {(l.status || '') === 'pending' && (
                            <>
                              <Button size="sm" color="success" outline className="rounded-2 me-1" onClick={() => setLeaveApproveModal({ leave: l, action: 'approved' })}>Approve</Button>
                              <Button size="sm" color="danger" outline className="rounded-2" onClick={() => setLeaveApproveModal({ leave: l, action: 'rejected' })}>Reject</Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'documents' && (
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center">
            <span>Documents</span>
            <Button color="primary" size="sm" className="rounded-2" onClick={() => setDocUploadModal(true)}>Upload</Button>
          </CardHeader>
          <CardBody>
            {loadingDocs ? <Spinner /> : (
              documents.length === 0 ? <p className="text-muted mb-0">No documents.</p> : (
                <ul className="list-group list-group-flush">
                  {documents.map((d) => (
                    <li key={d.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{d.documentName || d.document_name}</strong>
                        {d.expiryDate || d.expiry_date ? <small className="text-muted ms-2">Expires: {(d.expiryDate || d.expiry_date).toString().slice(0, 10)}</small> : null}
                      </div>
                      <div>
                        <a href={docUrl(d)} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary rounded-2 me-1">View</a>
                        <Button size="sm" color="danger" outline className="rounded-2" onClick={() => handleDocDelete(d.id)}>Delete</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            )}
          </CardBody>
        </Card>
      )}

      <Modal isOpen={shiftModal} toggle={() => !submitting && setShiftModal(false)}>
        <ModalHeader toggle={() => !submitting && setShiftModal(false)}>{editingShiftId ? 'Edit Shift' : 'Add Shift'}</ModalHeader>
        <form onSubmit={handleShiftSubmit}>
          <ModalBody>
            <div className="mb-3"><label className="form-label">Start (datetime)</label><Input type="datetime-local" className="form-control" required value={shiftForm.shiftStart} onChange={(e) => setShiftForm((f) => ({ ...f, shiftStart: e.target.value }))} /></div>
            <div className="mb-3"><label className="form-label">End (datetime)</label><Input type="datetime-local" className="form-control" required value={shiftForm.shiftEnd} onChange={(e) => setShiftForm((f) => ({ ...f, shiftEnd: e.target.value }))} /></div>
            <div className="mb-3"><label className="form-label">Assigned gate</label><Input className="form-control" value={shiftForm.assignedGate} onChange={(e) => setShiftForm((f) => ({ ...f, assignedGate: e.target.value }))} /></div>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" className="rounded-2" onClick={() => setShiftModal(false)} disabled={submitting}>Cancel</Button>
            <Button color="primary" className="rounded-2" type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal isOpen={leaveModal} toggle={() => !submitting && setLeaveModal(false)}>
        <ModalHeader toggle={() => !submitting && setLeaveModal(false)}>Request Leave</ModalHeader>
        <form onSubmit={handleLeaveSubmit}>
          <ModalBody>
            <div className="mb-3"><label className="form-label">Type</label><Input type="select" className="form-select" value={leaveForm.leaveType} onChange={(e) => setLeaveForm((f) => ({ ...f, leaveType: e.target.value }))}>{LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Input></div>
            <div className="mb-3"><label className="form-label">Start date</label><Input type="date" className="form-control" required value={leaveForm.startDate} onChange={(e) => setLeaveForm((f) => ({ ...f, startDate: e.target.value }))} /></div>
            <div className="mb-3"><label className="form-label">End date</label><Input type="date" className="form-control" required value={leaveForm.endDate} onChange={(e) => setLeaveForm((f) => ({ ...f, endDate: e.target.value }))} /></div>
            <div className="mb-3"><label className="form-label">Notes</label><Input type="textarea" className="form-control" value={leaveForm.notes} onChange={(e) => setLeaveForm((f) => ({ ...f, notes: e.target.value }))} /></div>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" className="rounded-2" onClick={() => setLeaveModal(false)} disabled={submitting}>Cancel</Button>
            <Button color="primary" className="rounded-2" type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit'}</Button>
          </ModalFooter>
        </form>
      </Modal>

      {leaveApproveModal && (
        <Modal isOpen toggle={() => setLeaveApproveModal(null)}>
          <ModalHeader toggle={() => setLeaveApproveModal(null)}>{leaveApproveModal.action === 'approved' ? 'Approve' : 'Reject'} Leave?</ModalHeader>
          <ModalBody>Leave from {(leaveApproveModal.leave.startDate || leaveApproveModal.leave.start_date).toString().slice(0, 10)} to {(leaveApproveModal.leave.endDate || leaveApproveModal.leave.end_date).toString().slice(0, 10)}.</ModalBody>
          <ModalFooter>
            <Button color="secondary" className="rounded-2" onClick={() => setLeaveApproveModal(null)}>Cancel</Button>
            <Button color={leaveApproveModal.action === 'approved' ? 'success' : 'danger'} className="rounded-2" onClick={() => handleLeaveStatus(leaveApproveModal.leave.id, leaveApproveModal.action)}>Confirm</Button>
          </ModalFooter>
        </Modal>
      )}

      <Modal isOpen={docUploadModal} toggle={() => !submitting && setDocUploadModal(false)}>
        <ModalHeader toggle={() => !submitting && setDocUploadModal(false)}>Upload Document</ModalHeader>
        <form onSubmit={handleDocUpload}>
          <ModalBody>
            <div className="mb-3"><label className="form-label">Document name</label><Input className="form-control" value={docForm.documentName} onChange={(e) => setDocForm((f) => ({ ...f, documentName: e.target.value }))} placeholder="e.g. Aadhar" /></div>
            <div className="mb-3"><label className="form-label">Type</label><Input type="select" className="form-select" value={docForm.documentType} onChange={(e) => setDocForm((f) => ({ ...f, documentType: e.target.value }))}><option value="id_proof">ID proof</option><option value="contract">Contract</option><option value="certificate">Certificate</option><option value="other">Other</option></Input></div>
            <div className="mb-3"><label className="form-label">Expiry date (optional)</label><Input type="date" className="form-control" value={docForm.expiryDate} onChange={(e) => setDocForm((f) => ({ ...f, expiryDate: e.target.value }))} /></div>
            <div className="mb-3"><label className="form-label">File *</label><Input type="file" className="form-control" accept="image/*,application/pdf" onChange={(e) => setDocForm((f) => ({ ...f, file: e.target.files?.[0] }))} /></div>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" className="rounded-2" onClick={() => setDocUploadModal(false)} disabled={submitting}>Cancel</Button>
            <Button color="primary" className="rounded-2" type="submit" disabled={submitting || !docForm.file}>{submitting ? 'Uploading…' : 'Upload'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
