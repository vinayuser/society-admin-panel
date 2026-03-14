import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button } from 'reactstrap';
import PeopleIcon from '@mui/icons-material/People';
import ApartmentIcon from '@mui/icons-material/Apartment';
import ShieldIcon from '@mui/icons-material/Shield';
import CampaignIcon from '@mui/icons-material/Campaign';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import LandingFooter from '../../components/LandingFooter';

const featureList = [
  { Icon: AdminPanelSettingsIcon, title: 'Super Admin & Society Admin', desc: 'One platform for platform owners (Super Admin) and per-society admins. Role-based access so each society sees only their data.' },
  { Icon: GroupAddIcon, title: 'Invitation & onboarding', desc: 'Invite societies by email. They complete onboarding with society name, alias, address, and admin details. Activate when ready.' },
  { Icon: PeopleIcon, title: 'Resident & member management', desc: 'Add society members, assign flats, set primary residents. Optional passwords for resident app login. Full CRUD from the dashboard.' },
  { Icon: ApartmentIcon, title: 'Flats, towers & bulk add', desc: 'Manage towers and flat numbers. Add one flat or bulk-import many. Link residents to flats for visitor and complaint context.' },
  { Icon: ShieldIcon, title: 'Guards & visitor management', desc: 'Add security guards and mark them active/inactive. Log visitor entry and exit. View visitor history by flat and date.' },
  { Icon: CampaignIcon, title: 'Notices & announcements', desc: 'Publish notices with title and message. Optional scheduling. Residents and guards can view notices from the app or dashboard.' },
  { Icon: ReceiptIcon, title: 'Billing & subscriptions', desc: 'Setup fee and monthly subscription per society. Track payment status. Scale pricing by flat count or plan type.' },
  { Icon: ReportProblemIcon, title: 'Complaints & helpdesk', desc: 'Residents raise complaints; society admins move status from open to in progress to resolved. Full audit trail.' },
];

const Features = () => (
  <>
    <section className="landing-hero" style={{ padding: '3rem 0' }}>
      <Container>
        <h1 className="text-center">All features in one place</h1>
        <p className="lead text-center mx-auto" style={{ maxWidth: 600 }}>
          From resident and flat management to visitors, notices, billing, and complaints—everything your society needs.
        </p>
      </Container>
    </section>

    <section className="landing-section landing-section-alt">
      <Container>
        <Row className="g-4">
          {featureList.map((f) => (
            <Col key={f.title} md={6} lg={4}>
              <div className="landing-feature-card">
                <div className="icon-wrap">
                  <f.Icon style={{ fontSize: 28 }} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>

    <section className="landing-section">
      <Container className="text-center">
        <p className="section-sub mb-3">Ready to get started?</p>
        <Button tag={Link} to="/contact" color="primary" size="lg" className="me-2">
          Book a demo
        </Button>
        <Button tag={Link} to="/auth/login" outline color="primary" size="lg">
          Login
        </Button>
      </Container>
    </section>

    <LandingFooter />
  </>
);

export default Features;
