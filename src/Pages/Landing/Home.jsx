import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button } from 'reactstrap';
import PeopleIcon from '@mui/icons-material/People';
import ApartmentIcon from '@mui/icons-material/Apartment';
import ShieldIcon from '@mui/icons-material/Shield';
import CampaignIcon from '@mui/icons-material/Campaign';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SupportIcon from '@mui/icons-material/Support';
import LandingFooter from '../../components/LandingFooter';

const features = [
  { Icon: PeopleIcon, title: 'Resident & member management', text: 'Add members, assign flats, and manage roles. One dashboard for all society members and admins.' },
  { Icon: ApartmentIcon, title: 'Flats & towers', text: 'Manage towers, blocks, and flat numbers. Bulk add flats and keep your directory up to date.' },
  { Icon: ShieldIcon, title: 'Visitor & guard management', text: 'Log visitors, manage security guards, and track entries and exits from a single place.' },
  { Icon: CampaignIcon, title: 'Notices & announcements', text: 'Publish notices and announcements to residents. Schedule and broadcast in one click.' },
  { Icon: ReceiptIcon, title: 'Billing & subscriptions', text: 'Multi-tenant billing, setup fees, and monthly subscriptions. Track payments per society.' },
  { Icon: SupportIcon, title: 'Complaints & support', text: 'Residents raise complaints; admins track status from open to resolved with full visibility.' },
];

const stats = [
  { value: 'Multi-tenant', label: 'Scale to thousands of societies' },
  { value: 'Secure', label: 'Role-based access & JWT auth' },
  { value: 'Modern', label: 'React admin & REST API' },
];

const LandingHome = () => (
  <>
    <section className="landing-hero">
      <Container>
        <Row className="align-items-center">
          <Col lg={7}>
            <h1>Making everyday society management easier</h1>
            <p className="lead">
              Tech solutions to manage residents, visitors, notices, and billing—all in one platform. 
              Built for RWAs, housing societies, and property managers.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <Button tag={Link} to="/contact" color="primary" className="btn-hero btn-hero-primary">
                Book a demo
              </Button>
              <Button tag={Link} to="/auth/login" outline color="primary" className="btn-hero btn-hero-outline">
                Login to dashboard
              </Button>
            </div>
          </Col>
          <Col lg={5} className="text-center d-none d-lg-block">
            <div className="rounded-3 bg-white shadow-sm p-4 border" style={{ maxWidth: 320, marginLeft: 'auto' }}>
              <div className="text-muted small text-start mb-2">Dashboard at a glance</div>
              <div className="d-flex gap-2 flex-wrap justify-content-start">
                {['Members', 'Flats', 'Visitors', 'Notices'].map((l) => (
                  <span key={l} className="badge bg-light text-dark border px-3 py-2">{l}</span>
                ))}
              </div>
              <p className="text-muted small text-start mt-3 mb-0">One platform for your entire community.</p>
            </div>
          </Col>
        </Row>
      </Container>
    </section>

    <section className="landing-section">
      <Container>
        <h2 className="text-center">Why SocietyHub?</h2>
        <p className="text-center section-sub">
          A comprehensive platform that brings society management, residents, visitors, and billing into one place.
        </p>
        <Row xs={1} md={2} lg={3} className="g-4">
          {features.map((f) => (
            <Col key={f.title}>
              <div className="landing-feature-card">
                <div className="icon-wrap">
                  <f.Icon style={{ fontSize: 28 }} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>

    <section className="landing-section landing-section-alt">
      <Container>
        <h2 className="text-center">Built for scale</h2>
        <p className="text-center section-sub">
          Whether you run one society or a platform for many, SocietyHub adapts to your needs.
        </p>
        <Row className="g-4 justify-content-center">
          {stats.map((s) => (
            <Col key={s.label} md={4}>
              <div className="landing-stat">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>

    <section className="landing-section">
      <Container>
        <div className="landing-cta text-center">
          <h2>Ready to simplify society management?</h2>
          <p>Book a free demo and see how SocietyHub works for your community.</p>
          <Button tag={Link} to="/contact" color="light" size="lg" className="btn-light">
            Schedule a demo
          </Button>
        </div>
      </Container>
    </section>

    <LandingFooter />
  </>
);

export default LandingHome;
