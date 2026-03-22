import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardBody,
  Table,
  Spinner,
  Badge,
  Label,
  Input,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
  Pagination,
  PaginationItem,
  PaginationLink,
} from 'reactstrap';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
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

const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function absMediaUrl(u) {
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  return `${API_ORIGIN}${u.startsWith('/') ? u : `/${u}`}`;
}

/** Video in <video>; image URLs in <img> (handles wrong API type or .mp4 saved as banner). */
function looksLikeVideoUrl(u) {
  if (!u || typeof u !== 'string') return false;
  const path = u.split(/[?#]/)[0].toLowerCase();
  return /\.(mp4|webm|ogg|ogv|mov)(\?|#|$)/i.test(path);
}

function isVideoContent({ type, contentUrl, file }) {
  if (file && file.type && file.type.startsWith('video/')) return true;
  if (String(type || '').toLowerCase() === 'video') return true;
  return looksLikeVideoUrl(contentUrl);
}

/** Display: "Video" | "Image" for table and preview. */
function mediaKindLabel(row) {
  return isVideoContent({ type: row.type, contentUrl: row.contentUrl }) ? 'Video' : 'Image';
}

function toInputDate(d) {
  if (!d) return '';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return String(d).slice(0, 10);
  return x.toISOString().slice(0, 10);
}

const emptyForm = {
  title: '',
  type: 'banner',
  contentUrl: '',
  startDate: '',
  endDate: '',
  isActive: true,
};

const AdsList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [listRefresh, setListRefresh] = useState(0);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const previewBlobUrlRef = useRef(null);
  previewBlobUrlRef.current = previewBlobUrl;

  const fetchList = useCallback(() => {
    const { page, limit } = pagination;
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    axiosInstance
      .get(`${ENDPOINTS.ADS.LIST}?${params.toString()}`)
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
        toast.error('Failed to load advertisements');
        setList([]);
      })
      .finally(() => setLoading(false));
  }, [pagination.page, pagination.limit, listRefresh]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => () => {
    const u = previewBlobUrlRef.current;
    if (u) URL.revokeObjectURL(u);
  }, []);

  const limitNum = Math.max(1, Number(pagination.limit) || 20);
  const totalNum = Number(pagination.total) || 0;
  const totalPages = Math.max(1, Math.ceil(totalNum / limitNum));
  const start = totalNum === 0 ? 0 : (pagination.page - 1) * limitNum + 1;
  const end = Math.min(pagination.page * limitNum, totalNum);

  const displaySrc = previewBlobUrl || absMediaUrl(form.contentUrl);
  const showModalPreview = !!(previewBlobUrl || (form.contentUrl && String(form.contentUrl).trim()));
  const modalPreviewIsVideo = isVideoContent({
    type: form.type,
    contentUrl: form.contentUrl,
    file: pendingFile,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setPendingFile(null);
    setPreviewBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      title: row.title || '',
      type: row.type || 'banner',
      contentUrl: row.contentUrl || '',
      startDate: toInputDate(row.startDate),
      endDate: toInputDate(row.endDate),
      isActive: !!row.isActive,
    });
    setPendingFile(null);
    setPreviewBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModal(false);
    setPendingFile(null);
    setPreviewBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const handlePickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPreviewBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setPendingFile(file);
  };

  const clearPendingFile = () => {
    setPendingFile(null);
    setPreviewBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) {
      toast.error('Start and end dates are required');
      return;
    }
    const hasNewFile = pendingFile instanceof File;
    if (!hasNewFile && !form.contentUrl?.trim()) {
      toast.error('Choose a file to upload or enter a media URL');
      return;
    }

    setSubmitting(true);

    const appendCommonFields = (fd) => {
      fd.append('type', form.type);
      if (form.title?.trim()) fd.append('title', form.title.trim());
      fd.append('startDate', form.startDate);
      fd.append('endDate', form.endDate);
      fd.append('isActive', form.isActive ? 'true' : 'false');
    };

    if (editing) {
      if (hasNewFile) {
        const fd = new FormData();
        appendCommonFields(fd);
        fd.append('file', pendingFile);
        axiosInstance
          .patch(ENDPOINTS.ADS.UPDATE(editing.id), fd)
          .then((res) => {
            if (res.data?.success) {
              toast.success('Advertisement updated');
              closeModal();
              setListRefresh((n) => n + 1);
            } else toast.error(res.data?.message || 'Update failed');
          })
          .catch((err) => toast.error(err.response?.data?.message || 'Update failed'))
          .finally(() => setSubmitting(false));
        return;
      }
      const payload = {
        type: form.type,
        contentUrl: form.contentUrl.trim(),
        title: form.title?.trim() || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        isActive: form.isActive,
      };
      axiosInstance
        .patch(ENDPOINTS.ADS.UPDATE(editing.id), payload)
        .then((res) => {
          if (res.data?.success) {
            toast.success('Advertisement updated');
            closeModal();
            setListRefresh((n) => n + 1);
          } else toast.error(res.data?.message || 'Update failed');
        })
        .catch((err) => toast.error(err.response?.data?.message || 'Update failed'))
        .finally(() => setSubmitting(false));
      return;
    }

    if (hasNewFile) {
      const fd = new FormData();
      appendCommonFields(fd);
      fd.append('file', pendingFile);
      axiosInstance
        .post(ENDPOINTS.ADS.CREATE, fd)
        .then((res) => {
          if (res.data?.success) {
            toast.success('Advertisement created');
            closeModal();
            setPagination((p) => ({ ...p, page: 1 }));
            setListRefresh((n) => n + 1);
          } else toast.error(res.data?.message || 'Create failed');
        })
        .catch((err) => toast.error(err.response?.data?.message || 'Create failed'))
        .finally(() => setSubmitting(false));
      return;
    }

    axiosInstance
      .post(ENDPOINTS.ADS.CREATE, {
        type: form.type,
        contentUrl: form.contentUrl.trim(),
        title: form.title?.trim() || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        isActive: form.isActive,
      })
      .then((res) => {
        if (res.data?.success) {
          toast.success('Advertisement created');
          closeModal();
          setPagination((p) => ({ ...p, page: 1 }));
          setListRefresh((n) => n + 1);
        } else toast.error(res.data?.message || 'Create failed');
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Create failed'))
      .finally(() => setSubmitting(false));
  };

  const handleDelete = (row) => {
    if (!window.confirm(`Delete advertisement “${row.title || row.id}”?`)) return;
    setDeletingId(row.id);
    axiosInstance
      .delete(ENDPOINTS.ADS.DELETE(row.id))
      .then((res) => {
        if (res.data?.success) {
          toast.success('Deleted');
          setListRefresh((n) => n + 1);
        } else toast.error(res.data?.message || 'Delete failed');
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Delete failed'))
      .finally(() => setDeletingId(null));
  };

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap">
        <div>
          <h1 className="mb-0">Advertisements</h1>
          <p className="text-muted small mb-0 mt-1">Platform-wide creatives: all members see the same active ads in the app. Upload runs when you save.</p>
        </div>
        <Button color="primary" className="d-inline-flex align-items-center gap-1" onClick={openCreate}>
          <AddIcon fontSize="small" /> Add advertisement
        </Button>
      </div>
      <Card className="table-card">
        <CardBody className="p-0">
          <div className="px-3 py-2 border-bottom d-flex flex-nowrap justify-content-between align-items-center gap-2 overflow-x-auto">
            <div className="small text-muted text-nowrap flex-shrink-0">
              {loading ? 'Loading…' : (
                <>Showing {totalNum === 0 ? 0 : start}–{end} of {totalNum} {totalNum !== 1 ? 'ads' : 'ad'}</>
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
                      <th style={{ width: 100 }}>Preview</th>
                      <th>Title</th>
                      <th style={{ minWidth: 120 }}>Media</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted py-5">No advertisements yet.</td>
                      </tr>
                    ) : (
                      list.map((row) => {
                        const src = absMediaUrl(row.contentUrl);
                        const rowIsVideo = isVideoContent({ type: row.type, contentUrl: row.contentUrl });
                        return (
                          <tr key={row.id}>
                            <td className="p-1">
                              {rowIsVideo ? (
                                <video src={src} muted playsInline className="rounded" style={{ width: 88, height: 56, objectFit: 'cover', background: '#111' }} />
                              ) : (
                                <img src={src} alt="" className="rounded" style={{ width: 88, height: 56, objectFit: 'cover', background: '#eee' }} onError={(e) => { e.target.style.display = 'none'; }} />
                              )}
                            </td>
                            <td className="fw-medium">{row.title || '–'}</td>
                            <td>
                              <Badge color={rowIsVideo ? 'dark' : 'info'} pill className="me-0">
                                {mediaKindLabel(row)}
                              </Badge>
                              <div className="small text-muted text-capitalize mt-1" title="Campaign style (banner / promotion / video)">
                                {row.type || '–'}
                              </div>
                            </td>
                            <td className="text-nowrap small">{row.startDate ? new Date(row.startDate).toLocaleDateString() : '–'}</td>
                            <td className="text-nowrap small">{row.endDate ? new Date(row.endDate).toLocaleDateString() : '–'}</td>
                            <td>
                              <Badge color={row.isActive ? 'success' : 'secondary'}>{row.isActive ? 'Active' : 'Inactive'}</Badge>
                            </td>
                            <td className="text-end text-nowrap">
                              <div className="d-inline-flex flex-nowrap gap-1">
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm p-1 lh-1"
                                  title="Edit"
                                  aria-label="Edit"
                                  onClick={() => openEdit(row)}
                                >
                                  <EditOutlinedIcon fontSize="small" />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm p-1 lh-1"
                                  title="Delete"
                                  aria-label="Delete"
                                  disabled={deletingId === row.id}
                                  onClick={() => handleDelete(row)}
                                >
                                  {deletingId === row.id ? '…' : <DeleteOutlineIcon fontSize="small" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
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

      <Modal isOpen={modal} toggle={closeModal} size="lg">
        <ModalHeader toggle={closeModal}>
          {editing ? 'Edit advertisement' : 'New advertisement'}
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            {showModalPreview && (
              <div className="mb-3 p-2 border rounded bg-light text-center">
                <div className="d-flex align-items-center justify-content-center gap-2 mb-2 flex-wrap">
                  <span className="small text-muted mb-0">Preview</span>
                  <Badge color={modalPreviewIsVideo ? 'dark' : 'info'} pill>
                    {modalPreviewIsVideo ? 'Video' : 'Image'}
                  </Badge>
                </div>
                {modalPreviewIsVideo ? (
                  <video
                    key={displaySrc}
                    src={displaySrc}
                    muted
                    playsInline
                    controls
                    className="rounded mx-auto d-block"
                    style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain', background: '#111' }}
                  />
                ) : (
                  <img
                    key={displaySrc}
                    src={displaySrc}
                    alt=""
                    className="rounded mx-auto d-block"
                    style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
              </div>
            )}
            <FormGroup>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Optional headline" />
            </FormGroup>
            <FormGroup>
              <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                <Label className="mb-0">Campaign style *</Label>
                <Badge color={modalPreviewIsVideo ? 'dark' : 'info'} pill>
                  {modalPreviewIsVideo ? 'Video' : 'Image'}
                </Badge>
              </div>
              <Input type="select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="banner">Banner (image)</option>
                <option value="video">Video</option>
                <option value="promotion">Promotion (image)</option>
              </Input>
              <small className="text-muted d-block mt-1">Badge shows how the creative plays (video vs image). Campaign style is the ad category stored with the row.</small>
            </FormGroup>
            <FormGroup>
              <Label>Media file</Label>
              <Input type="file" accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm" onChange={handlePickFile} />
              {pendingFile && (
                <div className="mt-1 small text-muted">
                  Selected: {pendingFile.name}
                  {' '}
                  <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={clearPendingFile}>Clear</button>
                </div>
              )}
              <small className="text-muted d-block mt-1">File is uploaded when you click {editing ? 'Update' : 'Create'} (max ~15MB).</small>
            </FormGroup>
            <FormGroup>
              <Label>Or media URL {!pendingFile && '*'}</Label>
              <Input
                value={form.contentUrl}
                onChange={(e) => setForm((f) => ({ ...f, contentUrl: e.target.value }))}
                placeholder="/uploads/ads/… or https://…"
                className="font-monospace small"
                disabled={!!pendingFile}
              />
            </FormGroup>
            <div className="row g-2">
              <FormGroup className="col-md-6">
                <Label>Start date *</Label>
                <Input type="date" required value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              </FormGroup>
              <FormGroup className="col-md-6">
                <Label>End date *</Label>
                <Input type="date" required value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
              </FormGroup>
            </div>
            <FormGroup check className="mb-0">
              <Input
                type="checkbox"
                id="adActive"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              <Label check for="adActive">Active (inactive ads never show in the member app)</Label>
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" type="button" onClick={closeModal} disabled={submitting}>Cancel</Button>
            <Button color="primary" type="submit" disabled={submitting}>{submitting ? 'Saving…' : editing ? 'Update' : 'Create'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

export default AdsList;
