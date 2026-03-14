import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  InputGroup,
  Row,
  Col,
  Badge,
  Pagination,
  PaginationItem,
  PaginationLink,
} from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_URL || '';

function getFlatLabel(f) {
  const num = f.flatNumber ?? f.flat_number ?? '';
  const floor = f.floor != null && f.floor !== '' ? ` · Floor ${f.floor}` : '';
  const type = f.flatType || f.flat_type ? ` · ${f.flatType || f.flat_type}` : '';
  return `${f.tower} – ${num}${floor}${type}`;
}

const ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'family_member', label: 'Family Member' },
  { value: 'committee_member', label: 'Committee Member' },
  { value: 'security_staff', label: 'Security Staff' },
  { value: 'maintenance_staff', label: 'Maintenance Staff' },
];
const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'moved_out', label: 'Moved Out' },
  { value: 'blacklisted', label: 'Blacklisted' },
];

export default function MembersList() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterTower, setFilterTower] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [towers, setTowers] = useState([]);
  const [flatSearchQuery, setFlatSearchQuery] = useState('');
  const [flatDropdownOpen, setFlatDropdownOpen] = useState(false);
  const flatDropdownRef = useRef(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    flatId: '',
    role: 'family_member',
    gender: '',
    dob: '',
    occupation: '',
    status: 'active',
    joinedAt: '',
  });

  const fetchFlats = useCallback(() => {
    axiosInstance.get(ENDPOINTS.FLATS.LIST + '?limit=500').then((res) => {
      const d = res.data?.data ?? [];
      setFlats(Array.isArray(d) ? d : []);
    }).catch(() => setFlats([]));
  }, []);

  const fetchTowers = useCallback(() => {
    axiosInstance.get(ENDPOINTS.FLATS.TOWERS).then((res) => {
      const t = res.data?.data ?? [];
      setTowers(Array.isArray(t) ? t : []);
    }).catch(() => setTowers([]));
  }, []);

  const fetchList = useCallback((page = 1, limit = pagination.limit) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchApplied.trim()) params.set('search', searchApplied.trim());
    if (filterRole) params.set('role', filterRole);
    if (filterTower) params.set('tower', filterTower);
    if (filterStatus) params.set('status', filterStatus);
    params.set('page', String(page));
    params.set('limit', String(limit));
    axiosInstance
      .get(ENDPOINTS.MEMBERS.LIST + '?' + params.toString())
      .then((res) => {
        const d = res.data?.data ?? [];
        setList(Array.isArray(d) ? d : []);
        const p = res.data?.pagination ?? {};
        setPagination((prev) => ({ ...prev, page: p.page ?? page, limit: limit, total: p.total ?? prev.total }));
      })
      .catch(() => {
        toast.error('Failed to load members');
        setList([]);
      })
      .finally(() => setLoading(false));
  }, [searchApplied, filterRole, filterTower, filterStatus, pagination.limit]);

  useEffect(() => {
    fetchList(pagination.page);
  }, [fetchList, pagination.page]);

  useEffect(() => {
    fetchFlats();
    fetchTowers();
  }, [fetchFlats, fetchTowers]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (flatDropdownRef.current && !flatDropdownRef.current.contains(e.target)) setFlatDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (modal) {
      setFlatSearchQuery('');
      setFlatDropdownOpen(false);
    }
  }, [modal]);

  const applySearch = () => {
    setSearchApplied(search.trim());
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const onFilterChange = (setter, value) => {
    setter(value);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const filteredFlats = flatSearchQuery.trim()
    ? flats.filter((f) => {
        const q = flatSearchQuery.trim().toLowerCase();
        const label = getFlatLabel(f).toLowerCase();
        const tower = (f.tower || '').toLowerCase();
        const num = String(f.flatNumber ?? f.flat_number ?? '').toLowerCase();
        return label.includes(q) || tower.includes(q) || num.includes(q);
      })
    : flats;
  const selectedFlat = form.flatId ? flats.find((f) => String(f.id) === String(form.flatId)) : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      flatId: form.flatId ? Number(form.flatId) : null,
      role: form.role || 'family_member',
      gender: form.gender.trim() || null,
      dob: form.dob || null,
      occupation: form.occupation.trim() || null,
      status: form.status || 'active',
      joinedAt: form.joinedAt || null,
    };
    axiosInstance
      .post(ENDPOINTS.MEMBERS.CREATE, payload)
      .then((res) => {
        if (res.data?.success) {
          toast.success('Member added');
          setModal(false);
          setForm({ name: '', phone: '', email: '', flatId: '', role: 'family_member', gender: '', dob: '', occupation: '', status: 'active', joinedAt: '' });
          setFlatSearchQuery('');
          setFlatDropdownOpen(false);
          setPagination((p) => ({ ...p, page: 1 }));
          fetchList(1);
        } else {
          toast.error(res.data?.message || 'Failed to add member');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to add member'))
      .finally(() => setSubmitting(false));
  };

  const handleDelete = (row) => {
    if (!window.confirm(`Remove member ${row.name}?`)) return;
    setDeletingId(row.id);
    axiosInstance
      .delete(ENDPOINTS.MEMBERS.DELETE(row.id))
      .then((res) => {
        if (res.data?.success) {
          toast.success('Member removed');
          fetchList(pagination.page);
        } else {
          toast.error(res.data?.message || 'Failed to remove');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to remove'))
      .finally(() => setDeletingId(null));
  };

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);
  const hasFilters = searchApplied || filterRole || filterTower || filterStatus;
  const avatarUrl = (row) => {
    const url = row.profileImage || row.profile_image;
    return url ? (url.startsWith('http') ? url : `${API_BASE}${url}`) : null;
  };

  return (
    <div className="members-list-page">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <h1 className="h4 mb-0 fw-semibold">Members</h1>
        <Button color="primary" onClick={() => setModal(true)}>Add Member</Button>
      </div>
      <Card className="shadow-sm border-0 rounded-3">
        <CardBody className="p-0">
          <div className="p-3 border-bottom bg-light">
            <Row className="g-2 align-items-end">
              <Col md={3}>
                <Label className="small text-muted mb-1 d-block">Search</Label>
                <InputGroup size="sm">
                  <Input
                    placeholder="Name, phone, email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                  />
                  <Button color="primary" onClick={applySearch}>Search</Button>
                </InputGroup>
              </Col>
              <Col md={2}>
                <Label className="small text-muted mb-1 d-block">Role</Label>
                <Input type="select" value={filterRole} onChange={(e) => onFilterChange(setFilterRole, e.target.value)} className="form-select form-select-sm">
                  <option value="">All</option>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </Input>
              </Col>
              <Col md={2}>
                <Label className="small text-muted mb-1 d-block">Block / Tower</Label>
                <Input type="select" value={filterTower} onChange={(e) => onFilterChange(setFilterTower, e.target.value)} className="form-select form-select-sm">
                  <option value="">All</option>
                  {towers.map((t) => <option key={t} value={t}>{t}</option>)}
                </Input>
              </Col>
              <Col md={2}>
                <Label className="small text-muted mb-1 d-block">Status</Label>
                <Input type="select" value={filterStatus} onChange={(e) => onFilterChange(setFilterStatus, e.target.value)} className="form-select form-select-sm">
                  <option value="">All</option>
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Input>
              </Col>
              <Col md={2}>
                <Label className="small text-muted mb-1 d-block">Per page</Label>
                <Input type="select" value={pagination.limit} onChange={(e) => { const limit = Number(e.target.value); setPagination((p) => ({ ...p, limit, page: 1 })); fetchList(1, limit); }} className="form-select form-select-sm">
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </Input>
              </Col>
              {hasFilters && (
                <Col auto>
                  <Button color="light" size="sm" onClick={() => { setSearch(''); setSearchApplied(''); setFilterRole(''); setFilterTower(''); setFilterStatus(''); setPagination((p) => ({ ...p, page: 1 })); }}>Clear filters</Button>
                </Col>
              )}
            </Row>
          </div>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5"><Spinner color="primary" /></div>
          ) : (
            <>
              <div className="px-3 py-2 border-bottom small text-muted">
                Showing {pagination.total === 0 ? 0 : start}–{end} of {pagination.total} member{pagination.total !== 1 ? 's' : ''}
              </div>
              <Table responsive hover className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Profile</th>
                    <th>Name</th>
                    <th>Flat</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-5">
                        {hasFilters ? 'No members match the current filters.' : 'No members yet. Add a member to get started.'}
                      </td>
                    </tr>
                  ) : (
                    list.map((row) => (
                      <tr key={row.id}>
                        <td>
                          {avatarUrl(row) ? (
                            <img src={avatarUrl(row)} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dee2e6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                              {(row.name || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td>{row.name || '—'}</td>
                        <td>{row.tower && row.flatNumber ? `${row.tower} – ${row.flatNumber}` : '—'}</td>
                        <td><Badge color="light" className="text-dark">{(row.role || '').replace(/_/g, ' ')}</Badge></td>
                        <td>{row.phone || '—'}</td>
                        <td>
                          <Badge color={row.status === 'active' ? 'success' : row.status === 'moved_out' ? 'secondary' : 'warning'}>
                            {(row.status || 'active').replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <Button size="sm" color="info" className="me-1" onClick={() => navigate(`/admin/dashboard/members/${row.id}`)}>View</Button>
                          <Button size="sm" color="primary" outline className="me-1" onClick={() => navigate(`/admin/dashboard/members/${row.id}?edit=1`)}>Edit</Button>
                          <Button size="sm" color="danger" outline onClick={() => handleDelete(row)} disabled={deletingId === row.id}>
                            {deletingId === row.id ? '…' : 'Delete'}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top flex-wrap gap-2">
                  <span className="small text-muted">Page {pagination.page} of {totalPages}</span>
                  <Pagination className="mb-0">
                    <PaginationItem disabled={pagination.page <= 1}>
                      <PaginationLink previous onClick={() => fetchList(pagination.page - 1)} />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = pagination.page <= 3 ? i + 1 : Math.max(1, pagination.page - 2 + i);
                      if (p > totalPages) return null;
                      return (
                        <PaginationItem key={p} active={p === pagination.page}>
                          <PaginationLink onClick={() => fetchList(p)}>{p}</PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem disabled={pagination.page >= totalPages}>
                      <PaginationLink next onClick={() => fetchList(pagination.page + 1)} />
                    </PaginationItem>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={modal} toggle={() => !submitting && setModal(false)} size="lg">
        <ModalHeader toggle={() => !submitting && setModal(false)}>Add Member</ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup><Label>Name *</Label><Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Flat</Label>
                  <div ref={flatDropdownRef} className="position-relative">
                    <Input
                      type="text"
                      placeholder="Search by tower or flat number…"
                      value={flatDropdownOpen ? flatSearchQuery : (selectedFlat ? getFlatLabel(selectedFlat) : '')}
                      onChange={(e) => {
                        setFlatSearchQuery(e.target.value);
                        setFlatDropdownOpen(true);
                      }}
                      onFocus={() => {
                        setFlatDropdownOpen(true);
                        if (selectedFlat) setFlatSearchQuery('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setFlatDropdownOpen(false);
                      }}
                      autoComplete="off"
                    />
                    {selectedFlat && !flatDropdownOpen && (
                      <Button type="button" color="link" className="position-absolute end-0 top-50 translate-middle-y text-muted p-0 me-2" style={{ fontSize: '0.85rem' }} onClick={() => { setForm((f) => ({ ...f, flatId: '' })); setFlatSearchQuery(''); }}>
                        Clear
                      </Button>
                    )}
                    {flatDropdownOpen && (
                      <ul className="list-group position-absolute w-100 mt-1 border rounded shadow-sm" style={{ maxHeight: 220, overflowY: 'auto', zIndex: 1050 }}>
                        {filteredFlats.length === 0 ? (
                          <li className="list-group-item list-group-item-light small text-muted">No flats match</li>
                        ) : (
                          filteredFlats.slice(0, 100).map((f) => (
                            <li
                              key={f.id}
                              className="list-group-item list-group-item-action py-2 small cursor-pointer"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                setForm((prev) => ({ ...prev, flatId: String(f.id) }));
                                setFlatSearchQuery('');
                                setFlatDropdownOpen(false);
                              }}
                            >
                              {getFlatLabel(f)}
                            </li>
                          ))
                        )}
                        {filteredFlats.length > 100 && (
                          <li className="list-group-item list-group-item-light small text-muted">Type to narrow down ({filteredFlats.length} total)</li>
                        )}
                      </ul>
                    )}
                  </div>
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}><FormGroup><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></FormGroup></Col>
              <Col md={6}><FormGroup><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></FormGroup></Col>
            </Row>
            <Row>
              <Col md={4}><FormGroup><Label>Role</Label><Input type="select" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>{ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</Input></FormGroup></Col>
              <Col md={4}><FormGroup><Label>Gender</Label><Input type="select" value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}><option value="">—</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></Input></FormGroup></Col>
              <Col md={4}><FormGroup><Label>Status</Label><Input type="select" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>{STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</Input></FormGroup></Col>
            </Row>
            <Row>
              <Col md={6}><FormGroup><Label>Occupation</Label><Input value={form.occupation} onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))} /></FormGroup></Col>
              <Col md={3}><FormGroup><Label>Date of birth</Label><Input type="date" value={form.dob} onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))} /></FormGroup></Col>
              <Col md={3}><FormGroup><Label>Joined at</Label><Input type="date" value={form.joinedAt} onChange={(e) => setForm((f) => ({ ...f, joinedAt: e.target.value }))} /></FormGroup></Col>
            </Row>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setModal(false)} disabled={submitting}>Cancel</Button>
            <Button color="primary" type="submit" disabled={submitting}>{submitting ? 'Adding…' : 'Add Member'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
