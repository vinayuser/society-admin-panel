import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardBody,
  Table,
  Spinner,
  Badge,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
  Label,
  Input,
  Pagination,
  PaginationItem,
  PaginationLink,
} from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';
import { toast } from 'react-toastify';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const listFromResponse = (res) => {
  const raw = res?.data;
  if (!raw || typeof raw !== 'object') return [];
  if (Array.isArray(raw.data)) return raw.data;
  if (raw.Collection && Array.isArray(raw.Collection.data)) return raw.Collection.data;
  return [];
};

const BillingList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [societies, setSocieties] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateYear, setGenerateYear] = useState(new Date().getFullYear());
  const [generateMonth, setGenerateMonth] = useState(new Date().getMonth() + 1);
  const [generating, setGenerating] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [listRefresh, setListRefresh] = useState(0);
  const [createForm, setCreateForm] = useState({
    societyId: '',
    type: 'monthly',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    quarter: 1,
    amount: '',
    dueDate: '',
    notes: '',
  });

  const fetchList = useCallback(() => {
    const { page, limit } = pagination;
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    axiosInstance
      .get(`${ENDPOINTS.BILLING.LIST}?${params.toString()}`)
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
        toast.error('Failed to load invoices');
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

  useEffect(() => {
    if (createOpen) {
      axiosInstance
        .get(`${ENDPOINTS.SOCIETIES.LIST}?page=1&limit=100`)
        .then((res) => {
          const data = listFromResponse(res);
          setSocieties(Array.isArray(data) ? data : []);
          if (data.length && !createForm.societyId) {
            setCreateForm((f) => ({ ...f, societyId: String(data[0].id) }));
          }
        })
        .catch(() => setSocieties([]));
    }
  }, [createOpen]);

  const handleGenerateRecurring = () => {
    setGenerating(true);
    axiosInstance
      .post(ENDPOINTS.PAYMENTS.GENERATE_RECURRING, { year: generateYear, month: generateMonth })
      .then((res) => {
        if (res.data?.success) {
          toast.success(res.data?.data?.message || 'Invoices generated');
          setGenerateOpen(false);
          setPagination((p) => ({ ...p, page: 1 }));
          setListRefresh((n) => n + 1);
        } else {
          toast.error(res.data?.message || 'Failed to generate');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to generate invoices'))
      .finally(() => setGenerating(false));
  };

  const getBillingDate = () => {
    const y = Number(createForm.year) || new Date().getFullYear();
    if (createForm.type === 'yearly') return `${y}-01-01`;
    if (createForm.type === 'quarterly') {
      const m = Number(createForm.quarter) || 1;
      const month = m * 3;
      return `${y}-${String(month).padStart(2, '0')}-01`;
    }
    const m = Number(createForm.month) || 1;
    return `${y}-${String(m).padStart(2, '0')}-01`;
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const societyId = Number(createForm.societyId);
    const amount = Number(createForm.amount);
    if (!societyId || !amount || amount <= 0) {
      toast.error('Select a society and enter a valid amount');
      return;
    }
    setSubmitting(true);
    const billingDate = getBillingDate();
    const payload = {
      societyId,
      amount,
      type: createForm.type,
      billingDate,
      dueDate: createForm.dueDate || billingDate,
      notes: createForm.notes.trim() || undefined,
    };
    axiosInstance
      .post(ENDPOINTS.BILLING.CREATE, payload)
      .then((res) => {
        if (res.data?.success) {
          toast.success('Invoice created');
          setCreateOpen(false);
          setCreateForm({
            societyId: '',
            type: 'monthly',
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            quarter: 1,
            amount: '',
            dueDate: '',
            notes: '',
          });
          setPagination((p) => ({ ...p, page: 1 }));
          setListRefresh((n) => n + 1);
        } else {
          toast.error(res.data?.message || 'Failed to create invoice');
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to create invoice');
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap">
        <div>
          <h1 className="mb-0">Billing / Invoices</h1>
          <p className="text-muted small mb-0 mt-1">Generate recurring invoices for all societies at once by month. Society admins see their invoices under Payments.</p>
        </div>
      </div>

      <Card className="mb-3 border-primary">
        <CardBody className="py-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div>
              <h6 className="mb-1">Generate recurring invoices</h6>
              <p className="small text-muted mb-0">Creates pending monthly/quarterly/yearly invoices for the selected month for all societies (based on their plan). Existing invoices are skipped.</p>
            </div>
            <Button color="primary" onClick={() => setGenerateOpen(true)}>
              Generate for month
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="d-flex justify-content-between align-items-center flex-nowrap gap-2 mb-2 overflow-x-auto">
        <span className="small text-muted text-nowrap flex-shrink-0">All invoices (generated + one-off).</span>
        <Button
          color="outline-secondary"
          size="sm"
          className="flex-shrink-0"
          onClick={() => {
            setCreateForm({
              societyId: '',
              type: 'monthly',
              year: new Date().getFullYear(),
              month: new Date().getMonth() + 1,
              quarter: 1,
              amount: '',
              dueDate: '',
              notes: '',
            });
            setCreateOpen(true);
          }}
        >
          Create one-off invoice
        </Button>
      </div>

      <Card className="table-card">
        <CardBody className="p-0">
          <div className="px-3 py-2 border-bottom d-flex flex-nowrap justify-content-between align-items-center gap-2 overflow-x-auto">
            <div className="small text-muted text-nowrap flex-shrink-0">
              {loading ? 'Loading invoices…' : (
                <>Showing {totalNum === 0 ? 0 : start}–{end} of {totalNum} invoice{totalNum !== 1 ? 's' : ''}</>
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
                      <th>Society</th>
                      <th>Invoice</th>
                      <th>Type</th>
                      <th className="text-end">Amount</th>
                      <th>Billing date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-5">No invoices yet.</td>
                      </tr>
                    ) : (
                      list.map((row) => (
                        <tr key={row.id}>
                          <td>{row.societyName || row.societyId}</td>
                          <td className="font-monospace small">{row.invoiceNumber}</td>
                          <td className="text-capitalize">{row.type}</td>
                          <td className="text-end">₹{Number(row.amount || 0).toLocaleString()}</td>
                          <td className="text-nowrap small">{row.billingDate ? new Date(row.billingDate).toLocaleDateString() : '–'}</td>
                          <td>
                            <Badge color={row.paymentStatus === 'paid' ? 'success' : row.paymentStatus === 'overdue' ? 'danger' : 'warning'}>
                              {row.paymentStatus}
                            </Badge>
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

      <Modal isOpen={createOpen} toggle={() => !submitting && setCreateOpen(false)} size="md">
        <ModalHeader toggle={() => !submitting && setCreateOpen(false)}>Create one-off invoice</ModalHeader>
        <form onSubmit={handleCreateSubmit}>
          <ModalBody>
            <FormGroup>
              <Label>Society</Label>
              <Input
                type="select"
                required
                value={createForm.societyId}
                onChange={(e) => setCreateForm((f) => ({ ...f, societyId: e.target.value }))}
              >
                <option value="">Select society</option>
                {societies.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.alias})</option>
                ))}
              </Input>
            </FormGroup>
            <FormGroup>
              <Label>Type</Label>
              <Input
                type="select"
                value={createForm.type}
                onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value }))}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </Input>
            </FormGroup>
            {createForm.type === 'monthly' && (
              <div className="row g-2">
                <FormGroup className="col-6">
                  <Label>Month</Label>
                  <Input
                    type="select"
                    value={createForm.month}
                    onChange={(e) => setCreateForm((f) => ({ ...f, month: Number(e.target.value) }))}
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </Input>
                </FormGroup>
                <FormGroup className="col-6">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    min={2020}
                    max={2030}
                    value={createForm.year}
                    onChange={(e) => setCreateForm((f) => ({ ...f, year: Number(e.target.value) }))}
                  />
                </FormGroup>
              </div>
            )}
            {createForm.type === 'quarterly' && (
              <div className="row g-2">
                <FormGroup className="col-6">
                  <Label>Quarter</Label>
                  <Input
                    type="select"
                    value={createForm.quarter}
                    onChange={(e) => setCreateForm((f) => ({ ...f, quarter: Number(e.target.value) }))}
                  >
                    <option value={1}>Q1 (Jan–Mar)</option>
                    <option value={2}>Q2 (Apr–Jun)</option>
                    <option value={3}>Q3 (Jul–Sep)</option>
                    <option value={4}>Q4 (Oct–Dec)</option>
                  </Input>
                </FormGroup>
                <FormGroup className="col-6">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    min={2020}
                    max={2030}
                    value={createForm.year}
                    onChange={(e) => setCreateForm((f) => ({ ...f, year: Number(e.target.value) }))}
                  />
                </FormGroup>
              </div>
            )}
            {createForm.type === 'yearly' && (
              <FormGroup>
                <Label>Year</Label>
                <Input
                  type="number"
                  min={2020}
                  max={2030}
                  value={createForm.year}
                  onChange={(e) => setCreateForm((f) => ({ ...f, year: Number(e.target.value) }))}
                />
              </FormGroup>
            )}
            <FormGroup>
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                required
                min={0}
                step="0.01"
                value={createForm.amount}
                onChange={(e) => setCreateForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="Invoice amount"
              />
            </FormGroup>
            <FormGroup>
              <Label>Due date (optional)</Label>
              <Input
                type="date"
                value={createForm.dueDate}
                onChange={(e) => setCreateForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </FormGroup>
            <FormGroup>
              <Label>Notes (optional)</Label>
              <Input
                type="textarea"
                rows={2}
                value={createForm.notes}
                onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Maintenance March 2025"
              />
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" type="button" onClick={() => setCreateOpen(false)} disabled={submitting}>Cancel</Button>
            <Button color="primary" type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create one-off'}</Button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal isOpen={generateOpen} toggle={() => !generating && setGenerateOpen(false)}>
        <ModalHeader toggle={() => !generating && setGenerateOpen(false)}>Generate recurring invoices</ModalHeader>
        <ModalBody>
          <p className="small text-muted mb-3">Creates pending invoices for the selected period for all societies (according to their billing cycle). Existing invoices for that period are skipped.</p>
          <div className="row g-2">
            <div className="col-6">
              <Label>Year</Label>
              <Input type="select" value={generateYear} onChange={(e) => setGenerateYear(Number(e.target.value))}>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Input>
            </div>
            <div className="col-6">
              <Label>Month</Label>
              <Input type="select" value={generateMonth} onChange={(e) => setGenerateMonth(Number(e.target.value))}>
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </Input>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setGenerateOpen(false)} disabled={generating}>Cancel</Button>
          <Button color="primary" onClick={handleGenerateRecurring} disabled={generating}>{generating ? 'Generating…' : 'Generate'}</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default BillingList;
