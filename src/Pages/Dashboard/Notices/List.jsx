import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  CardBody,
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

const NoticesList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({ title: '', message: '', scheduledAt: '' });

  const fetchList = () => {
    setLoading(true);
    axiosInstance
      .get(ENDPOINTS.NOTICES.LIST)
      .then((res) => {
        const d = res.data?.data ?? [];
        setList(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        toast.error('Failed to load notices');
        setList([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message required');
      return;
    }
    setSubmitting(true);
    const payload = { title: form.title.trim(), message: form.message.trim() };
    if (form.scheduledAt) payload.scheduledAt = new Date(form.scheduledAt).toISOString();
    axiosInstance
      .post(ENDPOINTS.NOTICES.CREATE, payload)
      .then((res) => {
        if (res.data?.success) {
          toast.success('Notice published');
          setModal(false);
          setForm({ title: '', message: '', scheduledAt: '' });
          fetchList();
        } else {
          toast.error(res.data?.message || 'Failed to create notice');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to create notice'))
      .finally(() => setSubmitting(false));
  };

  const handleDelete = (row) => {
    if (!window.confirm(`Delete notice "${row.title}"?`)) return;
    setDeletingId(row.id);
    axiosInstance
      .delete(ENDPOINTS.NOTICES.DELETE(row.id))
      .then((res) => {
        if (res.data?.success) {
          toast.success('Notice deleted');
          fetchList();
        } else {
          toast.error(res.data?.message || 'Failed to delete');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to delete'))
      .finally(() => setDeletingId(null));
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleString() : '-');

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1>Notices</h1>
          <p className="page-subtitle mb-0">Notice board — publish and manage society notices.</p>
        </div>
        <Button color="primary" className="rounded-2" onClick={() => setModal(true)}>Create Notice</Button>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5"><Spinner color="primary" /></div>
      ) : (
        <div className="notice-feed">
          {list.length === 0 ? (
            <Card>
              <CardBody className="text-center text-muted py-5">No notices yet. Create one to get started.</CardBody>
            </Card>
          ) : (
            list.map((row) => (
              <div key={row.id} className="notice-card">
                <div className="d-flex justify-content-between align-items-start gap-3">
                  <div className="flex-grow-1 min-w-0">
                    <h3 className="nc-title mb-2">{row.title}</h3>
                    <p className="text-muted small mb-2" style={{ whiteSpace: 'pre-wrap' }}>{row.message || '-'}</p>
                    <div className="nc-meta">
                      Published: {formatDate(row.publishedAt)} · Created: {formatDate(row.createdAt)}
                    </div>
                  </div>
                  <Button size="sm" color="danger" outline className="rounded-2 flex-shrink-0" onClick={() => handleDelete(row)} disabled={deletingId === row.id}>
                    {deletingId === row.id ? '…' : 'Delete'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Modal isOpen={modal} toggle={() => !submitting && setModal(false)}>
        <ModalHeader toggle={() => !submitting && setModal(false)}>Create Notice</ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div className="mb-3">
              <label className="form-label">Title *</label>
              <Input className="form-control" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="form-label">Message *</label>
              <Input type="textarea" rows={4} className="form-control" required value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="form-label">Scheduled at (optional)</label>
              <Input type="datetime-local" className="form-control" value={form.scheduledAt} onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))} />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" className="rounded-2" onClick={() => setModal(false)} disabled={submitting}>Cancel</Button>
            <Button color="primary" className="rounded-2" type="submit" disabled={submitting}>{submitting ? 'Publishing…' : 'Publish'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

export default NoticesList;
