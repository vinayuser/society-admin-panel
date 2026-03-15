import React, { useState, useEffect } from 'react';
import { Card, CardBody, Spinner, FormGroup, Label, Input, Button, Row, Col } from 'reactstrap';
import axiosInstance from '../../config/axiosInstance';
import ENDPOINTS from '../../config/apiUrls';
import { toast } from 'react-toastify';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const SocietySettings = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    address: '',
    themeColor: '#1a237e',
    adminContactName: '',
    adminContactPhone: '',
    totalFlats: '',
    towersBlocks: '',
    logo: '',
    bannerImage: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axiosInstance
      .get(ENDPOINTS.SOCIETIES.MY_CONFIG)
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          const data = res.data.data;
          setConfig(data);
          setForm({
            address: data.address || '',
            themeColor: data.themeColor || '#1a237e',
            adminContactName: data.adminContactName || '',
            adminContactPhone: data.adminContactPhone || '',
            totalFlats: data.totalFlats ?? '',
            towersBlocks: Array.isArray(data.towersBlocks) ? data.towersBlocks.join(', ') : (data.towersBlocks || ''),
            logo: data.logo || '',
            bannerImage: data.bannerImage || '',
          });
        } else {
          setConfig({});
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to load society settings');
        setConfig({});
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      address: form.address || null,
      themeColor: form.themeColor || null,
      adminContactName: form.adminContactName || null,
      adminContactPhone: form.adminContactPhone || null,
      totalFlats: form.totalFlats === '' ? null : Number(form.totalFlats) || 0,
      towersBlocks: form.towersBlocks
        ? form.towersBlocks.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      logo: form.logo || null,
      bannerImage: form.bannerImage || null,
    };
    axiosInstance
      .patch(ENDPOINTS.SOCIETIES.UPDATE_CONFIG, payload)
      .then((res) => {
        if (res.data?.success) {
          toast.success('Society settings updated');
          setEditing(false);
          setLoading(true);
          return axiosInstance.get(ENDPOINTS.SOCIETIES.MY_CONFIG).then((r) => {
            const data = r.data?.data || {};
            setConfig(data);
            setForm({
              address: data.address || '',
              themeColor: data.themeColor || '#1a237e',
              adminContactName: data.adminContactName || '',
              adminContactPhone: data.adminContactPhone || '',
              totalFlats: data.totalFlats ?? '',
              towersBlocks: Array.isArray(data.towersBlocks) ? data.towersBlocks.join(', ') : (data.towersBlocks || ''),
              logo: data.logo || '',
              bannerImage: data.bannerImage || '',
            });
          });
        }
        toast.error(res.data?.message || 'Failed to update settings');
        return null;
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to update settings');
      })
      .finally(() => {
        setSaving(false);
        setLoading(false);
      });
  };

  const logoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner color="primary" style={{ width: '2.5rem', height: '2.5rem' }} />
      </div>
    );
  }

  return (
    <div className="society-settings-page">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-2 mb-4">
        <div>
          <h1 className="h4 mb-1 fw-semibold">Society</h1>
          <p className="text-muted small mb-0">Update your society profile, contact details and branding. Billing and plan changes are done by the platform admin.</p>
        </div>
        <Button color={editing ? 'secondary' : 'primary'} onClick={() => setEditing((v) => !v)} disabled={saving}>
          {editing ? 'Cancel' : 'Edit settings'}
        </Button>
      </div>

      <form onSubmit={handleSave}>
        {/* Branding */}
        <Card className="mb-4 shadow-sm border-0 rounded-3">
          <CardBody className="p-4">
            <h6 className="text-uppercase text-muted small fw-semibold mb-3">Branding</h6>
            <Row className="g-3">
              <Col md={12} lg={4}>
                <FormGroup className="mb-0">
                  <Label className="small fw-medium">Logo</Label>
                  {editing ? (
                    <Input
                      type="text"
                      placeholder="Logo image URL"
                      value={form.logo}
                      onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-2 p-3 bg-light rounded text-center" style={{ minHeight: 80 }}>
                      {config?.logo ? (
                        <img src={logoUrl(config.logo)} alt="Society logo" style={{ maxHeight: 56, width: 'auto' }} onError={(e) => { e.target.style.display = 'none'; }} />
                      ) : (
                        <span className="text-muted small">No logo set</span>
                      )}
                    </div>
                  )}
                </FormGroup>
              </Col>
              <Col md={12} lg={4}>
                <FormGroup className="mb-0">
                  <Label className="small fw-medium">Theme colour</Label>
                  {editing ? (
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <Input
                        type="color"
                        value={form.themeColor || '#1a237e'}
                        onChange={(e) => setForm((f) => ({ ...f, themeColor: e.target.value }))}
                        style={{ width: 44, height: 38, padding: 2, cursor: 'pointer' }}
                      />
                      <Input
                        type="text"
                        value={form.themeColor || ''}
                        onChange={(e) => setForm((f) => ({ ...f, themeColor: e.target.value }))}
                        placeholder="#1a237e"
                        className="flex-grow-1"
                      />
                    </div>
                  ) : (
                    <div className="d-flex align-items-center gap-2 mt-2">
                      <span className="rounded border" style={{ width: 28, height: 28, backgroundColor: config?.themeColor || '#1a237e' }} />
                      <span className="text-muted small">{config?.themeColor || '—'}</span>
                    </div>
                  )}
                </FormGroup>
              </Col>
              <Col md={12} lg={4}>
                <FormGroup className="mb-0">
                  <Label className="small fw-medium">Banner image</Label>
                  {editing ? (
                    <Input
                      type="text"
                      placeholder="Banner image URL"
                      value={form.bannerImage}
                      onChange={(e) => setForm((f) => ({ ...f, bannerImage: e.target.value }))}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-2 p-2 bg-light rounded text-center" style={{ minHeight: 60 }}>
                      {config?.bannerImage ? (
                        <img src={logoUrl(config.bannerImage)} alt="Banner" style={{ maxHeight: 52, width: '100%', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                      ) : (
                        <span className="text-muted small">No banner</span>
                      )}
                    </div>
                  )}
                </FormGroup>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {/* Contact & property */}
        <Card className="mb-4 shadow-sm border-0 rounded-3">
          <CardBody className="p-4">
            <h6 className="text-uppercase text-muted small fw-semibold mb-3">Contact & property</h6>
            <Row className="g-3">
              <Col md={6}>
                <FormGroup>
                  <Label className="small fw-medium">Admin contact name</Label>
                  {editing ? (
                    <Input value={form.adminContactName} onChange={(e) => setForm((f) => ({ ...f, adminContactName: e.target.value }))} placeholder="e.g. John Doe" />
                  ) : (
                    <div className="py-2 text-break">{config?.adminContactName || '—'}</div>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="small fw-medium">Admin contact phone</Label>
                  {editing ? (
                    <Input value={form.adminContactPhone} onChange={(e) => setForm((f) => ({ ...f, adminContactPhone: e.target.value }))} placeholder="e.g. +91 98765 43210" />
                  ) : (
                    <div className="py-2 text-break">{config?.adminContactPhone || '—'}</div>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="small fw-medium">Total flats</Label>
                  {editing ? (
                    <Input type="number" min={0} value={form.totalFlats} onChange={(e) => setForm((f) => ({ ...f, totalFlats: e.target.value }))} placeholder="0" />
                  ) : (
                    <div className="py-2">{config?.totalFlats ?? '—'}</div>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="small fw-medium">Towers / blocks</Label>
                  {editing ? (
                    <Input value={form.towersBlocks} onChange={(e) => setForm((f) => ({ ...f, towersBlocks: e.target.value }))} placeholder="A, B, C" />
                  ) : (
                    <div className="py-2 text-break">{Array.isArray(config?.towersBlocks) ? config.towersBlocks.join(', ') : (config?.towersBlocks || '—')}</div>
                  )}
                </FormGroup>
              </Col>
              <Col xs={12}>
                <FormGroup>
                  <Label className="small fw-medium">Society address</Label>
                  {editing ? (
                    <Input type="textarea" rows={2} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Full address" />
                  ) : (
                    <div className="py-2 text-break">{config?.address || '—'}</div>
                  )}
                </FormGroup>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {editing && (
          <div className="d-flex justify-content-end gap-2">
            <Button type="button" color="secondary" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" color="primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default SocietySettings;
