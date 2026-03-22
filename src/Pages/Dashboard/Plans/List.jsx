import React, { useState, useEffect, useCallback } from 'react';
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
  Pagination,
  PaginationItem,
  PaginationLink,
} from 'reactstrap';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';
import { toast } from 'react-toastify';

const listFromResponse = (res) => {
  const raw = res?.data;
  if (!raw || typeof raw !== 'object') return [];
  if (Array.isArray(raw.data)) return raw.data;
  if (raw.Collection && Array.isArray(raw.Collection.data)) return raw.Collection.data;
  return [];
};

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
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [listRefresh, setListRefresh] = useState(0);

  const fetchList = useCallback(() => {
    const { page, limit } = pagination;
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    axiosInstance
      .get(`${ENDPOINTS.PLANS.LIST}?${params.toString()}`)
      .then((res) => {
        const data = listFromResponse(res);
        setList(Array.isArray(data) ? data : []);
        const p = res.data?.pagination ?? {};
        const total = res.data?.total ?? p.total ?? 0;
        setPagination((prev) => ({
          ...prev,
          page: p.page ?? page,
          limit: p.limit ?? prev.limit,
          total: Number(total) || 0,
        }));
      })
      .catch(() => {
        toast.error('Failed to load plans');
        setList([]);
      })
      .finally(() => setLoading(false));
  }, [pagination.page, pagination.limit, listRefresh]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const limitNum = Math.max(1, Number(pagination.limit) || 20);
  const totalNum = Number(pagination.total) || 0;
  const totalPages = Math.max(1, Math.ceil(totalNum / limitNum));
  const start = totalNum === 0 ? 0 : (pagination.page - 1) * limitNum + 1;
  const end = Math.min(pagination.page * limitNum, totalNum);

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
            setListRefresh((n) => n + 1);
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
            setPagination((p) => ({ ...p, page: 1 }));
            setListRefresh((n) => n + 1);
          } else toast.error(res.data?.message || 'Create failed');
        })
        .catch((err) => toast.error(err.response?.data?.message || 'Create failed'))
        .finally(() => setSubmitting(false));
    }
  };

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap">
        <div>
          <h1 className="mb-0">Plans</h1>
          <p className="text-muted small mb-0 mt-1">Recurring pricing templates used when creating invites.</p>
        </div>
        <Button color="primary" onClick={openCreate}>Add plan</Button>
      </div>
      <Card className="table-card">
        <CardBody className="p-0">
          <div className="px-3 py-2 border-bottom d-flex flex-nowrap justify-content-between align-items-center gap-2 overflow-x-auto">
            <div className="small text-muted text-nowrap flex-shrink-0">
              {loading ? 'Loading plans…' : (
                <>Showing {totalNum === 0 ? 0 : start}–{end} of {totalNum} {totalNum !== 1 ? 'plans' : 'plan'}</>
              )}
            </div>
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <Label className="small text-muted mb-0 text-nowrap">Per page</Label>
              <Input
                type="select"
                className="form-select form-select-sm"
                style={{ width: 'auto', minWidth: 72 }}
                value={pagination.limit}
                onChange={(e) => {
                  const limit = Number(e.target.value);
                  setPagination((p) => ({ ...p, limit, page: 1 }));
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </Input>
            </div>
          </div>
          {loading ? (
            <div className="d-flex justify-content-center py-5"><Spinner color="primary" /></div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover size="sm" className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Billing</th>
                      <th className="text-end">Monthly</th>
                      <th className="text-end">Yearly</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-5">
                          No plans yet. Add a plan to use when creating invites.
                        </td>
                      </tr>
                    ) : (
                      list.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <strong>{row.name}</strong>
                            {row.description && (
                              <>
                                <br />
                                <span className="text-muted small">{row.description}</span>
                              </>
                            )}
                          </td>
                          <td className="text-capitalize">{row.billingCycle}</td>
                          <td className="text-end">₹{Number(row.monthlyFee || 0).toLocaleString()}</td>
                          <td className="text-end">₹{Number(row.yearlyFee || 0).toLocaleString()}</td>
                          <td><Badge color={row.isActive ? 'success' : 'secondary'}>{row.isActive ? 'Active' : 'Inactive'}</Badge></td>
                          <td className="text-end text-nowrap">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm p-1 lh-1"
                              title="Edit plan"
                              aria-label="Edit plan"
                              onClick={() => openEdit(row)}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center px-3 py-2 border-top gap-2">
                  <span className="small text-muted order-2 order-sm-1 text-center text-sm-start">
                    Page {pagination.page} of {totalPages}
                  </span>
                  <Pagination size="sm" className="mb-0 justify-content-center justify-content-sm-end order-1 order-sm-2 flex-wrap">
                    <PaginationItem disabled={pagination.page <= 1}>
                      <PaginationLink previous tag="button" type="button" onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))} />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = pagination.page <= 3 ? i + 1 : Math.max(1, pagination.page - 2 + i);
                      if (p > totalPages) return null;
                      return (
                        <PaginationItem key={p} active={p === pagination.page}>
                          <PaginationLink tag="button" type="button" onClick={() => setPagination((prev) => ({ ...prev, page: p }))}>{p}</PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem disabled={pagination.page >= totalPages}>
                      <PaginationLink next tag="button" type="button" onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))} />
                    </PaginationItem>
                  </Pagination>
                </div>
              )}
            </>
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
