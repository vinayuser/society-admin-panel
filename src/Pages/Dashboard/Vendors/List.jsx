import React, { useEffect, useState } from 'react';
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

const categories = [
  'plumber',
  'electrician',
  'grocery',
  'water_delivery',
  'laundry',
  'tutors',
  'tiffin_services',
  'cleaning_services',
  'repair_services',
];

const VendorsList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [form, setForm] = useState({
    vendorName: '',
    category: '',
    phone: '',
    description: '',
    serviceArea: '',
    status: 'active',
  });

  const fetchList = () => {
    setLoading(true);
    axiosInstance
      .get(ENDPOINTS.VENDORS.LIST, {
        params: filterCategory ? { category: filterCategory } : undefined,
      })
      .then((res) => {
        const d = res.data?.data ?? [];
        setList(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        toast.error('Failed to load vendors');
        setList([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      vendorName: '',
      category: '',
      phone: '',
      description: '',
      serviceArea: '',
      status: 'active',
    });
    setModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      vendorName: row.vendorName || row.vendor_name || '',
      category: row.category || '',
      phone: row.phone || '',
      description: row.description || '',
      serviceArea: row.serviceArea || row.service_area || '',
      status: row.status || 'active',
    });
    setModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.vendorName.trim() || !form.category) {
      toast.error('Vendor name and category are required');
      return;
    }
    setSaving(true);
    const payload = {
      vendorName: form.vendorName.trim(),
      category: form.category,
      phone: form.phone.trim() || null,
      description: form.description.trim() || null,
      serviceArea: form.serviceArea.trim() || null,
      status: form.status,
    };
    const req = editing
      ? axiosInstance.patch(ENDPOINTS.VENDORS.UPDATE(editing.id), payload)
      : axiosInstance.post(ENDPOINTS.VENDORS.CREATE, payload);
    req
      .then((res) => {
        if (res.data?.success) {
          toast.success('Vendor saved');
          setModal(false);
          fetchList();
        } else {
          toast.error(res.data?.message || 'Failed to save vendor');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to save vendor'))
      .finally(() => setSaving(false));
  };

  const handleDeactivate = (row) => {
    const nextStatus = row.status === 'active' ? 'inactive' : 'active';
    axiosInstance
      .patch(ENDPOINTS.VENDORS.UPDATE(row.id), { status: nextStatus })
      .then((res) => {
        if (res.data?.success) {
          toast.success(`Vendor ${nextStatus === 'active' ? 'activated' : 'deactivated'}`);
          fetchList();
        } else {
          toast.error(res.data?.message || 'Failed to update status');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to update status'));
  };

  const handleDelete = (row) => {
    if (!window.confirm(`Delete vendor "${row.vendorName || row.vendor_name}"?`)) return;
    axiosInstance
      .delete(ENDPOINTS.VENDORS.DELETE(row.id))
      .then((res) => {
        if (res.data?.success) {
          toast.success('Vendor deleted');
          fetchList();
        } else {
          toast.error(res.data?.message || 'Failed to delete vendor');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to delete vendor'));
  };

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1>Vendor Marketplace</h1>
          <p className="page-subtitle mb-0">
            Add trusted local vendors (plumbers, electricians, groceries, and more) for your residents.
          </p>
        </div>
        <Button color="primary" className="rounded-2" onClick={openCreate}>Add Vendor</Button>
      </div>
      <Card className="table-card">
        <CardBody>
          <div className="d-flex flex-wrap gap-3 mb-3 align-items-center">
            <label className="form-label mb-0 text-muted small">Filter by category</label>
            <Input
              type="select"
              className="form-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ maxWidth: 220 }}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c.replace('_', ' ')}</option>
              ))}
            </Input>
          </div>
          {loading ? (
            <div className="d-flex justify-content-center py-5"><Spinner color="primary" /></div>
          ) : (
            <Table responsive hover className="table-striped">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Phone</th>
                  <th>Service area</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.id}>
                    <td>{row.vendorName || row.vendor_name}</td>
                    <td>{row.category}</td>
                    <td>{row.phone || '-'}</td>
                    <td>{row.serviceArea || row.service_area || '-'}</td>
                    <td>
                      <span className={`badge ${row.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        <Button size="sm" color="primary" outline className="rounded-2" onClick={() => openEdit(row)}>Edit</Button>
                        <Button size="sm" color={row.status === 'active' ? 'warning' : 'success'} outline className="rounded-2" onClick={() => handleDeactivate(row)}>
                          {row.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button size="sm" color="danger" outline className="rounded-2" onClick={() => handleDelete(row)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={modal} toggle={() => !saving && setModal(false)}>
        <ModalHeader toggle={() => !saving && setModal(false)}>
          {editing ? 'Edit Vendor' : 'Add Vendor'}
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div className="mb-3">
              <label className="form-label">Vendor name *</label>
              <Input className="form-control" required value={form.vendorName} onChange={(e) => setForm((f) => ({ ...f, vendorName: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="form-label">Category *</label>
              <Input type="select" className="form-select" required value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c.replace('_', ' ')}</option>
                ))}
              </Input>
            </div>
            <div className="mb-3">
              <label className="form-label">Phone</label>
              <Input className="form-control" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="form-label">Service area</label>
              <Input className="form-control" value={form.serviceArea} onChange={(e) => setForm((f) => ({ ...f, serviceArea: e.target.value }))} placeholder="e.g. Tower A & B, full society" />
            </div>
            <div className="mb-3">
              <label className="form-label">Description</label>
              <Input type="textarea" rows={3} className="form-control" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" className="rounded-2" onClick={() => setModal(false)} disabled={saving}>Cancel</Button>
            <Button color="primary" className="rounded-2" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

export default VendorsList;

