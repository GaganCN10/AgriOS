import React from 'react';
import { useAuth } from '../context/AuthContext';
import FarmerDashboard from './FarmerDashboard';
import FPODashboard from './FPODashboard';
import BusinessDashboard from './BusinessDashboard';
import ExpertDashboard from './ExpertDashboard';

const DashboardSelector = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
        <h2>Session Invalidated</h2>
        <p>Please log in to access AgriOS dashboard consoles.</p>
        <button className="btn btn-primary" onClick={logout}>Login Screen</button>
      </div>
    );
  }

  // Switch statement rendering the corresponding React dashboard page component
  switch (user.role) {
    case 'FARMER':
      return <FarmerDashboard />;
    case 'FPO_ADMIN':
      return <FPODashboard />;
    case 'AGRI_BUSINESS':
      return <BusinessDashboard />;
    case 'EXPERT':
      return <ExpertDashboard />;
    default:
      return (
        <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
          <h2>Access Denied</h2>
          <p>Your security role "<strong>{user.role}</strong>" is not recognized by AgriOS security routers.</p>
          <button className="btn btn-danger" onClick={logout}>Disconnect Profile</button>
        </div>
      );
  }
};

export default DashboardSelector;
