import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'reactstrap';

const LandingFooter = () => (
  <footer className="landing-footer">
    <Container>
      <Row>
        <Col md={4} className="mb-4 mb-md-0">
          <div className="footer-brand">SocietyHub</div>
          <p className="mt-2 mb-0 text-white-50 small">
            Housing society management platform for RWAs and property managers.
          </p>
        </Col>
        <Col md={2}>
          <div className="fw-semibold mb-2">Product</div>
          <ul className="footer-links">
            <li><Link to="/features">Features</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/auth/login">Login</Link></li>
          </ul>
        </Col>
        <Col md={2}>
          <div className="fw-semibold mb-2">Company</div>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/contact">Book a demo</Link></li>
          </ul>
        </Col>
      </Row>
      <Row>
        <Col className="footer-bottom">
          © {new Date().getFullYear()} SocietyHub. All rights reserved.
        </Col>
      </Row>
    </Container>
  </footer>
);

export default LandingFooter;
