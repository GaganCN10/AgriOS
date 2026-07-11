import React from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

const UserFriendlyAlert = ({ type = 'error', title, message, remedy, onClose }) => {
  const colors = {
    error: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b', icon: AlertTriangle },
    success: { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46', icon: CheckCircle },
    info: { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af', icon: Info },
  };
  const config = colors[type] || colors.error;
  const Icon = config.icon;

  return (
    <div style={{ 
      padding: '14px 18px', 
      borderRadius: 10, 
      marginBottom: 20, 
      background: config.bg, 
      color: config.text, 
      border: `1px solid ${config.border}`,
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start'
    }}>
      <Icon size={20} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        {title && <strong style={{ display: 'block', marginBottom: 4, fontSize: '0.95rem' }}>{title}</strong>}
        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{message}</p>
        {remedy && (
          <p style={{ margin: '6px 0 0', fontSize: '0.8rem', opacity: 0.85, fontStyle: 'italic' }}>Remedy: {remedy}</p>
        )}
      </div>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: config.text, cursor: 'pointer', padding: 0, lineHeight: 1 }}>
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default UserFriendlyAlert;
