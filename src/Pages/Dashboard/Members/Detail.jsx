import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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

const TABS = ['overview', 'family', 'vehicles', 'documents', 'emergency', 'complaints', 'marketplace', 'activity'];
const ROLES = ['owner', 'tenant', 'family_member', 'committee_member', 'security_staff', 'maintenance_staff'];
const STATUS_COLOR = { active: 'success', inactive: 'secondary', moved_out: 'secondary', blacklisted: 'danger' };

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editMode = searchParams.get('edit') === '1';
  const tabFromUrl = searchParams.get('tab');
  const initialTab = TABS.includes(tabFromUrl) ? tabFromUrl : 'overview';

  const [member, setMember] = useState(null);
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [family, setFamily] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [emergency, setEmergency] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [marketplace, setMarketplace] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loadingTab, setLoadingTab] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [familyModal, setFamilyModal] = useState(false);
  const [vehicleModal, setVehicleModal] = useState(false);
  const [docModal, setDocModal] = useState(false);
  const [emergencyModal, setEmergencyModal] = useState(false);
  const [familyForm, setFamilyForm] = useState({ name: '', relationship: '', phone: '', age: '' });
  const [vehicleForm, setVehicleForm] = useState({ vehicleNumber: '', vehicleType: 'car', parkingSlot: '' });
  const [docForm, setDocForm] = useState({ documentName: '', documentType: '' });
  const [emergencyForm, setEmergencyForm] = useState({ contactName: '', relationship: '', phone: '' });
  const [docFile, setDocFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingFamilyId, setDeletingFamilyId] = useState(null);
  const [deletingVehicleId, setDeletingVehicleId] = useState(null);
  const [deletingDocId, setDeletingDocId] = useState(null);
  const [deletingContactId, setDeletingContactId] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axiosInstance.get(ENDPOINTS.MEMBERS.GET(id))
      .then((res) => { if (res.data?.success) setMember(res.data.data); else toast.error('Member not found'); })
      .catch(() => toast.error('Member not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    axiosInstance.get(ENDPOINTS.FLATS.LIST + '?limit=500').then((res) => {
      setFlats(res.data?.data ?? []);
    }).catch(() => setFlats([]));
  }, []);

  useEffect(() => {
    if (editMode && member) {
      setEditForm({
        name: member.name || '',
        phone: member.phone || '',
        email: member.email || '',
        flatId: member.flatId ?? member.flat_id ?? '',
        role: member.role || 'family_member',
        gender: member.gender || '',
        dob: member.dob ? member.dob.slice(0, 10) : '',
        occupation: member.occupation || '',
        status: member.status || 'active',
        joinedAt: member.joinedAt ? member.joinedAt.slice(0, 10) : '',
      });
      setEditModal(true);
    }
  }, [editMode, member]);

  const loadFamily = () => { setLoadingTab(true); axiosInstance.get(ENDPOINTS.MEMBERS.FAMILY(id)).then((res) => setFamily(res.data?.data ?? [])).catch(() => setFamily([])).finally(() => setLoadingTab(false)); };
  const loadVehicles = () => { setLoadingTab(true); axiosInstance.get(ENDPOINTS.MEMBERS.VEHICLES(id)).then((res) => setVehicles(res.data?.data ?? [])).catch(() => setVehicles([])).finally(() => setLoadingTab(false)); };
  const loadDocuments = () => { setLoadingTab(true); axiosInstance.get(ENDPOINTS.MEMBERS.DOCUMENTS(id)).then((res) => setDocuments(res.data?.data ?? [])).catch(() => setDocuments([])).finally(() => setLoadingTab(false)); };
  const loadEmergency = () => { setLoadingTab(true); axiosInstance.get(ENDPOINTS.MEMBERS.EMERGENCY(id)).then((res) => setEmergency(res.data?.data ?? [])).catch(() => setEmergency([])).finally(() => setLoadingTab(false)); };
  const loadComplaints = () => { setLoadingTab(true); axiosInstance.get(ENDPOINTS.MEMBERS.COMPLAINTS(id)).then((res) => setComplaints(res.data?.data ?? [])).catch(() => setComplaints([])).finally(() => setLoadingTab(false)); };
  const loadMarketplace = () => { setLoadingTab(true); axiosInstance.get(ENDPOINTS.MEMBERS.MARKETPLACE(id)).then((res) => setMarketplace(res.data?.data ?? [])).catch(() => setMarketplace([])).finally(() => setLoadingTab(false)); };
  const loadActivity = () => { setLoadingTab(true); axiosInstance.get(ENDPOINTS.MEMBERS.ACTIVITY(id)).then((res) => setActivity(res.data?.data ?? [])).catch(() => setActivity([])).finally(() => setLoadingTab(false)); };

  useEffect(() => {
    if (!id || !activeTab) return;
    if (activeTab === 'family') loadFamily();
    else if (activeTab === 'vehicles') loadVehicles();
    else if (activeTab === 'documents') loadDocuments();
    else if (activeTab === 'emergency') loadEmergency();
    else if (activeTab === 'complaints') loadComplaints();
    else if (activeTab === 'marketplace') loadMarketplace();
    else if (activeTab === 'activity') loadActivity();
  }, [id, activeTab]);

  const setTab = (tab) => {
    setActiveTab(tab);
    navigate({ pathname: '/admin/dashboard/members/' + id, search: tab === 'overview' ? '' : '?tab=' + tab }, { replace: true });
  };

  const handleSaveMember = (e) => {
    e.preventDefault();
    if (!editForm || !id) return;
    setSubmitting(true);
    const payload = { ...editForm };
    payload.flatId = payload.flatId ? Number(payload.flatId) : null;
    payload.dob = payload.dob || null;
    payload.joinedAt = payload.joinedAt || null;
    axiosInstance.put(ENDPOINTS.MEMBERS.UPDATE(id), payload)
      .then((res) => {
        if (res.data?.success) { setMember(res.data.data); setEditModal(false); toast.success('Member updated'); navigate('/admin/dashboard/members/' + id, { replace: true }); }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Update failed'))
      .finally(() => setSubmitting(false));
  };

  const handleAddFamily = (e) => {
    e.preventDefault();
    setSubmitting(true);
    axiosInstance.post(ENDPOINTS.MEMBERS.FAMILY(id), familyForm).then((res) => {
      if (res.data?.success) { setFamilyModal(false); setFamilyForm({ name: '', relationship: '', phone: '', age: '' }); loadFamily(); toast.success('Family member added'); }
    }).catch((err) => toast.error(err.response?.data?.message || 'Failed')).finally(() => setSubmitting(false));
  };
  const handleDeleteFamily = (familyId) => {
    if (!window.confirm('Remove this family member?')) return;
    setDeletingFamilyId(familyId);
    axiosInstance.delete(ENDPOINTS.MEMBERS.FAMILY_DELETE(id, familyId)).then(() => { loadFamily(); toast.success('Removed'); }).catch((err) => toast.error(err.response?.data?.message)).finally(() => setDeletingFamilyId(null));
  };

  const handleAddVehicle = (e) => {
    e.preventDefault();
    setSubmitting(true);
    axiosInstance.post(ENDPOINTS.MEMBERS.VEHICLES(id), vehicleForm).then((res) => {
      if (res.data?.success) { setVehicleModal(false); setVehicleForm({ vehicleNumber: '', vehicleType: 'car', parkingSlot: '' }); loadVehicles(); toast.success('Vehicle added'); }
    }).catch((err) => toast.error(err.response?.data?.message)).finally(() => setSubmitting(false));
  };
  const handleDeleteVehicle = (vehicleId) => {
    if (!window.confirm('Remove this vehicle?')) return;
    setDeletingVehicleId(vehicleId);
    axiosInstance.delete(ENDPOINTS.MEMBERS.VEHICLE_DELETE(id, vehicleId)).then(() => { loadVehicles(); toast.success('Removed'); }).catch((err) => toast.error(err.response?.data?.message)).finally(() => setDeletingVehicleId(null));
  };

  const handleUploadDoc = (e) => {
    e.preventDefault();
    if (!docFile) { toast.error('Select a file'); return; }
    setSubmitting(true);
    const fd = new FormData();
    fd.append('file', docFile);
    if (docForm.documentName) fd.append('documentName', docForm.documentName);
    if (docForm.documentType) fd.append('documentType', docForm.documentType);
    axiosInstance.post(ENDPOINTS.MEMBERS.DOCUMENTS(id), fd, { headers: { 'Content-Type': undefined } })
      .then((res) => { if (res.data?.success) { setDocModal(false); setDocForm({ documentName: '', documentType: '' }); setDocFile(null); loadDocuments(); toast.success('Document uploaded'); } })
      .catch((err) => toast.error(err.response?.data?.message)).finally(() => setSubmitting(false));
  };
  const handleDeleteDoc = (docId) => {
    if (!window.confirm('Delete this document?')) return;
    setDeletingDocId(docId);
    axiosInstance.delete(ENDPOINTS.MEMBERS.DOCUMENT_DELETE(id, docId)).then(() => { loadDocuments(); toast.success('Deleted'); }).catch((err) => toast.error(err.response?.data?.message)).finally(() => setDeletingDocId(null));
  };

  const handleAddEmergency = (e) => {
    e.preventDefault();
    setSubmitting(true);
    axiosInstance.post(ENDPOINTS.MEMBERS.EMERGENCY(id), emergencyForm).then((res) => {
      if (res.data?.success) { setEmergencyModal(false); setEmergencyForm({ contactName: '', relationship: '', phone: '' }); loadEmergency(); toast.success('Emergency contact added'); }
    }).catch((err) => toast.error(err.response?.data?.message)).finally(() => setSubmitting(false));
  };
  const handleDeleteEmergency = (contactId) => {
    if (!window.confirm('Remove this contact?')) return;
    setDeletingContactId(contactId);
    axiosInstance.delete(ENDPOINTS.MEMBERS.EMERGENCY_DELETE(id, contactId)).then(() => { loadEmergency(); toast.success('Removed'); }).catch((err) => toast.error(err.response?.data?.message)).finally(() => setDeletingContactId(null));
  };

  if (loading && !member) return <div className="d-flex justify-content-center py-5"><Spinner /></div>;
  if (!member) return <div><Button color="secondary" onClick={() => navigate('/admin/dashboard/members')}>Back to Members</Button><p className="mt-3 text-danger">Member not found.</p></div>;

  const profileUrl = member.profileImage || member.profile_image;
  const avatarSrc = profileUrl ? (profileUrl.startsWith('http') ? profileUrl : `${API_BASE}${profileUrl}`) : null;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap mb-3">
        <div>
          <Button color="secondary" size="sm" className="me-2" onClick={() => navigate('/admin/dashboard/members')}>← Back</Button>
          {avatarSrc ? <img src={avatarSrc} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', marginRight: 12 }} /> : <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#dee2e6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>{(member.name || '?').charAt(0).toUpperCase()}</div>}
          <h4 className="mb-0 d-inline">{member.name || '—'}</h4>
          <Badge color={STATUS_COLOR[member.status] || 'secondary'} className="ms-2">{(member.status || 'active').replace(/_/g, ' ')}</Badge>
          <Badge color="light" className="text-dark ms-1">{(member.role || '').replace(/_/g, ' ')}</Badge>
        </div>
        <Button color="primary" size="sm" onClick={() => { setEditForm(member ? { name: member.name || '', phone: member.phone || '', email: member.email || '', flatId: member.flatId ?? member.flat_id ?? '', role: member.role || 'family_member', gender: member.gender || '', dob: member.dob ? member.dob.slice(0, 10) : '', occupation: member.occupation || '', status: member.status || 'active', joinedAt: member.joinedAt ? member.joinedAt.slice(0, 10) : '' } : null); setEditModal(true); }}>Edit member</Button>
      </div>

      <Nav tabs>
        {TABS.map((tab) => (
          <NavItem key={tab}><NavLink active={activeTab === tab} onClick={() => setTab(tab)} style={{ cursor: 'pointer' }}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</NavLink></NavItem>
        ))}
      </Nav>

      <Card className="shadow-sm rounded mt-3">
        <CardBody>
          {activeTab === 'overview' && (
            <Row>
              <Col md={6}>
                <p><strong>Name:</strong> {member.name || '—'}</p>
                <p><strong>Flat:</strong> {member.tower && member.flatNumber ? `${member.tower} - ${member.flatNumber}` : '—'}</p>
                <p><strong>Role:</strong> {(member.role || '—').replace(/_/g, ' ')}</p>
                <p><strong>Phone:</strong> {member.phone || '—'}</p>
                <p><strong>Email:</strong> {member.email || '—'}</p>
              </Col>
              <Col md={6}>
                <p><strong>Gender:</strong> {member.gender || '—'}</p>
                <p><strong>DOB:</strong> {member.dob || '—'}</p>
                <p><strong>Occupation:</strong> {member.occupation || '—'}</p>
                <p><strong>Status:</strong> {(member.status || '—').replace(/_/g, ' ')}</p>
                <p><strong>Joined:</strong> {member.joinedAt || '—'}</p>
              </Col>
            </Row>
          )}

          {activeTab === 'family' && (
            <>
              <div className="d-flex justify-content-end mb-2"><Button color="primary" size="sm" onClick={() => setFamilyModal(true)}>Add family member</Button></div>
              {loadingTab ? <Spinner /> : (
                <Table responsive>
                  <thead><tr><th>Name</th><th>Relationship</th><th>Phone</th><th>Age</th><th></th></tr></thead>
                  <tbody>
                    {family.map((f) => (
                      <tr key={f.id}><td>{f.name}</td><td>{f.relationship || '—'}</td><td>{f.phone || '—'}</td><td>{f.age ?? '—'}</td>
                        <td><Button size="sm" color="danger" outline onClick={() => handleDeleteFamily(f.id)} disabled={deletingFamilyId === f.id}>{deletingFamilyId === f.id ? '…' : 'Remove'}</Button></td></tr>
                    ))}
                    {!family.length && <tr><td colSpan={5} className="text-muted">No family members</td></tr>}
                  </tbody>
                </Table>
              )}
            </>
          )}

          {activeTab === 'vehicles' && (
            <>
              <div className="d-flex justify-content-end mb-2"><Button color="primary" size="sm" onClick={() => setVehicleModal(true)}>Add vehicle</Button></div>
              {loadingTab ? <Spinner /> : (
                <Table responsive>
                  <thead><tr><th>Vehicle number</th><th>Type</th><th>Parking slot</th><th></th></tr></thead>
                  <tbody>
                    {vehicles.map((v) => (
                      <tr key={v.id}><td>{v.vehicleNumber}</td><td>{v.vehicleType || '—'}</td><td>{v.parkingSlot || '—'}</td>
                        <td><Button size="sm" color="danger" outline onClick={() => handleDeleteVehicle(v.id)} disabled={deletingVehicleId === v.id}>{deletingVehicleId === v.id ? '…' : 'Remove'}</Button></td></tr>
                    ))}
                    {!vehicles.length && <tr><td colSpan={4} className="text-muted">No vehicles</td></tr>}
                  </tbody>
                </Table>
              )}
            </>
          )}

          {activeTab === 'documents' && (
            <>
              <div className="d-flex justify-content-end mb-2"><Button color="primary" size="sm" onClick={() => setDocModal(true)}>Upload document</Button></div>
              {loadingTab ? <Spinner /> : (
                <Table responsive>
                  <thead><tr><th>Name</th><th>Type</th><th>Uploaded</th><th></th></tr></thead>
                  <tbody>
                    {documents.map((d) => (
                      <tr key={d.id}><td>{d.documentName}</td><td>{d.documentType || '—'}</td><td>{d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : '—'}</td>
                        <td><a href={(d.fileUrl || '').startsWith('http') ? d.fileUrl : API_BASE + d.fileUrl} target="_blank" rel="noopener noreferrer" className="me-2">View</a>
                          <Button size="sm" color="danger" outline onClick={() => handleDeleteDoc(d.id)} disabled={deletingDocId === d.id}>{deletingDocId === d.id ? '…' : 'Delete'}</Button></td></tr>
                    ))}
                    {!documents.length && <tr><td colSpan={4} className="text-muted">No documents</td></tr>}
                  </tbody>
                </Table>
              )}
            </>
          )}

          {activeTab === 'emergency' && (
            <>
              <div className="d-flex justify-content-end mb-2"><Button color="primary" size="sm" onClick={() => setEmergencyModal(true)}>Add emergency contact</Button></div>
              {loadingTab ? <Spinner /> : (
                <Table responsive>
                  <thead><tr><th>Name</th><th>Relationship</th><th>Phone</th><th></th></tr></thead>
                  <tbody>
                    {emergency.map((e) => (
                      <tr key={e.id}><td>{e.contactName}</td><td>{e.relationship || '—'}</td><td>{e.phone}</td>
                        <td><Button size="sm" color="danger" outline onClick={() => handleDeleteEmergency(e.id)} disabled={deletingContactId === e.id}>{deletingContactId === e.id ? '…' : 'Remove'}</Button></td></tr>
                    ))}
                    {!emergency.length && <tr><td colSpan={4} className="text-muted">No emergency contacts</td></tr>}
                  </tbody>
                </Table>
              )}
            </>
          )}

          {activeTab === 'complaints' && (
            loadingTab ? <Spinner /> : (
              <Table responsive>
                <thead><tr><th>Title</th><th>Status</th><th>Created</th></tr></thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c.id}><td>{c.title}</td><td><Badge color={c.status === 'resolved' ? 'success' : 'warning'}>{c.status}</Badge></td><td>{c.createdAt ? new Date(c.createdAt).toLocaleString() : '—'}</td></tr>
                  ))}
                  {!complaints.length && <tr><td colSpan={3} className="text-muted">No complaints (or member not linked to app user)</td></tr>}
                </tbody>
              </Table>
            )
          )}

          {activeTab === 'marketplace' && (
            loadingTab ? <Spinner /> : (
              <Table responsive>
                <thead><tr><th>Title</th><th>Price</th><th>Status</th><th>Created</th></tr></thead>
                <tbody>
                  {marketplace.map((m) => (
                    <tr key={m.id}><td>{m.title}</td><td>{m.price}</td><td><Badge color="light" className="text-dark">{m.status}</Badge></td><td>{m.createdAt ? new Date(m.createdAt).toLocaleString() : '—'}</td></tr>
                  ))}
                  {!marketplace.length && <tr><td colSpan={4} className="text-muted">No marketplace listings</td></tr>}
                </tbody>
              </Table>
            )
          )}

          {activeTab === 'activity' && (
            loadingTab ? <Spinner /> : (
              <Table responsive>
                <thead><tr><th>Type</th><th>Title</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {activity.map((a, i) => (
                    <tr key={i}><td>{a.type}</td><td>{a.title}</td><td>{a.status ? <Badge color="light" className="text-dark">{a.status}</Badge> : '—'}</td><td>{a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}</td></tr>
                  ))}
                  {!activity.length && <tr><td colSpan={4} className="text-muted">No recent activity</td></tr>}
                </tbody>
              </Table>
            )
          )}
        </CardBody>
      </Card>

      <Modal isOpen={editModal} toggle={() => !submitting && setEditModal(false)} size="lg">
        <ModalHeader toggle={() => !submitting && setEditModal(false)}>Edit member</ModalHeader>
        <form onSubmit={handleSaveMember}>
          <ModalBody>
            {editForm && (
              <Row>
                <Col md={6}><FormGroup><Label>Name</Label><Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} /></FormGroup></Col>
                <Col md={6}><FormGroup><Label>Flat</Label><Input type="select" value={editForm.flatId} onChange={(e) => setEditForm((f) => ({ ...f, flatId: e.target.value }))}><option value="">—</option>{flats.map((f) => <option key={f.id} value={f.id}>{f.tower} - {f.flatNumber ?? f.flat_number}</option>)}</Input></FormGroup></Col>
                <Col md={6}><FormGroup><Label>Phone</Label><Input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} /></FormGroup></Col>
                <Col md={6}><FormGroup><Label>Email</Label><Input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} /></FormGroup></Col>
                <Col md={4}><FormGroup><Label>Role</Label><Input type="select" value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}>{ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}</Input></FormGroup></Col>
                <Col md={4}><FormGroup><Label>Status</Label><Input type="select" value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}><option value="active">Active</option><option value="inactive">Inactive</option><option value="moved_out">Moved out</option><option value="blacklisted">Blacklisted</option></Input></FormGroup></Col>
                <Col md={4}><FormGroup><Label>Gender</Label><Input type="select" value={editForm.gender} onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value }))}><option value="">—</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></Input></FormGroup></Col>
                <Col md={4}><FormGroup><Label>Occupation</Label><Input value={editForm.occupation} onChange={(e) => setEditForm((f) => ({ ...f, occupation: e.target.value }))} /></FormGroup></Col>
                <Col md={4}><FormGroup><Label>DOB</Label><Input type="date" value={editForm.dob} onChange={(e) => setEditForm((f) => ({ ...f, dob: e.target.value }))} /></FormGroup></Col>
                <Col md={4}><FormGroup><Label>Joined at</Label><Input type="date" value={editForm.joinedAt} onChange={(e) => setEditForm((f) => ({ ...f, joinedAt: e.target.value }))} /></FormGroup></Col>
              </Row>
            )}
          </ModalBody>
          <ModalFooter><Button color="secondary" onClick={() => setEditModal(false)} disabled={submitting}>Cancel</Button><Button color="primary" type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button></ModalFooter>
        </form>
      </Modal>

      <Modal isOpen={familyModal} toggle={() => setFamilyModal(false)}>
        <ModalHeader toggle={() => setFamilyModal(false)}>Add family member</ModalHeader>
        <form onSubmit={handleAddFamily}>
          <ModalBody>
            <FormGroup><Label>Name *</Label><Input required value={familyForm.name} onChange={(e) => setFamilyForm((f) => ({ ...f, name: e.target.value }))} /></FormGroup>
            <FormGroup><Label>Relationship</Label><Input value={familyForm.relationship} onChange={(e) => setFamilyForm((f) => ({ ...f, relationship: e.target.value }))} placeholder="e.g. spouse, child" /></FormGroup>
            <FormGroup><Label>Phone</Label><Input value={familyForm.phone} onChange={(e) => setFamilyForm((f) => ({ ...f, phone: e.target.value }))} /></FormGroup>
            <FormGroup><Label>Age</Label><Input type="number" min={0} max={150} value={familyForm.age} onChange={(e) => setFamilyForm((f) => ({ ...f, age: e.target.value }))} /></FormGroup>
          </ModalBody>
          <ModalFooter><Button color="secondary" onClick={() => setFamilyModal(false)} disabled={submitting}>Cancel</Button><Button color="primary" type="submit" disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</Button></ModalFooter>
        </form>
      </Modal>

      <Modal isOpen={vehicleModal} toggle={() => setVehicleModal(false)}>
        <ModalHeader toggle={() => setVehicleModal(false)}>Add vehicle</ModalHeader>
        <form onSubmit={handleAddVehicle}>
          <ModalBody>
            <FormGroup><Label>Vehicle number *</Label><Input required value={vehicleForm.vehicleNumber} onChange={(e) => setVehicleForm((f) => ({ ...f, vehicleNumber: e.target.value }))} /></FormGroup>
            <FormGroup><Label>Type</Label><Input type="select" value={vehicleForm.vehicleType} onChange={(e) => setVehicleForm((f) => ({ ...f, vehicleType: e.target.value }))}><option value="car">Car</option><option value="bike">Bike</option><option value="other">Other</option></Input></FormGroup>
            <FormGroup><Label>Parking slot</Label><Input value={vehicleForm.parkingSlot} onChange={(e) => setVehicleForm((f) => ({ ...f, parkingSlot: e.target.value }))} /></FormGroup>
          </ModalBody>
          <ModalFooter><Button color="secondary" onClick={() => setVehicleModal(false)} disabled={submitting}>Cancel</Button><Button color="primary" type="submit" disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</Button></ModalFooter>
        </form>
      </Modal>

      <Modal isOpen={docModal} toggle={() => setDocModal(false)}>
        <ModalHeader toggle={() => setDocModal(false)}>Upload document</ModalHeader>
        <form onSubmit={handleUploadDoc}>
          <ModalBody>
            <FormGroup><Label>Document name</Label><Input value={docForm.documentName} onChange={(e) => setDocForm((f) => ({ ...f, documentName: e.target.value }))} /></FormGroup>
            <FormGroup><Label>Type</Label><Input value={docForm.documentType} onChange={(e) => setDocForm((f) => ({ ...f, documentType: e.target.value }))} placeholder="e.g. KYC, ID proof" /></FormGroup>
            <FormGroup><Label>File *</Label><Input type="file" accept=".pdf,image/*" onChange={(e) => setDocFile(e.target.files?.[0])} /></FormGroup>
          </ModalBody>
          <ModalFooter><Button color="secondary" onClick={() => setDocModal(false)} disabled={submitting}>Cancel</Button><Button color="primary" type="submit" disabled={submitting || !docFile}>{submitting ? 'Uploading…' : 'Upload'}</Button></ModalFooter>
        </form>
      </Modal>

      <Modal isOpen={emergencyModal} toggle={() => setEmergencyModal(false)}>
        <ModalHeader toggle={() => setEmergencyModal(false)}>Add emergency contact</ModalHeader>
        <form onSubmit={handleAddEmergency}>
          <ModalBody>
            <FormGroup><Label>Contact name *</Label><Input required value={emergencyForm.contactName} onChange={(e) => setEmergencyForm((f) => ({ ...f, contactName: e.target.value }))} /></FormGroup>
            <FormGroup><Label>Relationship</Label><Input value={emergencyForm.relationship} onChange={(e) => setEmergencyForm((f) => ({ ...f, relationship: e.target.value }))} /></FormGroup>
            <FormGroup><Label>Phone *</Label><Input required value={emergencyForm.phone} onChange={(e) => setEmergencyForm((f) => ({ ...f, phone: e.target.value }))} /></FormGroup>
          </ModalBody>
          <ModalFooter><Button color="secondary" onClick={() => setEmergencyModal(false)} disabled={submitting}>Cancel</Button><Button color="primary" type="submit" disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</Button></ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
