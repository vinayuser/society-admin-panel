import React, { useState, useEffect } from 'react';
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
  Badge,
} from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';

const ChatList = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'society_admin' || user?.role === 'super_admin';

  const [groups, setGroups] = useState([]);
  const [societyUsers, setSocietyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    icon: '',
    adminOnlyPosting: false,
    memberIds: [],
  });

  const fetchGroups = () => {
    setLoading(true);
    axiosInstance
      .get(ENDPOINTS.CHAT.GROUPS)
      .then((res) => {
        const d = res.data?.data ?? [];
        setGroups(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        toast.error('Failed to load chat groups');
        setGroups([]);
      })
      .finally(() => setLoading(false));
  };

  const fetchSocietyUsers = () => {
    if (!isAdmin) return;
    axiosInstance
      .get(ENDPOINTS.CHAT.SOCIETY_USERS)
      .then((res) => {
        setSocietyUsers(res.data?.data ?? []);
      })
      .catch(() => setSocietyUsers([]));
  };

  useEffect(() => {
    fetchGroups();
    if (isAdmin) fetchSocietyUsers();
  }, [isAdmin]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Group name is required');
      return;
    }
    setSubmitting(true);
    axiosInstance
      .post(ENDPOINTS.CHAT.GROUPS, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        icon: form.icon.trim() || null,
        adminOnlyPosting: !!form.adminOnlyPosting,
        memberIds: form.memberIds,
      })
      .then((res) => {
        if (res.data?.success) {
          toast.success('Group created');
          setModal(false);
          setForm({ name: '', description: '', icon: '', adminOnlyPosting: false, memberIds: [] });
          fetchGroups();
        } else {
          toast.error(res.data?.message || 'Failed to create group');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to create group'))
      .finally(() => setSubmitting(false));
  };

  const toggleMember = (id) => {
    setForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(id)
        ? prev.memberIds.filter((m) => m !== id)
        : [...prev.memberIds, id],
    }));
  };

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap">
        <h1>Chat Groups</h1>
        {isAdmin && (
          <Button color="primary" onClick={() => setModal(true)}>
            Create Group
          </Button>
        )}
      </div>
      <Card className="table-card">
        <CardBody>
          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <Spinner />
            </div>
          ) : groups.length === 0 ? (
            <p className="text-muted text-center py-4 mb-0">No chat groups yet. Create one to get started.</p>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Members</th>
                  <th>Messages</th>
                  <th>Posting</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr
                    key={g.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/dashboard/chat/${g.id}`)}
                  >
                    <td>
                      <strong>{g.name}</strong>
                      {g.description && (
                        <small className="d-block text-muted">{g.description.substring(0, 60)}...</small>
                      )}
                    </td>
                    <td>{g.memberCount}</td>
                    <td>{g.messageCount}</td>
                    <td>
                      {g.adminOnlyPosting ? (
                        <Badge color="warning">Admin only</Badge>
                      ) : (
                        <Badge color="success">Open</Badge>
                      )}
                    </td>
                    <td>{g.updatedAt ? new Date(g.updatedAt).toLocaleDateString() : '-'}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" color="primary" onClick={() => navigate(`/admin/dashboard/chat/${g.id}`)}>
                        Open
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={modal} toggle={() => setModal(false)} size="lg">
        <ModalHeader toggle={() => setModal(false)}>Create Chat Group</ModalHeader>
        <form onSubmit={handleCreate}>
          <ModalBody>
            <FormGroup>
              <Label>Group name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Block A, Committee, General"
                required
              />
            </FormGroup>
            <FormGroup>
              <Label>Description (optional)</Label>
              <Input
                type="textarea"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief description"
                rows={2}
              />
            </FormGroup>
            <FormGroup check>
              <Label check>
                <Input
                  type="checkbox"
                  checked={form.adminOnlyPosting}
                  onChange={(e) => setForm((p) => ({ ...p, adminOnlyPosting: e.target.checked }))}
                />
                Admin-only posting (only admins can send messages)
              </Label>
            </FormGroup>
            <FormGroup>
              <Label>Add members (society users)</Label>
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: 4, padding: 8 }}>
                {societyUsers.map((u) => (
                  <Label key={u.id} check className="d-block">
                    <Input
                      type="checkbox"
                      checked={form.memberIds.includes(u.id)}
                      onChange={() => toggleMember(u.id)}
                    />
                    {u.name} ({u.email})
                  </Label>
                ))}
                {societyUsers.length === 0 && <small className="text-muted">No society users found.</small>}
              </div>
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button type="button" color="secondary" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button type="submit" color="primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Group'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

export default ChatList;
