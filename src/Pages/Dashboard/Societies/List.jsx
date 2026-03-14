import React, { useState, useEffect } from 'react';
import { Card, CardBody, Table, Spinner, Badge, Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input } from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';
import { toast } from 'react-toastify';

const SocietiesList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ flatCount: '', setupFee: '', monthlyFee: '' });
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  useEffect(() => {
    axiosInstance
      .get(ENDPOINTS.SOCIETIES.LIST)
      .then((res) => {
        const data = res.data?.data ?? [];
        setList(Array.isArray(data) ? data : []);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const openEdit = (row) => {
    setEditing(row);
    setEditForm({
      flatCount: row.flatCount ?? '',
      setupFee: row.setupFee ?? '',
      monthlyFee: row.monthlyFee ?? '',
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    axiosInstance
      .patch(ENDPOINTS.SOCIETIES.UPDATE(editing.id), {
        flatCount: Number(editForm.flatCount) || 0,
        setupFee: Number(editForm.setupFee) || 0,
        monthlyFee: Number(editForm.monthlyFee) || 0,
      })
      .then((res) => {
        if (res.data?.success) {
          toast.success('Society updated');
          setEditing(null);
          setLoading(true);
          return axiosInstance.get(ENDPOINTS.SOCIETIES.LIST).then((r) => {
            const data = r.data?.data ?? [];
            setList(Array.isArray(data) ? data : []);
          });
        }
        toast.error(res.data?.message || 'Failed to update society');
        return null;
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to update society');
      })
      .finally(() => {
        setSaving(false);
        setLoading(false);
      });
  };

  const updateStatus = (row, status) => {
    setUpdatingStatusId(row.id);
    axiosInstance
      .patch(ENDPOINTS.SOCIETIES.UPDATE_STATUS(row.id), { status })
      .then((res) => {
        if (res.data?.success) {
          toast.success(`Status changed to ${status}`);
          setLoading(true);
          return axiosInstance.get(ENDPOINTS.SOCIETIES.LIST).then((r) => {
            const data = r.data?.data ?? [];
            setList(Array.isArray(data) ? data : []);
          });
        }
        toast.error(res.data?.message || 'Failed to change status');
        return null;
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to change status');
      })
      .finally(() => {
        setUpdatingStatusId(null);
        setLoading(false);
      });
  };

  return (
    <div>
      <div className="page-header">
        <h1>Societies</h1>
      </div>
      <Card className="table-card">
        <CardBody>
          {loading ? (
            <div className="d-flex justify-content-center py-5"><Spinner /></div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Alias</th>
                  <th>Flat Count</th>
                  <th>Plan</th>
                  <th>Monthly Fee</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td><code>{row.alias}</code></td>
                    <td>{row.flatCount}</td>
                    <td>{row.planType}</td>
                    <td>₹{Number(row.monthlyFee || 0).toLocaleString()}</td>
                    <td><Badge color={row.status === 'active' ? 'success' : 'secondary'}>{row.status}</Badge></td>
                    <td>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}</td>
                    <td>
                      <Button
                        size="sm"
                        color="primary"
                        outline
                        className="me-1"
                        onClick={() => openEdit(row)}
                      >
                        Edit billing
                      </Button>
                      {row.status !== 'active' && (
                        <Button
                          size="sm"
                          color="success"
                          outline
                          className="me-1"
                          disabled={updatingStatusId === row.id}
                          onClick={() => updateStatus(row, 'active')}
                        >
                          {updatingStatusId === row.id ? '...' : 'Activate'}
                        </Button>
                      )}
                      {row.status === 'active' && (
                        <Button
                          size="sm"
                          color="warning"
                          outline
                          disabled={updatingStatusId === row.id}
                          onClick={() => updateStatus(row, 'suspended')}
                        >
                          {updatingStatusId === row.id ? '...' : 'Suspend'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={!!editing} toggle={() => !saving && setEditing(null)}>
        <ModalHeader toggle={() => !saving && setEditing(null)}>Edit billing</ModalHeader>
        <form onSubmit={handleSave}>
          <ModalBody>
            {editing && (
              <>
                <p className="text-muted small mb-3">
                  {editing.name} (<code>{editing.alias}</code>)
                </p>
                <FormGroup>
                  <Label>Flat count</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editForm.flatCount}
                    onChange={(e) => setEditForm((f) => ({ ...f, flatCount: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Setup fee</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={editForm.setupFee}
                    onChange={(e) => setEditForm((f) => ({ ...f, setupFee: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Monthly fee</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={editForm.monthlyFee}
                    onChange={(e) => setEditForm((f) => ({ ...f, monthlyFee: e.target.value }))}
                  />
                </FormGroup>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button color="primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

export default SocietiesList;
