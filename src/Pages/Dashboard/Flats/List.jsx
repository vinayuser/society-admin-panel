import React, { useState, useEffect, useCallback } from 'react';
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
  InputGroup,
  Row,
  Col,
  Badge,
  Pagination,
  PaginationItem,
  PaginationLink,
} from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';
import { toast } from 'react-toastify';

const STATUS_OPTIONS = ['active', 'vacant', 'under_maintenance'];
const FLAT_TYPES = ['1BHK', '2BHK', '3BHK', '4BHK', 'Villa', 'Other'];

const BULK_NUMBER_STYLES = [
  { value: 'floorLetter', label: 'Floor + letter (1A, 1B, 1C, 1D)', suffix: 'single letter' },
  { value: 'floorLetter2', label: 'Floor + two letters (1AA, 1AB, 1AC, 1AD)', suffix: 'two letters' },
  { value: 'floorNum', label: 'Numeric (101, 102, 103, 104)', suffix: 'floor×100 + flat' },
  { value: 'floorNumPad', label: 'Zero-padded (01-01, 01-02, 02-01)', suffix: 'floor-flat' },
  { value: 'floorDash', label: 'Floor-flat (1-1, 1-2, 1-3, 1-4)', suffix: 'floor-flat' },
];

function generateBulkFlats(options) {
  const { towersStr, floorFrom, floorTo, flatsPerFloor, numberStyle, groundLabel, capTotal } = options;
  const towerList = towersStr.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
  if (!towerList.length || floorFrom == null || floorTo == null || !flatsPerFloor) return [];

  const floorStart = parseInt(floorFrom, 10);
  const floorEnd = parseInt(floorTo, 10);
  const perFloor = Math.max(1, Math.min(50, parseInt(flatsPerFloor, 10) || 1));
  const cap = capTotal ? Math.max(1, parseInt(capTotal, 10)) : null;
  const flats = [];

  const fmtFloor = (f) => (f === 0 && groundLabel ? groundLabel : String(f));

  for (const tower of towerList) {
    for (let floor = floorStart; floor <= floorEnd; floor++) {
      const f = fmtFloor(floor);
      for (let i = 0; i < perFloor; i++) {
        let flatNumber;
        switch (numberStyle) {
          case 'floorLetter':
            flatNumber = f + String.fromCharCode(65 + (i % 26));
            break;
          case 'floorLetter2': {
            const a = Math.floor(i / 26);
            const b = i % 26;
            flatNumber = f + String.fromCharCode(65 + a) + String.fromCharCode(65 + b);
            break;
          }
          case 'floorNum':
            flatNumber = String(floor * 100 + (i + 1));
            break;
          case 'floorNumPad': {
            const fl = floor === 0 && groundLabel ? groundLabel : ((floor < 10 ? '0' : '') + floor);
            const fi = (i + 1 < 10 ? '0' : '') + (i + 1);
            flatNumber = `${fl}-${fi}`;
            break;
          }
          case 'floorDash':
          default:
            flatNumber = `${f}-${i + 1}`;
            break;
        }
        flats.push({ tower, flatNumber });
        if (cap && flats.length >= cap) return flats.slice(0, cap);
      }
    }
  }
  return cap ? flats.slice(0, cap) : flats;
}

const FlatsList = () => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [bulkModal, setBulkModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({
    tower: '',
    flatNumber: '',
    floor: '',
    flatType: '',
    areaSqft: '',
    ownershipType: '',
    ownerName: '',
    ownerContact: '',
    ownerEmail: '',
    status: 'active',
  });
  const [bulkText, setBulkText] = useState('');
  const [bulkMode, setBulkMode] = useState('advanced'); // 'advanced' | 'paste'
  const [bulkOptions, setBulkOptions] = useState({
    towersStr: 'A',
    floorFrom: 1,
    floorTo: 10,
    flatsPerFloor: 4,
    numberStyle: 'floorLetter',
    groundLabel: '',
    capTotal: '', // optional: e.g. 117 to match society total
  });
  const [bulkDefaults, setBulkDefaults] = useState({ flatType: '', areaSqft: '', status: 'vacant' });
  const [search, setSearch] = useState('');
  const [searchApplied, setSearchApplied] = useState(''); // server-side param: applied on Enter/Search click
  const [filterTower, setFilterTower] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFlatType, setFilterFlatType] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [towers, setTowers] = useState([]);

  const fetchTowers = useCallback(() => {
    axiosInstance.get(ENDPOINTS.FLATS.TOWERS).then((res) => {
      const t = res.data?.data ?? [];
      setTowers(Array.isArray(t) ? t : []);
    }).catch(() => setTowers([]));
  }, []);

  const fetchList = useCallback((page = 1, limit = pagination.limit) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchApplied.trim()) params.set('search', searchApplied.trim());
    if (filterTower.trim()) params.set('tower', filterTower.trim());
    if (filterStatus.trim()) params.set('status', filterStatus.trim());
    if (filterFlatType.trim()) params.set('flatType', filterFlatType.trim());
    params.set('page', String(page));
    params.set('limit', String(limit));
    axiosInstance
      .get(ENDPOINTS.FLATS.LIST + '?' + params.toString())
      .then((res) => {
        const d = res.data?.data ?? [];
        setList(Array.isArray(d) ? d : []);
        const p = res.data?.pagination ?? {};
        setPagination((prev) => ({ ...prev, page: p.page ?? page, limit: limit, total: p.total ?? 0 }));
      })
      .catch(() => {
        toast.error('Failed to load flats');
        setList([]);
      })
      .finally(() => setLoading(false));
  }, [searchApplied, filterTower, filterStatus, filterFlatType, pagination.limit]);

  useEffect(() => {
    fetchTowers();
  }, [fetchTowers]);

  useEffect(() => {
    fetchList(pagination.page, pagination.limit);
  }, [fetchList, pagination.page, pagination.limit]);

  const applySearch = () => {
    setSearchApplied(search.trim());
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const onFilterChange = (setter, value) => {
    setter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.tower.trim() || !form.flatNumber.trim()) {
      toast.error('Tower and flat number required');
      return;
    }
    setSubmitting(true);
    const payload = {
      tower: form.tower.trim(),
      flatNumber: form.flatNumber.trim(),
      floor: form.floor ? parseInt(form.floor, 10) : undefined,
      flatType: form.flatType || undefined,
      areaSqft: form.areaSqft ? parseFloat(form.areaSqft) : undefined,
      ownershipType: form.ownershipType || undefined,
      ownerName: form.ownerName || undefined,
      ownerContact: form.ownerContact || undefined,
      ownerEmail: form.ownerEmail || undefined,
      status: form.status || 'active',
    };
    axiosInstance
      .post(ENDPOINTS.FLATS.CREATE, payload)
      .then((res) => {
        if (res.data?.success) {
          toast.success('Flat added');
          setModal(false);
          setForm({ tower: '', flatNumber: '', floor: '', flatType: '', areaSqft: '', ownershipType: '', ownerName: '', ownerContact: '', ownerEmail: '', status: 'active' });
          fetchList(pagination.page);
        } else {
          toast.error(res.data?.message || 'Failed to add flat');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to add flat'))
      .finally(() => setSubmitting(false));
  };

  const handleBulkSubmit = (e) => {
    e.preventDefault();
    let flats = [];
    if (bulkMode === 'advanced') {
      flats = generateBulkFlats(bulkOptions);
      if (!flats.length) {
        toast.error('Set tower(s), floor range, and flats per floor');
        return;
      }
    } else {
      const lines = bulkText.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
      for (const line of lines) {
        const parts = line.split(/[-/\s]+/).map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          flats.push({ tower: parts[0], flatNumber: parts[1] });
        } else if (parts.length === 1 && line) {
          flats.push({ tower: 'A', flatNumber: parts[0] });
        }
      }
      if (!flats.length) {
        toast.error('Enter one flat per line, e.g. "A 101" or "Tower1-201"');
        return;
      }
    }
    setSubmitting(true);
    const defaults = {
      flatType: bulkDefaults.flatType || undefined,
      areaSqft: bulkDefaults.areaSqft ? parseFloat(bulkDefaults.areaSqft) : undefined,
      status: bulkDefaults.status || 'vacant',
    };
    axiosInstance
      .post(ENDPOINTS.FLATS.BULK, { flats, defaults })
      .then((res) => {
        if (res.data?.success) {
          const created = res.data?.data?.created ?? flats.length;
          toast.success(`${created} flat(s) added`);
          setBulkModal(false);
          setBulkText('');
          setPagination((p) => ({ ...p, page: 1 }));
          fetchTowers();
        } else {
          toast.error(res.data?.message || 'Bulk add failed');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Bulk add failed'))
      .finally(() => setSubmitting(false));
  };

  const previewFlats = bulkMode === 'advanced' ? generateBulkFlats(bulkOptions) : [];

  const handleDelete = (row) => {
    if (!window.confirm(`Delete flat ${row.tower} - ${row.flat_number}?`)) return;
    setDeletingId(row.id);
    axiosInstance
      .delete(ENDPOINTS.FLATS.DELETE(row.id))
      .then((res) => {
        if (res.data?.success) {
          toast.success('Flat deleted');
          fetchList(pagination.page);
        } else {
          toast.error(res.data?.message || 'Failed to delete');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to delete'))
      .finally(() => setDeletingId(null));
  };

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);
  const hasFilters = searchApplied || filterTower || filterStatus || filterFlatType;

  return (
    <div className="flats-list-page">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <h1 className="h4 mb-0 fw-semibold">Flats</h1>
        <div className="d-flex gap-2">
          <Button color="primary" onClick={() => setModal(true)}>Add Flat</Button>
          <Button color="secondary" outline onClick={() => setBulkModal(true)}>Bulk Add</Button>
        </div>
      </div>

      <Card className="shadow-sm border-0 rounded-3">
        <CardBody className="p-0">
          <div className="p-3 border-bottom bg-light">
            <Row className="g-2 align-items-end">
              <Col md={3}>
                <Label className="small text-muted mb-1 d-block">Search</Label>
                <InputGroup size="sm">
                  <Input
                    placeholder="Flat number, tower, owner…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                  />
                  <Button color="primary" onClick={applySearch}>Search</Button>
                </InputGroup>
              </Col>
              <Col md={2}>
                <Label className="small text-muted mb-1 d-block">Block / Tower</Label>
                <Input type="select" value={filterTower} onChange={(e) => onFilterChange(setFilterTower, e.target.value)} className="form-select form-select-sm">
                  <option value="">All</option>
                  {towers.map((t) => <option key={t} value={t}>{t}</option>)}
                </Input>
              </Col>
              <Col md={2}>
                <Label className="small text-muted mb-1 d-block">Status</Label>
                <Input type="select" value={filterStatus} onChange={(e) => onFilterChange(setFilterStatus, e.target.value)} className="form-select form-select-sm">
                  <option value="">All</option>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </Input>
              </Col>
              <Col md={2}>
                <Label className="small text-muted mb-1 d-block">Flat type</Label>
                <Input type="select" value={filterFlatType} onChange={(e) => onFilterChange(setFilterFlatType, e.target.value)} className="form-select form-select-sm">
                  <option value="">All</option>
                  {FLAT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Input>
              </Col>
              <Col md={2}>
                <Label className="small text-muted mb-1 d-block">Per page</Label>
                <Input type="select" value={pagination.limit} onChange={(e) => setPagination((p) => ({ ...p, limit: Number(e.target.value), page: 1 }))} className="form-select form-select-sm">
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </Input>
              </Col>
              {hasFilters && (
                <Col auto>
                  <Button color="light" size="sm" onClick={() => { setSearch(''); setSearchApplied(''); setFilterTower(''); setFilterStatus(''); setFilterFlatType(''); setPagination((p) => ({ ...p, page: 1 })); }}>Clear filters</Button>
                </Col>
              )}
            </Row>
          </div>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5"><Spinner color="primary" /></div>
          ) : (
            <>
              <div className="px-3 py-2 border-bottom small text-muted">
                Showing {pagination.total === 0 ? 0 : start}–{end} of {pagination.total} flat{pagination.total !== 1 ? 's' : ''}
              </div>
              <Table responsive hover className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Block / Tower</th>
                    <th>Flat number</th>
                    <th>Floor</th>
                    <th>Type</th>
                    <th>Owner</th>
                    <th>Status</th>
                    <th className="text-center">Members</th>
                    <th className="text-center">Vehicles</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center text-muted py-5">
                        {hasFilters ? 'No flats match the current filters.' : 'No flats yet. Add a flat or use Bulk Add.'}
                      </td>
                    </tr>
                  ) : (
                    list.map((row) => (
                      <tr key={row.id}>
                        <td>{row.tower || '—'}</td>
                        <td>{row.flatNumber ?? row.flat_number ?? '—'}</td>
                        <td>{row.floor != null ? row.floor : '—'}</td>
                        <td>{row.flatType || '—'}</td>
                        <td>{row.ownerName || '—'}</td>
                        <td>
                          <Badge color={row.status === 'active' ? 'success' : row.status === 'vacant' ? 'secondary' : 'warning'}>
                            {(row.status || 'active').replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="text-center">{row.membersCount ?? 0}</td>
                        <td className="text-center">{row.vehiclesCount ?? 0}</td>
                        <td className="text-end">
                          <Button size="sm" color="info" className="me-1" onClick={() => navigate(`/admin/dashboard/flats/${row.id}`)}>View</Button>
                          <Button size="sm" color="primary" outline className="me-1" onClick={() => navigate(`/admin/dashboard/flats/${row.id}?edit=1`)}>Edit</Button>
                          <Button size="sm" color="danger" outline onClick={() => handleDelete(row)} disabled={deletingId === row.id}>
                            {deletingId === row.id ? '…' : 'Delete'}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top flex-wrap gap-2">
                  <span className="small text-muted">Page {pagination.page} of {totalPages}</span>
                  <Pagination className="mb-0">
                    <PaginationItem disabled={pagination.page <= 1}>
                      <PaginationLink previous onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))} />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - pagination.page) <= 2)
                      .map((p, idx, arr) => (
                        <React.Fragment key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && <PaginationItem disabled><PaginationLink>…</PaginationLink></PaginationItem>}
                          <PaginationItem active={p === pagination.page}>
                            <PaginationLink onClick={() => setPagination((prev) => ({ ...prev, page: p }))}>{p}</PaginationLink>
                          </PaginationItem>
                        </React.Fragment>
                      ))}
                    <PaginationItem disabled={pagination.page >= totalPages}>
                      <PaginationLink next onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))} />
                    </PaginationItem>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={modal} toggle={() => !submitting && setModal(false)} size="lg">
        <ModalHeader toggle={() => !submitting && setModal(false)}>Add Flat</ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>Tower / Block *</Label>
                  <Input required value={form.tower} onChange={(e) => setForm((f) => ({ ...f, tower: e.target.value }))} placeholder="e.g. A or Tower 1" />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Flat Number *</Label>
                  <Input required value={form.flatNumber} onChange={(e) => setForm((f) => ({ ...f, flatNumber: e.target.value }))} placeholder="e.g. 101" />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <FormGroup>
                  <Label>Floor</Label>
                  <Input type="number" min={0} value={form.floor} onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))} placeholder="0" />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label>Flat type</Label>
                  <Input type="select" value={form.flatType} onChange={(e) => setForm((f) => ({ ...f, flatType: e.target.value }))}>
                    <option value="">—</option>
                    {FLAT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Input>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label>Area (sq ft)</Label>
                  <Input type="number" min={0} step={0.01} value={form.areaSqft} onChange={(e) => setForm((f) => ({ ...f, areaSqft: e.target.value }))} placeholder="—" />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>Owner name</Label>
                  <Input value={form.ownerName} onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))} placeholder="—" />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Owner contact</Label>
                  <Input value={form.ownerContact} onChange={(e) => setForm((f) => ({ ...f, ownerContact: e.target.value }))} placeholder="—" />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label>Owner email</Label>
                  <Input type="email" value={form.ownerEmail} onChange={(e) => setForm((f) => ({ ...f, ownerEmail: e.target.value }))} placeholder="—" />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label>Status</Label>
                  <Input type="select" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </Input>
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setModal(false)} disabled={submitting}>Cancel</Button>
            <Button color="primary" type="submit" disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</Button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal isOpen={bulkModal} toggle={() => !submitting && setBulkModal(false)} size="xl">
        <ModalHeader toggle={() => !submitting && setBulkModal(false)}>Bulk Add Flats</ModalHeader>
        <form onSubmit={handleBulkSubmit}>
          <ModalBody>
            <div className="d-flex gap-2 mb-3">
              <Button type="button" color={bulkMode === 'advanced' ? 'primary' : 'light'} size="sm" onClick={() => setBulkMode('advanced')}>
                Advanced generator
              </Button>
              <Button type="button" color={bulkMode === 'paste' ? 'primary' : 'light'} size="sm" onClick={() => setBulkMode('paste')}>
                Paste list
              </Button>
            </div>

            <div className="mb-3 p-2 rounded bg-light border">
              <Label className="small fw-medium text-muted">Default for all flats (property only)</Label>
              <Row className="g-2 mt-1">
                <Col xs={6} md={2}>
                  <FormGroup className="mb-0">
                    <Label className="small mb-0">Flat type</Label>
                    <Input type="select" size="sm" value={bulkDefaults.flatType} onChange={(e) => setBulkDefaults((d) => ({ ...d, flatType: e.target.value }))}>
                      <option value="">—</option>
                      {FLAT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
                <Col xs={6} md={2}>
                  <FormGroup className="mb-0">
                    <Label className="small mb-0">Area (sq ft)</Label>
                    <Input type="number" size="sm" min={0} step={0.01} value={bulkDefaults.areaSqft} onChange={(e) => setBulkDefaults((d) => ({ ...d, areaSqft: e.target.value }))} placeholder="—" />
                  </FormGroup>
                </Col>
                <Col xs={6} md={2}>
                  <FormGroup className="mb-0">
                    <Label className="small mb-0">Status</Label>
                    <Input type="select" size="sm" value={bulkDefaults.status} onChange={(e) => setBulkDefaults((d) => ({ ...d, status: e.target.value }))}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
              </Row>
            </div>

            {bulkMode === 'advanced' ? (
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label className="small fw-medium">Tower(s) / Block(s)</Label>
                    <Input
                      value={bulkOptions.towersStr}
                      onChange={(e) => setBulkOptions((o) => ({ ...o, towersStr: e.target.value }))}
                      placeholder="A or A, B, C or Tower 1, Tower 2"
                    />
                    <p className="text-muted small mb-0 mt-1">Comma-separated for multiple blocks. Same floor plan applied to each.</p>
                  </FormGroup>
                  <Row>
                    <Col xs={6}>
                      <FormGroup>
                        <Label className="small fw-medium">Floor from</Label>
                        <Input
                          type="number"
                          min={0}
                          value={bulkOptions.floorFrom}
                          onChange={(e) => setBulkOptions((o) => ({ ...o, floorFrom: e.target.value }))}
                        />
                        <p className="text-muted small mb-0">0 = ground</p>
                      </FormGroup>
                    </Col>
                    <Col xs={6}>
                      <FormGroup>
                        <Label className="small fw-medium">Floor to</Label>
                        <Input
                          type="number"
                          min={0}
                          value={bulkOptions.floorTo}
                          onChange={(e) => setBulkOptions((o) => ({ ...o, floorTo: e.target.value }))}
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <FormGroup>
                    <Label className="small fw-medium">Flats per floor</Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={bulkOptions.flatsPerFloor}
                      onChange={(e) => setBulkOptions((o) => ({ ...o, flatsPerFloor: e.target.value }))}
                      placeholder="e.g. 4 for 1A,1B,1C,1D"
                    />
                    <p className="text-muted small mb-0">e.g. 4 → 1A, 1B, 1C, 1D (or 1AA,1AB… depending on style)</p>
                  </FormGroup>
                  <FormGroup>
                    <Label className="small fw-medium">Ground floor label</Label>
                    <Input
                      value={bulkOptions.groundLabel}
                      onChange={(e) => setBulkOptions((o) => ({ ...o, groundLabel: e.target.value }))}
                      placeholder="Leave blank for 0, or use G"
                      maxLength={4}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label className="small fw-medium">Flat number style</Label>
                    <Input
                      type="select"
                      value={bulkOptions.numberStyle}
                      onChange={(e) => setBulkOptions((o) => ({ ...o, numberStyle: e.target.value }))}
                    >
                      {BULK_NUMBER_STYLES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </Input>
                  </FormGroup>
                  <FormGroup>
                    <Label className="small fw-medium">Cap total (optional)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={bulkOptions.capTotal}
                      onChange={(e) => setBulkOptions((o) => ({ ...o, capTotal: e.target.value }))}
                      placeholder="e.g. 117 to match society flat count"
                    />
                    <p className="text-muted small mb-0">If set, only this many flats are generated (first N). Leave blank for no limit.</p>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <Label className="small fw-medium">Preview ({previewFlats.length} flats)</Label>
                  <div className="border rounded p-2 bg-light" style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {previewFlats.length === 0 ? (
                      <p className="text-muted small mb-0">Set tower(s), floor range and flats per floor to see preview.</p>
                    ) : (
                      <div className="small font-monospace">
                        {previewFlats.slice(0, 100).map((f, i) => (
                          <div key={i}>{f.tower} – {f.flatNumber}</div>
                        ))}
                        {previewFlats.length > 100 && (
                          <div className="text-muted">… and {previewFlats.length - 100} more</div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-muted small mt-1 mb-0">
                    Total: {previewFlats.length} flat(s). Duplicates (same tower + flat number) will be skipped on add.
                  </p>
                </Col>
              </Row>
            ) : (
              <>
                <p className="text-muted small">One flat per line. Format: Tower FlatNumber (e.g. A 101, Tower1-201)</p>
                <Input type="textarea" rows={10} value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="A 101&#10;A 102&#10;B 201" />
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setBulkModal(false)} disabled={submitting}>Cancel</Button>
            <Button color="primary" type="submit" disabled={submitting || (bulkMode === 'advanced' && !previewFlats.length)}>
              {submitting ? 'Adding…' : bulkMode === 'advanced' ? `Add ${previewFlats.length} flats` : 'Add flats'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

export default FlatsList;
