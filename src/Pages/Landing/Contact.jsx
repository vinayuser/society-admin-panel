import React, { useState } from 'react';
import { Container, Row, Col, Form, FormGroup, Label, Input, Button } from 'reactstrap';
import { toast } from 'react-toastify';
import LandingFooter from '../../components/LandingFooter';

const Contact = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    societyName: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    // No backend contact endpoint yet - show success and clear form
    setTimeout(() => {
      toast.success('Thank you! We will get back to you soon.');
      setForm({ name: '', email: '', phone: '', societyName: '', message: '' });
      setSubmitting(false);
    }, 600);
  };

  return (
    <>
      <section className="landing-hero" style={{ padding: '3rem 0' }}>
        <Container>
          <h1 className="text-center">Get in touch</h1>
          <p className="lead text-center mx-auto" style={{ maxWidth: 540 }}>
            Schedule a free demo or ask us anything. We’re here to help your society run smoothly.
          </p>
        </Container>
      </section>

      <section className="landing-section">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <div className="landing-feature-card p-4">
                <Form onSubmit={handleSubmit}>
                  <FormGroup>
                    <Label for="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label for="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label for="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label for="societyName">Society / community name</Label>
                    <Input
                      id="societyName"
                      name="societyName"
                      type="text"
                      value={form.societyName}
                      onChange={handleChange}
                      placeholder="e.g. Green Valley Apartments"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label for="message">Message</Label>
                    <Input
                      id="message"
                      name="message"
                      type="textarea"
                      rows={4}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Tell us about your requirements or ask for a demo..."
                    />
                  </FormGroup>
                  <Button color="primary" size="lg" type="submit" disabled={submitting}>
                    {submitting ? 'Sending…' : 'Send message'}
                  </Button>
                </Form>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <LandingFooter />
    </>
  );
};

export default Contact;
