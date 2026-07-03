import React from 'react';

export const DashboardPanel = ({ children, className = '', style = {}, ...props }) => {
  return (
    <div className={`glass-panel ${className}`.trim()} style={style} {...props}>
      {children}
    </div>
  );
};

export const DashboardCard = ({ children, className = '', style = {}, ...props }) => {
  return (
    <div className={`glass-card ${className}`.trim()} style={style} {...props}>
      {children}
    </div>
  );
};

export const DashboardField = ({ label, children, style = {} }) => {
  return (
    <div className="input-group" style={style}>
      <span className="input-label">{label}</span>
      {children}
    </div>
  );
};
