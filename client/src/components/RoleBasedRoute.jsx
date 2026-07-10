import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
        <h2>Access Denied</h2>
        <p>Your role "<strong>{user.role}</strong>" is not authorized for this module.</p>
        <button className="btn btn-secondary" onClick={() => window.history.back()}>Return</button>
      </div>
    );
  }

  return children;
};

export default RoleBasedRoute;
