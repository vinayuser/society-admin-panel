import React, { useState, useEffect, useCallback } from 'react';
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
  Badge,
  Row,
  Col,
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

const PaymentsList = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [overview, setOverview] = useState({ data: [], year });
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateYear, setGenerateYear] = useState(new Date().getFullYear());
  const [generateMonth, setGenerateMonth] = useState(new Date().getMonth() + 1);
  const [generating, setGenerating] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [listRefresh, setListRefresh] = useState(0);

  const fetchOverview = useCallback(() => {
    const { page, limit } = pagination;
    setLoading(true);
    const params = new URLSearchParams();
    params.set('year', String(year));
    params.set('page', String(page));
    params.set('limit', String(limit));
    axiosInstance
      .get(`${ENDPOINTS.PAYMENTS.OVERVIEW}?${params.toString()}`)
      .then((res) => {
        const data = listFromResponse(res);
        const y = res.data?.year ?? year;
        const p = res.data?.pagination ?? {};
        const total = res.data?.total ?? p.total ?? 0;
        setOverview({ data: Array.isArray(data) ? data : [], year: y });
        setPagination((prev) => ({
          ...prev,
          page: p.page ?? page,
          limit: p.limit ?? prev.limit,
          total: Number(total) || 0,
        }));
      })
      .catch(() => {
        toast.error('Failed to load payments');
        setOverview((prev) => ({ ...prev, data: [] }));
      })
      .finally(() => setLoading(false));
  }, [year, pagination.page, pagination.limit, listRefresh]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const limitNum = Math.max(1, Number(pagination.limit) || 20);
  const totalNum = Number(pagination.total) || 0;
  const totalPages = Math.max(1, Math.ceil(totalNum / limitNum));
  const start = totalNum === 0 ? 0 : (pagination.page - 1) * limitNum + 1;
  const end = Math.min(pagination.page * limitNum, totalNum);

  const openMonthDetail = (societyId, month) => {
    setDetail(null);
    setDetailLoading(true);
    const params = new URLSearchParams({ societyId, year, month });
    axiosInstance
      .get(`${ENDPOINTS.PAYMENTS.MONTH_DETAIL}?${params.toString()}`)
      .then((res) => {
        if (res.data?.success) setDetail(res.data.data);
        else toast.error(res.data?.message || 'Failed to load detail');
      })
      .catch(() => toast.error('Failed to load month detail'))
      .finally(() => setDetailLoading(false));
  };

  const sendReminder = () => {
    if (!detail) return;
    setReminding(true);
    axiosInstance
      .post(ENDPOINTS.PAYMENTS.SEND_REMINDER, {
        societyId: detail.society.id,
        year: detail.year,
        month: detail.month,
      })
      .then((res) => {
        if (res.data?.success) {
          toast.success(res.data.data?.message || 'Reminder sent');
        } else toast.error(res.data?.message || 'Failed to send reminder');
      })
      .catch(() => toast.error('Failed to send reminder'))
      .finally(() => setReminding(false));
  };

  const handleGenerateRecurring = () => {
    setGenerating(true);
    axiosInstance
      .post(ENDPOINTS.PAYMENTS.GENERATE_RECURRING, { year: generateYear, month: generateMonth })
      .then((res) => {
        if (res.data?.success) {
          toast.success(res.data.data?.message || 'Invoices generated');
          setGenerateOpen(false);
          setPagination((p) => ({ ...p, page: 1 }));
          setListRefresh((n) => n + 1);
        } else toast.error(res.data?.message || 'Failed');
      })
      .catch(() => toast.error('Failed to generate invoices'))
      .finally(() => setGenerating(false));
  };

  const cellStatus = (m) => {
    if (!m) return { label: '—', color: 'secondary' };
    if (m.status === 'na') return { label: '–', color: 'secondary' };
    if (m.status === 'paid') return { label: 'Paid', color: 'success' };
    if (m.status === 'partial') return { label: 'Partial', color: 'warning' };
    return { label: 'Due', color: 'danger' };
  };

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap">
        <div>
          <h1 className="mb-0">Society payments</h1>
          <p className="text-muted small mb-0 mt-1">Monthly grid per society. Click a cell to open month detail and reminders.</p>
        </div>
        <Button color="primary" size="sm" onClick={() => setGenerateOpen(true)}>Generate recurring invoices</Button>
      </div>

      <Card className="table-card">
        <CardBody className="p-0">
          <div className="px-3 py-2 border-bottom d-flex flex-nowrap justify-content-between align-items-center gap-2 overflow-x-auto">
            <div className="small text-muted text-nowrap flex-shrink-0">
              {loading ? 'Loading…' : (
                <>Showing {totalNum === 0 ? 0 : start}–{end} of {totalNum} {totalNum !== 1 ? 'societies' : 'society'} · {overview.year}</>
              )}
            </div>
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <Label className="small text-muted mb-0 text-nowrap">Year</Label>
              <Input
                type="select"
                className="form-select form-select-sm"
                style={{ width: 'auto', minWidth: 88 }}
                value={year}
                onChange={(e) => {
                  setYear(Number(e.target.value));
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
              >
                {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Input>
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
            <div className="d-flex justify-content-center align-items-center py-5">
              <Spinner color="primary" />
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover size="sm" className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Society</th>
                      <th className="text-center">Billing cycle</th>
                      <th className="text-center">Period amount</th>
                      {MONTHS.map((m, i) => (
                        <th key={i} className="text-center" style={{ minWidth: 64 }}>{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {overview.data.length === 0 ? (
                      <tr>
                        <td colSpan={16} className="text-center text-muted py-5">
                          No societies found. Add societies and set monthly fee to see payments.
                        </td>
                      </tr>
                    ) : (
                      overview.data.map((row) => (
                        <tr key={row.id}>
                          <td className="text-nowrap">
                            <strong>{row.name}</strong>
                            {row.alias && <span className="text-muted small ms-1">({row.alias})</span>}
                          </td>
                          <td className="text-center text-capitalize">{row.billingCycle || 'monthly'}</td>
                          <td className="text-center small">
                            {row.billingCycle === 'yearly'
                              ? `₹${Number(row.yearlyFee || row.monthlyFee * 12 || 0).toLocaleString()}/yr`
                              : row.billingCycle === 'quarterly'
                                ? `₹${Number(row.yearlyFee ? row.yearlyFee / 4 : row.monthlyFee * 3 || 0).toLocaleString()}/qtr`
                                : `₹${Number(row.monthlyFee || 0).toLocaleString()}/mo`}
                          </td>
                          {MONTHS.map((_, i) => {
                            const monthNum = i + 1;
                            const m = row.months?.[monthNum];
                            const { label, color } = cellStatus(m);
                            return (
                              <td key={i} className="text-center p-1">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-link p-1 text-decoration-none"
                                  style={{ minWidth: 56 }}
                                  onClick={() => openMonthDetail(row.id, monthNum)}
                                >
                                  <Badge color={color}>{label}</Badge>
                                </button>
                              </td>
                            );
                          })}
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

      <Modal isOpen={generateOpen} toggle={() => !generating && setGenerateOpen(false)}>
        <ModalHeader toggle={() => !generating && setGenerateOpen(false)}>Generate recurring invoices</ModalHeader>
        <ModalBody>
          <p className="small text-muted mb-3">Creates pending invoices for the selected period for all societies (according to their billing cycle). Existing invoices are skipped.</p>
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

      <Modal isOpen={detail !== null || detailLoading} toggle={() => !detailLoading && setDetail(null)} size="lg">
        <ModalHeader toggle={() => !detailLoading && setDetail(null)}>
          {detail
            ? `${detail.society?.name} – ${detail.monthLabel} ${detail.year}`
            : 'Month detail'}
        </ModalHeader>
        <ModalBody>
          {detailLoading ? (
            <div className="d-flex justify-content-center py-4"><Spinner /></div>
          ) : detail ? (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <p className="mb-1 small text-muted">Billing cycle</p>
                  <p className="mb-0 fw-semibold text-capitalize">{detail.society?.billingCycle || 'monthly'}</p>
                </Col>
                <Col md={6}>
                  <p className="mb-1 small text-muted">Amount due (period)</p>
                  <p className="mb-0 fw-semibold">₹{Number(detail.amountDue || 0).toLocaleString()}</p>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <p className="mb-1 small text-muted">Total paid this period</p>
                  <p className="mb-0 fw-semibold">₹{Number(detail.totalPaid || 0).toLocaleString()}</p>
                </Col>
              </Row>
              {detail.previousBalance != null && detail.previousBalance !== 0 && (
                <p className="mb-2 small">
                  <span className="text-muted">Previous balance carried: </span>
                  ₹{Number(detail.previousBalance).toLocaleString()}
                </p>
              )}
              <p className="mb-2">
                <Badge color={detail.status === 'paid' ? 'success' : detail.status === 'partial' ? 'warning' : 'danger'}>
                  {detail.status === 'paid' ? 'Paid' : detail.status === 'partial' ? 'Partial' : 'Due'}
                </Badge>
              </p>
              <h6 className="mt-3 mb-2">Transactions</h6>
              {!detail.transactions?.length ? (
                <p className="text-muted small">No transactions for this month yet.</p>
              ) : (
                <Table size="sm" className="mb-0">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Paid at</th>
                      <th>Previous balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.transactions.map((t) => (
                      <tr key={t.id}>
                        <td>{t.invoiceNumber || t.id}</td>
                        <td className="text-capitalize">{t.type || '–'}</td>
                        <td>₹{Number(t.amount || 0).toLocaleString()}</td>
                        <td><Badge color={t.paymentStatus === 'paid' ? 'success' : 'secondary'}>{t.paymentStatus}</Badge></td>
                        <td>{t.paidAt ? new Date(t.paidAt).toLocaleString() : '—'}</td>
                        <td>{t.previousBalance != null ? `₹${Number(t.previousBalance).toLocaleString()}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </>
          ) : null}
        </ModalBody>
        {detail && (
          <ModalFooter>
            <Button color="primary" outline onClick={sendReminder} disabled={reminding}>
              {reminding ? 'Sending…' : 'Send reminder'}
            </Button>
            <Button color="secondary" onClick={() => setDetail(null)}>Close</Button>
          </ModalFooter>
        )}
      </Modal>
    </div>
  );
};

export default PaymentsList;
