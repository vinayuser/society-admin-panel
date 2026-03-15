import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../store/slices/authSlice';
import { getDefaultPath } from '../../helpers/roleUtils';
import { toast } from 'react-toastify';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, error } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [validationErrors, setValidationErrors] = useState({ email: false, password: false });

  useEffect(() => {
    if (user) {
      const to = location.state?.from?.pathname || getDefaultPath(user);
      navigate(to);
    }
  }, [user, navigate, location.state]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (validationErrors[id]) setValidationErrors((prev) => ({ ...prev, [id]: false }));
  };

  const validateForm = () => {
    const errors = { email: !formData.email?.trim(), password: !formData.password };
    setValidationErrors(errors);
    return !errors.email && !errors.password;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      await dispatch(loginUser({ email: formData.email.trim(), password: formData.password })).unwrap();
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      navigate(location.state?.from?.pathname || getDefaultPath(stored));
    } catch (_) {}
  };

  return (
    <div className="loginBox">
      <div className="loginHeader">
        <div className="loginLogo">
          <i className="fas fa-building" />
        </div>
        <div className="HeadingText text-center">
          <h1 className="h3">Society Management</h1>
          <p className="loginSubtitle">Admin &amp; society dashboard</p>
        </div>
      </div>
      <div className="card">
        <div className="card-body px-4 py-4">
          <div className="cardText text-center mb-4">
            <h2 className="heading h4 mb-1">Sign in</h2>
            <p className="smallHeading">Use your email and password to continue</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <input
                type="text"
                inputMode="email"
                placeholder="Email address"
                className={`form-control ${validationErrors.email ? 'is-invalid' : ''}`}
                id="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                placeholder="Password"
                className={`form-control ${validationErrors.password ? 'is-invalid' : ''}`}
                id="password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
