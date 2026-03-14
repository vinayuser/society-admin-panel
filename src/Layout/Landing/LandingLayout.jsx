import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Navbar, Nav, Container, NavbarToggler, Collapse } from 'reactstrap';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/features', label: 'Features' },
  { path: '/contact', label: 'Contact' },
];

const LandingLayout = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="landing-wrap">
      <Navbar expand="lg" className="landing-nav" container="fluid">
        <Container>
          <Link to="/" className="navbar-brand">SocietyHub</Link>
          <NavbarToggler onClick={() => setOpen(!open)} />
          <Collapse isOpen={open} navbar>
            <Nav className="ms-auto align-items-lg-center" navbar>
              {navLinks.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`nav-link ${location.pathname === path ? 'active fw-semibold' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <Link to="/auth/login" className="nav-link btn-login ms-lg-2" onClick={() => setOpen(false)}>
                Login
              </Link>
            </Nav>
          </Collapse>
        </Container>
      </Navbar>
      <main><Outlet /></main>
    </div>
  );
};

export default LandingLayout;
