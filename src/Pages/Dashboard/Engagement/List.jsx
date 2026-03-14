import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  Table,
  Spinner,
  Nav,
  NavItem,
  NavLink,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
} from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';
import { toast } from 'react-toastify';

const EngagementPage = () => {
  const [activeTab, setActiveTab] = useState('lost');
  const [lostList, setLostList] = useState([]);
  const [pollList, setPollList] = useState([]);
  const [loadingLost, setLoadingLost] = useState(true);
  const [loadingPolls, setLoadingPolls] = useState(true);
  const [lostModal, setLostModal] = useState(false);
  const [pollModal, setPollModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lostForm, setLostForm] = useState({ title: '', description: '' });
  const [pollForm, setPollForm] = useState({ title: '', description: '' });

  const fetchLost = () => {
    setLoadingLost(true);
    axiosInstance
      .get(ENDPOINTS.ENGAGEMENT.LOST_FOUND_LIST)
      .then((res) => {
        const d = res.data?.data ?? [];
        setLostList(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        toast.error('Failed to load lost & found');
        setLostList([]);
      })
      .finally(() => setLoadingLost(false));
  };

  const fetchPolls = () => {
    setLoadingPolls(true);
    axiosInstance
      .get(ENDPOINTS.ENGAGEMENT.POLLS_LIST)
      .then((res) => {
        const d = res.data?.data ?? [];
        setPollList(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        toast.error('Failed to load polls');
        setPollList([]);
      })
      .finally(() => setLoadingPolls(false));
  };

  useEffect(() => {
    fetchLost();
    fetchPolls();
  }, []);

  const createLost = (e) => {
    e.preventDefault();
    if (!lostForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    axiosInstance
      .post(ENDPOINTS.ENGAGEMENT.LOST_FOUND_CREATE, {
        title: lostForm.title.trim(),
        description: lostForm.description.trim() || null,
      })
      .then((res) => {
        if (res.data?.success) {
          toast.success('Lost & found item created');
          setLostModal(false);
          setLostForm({ title: '', description: '' });
          fetchLost();
        } else {
          toast.error(res.data?.message || 'Failed to create');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to create'))
      .finally(() => setSaving(false));
  };

  const createPoll = (e) => {
    e.preventDefault();
    if (!pollForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    axiosInstance
      .post(ENDPOINTS.ENGAGEMENT.POLLS_CREATE, {
        title: pollForm.title.trim(),
        description: pollForm.description.trim() || null,
      })
      .then((res) => {
        if (res.data?.success) {
          toast.success('Poll created');
          setPollModal(false);
          setPollForm({ title: '', description: '' });
          fetchPolls();
        } else {
          toast.error(res.data?.message || 'Failed to create');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to create'))
      .finally(() => setSaving(false));
  };

  const closeLost = (row) => {
    axiosInstance
      .patch(ENDPOINTS.ENGAGEMENT.LOST_FOUND_UPDATE_STATUS(row.id), { status: 'closed' })
      .then((res) => {
        if (res.data?.success) {
          toast.success('Marked as closed');
          fetchLost();
        } else {
          toast.error(res.data?.message || 'Failed to update');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to update'));
  };

  const archivePoll = (row) => {
    axiosInstance
      .delete(ENDPOINTS.ENGAGEMENT.POLLS_DELETE(row.id))
      .then((res) => {
        if (res.data?.success) {
          toast.success('Poll archived');
          fetchPolls();
        } else {
          toast.error(res.data?.message || 'Failed to archive');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to archive'));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Community Engagement</h1>
        <p className="page-subtitle mb-0">
          Lost & found and polls to keep residents engaged and informed.
        </p>
      </div>

      <Nav pills className="mb-4 nav-pills-custom">
        <NavItem>
          <NavLink
            href="#"
            active={activeTab === 'lost'}
            onClick={(e) => { e.preventDefault(); setActiveTab('lost'); }}
          >
            Lost &amp; found
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            href="#"
            active={activeTab === 'polls'}
            onClick={(e) => { e.preventDefault(); setActiveTab('polls'); }}
          >
            Polls
          </NavLink>
        </NavItem>
      </Nav>

      {activeTab === 'lost' && (
        <>
          <div className="d-flex justify-content-end mb-3">
            <Button color="primary" size="sm" className="rounded-2" onClick={() => setLostModal(true)}>
              New lost &amp; found
            </Button>
          </div>
          <Card className="table-card">
            <CardBody>
              {loadingLost ? (
                <div className="d-flex justify-content-center py-5"><Spinner color="primary" /></div>
              ) : (
                <Table responsive hover className="table-striped">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lostList.map((row) => (
                      <tr key={row.id}>
                        <td>{row.title}</td>
                        <td className="text-muted small" style={{ maxWidth: 260 }}>{row.description || '-'}</td>
                        <td>
                          <span className={`badge ${row.status === 'open' ? 'bg-warning' : 'bg-success'}`}>{row.status}</span>
                        </td>
                        <td>{row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'}</td>
                        <td>
                          {row.status === 'open' && (
                            <Button size="sm" color="success" outline className="rounded-2" onClick={() => closeLost(row)}>Mark closed</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </>
      )}

      {activeTab === 'polls' && (
        <>
          <div className="d-flex justify-content-end mb-2">
            <Button color="primary" size="sm" onClick={() => setPollModal(true)}>
              New poll
            </Button>
          </div>
          <Card className="table-card">
            <CardBody>
              {loadingPolls ? (
                <div className="d-flex justify-content-center py-5"><Spinner /></div>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Description</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pollList.map((row) => (
                      <tr key={row.id}>
                        <td>{row.title}</td>
                        <td className="text-muted small" style={{ maxWidth: 260 }}>{row.description || '-'}</td>
                        <td>{row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'}</td>
                        <td>
                          <Button size="sm" color="danger" outline className="rounded-2" onClick={() => archivePoll(row)}>Archive</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </>
      )}

      <Modal isOpen={lostModal} toggle={() => !saving && setLostModal(false)}>
        <ModalHeader toggle={() => !saving && setLostModal(false)}>New lost &amp; found</ModalHeader>
        <form onSubmit={createLost}>
          <ModalBody>
            <div className="mb-3">
              <label className="form-label">Title *</label>
              <Input className="form-control" required value={lostForm.title} onChange={(e) => setLostForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="form-label">Description</label>
              <Input type="textarea" rows={3} className="form-control" value={lostForm.description} onChange={(e) => setLostForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" className="rounded-2" onClick={() => setLostModal(false)} disabled={saving}>Cancel</Button>
            <Button color="primary" className="rounded-2" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal isOpen={pollModal} toggle={() => !saving && setPollModal(false)}>
        <ModalHeader toggle={() => !saving && setPollModal(false)}>New poll</ModalHeader>
        <form onSubmit={createPoll}>
          <ModalBody>
            <div className="mb-3">
              <label className="form-label">Question *</label>
              <Input className="form-control" required value={pollForm.title} onChange={(e) => setPollForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="form-label">Description</label>
              <Input type="textarea" rows={3} className="form-control" value={pollForm.description} onChange={(e) => setPollForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" className="rounded-2" onClick={() => setPollModal(false)} disabled={saving}>Cancel</Button>
            <Button color="primary" className="rounded-2" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

export default EngagementPage;

