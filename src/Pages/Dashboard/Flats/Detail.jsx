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
  Nav,
  NavItem,
  NavLink,
  FormGroup,
  Label,
  Input,
  Badge,
  Row,
  Col,
} from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_URL || '';

const TABS = ['overview', 'members', 'vehicles', 'maintenance', 'documents', 'complaints', 'visitors'];
const MEMBER_ROLES = ['owner', 'tenant', 'family_member', 'domestic_help'];
const STATUS_COLOR = { active: 'success', vacant: 'secondary', under_maintenance: 'warning' };

export default function FlatDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editMode = searchParams.get('edit') === '1';
  const tabFromUrl = searchParams.get('tab');
  const initialTab = TABS.includes(tabFromUrl) ? tabFromUrl : 'overview';

  const [flat, setFlat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [members, setMembers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [billing, setBilling] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [loadingTab, setLoadingTab] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [memberModal, setMemberModal] = useState(false);
  const [vehicleModal, setVehicleModal] = useState(false);
  const [docModal, setDocModal] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: '', phone: '', email: '', role: 'family_member' });
  const [vehicleForm, setVehicleForm] = useState({ vehicleNumber: '', vehicleType: 'car', parkingSlot: '' });
  const [docForm, setDocForm] = useState({ documentName: '', documentType: '' });
  const [docFile, setDocFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState(null);
  const [deletingVehicleId, setDeletingVehicleId] = useState(null);
  const [deletingDocId, setDeletingDocId] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axiosInstance.get(ENDPOINTS.FLATS.GET(id))
      .then((res) => {
        if (res.data?.success) setFlat(res.data.data);
        else toast.error('Flat not found');
      })
      .catch(() => toast.error('Flat not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (editMode && flat) {
      setEditForm({
        tower: flat.tower || '',
        flatNumber: flat.flatNumber || flat.flat_number || '',
        floor: flat.floor ?? '',
        flatType: flat.flatType || '',
        areaSqft: flat.areaSqft ?? '',
        ownershipType: flat.ownershipType || '',
        ownerName: flat.ownerName || '',
        ownerContact: flat.ownerContact || '',
        ownerEmail: flat.ownerEmail || '',
        status: flat.status || 'active',
      });
      setEditModal(true);
    }
  }, [editMode, flat]);

  const fetchMembers = () => {
    if (!id) return;
    setLoadingTab(true);
    axiosInstance.get(ENDPOINTS.FLATS.MEMBERS(id))
      .then((res) => setMembers(res.data?.data ?? res.data?.Collection?.data ?? []))
      .catch(() => setMembers([]))
      .finally(() => setLoadingTab(false));
  };
  const fetchVehicles = () => {
    if (!id) return;
    setLoadingTab(true);
    axiosInstance.get(ENDPOINTS.FLATS.VEHICLES(id))
      .then((res) => setVehicles(res.data?.data ?? []))
      .catch(() => setVehicles([]))
      .finally(() => setLoadingTab(false));
  };
  const fetchDocuments = () => {
    if (!id) return;
    setLoadingTab(true);
    axiosInstance.get(ENDPOINTS.FLATS.DOCUMENTS(id))
      .then((res) => setDocuments(res.data?.data ?? []))
      .catch(() => setDocuments([]))
      .finally(() => setLoadingTab(false));
  };
  const fetchComplaints = () => {
    if (!id) return;
    setLoadingTab(true);
    axiosInstance.get(ENDPOINTS.FLATS.COMPLAINTS(id))
      .then((res) => setComplaints(res.data?.data ?? []))
      .catch(() => setComplaints([]))
      .finally(() => setLoadingTab(false));
  };
  const fetchBilling = () => {
    if (!id) return;
    setLoadingTab(true);
    axiosInstance.get(ENDPOINTS.FLATS.BILLING(id))
      .then((res) => setBilling(res.data?.data ?? []))
      .catch(() => setBilling([]))
      .finally(() => setLoadingTab(false));
  };
  const fetchVisitors = () => {
    if (!id) return;
    setLoadingTab(true);
    axiosInstance.get(ENDPOINTS.VISITORS.LIST + '?flatId=' + id)
      .then((res) => setVisitors(res.data?.data ?? []))
      .catch(() => setVisitors([]))
      .finally(() => setLoadingTab(false));
  };

  useEffect(() => {
    if (!id || !activeTab) return;
    if (activeTab === 'members') fetchMembers();
    else if (activeTab === 'vehicles') fetchVehicles();
    else if (activeTab === 'documents') fetchDocuments();
    else if (activeTab === 'complaints') fetchComplaints();
    else if (activeTab === 'maintenance') fetchBilling();
    else if (activeTab === 'visitors') fetchVisitors();
  }, [id, activeTab]);

  const setTab = (tab) => {
    setActiveTab(tab);
    navigate({ pathname: '/admin/dashboard/flats/' + id, search: tab === 'overview' ? '' : '?tab=' + tab }, { replace: true });
  };

  const handleSaveFlat = (e) => {
    e.preventDefault();
    if (!editForm || !id) return;
    setSubmitting(true);
    const payload = { ...editForm };
    if (payload.floor === '') payload.floor = null; else if (payload.floor !== null) payload.floor = parseInt(payload.floor, 10);
    if (payload.areaSqft === '') payload.areaSqft = null; else if (payload.areaSqft !== null) payload.areaSqft = parseFloat(payload.areaSqft);
    axiosInstance.put(ENDPOINTS.FLATS.UPDATE(id), payload)
      .then((res) => {
        if (res.data?.success) {
          setFlat(res.data.data);
          setEditModal(false);
          toast.success('Flat updated');
          navigate('/admin/dashboard/flats/' + id, { replace: true });
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Update failed'))
      .finally(() => setSubmitting(false));
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    axiosInstance.post(ENDPOINTS.FLATS.MEMBERS(id), memberForm)
      .then((res) => {
        if (res.data?.success) {
          setMemberModal(false);
          setMemberForm({ name: '', phone: '', email: '', role: 'family_member' });
          fetchMembers();
          toast.success('Member added');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed'))
      .finally(() => setSubmitting(false));
  };

  const handleDeleteMember = (memberId) => {
    if (!window.confirm('Remove this member?')) return;
    setDeletingMemberId(memberId);
    axiosInstance.delete(ENDPOINTS.FLATS.MEMBER_DELETE(id, memberId))
      .then(() => { fetchMembers(); toast.success('Member removed'); })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed'))
      .finally(() => setDeletingMemberId(null));
  };

  const handleAddVehicle = (e) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    axiosInstance.post(ENDPOINTS.FLATS.VEHICLES(id), vehicleForm)
      .then((res) => {
        if (res.data?.success) {
          setVehicleModal(false);
          setVehicleForm({ vehicleNumber: '', vehicleType: 'car', parkingSlot: '' });
          fetchVehicles();
          toast.success('Vehicle added');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed'))
      .finally(() => setSubmitting(false));
  };

  const handleDeleteVehicle = (vehicleId) => {
    if (!window.confirm('Remove this vehicle?')) return;
    setDeletingVehicleId(vehicleId);
    axiosInstance.delete(ENDPOINTS.FLATS.VEHICLE_DELETE(id, vehicleId))
      .then(() => { fetchVehicles(); toast.success('Vehicle removed'); })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed'))
      .finally(() => setDeletingVehicleId(null));
  };

  const handleUploadDoc = (e) => {
    e.preventDefault();
    if (!id || !docFile) {
      toast.error('Select a file');
      return;
    }
    setSubmitting(true);
    const fd = new FormData();
    fd.append('file', docFile);
    if (docForm.documentName) fd.append('documentName', docForm.documentName);
    if (docForm.documentType) fd.append('documentType', docForm.documentType);
    axiosInstance.post(ENDPOINTS.FLATS.DOCUMENTS(id), fd, { headers: { 'Content-Type': undefined } })
      .then((res) => {
        if (res.data?.success) {
          setDocModal(false);
          setDocForm({ documentName: '', documentType: '' });
          setDocFile(null);
          fetchDocuments();
          toast.success('Document uploaded');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Upload failed'))
      .finally(() => setSubmitting(false));
  };

  const handleDeleteDoc = (docId) => {
    if (!window.confirm('Delete this document?')) return;
    setDeletingDocId(docId);
    axiosInstance.delete(ENDPOINTS.FLATS.DOCUMENT_DELETE(id, docId))
      .then(() => { fetchDocuments(); toast.success('Document deleted'); })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed'))
      .finally(() => setDeletingDocId(null));
  };

  if (loading && !flat) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner />
      </div>
    );
  }
  if (!flat) {
    return (
      <div>
        <Button color="secondary" onClick={() => navigate('/admin/dashboard/flats')}>Back to Flats</Button>
        <p className="mt-3 text-danger">Flat not found.</p>
      </div>
    );
  }

  const title = `${flat.tower || '—'} - ${flat.flatNumber ?? flat.flat_number ?? '—'}`;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap mb-3">
        <div>
          <Button color="secondary" size="sm" className="me-2" onClick={() => navigate('/admin/dashboard/flats')}>← Back</Button>
          <h4 className="mb-0 d-inline">Flat: {title}</h4>
          <Badge color={STATUS_COLOR[flat.status] || 'secondary'} className="ms-2">{(flat.status || 'active').replace(/_/g, ' ')}</Badge>
        </div>
        <Button color="primary" size="sm" onClick={() => {
          setEditForm(flat ? {
            tower: flat.tower || '',
            flatNumber: flat.flatNumber ?? flat.flat_number ?? '',
            floor: flat.floor ?? '',
            flatType: flat.flatType || '',
            areaSqft: flat.areaSqft ?? '',
            ownershipType: flat.ownershipType || '',
            ownerName: flat.ownerName || '',
            ownerContact: flat.ownerContact || '',
            ownerEmail: flat.ownerEmail || '',
            status: flat.status || 'active',
          } : null);
          setEditModal(true);
        }}>Edit flat</Button>
      </div>

      <Nav tabs>
        {TABS.map((tab) => (
          <NavItem key={tab}>
            <NavLink active={activeTab === tab} onClick={() => setTab(tab)} style={{ cursor: 'pointer' }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </NavLink>
          </NavItem>
        ))}
      </Nav>

      <Card className="shadow-sm rounded mt-3">
        <CardBody>
          {activeTab === 'overview' && (
            <Row>
              <Col md={6}>
                <p><strong>Block / Tower:</strong> {flat.tower || '—'}</p>
                <p><strong>Flat number:</strong> {flat.flatNumber ?? flat.flat_number ?? '—'}</p>
                <p><strong>Floor:</strong> {flat.floor != null ? flat.floor : '—'}</p>
                <p><strong>Flat type:</strong> {flat.flatType || '—'}</p>
                <p><strong>Area (sq ft):</strong> {flat.areaSqft != null ? flat.areaSqft : '—'}</p>
              </Col>
              <Col md={6}>
                <p><strong>Owner:</strong> {flat.ownerName || '—'}</p>
                <p><strong>Owner contact:</strong> {flat.ownerContact || '—'}</p>
                <p><strong>Owner email:</strong> {flat.ownerEmail || '—'}</p>
                <p><strong>Occupancy:</strong> {(flat.ownershipType || flat.status || '—').replace(/_/g, ' ')}</p>
              </Col>
            </Row>
          )}

          {activeTab === 'members' && (
            <>
              <div className="d-flex justify-content-end mb-2">
                <Button color="primary" size="sm" onClick={() => setMemberModal(true)}>Add flat member</Button>
              </div>
              {loadingTab ? <Spinner /> : (
                <Table responsive>
                  <thead>
                    <tr><th>Name</th><th>Phone</th><th>Email</th><th>Role</th><th></th></tr>
                  </thead>
                  <tbody>
                    {members.map((m) => {
                      const mid = m.memberId ?? m.id;
                      return (
                      <tr key={m.id}>
                        <td>{m.name}</td>
                        <td>{m.phone || '—'}</td>
                        <td>{m.email || '—'}</td>
                        <td><Badge color="light" className="text-dark">{m.role?.replace(/_/g, ' ') || '—'}</Badge></td>
                        <td>
                          <Button size="sm" color="info" className="me-1" onClick={() => navigate('/admin/dashboard/members/' + mid)}>View profile</Button>
                          <Button size="sm" color="danger" outline onClick={() => handleDeleteMember(m.id)} disabled={deletingMemberId === m.id}>
                            {deletingMemberId === m.id ? '…' : 'Remove'}
                          </Button>
                        </td>
                      </tr>
                      );
                    })}
                    {!members.length && <tr><td colSpan={5} className="text-muted">No members for this flat. Add one above or assign a flat from the Members module.</td></tr>}
                  </tbody>
                </Table>
              )}
            </>
          )}

          {activeTab === 'vehicles' && (
            <>
              <div className="d-flex justify-content-end mb-2">
                <Button color="primary" size="sm" onClick={() => setVehicleModal(true)}>Add vehicle</Button>
              </div>
              {loadingTab ? <Spinner /> : (
                <Table responsive>
                  <thead><tr><th>Vehicle number</th><th>Type</th><th>Parking slot</th><th></th></tr></thead>
                  <tbody>
                    {vehicles.map((v) => (
                      <tr key={v.id}>
                        <td>{v.vehicleNumber}</td>
                        <td>{v.vehicleType || '—'}</td>
                        <td>{v.parkingSlot || '—'}</td>
                        <td>
                          <Button size="sm" color="danger" outline onClick={() => handleDeleteVehicle(v.id)} disabled={deletingVehicleId === v.id}>
                            {deletingVehicleId === v.id ? '…' : 'Remove'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!vehicles.length && <tr><td colSpan={4} className="text-muted">No vehicles</td></tr>}
                  </tbody>
                </Table>
              )}
            </>
          )}

          {activeTab === 'maintenance' && (
            <>
              {loadingTab ? <Spinner /> : (
                <Table responsive>
                  <thead><tr><th>Date</th><th>Amount</th><th>Type</th><th>Status</th></tr></thead>
                  <tbody>
                    {billing.map((b) => (
                      <tr key={b.id}>
                        <td>{b.billingDate}</td>
                        <td>{b.amount}</td>
                        <td>{b.type || '—'}</td>
                        <td><Badge color={b.paymentStatus === 'paid' ? 'success' : 'warning'}>{b.paymentStatus}</Badge></td>
                      </tr>
                    ))}
                    {!billing.length && <tr><td colSpan={4} className="text-muted">No maintenance/billing records</td></tr>}
                  </tbody>
                </Table>
              )}
            </>
          )}

          {activeTab === 'documents' && (
            <>
              <div className="d-flex justify-content-end mb-2">
                <Button color="primary" size="sm" onClick={() => setDocModal(true)}>Upload document</Button>
              </div>
              {loadingTab ? <Spinner /> : (
                <Table responsive>
                  <thead><tr><th>Name</th><th>Type</th><th>Uploaded</th><th></th></tr></thead>
                  <tbody>
                    {documents.map((d) => (
                      <tr key={d.id}>
                        <td>{d.documentName}</td>
                        <td>{d.documentType || '—'}</td>
                        <td>{d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : '—'}</td>
                        <td>
                          <a href={d.fileUrl.startsWith('http') ? d.fileUrl : API_BASE + d.fileUrl} target="_blank" rel="noopener noreferrer" className="me-2">View</a>
                          <Button size="sm" color="danger" outline onClick={() => handleDeleteDoc(d.id)} disabled={deletingDocId === d.id}>
                            {deletingDocId === d.id ? '…' : 'Delete'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!documents.length && <tr><td colSpan={4} className="text-muted">No documents</td></tr>}
                  </tbody>
                </Table>
              )}
            </>
          )}

          {activeTab === 'complaints' && (
            <>
              {loadingTab ? <Spinner /> : (
                <Table responsive>
                  <thead><tr><th>Title</th><th>By</th><th>Status</th><th>Created</th></tr></thead>
                  <tbody>
                    {complaints.map((c) => (
                      <tr key={c.id}>
                        <td>{c.title}</td>
                        <td>{c.userName || '—'}</td>
                        <td><Badge color={c.status === 'resolved' ? 'success' : 'warning'}>{c.status}</Badge></td>
                        <td>{c.createdAt ? new Date(c.createdAt).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                    {!complaints.length && <tr><td colSpan={4} className="text-muted">No complaints from this flat</td></tr>}
                  </tbody>
                </Table>
              )}
            </>
          )}

          {activeTab === 'visitors' && (
            <>
              {loadingTab ? <Spinner /> : (
                <Table responsive>
                  <thead><tr><th>Visitor</th><th>Phone</th><th>Purpose</th><th>Entry</th><th>Exit</th></tr></thead>
                  <tbody>
                    {visitors.map((v) => (
                      <tr key={v.id}>
                        <td>{v.visitorName}</td>
                        <td>{v.visitorPhone || '—'}</td>
                        <td>{v.purpose || '—'}</td>
                        <td>{v.entryTime ? new Date(v.entryTime).toLocaleString() : '—'}</td>
                        <td>{v.exitTime ? new Date(v.exitTime).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                    {!visitors.length && <tr><td colSpan={5} className="text-muted">No visitor records</td></tr>}
                  </tbody>
                </Table>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Edit flat modal */}
      <Modal isOpen={editModal} toggle={() => !submitting && setEditModal(false)} size="lg">
        <ModalHeader toggle={() => !submitting && setEditModal(false)}>Edit flat</ModalHeader>
        <form onSubmit={handleSaveFlat}>
          <ModalBody>
            {editForm && (
              <Row>
                <Col md={6}><FormGroup><Label>Tower / Block</Label><Input value={editForm.tower} onChange={(e) => setEditForm((f) => ({ ...f, tower: e.target.value }))} /></FormGroup></Col>
                <Col md={6}><FormGroup><Label>Flat number</Label><Input value={editForm.flatNumber} onChange={(e) => setEditForm((f) => ({ ...f, flatNumber: e.target.value }))} /></FormGroup></Col>
                <Col md={4}><FormGroup><Label>Floor</Label><Input type="number" min={0} value={editForm.floor} onChange={(e) => setEditForm((f) => ({ ...f, floor: e.target.value }))} /></FormGroup></Col>
                <Col md={4}><FormGroup><Label>Flat type</Label><Input value={editForm.flatType} onChange={(e) => setEditForm((f) => ({ ...f, flatType: e.target.value }))} placeholder="e.g. 2BHK" /></FormGroup></Col>
                <Col md={4}><FormGroup><Label>Area (sq ft)</Label><Input type="number" min={0} value={editForm.areaSqft} onChange={(e) => setEditForm((f) => ({ ...f, areaSqft: e.target.value }))} /></FormGroup></Col>
                <Col md={6}><FormGroup><Label>Owner name</Label><Input value={editForm.ownerName} onChange={(e) => setEditForm((f) => ({ ...f, ownerName: e.target.value }))} /></FormGroup></Col>
                <Col md={6}><FormGroup><Label>Owner contact</Label><Input value={editForm.ownerContact} onChange={(e) => setEditForm((f) => ({ ...f, ownerContact: e.target.value }))} /></FormGroup></Col>
                <Col md={6}><FormGroup><Label>Owner email</Label><Input type="email" value={editForm.ownerEmail} onChange={(e) => setEditForm((f) => ({ ...f, ownerEmail: e.target.value }))} /></FormGroup></Col>
                <Col md={6}><FormGroup><Label>Status</Label><Input type="select" value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}><option value="active">Active</option><option value="vacant">Vacant</option><option value="under_maintenance">Under maintenance</option></Input></FormGroup></Col>
              </Row>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setEditModal(false)} disabled={submitting}>Cancel</Button>
            <Button color="primary" type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Add member modal */}
      <Modal isOpen={memberModal} toggle={() => setMemberModal(false)}>
        <ModalHeader toggle={() => setMemberModal(false)}>Add member</ModalHeader>
        <form onSubmit={handleAddMember}>
          <ModalBody>
            <FormGroup><Label>Name *</Label><Input required value={memberForm.name} onChange={(e) => setMemberForm((f) => ({ ...f, name: e.target.value }))} /></FormGroup>
            <FormGroup><Label>Phone</Label><Input value={memberForm.phone} onChange={(e) => setMemberForm((f) => ({ ...f, phone: e.target.value }))} /></FormGroup>
            <FormGroup><Label>Email</Label><Input type="email" value={memberForm.email} onChange={(e) => setMemberForm((f) => ({ ...f, email: e.target.value }))} /></FormGroup>
            <FormGroup><Label>Role</Label><Input type="select" value={memberForm.role} onChange={(e) => setMemberForm((f) => ({ ...f, role: e.target.value }))}>{MEMBER_ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}</Input></FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setMemberModal(false)} disabled={submitting}>Cancel</Button>
            <Button color="primary" type="submit" disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Add vehicle modal */}
      <Modal isOpen={vehicleModal} toggle={() => setVehicleModal(false)}>
        <ModalHeader toggle={() => setVehicleModal(false)}>Add vehicle</ModalHeader>
        <form onSubmit={handleAddVehicle}>
          <ModalBody>
            <FormGroup><Label>Vehicle number *</Label><Input required value={vehicleForm.vehicleNumber} onChange={(e) => setVehicleForm((f) => ({ ...f, vehicleNumber: e.target.value }))} /></FormGroup>
            <FormGroup><Label>Type</Label><Input type="select" value={vehicleForm.vehicleType} onChange={(e) => setVehicleForm((f) => ({ ...f, vehicleType: e.target.value }))}><option value="car">Car</option><option value="bike">Bike</option><option value="other">Other</option></Input></FormGroup>
            <FormGroup><Label>Parking slot</Label><Input value={vehicleForm.parkingSlot} onChange={(e) => setVehicleForm((f) => ({ ...f, parkingSlot: e.target.value }))} /></FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setVehicleModal(false)} disabled={submitting}>Cancel</Button>
            <Button color="primary" type="submit" disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Upload document modal */}
      <Modal isOpen={docModal} toggle={() => setDocModal(false)}>
        <ModalHeader toggle={() => setDocModal(false)}>Upload document</ModalHeader>
        <form onSubmit={handleUploadDoc}>
          <ModalBody>
            <FormGroup><Label>Document name</Label><Input value={docForm.documentName} onChange={(e) => setDocForm((f) => ({ ...f, documentName: e.target.value }))} placeholder="Optional" /></FormGroup>
            <FormGroup><Label>Type</Label><Input value={docForm.documentType} onChange={(e) => setDocForm((f) => ({ ...f, documentType: e.target.value }))} placeholder="e.g. ownership, rent_agreement" /></FormGroup>
            <FormGroup><Label>File *</Label><Input type="file" accept=".pdf,image/*" onChange={(e) => setDocFile(e.target.files?.[0])} /></FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setDocModal(false)} disabled={submitting}>Cancel</Button>
            <Button color="primary" type="submit" disabled={submitting || !docFile}>{submitting ? 'Uploading…' : 'Upload'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
