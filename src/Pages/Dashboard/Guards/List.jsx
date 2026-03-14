import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
} from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_URL || '';

const ROLES = [
  { value: '', label: 'All roles' },
  { value: 'guard', label: 'Guard' },
  { value: 'head_guard', label: 'Head Guard' },
  { value: 'supervisor', label: 'Supervisor' },
];

const GuardsList = () => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filterRole, setFilterRole] = useState('');
  const [filterBlock, setFilterBlock] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    employeeId: '',
    role: 'guard',
    assignedBlocks: '',
    joiningDate: '',
  });
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    employeeId: '',
    role: 'guard',
    assignedBlocks: '',
    joiningDate: '',
    isActive: true,
  });

  const fetchList = () => {
    setLoading(true);
    const params = {};
    if (filterRole) params.role = filterRole;
    if (filterBlock) params.block = filterBlock;
    axiosInstance
      .get(ENDPOINTS.GUARDS.LIST, { params })
      .then((res) => {
        const d = res.data?.data ?? [];
        setList(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        toast.error('Failed to load guards');
        setList([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, [filterRole, filterBlock]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Name and phone required');
      return;
    }
    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email?.trim() || null,
      employeeId: form.employeeId?.trim() || null,
      role: form.role || 'guard',
      assignedBlocks: form.assignedBlocks?.trim() || null,
      joiningDate: form.joiningDate || null,
    };
    axiosInstance
      .post(ENDPOINTS.GUARDS.CREATE, payload)
      .then((res) => {
        if (res.data?.success) {
          toast.success('Guard added');
          setModal(false);
          setForm({ name: '', phone: '', email: '', employeeId: '', role: 'guard', assignedBlocks: '', joiningDate: '' });
          fetchList();
        } else {
          toast.error(res.data?.message || 'Failed to add guard');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to add guard'))
      .finally(() => setSubmitting(false));
  };

  const openEdit = (row) => {
    setEditModal(row);
    setEditForm({
      name: row.name,
      phone: row.phone || '',
      email: row.email || '',
      employeeId: row.employeeId || row.employee_id || '',
      role: row.role || 'guard',
      assignedBlocks: row.assignedBlocks || row.assigned_blocks || '',
      joiningDate: row.joiningDate || row.joining_date ? (row.joiningDate || row.joining_date).toString().slice(0, 10) : '',
      isActive: row.isActive !== false && row.is_active !== 0,
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editModal) return;
    setSubmitting(true);
    const payload = {
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      email: editForm.email?.trim() || null,
      employeeId: editForm.employeeId?.trim() || null,
      role: editForm.role || 'guard',
      assignedBlocks: editForm.assignedBlocks?.trim() || null,
      joiningDate: editForm.joiningDate || null,
      isActive: editForm.isActive,
    };
    axiosInstance
      .patch(ENDPOINTS.GUARDS.UPDATE(editModal.id), payload)
      .then((res) => {
        if (res.data?.success) {
          toast.success('Guard updated');
          setEditModal(null);
          fetchList();
        } else {
          toast.error(res.data?.message || 'Failed to update');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to update'))
      .finally(() => setSubmitting(false));
  };

  const handleToggleActive = (row) => {
    axiosInstance
      .patch(ENDPOINTS.GUARDS.UPDATE(row.id), { isActive: !row.isActive && row.is_active !== 0 })
      .then((res) => {
        if (res.data?.success) {
          toast.success(row.isActive ? 'Guard deactivated' : 'Guard activated');
          fetchList();
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to update'));
  };

  const handleDelete = (row) => {
    if (!window.confirm(`Remove guard "${row.name}"?`)) return;
    setDeletingId(row.id);
    axiosInstance
      .delete(ENDPOINTS.GUARDS.DELETE(row.id))
      .then((res) => {
        if (res.data?.success) {
          toast.success('Guard removed');
          fetchList();
        } else {
          toast.error(res.data?.message || 'Failed to remove');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to remove'))
      .finally(() => setDeletingId(null));
  };

  const roleLabel = (r) => ROLES.find((x) => x.value === r)?.label || r;
  const avatarUrl = (row) => {
    const url = row.profilePicture || row.profile_picture;
    if (url) return url.startsWith('http') ? url : `${API_BASE}${url}`;
    return null;
  };

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1>Guards</h1>
          <p className="page-subtitle mb-0">Manage security staff: profiles, shifts, leaves, and documents. Click a guard or <strong>Manage shifts</strong> to add or edit shifts.</p>
        </div>
        <Button color="primary" className="rounded-2" onClick={() => setModal(true)}>Add Guard</Button>
      </div>

      <Card className="mb-4">
        <CardBody>
          <div className="d-flex flex-wrap gap-4 align-items-end">
            <div>
              <label className="form-label small text-muted">Role</label>
              <Input type="select" className="form-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ minWidth: 140 }}>
                {ROLES.map((r) => (
                  <option key={r.value || 'all'} value={r.value}>{r.label}</option>
                ))}
              </Input>
            </div>
            <div>
              <label className="form-label small text-muted">Block / Gate</label>
              <Input className="form-control" value={filterBlock} onChange={(e) => setFilterBlock(e.target.value)} placeholder="Filter by block" style={{ minWidth: 160 }} />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="table-card">
        <CardBody>
          {loading ? (
            <div className="d-flex justify-content-center py-5"><Spinner color="primary" /></div>
          ) : (
            <Table responsive hover className="table-striped">
              <thead>
                <tr>
                  <th>Guard</th>
                  <th>Contact</th>
                  <th>Employee ID</th>
                  <th>Role</th>
                  <th>Assigned</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        {avatarUrl(row) ? (
                          <img src={avatarUrl(row)} alt="" className="rounded-circle" style={{ width: 40, height: 40, objectFit: 'cover' }} />
                        ) : (
                          <span className="navbar-avatar" style={{ width: 40, height: 40, fontSize: '0.875rem' }}>{(row.name || '?').charAt(0).toUpperCase()}</span>
                        )}
                        <div>
                          <Link to={`/admin/dashboard/guards/${row.id}`} className="fw-semibold text-dark text-decoration-none">{row.name}</Link>
                          {row.joiningDate || row.joining_date ? (
                            <div className="small text-muted">Joined {(row.joiningDate || row.joining_date).toString().slice(0, 10)}</div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{row.phone || '-'}</div>
                      {row.email && <small className="text-muted">{row.email}</small>}
                    </td>
                    <td>{row.employeeId || row.employee_id || '-'}</td>
                    <td><span className="badge bg-secondary">{roleLabel(row.role)}</span></td>
                    <td className="small">{(row.assignedBlocks || row.assigned_blocks) || '-'}</td>
                    <td>
                      <span className={`badge ${row.isActive !== false && row.is_active !== 0 ? 'bg-success' : 'bg-secondary'}`}>
                        {row.isActive !== false && row.is_active !== 0 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        <Button size="sm" color="primary" outline className="rounded-2" onClick={() => navigate(`/admin/dashboard/guards/${row.id}`)}>Profile</Button>
                        <Button size="sm" color="info" outline className="rounded-2" onClick={() => navigate(`/admin/dashboard/guards/${row.id}?tab=shifts`)}>Manage shifts</Button>
                        <Button size="sm" color="secondary" outline className="rounded-2" onClick={() => openEdit(row)}>Edit</Button>
                        <Button size="sm" color={row.isActive ? 'warning' : 'success'} outline className="rounded-2" onClick={() => handleToggleActive(row)}>
                          {row.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button size="sm" color="danger" outline className="rounded-2" onClick={() => handleDelete(row)} disabled={deletingId === row.id}>
                          {deletingId === row.id ? '…' : 'Delete'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={modal} toggle={() => !submitting && setModal(false)}>
        <ModalHeader toggle={() => !submitting && setModal(false)}>Add Guard</ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div className="row g-3">
              <div className="col-12"><label className="form-label">Name *</label><Input className="form-control" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
              <div className="col-md-6"><label className="form-label">Phone *</label><Input className="form-control" required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
              <div className="col-md-6"><label className="form-label">Email</label><Input type="email" className="form-control" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
              <div className="col-md-6"><label className="form-label">Employee ID</label><Input className="form-control" value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))} /></div>
              <div className="col-md-6"><label className="form-label">Role</label><Input type="select" className="form-select" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>{ROLES.filter((r) => r.value).map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</Input></div>
              <div className="col-md-6"><label className="form-label">Assigned blocks / gates</label><Input className="form-control" value={form.assignedBlocks} onChange={(e) => setForm((f) => ({ ...f, assignedBlocks: e.target.value }))} placeholder="e.g. Gate A, Block B" /></div>
              <div className="col-md-6"><label className="form-label">Joining date</label><Input type="date" className="form-control" value={form.joiningDate} onChange={(e) => setForm((f) => ({ ...f, joiningDate: e.target.value }))} /></div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" className="rounded-2" onClick={() => setModal(false)} disabled={submitting}>Cancel</Button>
            <Button color="primary" className="rounded-2" type="submit" disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</Button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal isOpen={!!editModal} toggle={() => !submitting && setEditModal(null)}>
        <ModalHeader toggle={() => !submitting && setEditModal(null)}>Edit Guard</ModalHeader>
        <form onSubmit={handleEditSubmit}>
          <ModalBody>
            <div className="row g-3">
              <div className="col-12"><label className="form-label">Name *</label><Input className="form-control" required value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} /></div>
              <div className="col-md-6"><label className="form-label">Phone *</label><Input className="form-control" required value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} /></div>
              <div className="col-md-6"><label className="form-label">Email</label><Input type="email" className="form-control" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} /></div>
              <div className="col-md-6"><label className="form-label">Employee ID</label><Input className="form-control" value={editForm.employeeId} onChange={(e) => setEditForm((f) => ({ ...f, employeeId: e.target.value }))} /></div>
              <div className="col-md-6"><label className="form-label">Role</label><Input type="select" className="form-select" value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}>{ROLES.filter((r) => r.value).map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</Input></div>
              <div className="col-md-6"><label className="form-label">Assigned blocks / gates</label><Input className="form-control" value={editForm.assignedBlocks} onChange={(e) => setEditForm((f) => ({ ...f, assignedBlocks: e.target.value }))} /></div>
              <div className="col-md-6"><label className="form-label">Joining date</label><Input type="date" className="form-control" value={editForm.joiningDate} onChange={(e) => setEditForm((f) => ({ ...f, joiningDate: e.target.value }))} /></div>
              <div className="col-12"><div className="form-check"><Input type="checkbox" className="form-check-input" id="edit-active" checked={editForm.isActive} onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))} /><label className="form-check-label" htmlFor="edit-active">Active</label></div></div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" className="rounded-2" onClick={() => setEditModal(null)} disabled={submitting}>Cancel</Button>
            <Button color="primary" className="rounded-2" type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

export default GuardsList;
