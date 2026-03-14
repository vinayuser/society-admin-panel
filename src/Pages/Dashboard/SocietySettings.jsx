import React, { useState, useEffect } from 'react';
import { Card, CardBody, Spinner, FormGroup, Label, Input, Button } from 'reactstrap';
import axiosInstance from '../../config/axiosInstance';
import ENDPOINTS from '../../config/apiUrls';
import { toast } from 'react-toastify';

const SocietySettings = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    address: '',
    themeColor: '',
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
            themeColor: data.themeColor || '',
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
              themeColor: data.themeColor || '',
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner color="primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Society Settings</h1>
      </div>
      <Card>
        <CardBody>
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <p className="text-muted mb-0">
              Your society configuration (you can update branding and contact details here).
              Contact Super Admin to change billing or plan.
            </p>
            <Button color={editing ? 'secondary' : 'primary'} size="sm" onClick={() => setEditing((v) => !v)} disabled={saving}>
              {editing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
          <div className="row">
            <div className="col-md-6">
              <FormGroup>
                <Label className="text-muted small">Address</Label>
                {editing ? (
                  <Input
                    type="textarea"
                    rows={3}
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  />
                ) : (
                  <Input type="text" plaintext readOnly value={config?.address || '-'} className="border-0 bg-light rounded p-2" />
                )}
              </FormGroup>
            </div>
            <div className="col-md-6">
              <FormGroup>
                <Label className="text-muted small">Theme color</Label>
                <div className="d-flex align-items-center gap-2">
                  {config?.themeColor && !editing && (
                    <span className="rounded border p-2" style={{ width: 36, height: 36, backgroundColor: config.themeColor }} />
                  )}
                  {editing ? (
                    <Input
                      type="text"
                      placeholder="#0088cc"
                      value={form.themeColor}
                      onChange={(e) => setForm((f) => ({ ...f, themeColor: e.target.value }))}
                    />
                  ) : (
                    <Input type="text" plaintext readOnly value={config?.themeColor || '-'} className="border-0 bg-light rounded p-2 flex-grow-1" />
                  )}
                </div>
              </FormGroup>
            </div>
            <div className="col-md-6">
              <FormGroup>
                <Label className="text-muted small">Admin contact name</Label>
                {editing ? (
                  <Input
                    type="text"
                    value={form.adminContactName}
                    onChange={(e) => setForm((f) => ({ ...f, adminContactName: e.target.value }))}
                  />
                ) : (
                  <Input type="text" plaintext readOnly value={config?.adminContactName || '-'} className="border-0 bg-light rounded p-2" />
                )}
              </FormGroup>
            </div>
            <div className="col-md-6">
              <FormGroup>
                <Label className="text-muted small">Admin contact phone</Label>
                {editing ? (
                  <Input
                    type="text"
                    value={form.adminContactPhone}
                    onChange={(e) => setForm((f) => ({ ...f, adminContactPhone: e.target.value }))}
                  />
                ) : (
                  <Input type="text" plaintext readOnly value={config?.adminContactPhone || '-'} className="border-0 bg-light rounded p-2" />
                )}
              </FormGroup>
            </div>
            <div className="col-md-6">
              <FormGroup>
                <Label className="text-muted small">Total flats (config)</Label>
                {editing ? (
                  <Input
                    type="number"
                    min={0}
                    value={form.totalFlats}
                    onChange={(e) => setForm((f) => ({ ...f, totalFlats: e.target.value }))}
                  />
                ) : (
                  <Input type="text" plaintext readOnly value={config?.totalFlats ?? '-'} className="border-0 bg-light rounded p-2" />
                )}
              </FormGroup>
            </div>
            <div className="col-md-6">
              <FormGroup>
                <Label className="text-muted small">Towers / blocks</Label>
                {editing ? (
                  <Input
                    type="text"
                    placeholder="A, B, C"
                    value={form.towersBlocks}
                    onChange={(e) => setForm((f) => ({ ...f, towersBlocks: e.target.value }))}
                  />
                ) : (
                  <Input
                    type="text"
                    plaintext
                    readOnly
                    value={Array.isArray(config?.towersBlocks) ? config.towersBlocks.join(', ') : (config?.towersBlocks || '-')}
                    className="border-0 bg-light rounded p-2"
                  />
                )}
              </FormGroup>
            </div>
            {config?.logo && (
              <div className="col-12">
                <FormGroup>
                  <Label className="text-muted small">Logo</Label>
                  {editing ? (
                    <Input
                      type="text"
                      placeholder="Logo URL"
                      value={form.logo}
                      onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
                    />
                  ) : (
                    <div><img src={config.logo} alt="Society logo" style={{ maxHeight: 60 }} /></div>
                  )}
                </FormGroup>
              </div>
            )}
            {config?.bannerImage && (
              <div className="col-12">
                <FormGroup>
                  <Label className="text-muted small">Banner</Label>
                  {editing ? (
                    <Input
                      type="text"
                      placeholder="Banner URL"
                      value={form.bannerImage}
                      onChange={(e) => setForm((f) => ({ ...f, bannerImage: e.target.value }))}
                    />
                  ) : (
                    <div><img src={config.bannerImage} alt="Banner" style={{ maxHeight: 120 }} className="rounded" /></div>
                  )}
                </FormGroup>
              </div>
            )}
            {editing && (
              <div className="col-12 mt-3">
                <Button color="primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default SocietySettings;
