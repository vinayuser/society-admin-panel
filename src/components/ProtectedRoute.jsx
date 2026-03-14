import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { canAccessRoute } from '../helpers/roleUtils';

const ProtectedRoute = ({
  children,
  allowedRoles = [],
  fallbackPath = '/admin/dashboard',
}) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  const canAccess = canAccessRoute(user, location.pathname);
  if (!canAccess) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (allowedRoles.length > 0) {
    const hasRole = allowedRoles.includes(user.role);
    if (!hasRole) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
