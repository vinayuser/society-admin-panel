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
} from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';
import { toast } from 'react-toastify';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
    setLoading(true);
    axiosInstance
      .get(ENDPOINTS.BILLING.LIST)
      .then((res) => {
        const data = res.data?.data ?? [];
        setList(Array.isArray(data) ? data : []);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (createOpen) {
      axiosInstance
        .get(ENDPOINTS.SOCIETIES.LIST)
        .then((res) => {
          const data = res.data?.data ?? [];
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
          fetchList();
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
          fetchList();
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
      <div className="page-header mb-3">
        <h1>Billing / Invoices</h1>
        <p className="text-muted small mb-0">Generate recurring invoices for all societies at once by month. No need to create each invoice manually.</p>
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
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
        <span className="small text-muted">All invoices (generated + one-off). Society admins see their invoices and payment reminders in Dashboard → Payments.</span>
        <Button
          color="outline-secondary"
          size="sm"
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
        <CardBody>
          {loading ? (
            <div className="d-flex justify-content-center py-5"><Spinner /></div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Society</th>
                  <th>Invoice</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Billing Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.id}>
                    <td>{row.societyName || row.societyId}</td>
                    <td>{row.invoiceNumber}</td>
                    <td className="text-capitalize">{row.type}</td>
                    <td>₹{Number(row.amount || 0).toLocaleString()}</td>
                    <td>{row.billingDate ? new Date(row.billingDate).toLocaleDateString() : '-'}</td>
                    <td><Badge color={row.paymentStatus === 'paid' ? 'success' : 'warning'}>{row.paymentStatus}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </Table>
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
