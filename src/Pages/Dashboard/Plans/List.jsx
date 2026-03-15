import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Table,
  Spinner,
  Button,
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

const PlansList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    billingCycle: 'monthly',
    monthlyFee: 0,
    yearlyFee: 0,
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchList = () => {
    setLoading(true);
    axiosInstance
      .get(ENDPOINTS.PLANS.LIST)
      .then((res) => {
        if (res.data?.success) setList(res.data.data || []);
      })
      .catch(() => {
        toast.error('Failed to load plans');
        setList([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      slug: '',
      billingCycle: 'monthly',
      monthlyFee: 0,
      yearlyFee: 0,
      description: '',
    });
    setModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name,
      slug: row.slug,
      billingCycle: row.billingCycle || 'monthly',
      monthlyFee: row.monthlyFee ?? 0,
      yearlyFee: row.yearlyFee ?? 0,
      description: row.description || '',
    });
    setModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      name: form.name,
      slug: form.slug || form.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'plan',
      billingCycle: form.billingCycle,
      monthlyFee: Number(form.monthlyFee) || 0,
      yearlyFee: Number(form.yearlyFee) || 0,
      description: form.description || undefined,
    };
    if (editing) {
      axiosInstance
        .patch(ENDPOINTS.PLANS.UPDATE(editing.id), { ...payload, isActive: editing.isActive })
        .then((res) => {
          if (res.data?.success) {
            toast.success('Plan updated');
            setModal(false);
            fetchList();
          } else toast.error(res.data?.message || 'Update failed');
        })
        .catch((err) => toast.error(err.response?.data?.message || 'Update failed'))
        .finally(() => setSubmitting(false));
    } else {
      axiosInstance
        .post(ENDPOINTS.PLANS.CREATE, payload)
        .then((res) => {
          if (res.data?.success) {
            toast.success('Plan created');
            setModal(false);
            fetchList();
          } else toast.error(res.data?.message || 'Create failed');
        })
        .catch((err) => toast.error(err.response?.data?.message || 'Create failed'))
        .finally(() => setSubmitting(false));
    }
  };

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center">
        <h1>Plans</h1>
        <Button color="primary" onClick={openCreate}>Add plan</Button>
      </div>
      <Card className="table-card">
        <CardBody>
          {loading ? (
            <div className="d-flex justify-content-center py-5"><Spinner /></div>
          ) : list.length === 0 ? (
            <p className="text-muted text-center py-5 mb-0">No plans yet. Add a plan to use when creating invites.</p>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Billing</th>
                  <th>Monthly</th>
                  <th>Yearly</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.id}>
                    <td><strong>{row.name}</strong>{row.description && <><br /><span className="text-muted small">{row.description}</span></>}</td>
                    <td className="text-capitalize">{row.billingCycle}</td>
                    <td>₹{Number(row.monthlyFee || 0).toLocaleString()}</td>
                    <td>₹{Number(row.yearlyFee || 0).toLocaleString()}</td>
                    <td><Badge color={row.isActive ? 'success' : 'secondary'}>{row.isActive ? 'Active' : 'Inactive'}</Badge></td>
                    <td><Button size="sm" color="outline-primary" onClick={() => openEdit(row)}>Edit</Button></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={modal} toggle={() => !submitting && setModal(false)}>
        <ModalHeader toggle={() => !submitting && setModal(false)}>{editing ? 'Edit plan' : 'Add plan'}</ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <FormGroup>
              <Label>Name</Label>
              <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Standard" />
            </FormGroup>
            <FormGroup>
              <Label>Slug (optional)</Label>
              <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="standard" />
            </FormGroup>
            <FormGroup>
              <Label>Billing cycle</Label>
              <Input type="select" value={form.billingCycle} onChange={(e) => setForm((f) => ({ ...f, billingCycle: e.target.value }))}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </Input>
            </FormGroup>
            <div className="row g-2">
              <FormGroup className="col-6">
                <Label>Monthly fee (₹)</Label>
                <Input type="number" min={0} step={0.01} value={form.monthlyFee} onChange={(e) => setForm((f) => ({ ...f, monthlyFee: e.target.value }))} />
              </FormGroup>
              <FormGroup className="col-6">
                <Label>Yearly fee (₹)</Label>
                <Input type="number" min={0} step={0.01} value={form.yearlyFee} onChange={(e) => setForm((f) => ({ ...f, yearlyFee: e.target.value }))} />
              </FormGroup>
            </div>
            <FormGroup>
              <Label>Description (optional)</Label>
              <Input type="textarea" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description" />
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" type="button" onClick={() => setModal(false)} disabled={submitting}>Cancel</Button>
            <Button color="primary" type="submit" disabled={submitting}>{submitting ? 'Saving…' : editing ? 'Update' : 'Create'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

export default PlansList;
