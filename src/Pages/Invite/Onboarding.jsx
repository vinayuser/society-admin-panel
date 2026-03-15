import React, { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardBody, Button, FormGroup, Label, Input, Spinner } from 'reactstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = API_URL.replace(/\/$/, '');

function logoPreviewUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url.startsWith('/') ? url : '/' + url}`;
}

const Onboarding = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const step = searchParams.get('step');
  const isSetupFeeStep = step === 'setup_fee';
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    themeColor: '#1a237e',
    logo: '',
    bannerImage: '',
    adminContactName: '',
    adminContactPhone: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentStep, setPaymentStep] = useState(null);
  const [paying, setPaying] = useState(false);
  const logoInputRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid link');
      setLoading(false);
      return;
    }
    axios
      .get(`${API_URL}/society-invites/${token}`)
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setInvite(res.data.data);
        } else {
          setError('Invitation not found');
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Invitation not found or expired');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const onboardingUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Please choose an image (JPEG, PNG, GIF or WebP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2 MB.');
      return;
    }
    setUploadingLogo(true);
    const fd = new FormData();
    fd.append('logo', file);
    axios
      .post(`${API_URL}/society-invites/${token}/upload-logo`, fd)
      .then((res) => {
        if (res.data?.success && res.data?.data?.logoUrl) {
          setForm((f) => ({ ...f, logo: res.data.data.logoUrl }));
          toast.success('Logo uploaded');
        } else {
          toast.error('Upload failed');
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Logo upload failed');
      })
      .finally(() => {
        setUploadingLogo(false);
        if (logoInputRef.current) logoInputRef.current.value = '';
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      address: invite?.address || undefined,
      themeColor: form.themeColor || undefined,
      logo: form.logo || undefined,
      bannerImage: form.bannerImage || undefined,
      totalFlats: invite?.flatCount != null ? invite.flatCount : undefined,
      adminContactName: form.adminContactName || undefined,
      adminContactPhone: form.adminContactPhone || undefined,
      adminEmail: form.adminEmail || undefined,
      adminPassword: form.adminPassword || undefined,
    };
    axios
      .post(`${API_URL}/society-invites/${token}/accept`, payload)
      .then((res) => {
        if (res.data?.success) {
          const data = res.data.data || {};
          const billingIds = data.billingIds && data.billingIds.length > 0
            ? data.billingIds
            : (data.billingId ? [data.billingId] : []);
          const totalAmount = data.totalAmount ?? data.setupAmount ?? 0;
          if (billingIds.length > 0 && totalAmount > 0) {
            setPaymentStep({
              billingIds,
              pendingBilling: data.pendingBilling || [{ amount: totalAmount, label: 'Payment' }],
              totalAmount,
            });
            toast.success('Details saved. Pay the amount below to continue.');
          } else {
            toast.success('Onboarding completed. You can now sign in.');
            window.location.href = '/auth/login';
          }
        } else {
          toast.error(res.data?.message || 'Failed to complete');
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to complete'))
      .finally(() => setSubmitting(false));
  };

  const handlePayWithRazorpay = () => {
    const ids = paymentStep?.billingIds?.length ? paymentStep.billingIds : (paymentStep?.billingId ? [paymentStep.billingId] : null);
    if (!ids?.length || !token) return;
    setPaying(true);
    axios
      .post(`${API_URL}/society-invites/${token}/create-setup-order`, { billingIds: ids })
      .then((res) => {
        if (!res.data?.success || !res.data?.data?.orderId || !res.data?.data?.keyId) {
          toast.error(res.data?.message || 'Could not create payment');
          setPaying(false);
          return;
        }
        const { orderId, keyId } = res.data.data;
        if (typeof window.Razorpay === 'undefined') {
          toast.error('Payment script not loaded. Please refresh and try again.');
          setPaying(false);
          return;
        }
        const options = {
          key: keyId,
          amount: res.data.data.amount,
          currency: 'INR',
          name: invite?.societyName || 'Society',
          description: 'Setup fee',
          order_id: orderId,
          handler: function (response) {
            axios
              .post(`${API_URL}/society-invites/${token}/verify-payment`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
              })
              .then((ver) => {
                if (ver.data?.success) {
                  toast.success('Payment successful. You can sign in now.');
                  window.location.href = '/auth/login';
                } else {
                  toast.error(ver.data?.message || 'Payment verification failed');
                  setPaying(false);
                }
              })
              .catch(() => {
                toast.error('Payment verification failed');
                setPaying(false);
              });
          },
          prefill: { email: form.adminEmail || invite?.email },
          theme: { color: '#1a237e' },
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', () => {
          toast.error('Payment failed or cancelled');
          setPaying(false);
        });
        rzp.open();
        setPaying(false);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Could not start payment');
        setPaying(false);
      });
  };

  useEffect(() => {
    const needScript = paymentStep || (invite && isSetupFeeStep && invite.setupFee > 0 && !invite.setupFeePaid);
    if (!needScript) return;
    if (typeof window.Razorpay !== 'undefined') return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { try { document.body.removeChild(script); } catch (_) {} };
  }, [paymentStep, invite, isSetupFeeStep]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
        <Spinner color="primary" style={{ width: '2.5rem', height: '2.5rem' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center p-4 bg-light">
        <Card className="shadow-sm border-0" style={{ maxWidth: 380 }}>
          <CardBody className="p-4 text-center">
            <p className="text-danger mb-0">{error}</p>
            <Button color="primary" className="mt-3" href="/auth/login">Go to login</Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Link 1: Setup fee only (one-time). After pay, show success and link to Link 2.
  if (invite && isSetupFeeStep) {
    if (invite.setupFeePaid) {
      return (
        <div className="min-vh-100 bg-light py-5">
          <div className="container" style={{ maxWidth: 480 }}>
            <Card className="shadow-sm border-0">
              <CardBody className="p-4 text-center">
                <h5 className="mb-2 fw-semibold">Setup fee already paid</h5>
                <p className="text-muted small mb-3">{invite.societyName}</p>
                <Button color="primary" href={invite.linkOnboarding || `/invite/${token}`}>Continue to onboarding</Button>
              </CardBody>
            </Card>
          </div>
        </div>
      );
    }
    if (invite.setupFee <= 0) {
      window.location.href = invite.linkOnboarding || `/invite/${token}`;
      return (
        <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
          <Spinner color="primary" />
        </div>
      );
    }
    const handlePaySetupFee = () => {
      setPaying(true);
      axios
        .post(`${API_URL}/society-invites/${token}/create-setup-fee-order`)
        .then((res) => {
          if (!res.data?.success || !res.data?.data?.orderId || !res.data?.data?.keyId) {
            toast.error(res.data?.message || 'Could not create payment');
            setPaying(false);
            return;
          }
          const { orderId, keyId } = res.data.data;
          if (typeof window.Razorpay === 'undefined') {
            toast.error('Payment script not loaded. Please refresh and try again.');
            setPaying(false);
            return;
          }
          const options = {
            key: keyId,
            amount: res.data.data.amount,
            currency: 'INR',
            name: invite.societyName || 'Society',
            description: 'One-time setup fee',
            order_id: orderId,
            handler: function (response) {
              axios
                .post(`${API_URL}/society-invites/${token}/verify-payment`, {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                })
                .then((ver) => {
                  if (ver.data?.success) {
                    toast.success(ver.data?.data?.message || 'Setup fee paid.');
                    setInvite((prev) => (prev ? { ...prev, setupFeePaid: true } : prev));
                  } else {
                    toast.error(ver.data?.message || 'Verification failed');
                    setPaying(false);
                  }
                })
                .catch(() => {
                  toast.error('Payment verification failed');
                  setPaying(false);
                });
            },
            prefill: { email: invite?.email },
            theme: { color: '#1a237e' },
          };
          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', () => {
            toast.error('Payment failed or cancelled');
            setPaying(false);
          });
          rzp.open();
          setPaying(false);
        })
        .catch((err) => {
          toast.error(err.response?.data?.message || 'Could not start payment');
          setPaying(false);
        });
    };
    return (
      <div className="min-vh-100 bg-light py-5">
        <div className="container" style={{ maxWidth: 480 }}>
          <Card className="shadow-sm border-0">
            <CardBody className="p-4 text-center">
              <h5 className="mb-2 fw-semibold">Pay setup fee (one-time)</h5>
              <p className="text-muted small mb-3">{invite.societyName}</p>
              <p className="h4 mb-4">₹{Number(invite.setupFee || 0).toLocaleString()}</p>
              <Button color="primary" size="lg" className="w-100 mb-2" onClick={handlePaySetupFee} disabled={paying}>
                {paying ? 'Opening…' : 'Pay with Razorpay'}
              </Button>
              <p className="small text-muted mb-0">
                <a href={invite.linkOnboarding || `/invite/${token}`} className="text-muted">Skip to onboarding</a>
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  if (paymentStep) {
    const total = paymentStep.totalAmount ?? paymentStep.setupAmount ?? 0;
    return (
      <div className="min-vh-100 bg-light py-5">
        <div className="container" style={{ maxWidth: 480 }}>
          <Card className="shadow-sm border-0">
            <CardBody className="p-4 text-center">
              <h5 className="mb-2 fw-semibold">Complete payment</h5>
              <p className="text-muted small mb-3">{invite?.societyName}</p>
              {paymentStep.pendingBilling?.length > 0 ? (
                <div className="text-start small mb-3">
                  {paymentStep.pendingBilling.map((item, i) => (
                    <div key={i} className="d-flex justify-content-between"><span>{item.label}</span><span>₹{Number(item.amount).toLocaleString()}</span></div>
                  ))}
                </div>
              ) : null}
              <p className="h4 mb-4">₹{Number(total).toLocaleString()}</p>
              <Button color="primary" size="lg" className="w-100 mb-2" onClick={handlePayWithRazorpay} disabled={paying}>
                {paying ? 'Opening…' : 'Pay with Razorpay'}
              </Button>
              <p className="small text-muted mb-0">
                <a href="/auth/login" className="text-muted">I'll pay later</a>
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light py-5">
      <div className="container" style={{ maxWidth: 720 }}>
        <Card className="shadow-sm border-0">
          <CardBody className="p-0">
            {/* Header */}
            <div className="px-4 py-4 border-bottom bg-white">
              <h5 className="mb-1 fw-semibold">Complete onboarding</h5>
              <p className="text-muted small mb-0">{invite?.societyName}</p>
            </div>

            {/* Read-only info */}
            <div className="px-4 py-3 bg-white border-bottom">
              <div className="d-flex flex-wrap gap-4 small text-muted">
                {invite?.address && (
                  <span><strong className="text-dark">Address:</strong> {invite.address}</span>
                )}
                <span><strong className="text-dark">Total flats:</strong> {invite?.flatCount ?? '–'}</span>
                {invite?.email && (
                  <span><strong className="text-dark">Contact:</strong> {invite.email}</span>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <Label className="form-label small text-muted">Theme color</Label>
                  <div className="d-flex align-items-center gap-2">
                    <Input
                      type="color"
                      value={form.themeColor}
                      onChange={(e) => setForm((f) => ({ ...f, themeColor: e.target.value }))}
                      className="border rounded p-1"
                      style={{ width: 40, height: 38, cursor: 'pointer' }}
                    />
                    <span className="small">{form.themeColor}</span>
                  </div>
                </div>

                <div className="col-md-6">
                  <Label className="form-label small text-muted">Society logo</Label>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleLogoChange}
                      disabled={uploadingLogo}
                      className="form-control form-control-sm"
                      style={{ maxWidth: 180 }}
                    />
                    {form.logo && (
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={logoPreviewUrl(form.logo)}
                          alt="Logo preview"
                          className="rounded border bg-white"
                          style={{ height: 40, width: 'auto', maxWidth: 100, objectFit: 'contain' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <Button type="button" color="outline-secondary" size="sm" className="py-0" onClick={() => setForm((f) => ({ ...f, logo: '' }))}>Remove</Button>
                      </div>
                    )}
                  </div>
                  {uploadingLogo && <span className="small text-muted">Uploading…</span>}
                </div>

                <div className="col-12">
                  <Label htmlFor="adminName" className="form-label small text-muted">Admin contact name</Label>
                  <Input id="adminName" value={form.adminContactName} onChange={(e) => setForm((f) => ({ ...f, adminContactName: e.target.value }))} placeholder="Full name" className="rounded" />
                </div>

                <div className="col-md-6">
                  <Label htmlFor="adminPhone" className="form-label small text-muted">Admin contact phone</Label>
                  <Input id="adminPhone" value={form.adminContactPhone} onChange={(e) => setForm((f) => ({ ...f, adminContactPhone: e.target.value }))} placeholder="Phone number" className="rounded" />
                </div>

                <div className="col-md-6">
                  <Label htmlFor="adminEmail" className="form-label small text-muted">Admin login email</Label>
                  <Input id="adminEmail" type="email" value={form.adminEmail} onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))} placeholder="For signing in" className="rounded" />
                </div>

                <div className="col-12">
                  <Label htmlFor="adminPassword" className="form-label small text-muted">Admin password</Label>
                  <Input id="adminPassword" type="password" value={form.adminPassword} onChange={(e) => setForm((f) => ({ ...f, adminPassword: e.target.value }))} placeholder="Min 6 characters" className="rounded" />
                </div>

                <div className="col-12 pt-2">
                  <Button color="primary" type="submit" className="w-100" disabled={submitting}>
                    {submitting ? 'Completing…' : 'Complete onboarding'}
                  </Button>
                </div>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
