import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Sprout, Lock, Mail, User, ShieldCheck } from 'lucide-react';

const Login = () => {
  const { login, register } = useAuth();
  const { notify, notifySuccess, clearNotification } = useNotification();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('FARMER');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearNotification();
    setLoading(true);

    try {
      if (isRegistering) {
        await register(name, email, password, role);
        notifySuccess('Account created successfully! Welcome to AgriOS.', 'You can now explore all features.');
      } else {
        await login(email, password);
        notifySuccess('Welcome back!', 'You are now securely logged in.');
      }
    } catch (err) {
      notify(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: 20 }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: '3rem', marginBottom: 12 }}>🌱</span>
          <h2 style={{ margin: 0, fontWeight: 700, letterSpacing: -0.5 }}>AgriOS Platform</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Unified Agriculture Operating System</p>
        </div>

        {/*
          Notifications are rendered globally by NotificationProvider
        */}

        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div className="input-group">
              <span className="input-label">Full Name</span>
              <div style={{ position: 'relative' }}>
                <input 
                  className="input-field" 
                  style={{ width: '100%', paddingLeft: 40 }} 
                  required 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Farmer or Agent Name" 
                />
                <User size={16} className="text-muted" style={{ position: 'absolute', left: 14, top: 15 }} />
              </div>
            </div>
          )}

          <div className="input-group">
            <span className="input-label">Email Address</span>
            <div style={{ position: 'relative' }}>
              <input 
                className="input-field" 
                style={{ width: '100%', paddingLeft: 40 }} 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="name@agrios.org" 
              />
              <Mail size={16} className="text-muted" style={{ position: 'absolute', left: 14, top: 15 }} />
            </div>
          </div>

          <div className="input-group">
            <span className="input-label">Security Password</span>
            <div style={{ position: 'relative' }}>
              <input 
                className="input-field" 
                style={{ width: '100%', paddingLeft: 40 }} 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
              />
              <Lock size={16} className="text-muted" style={{ position: 'absolute', left: 14, top: 15 }} />
            </div>
          </div>

          {isRegistering && (
            <div className="input-group">
              <span className="input-label">Platform Role Clearance</span>
              <select className="input-field" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="FARMER">Farmer (Single Land Scans)</option>
                <option value="FPO_ADMIN">FPO Manager (Bulk Harvest consolidation)</option>
                <option value="AGRI_BUSINESS">Enterprise Buyer (B2B Procurement)</option>
                <option value="EXPERT">Agronomist Expert (Diagnostics override)</option>
              </select>
            </div>
          )}

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} type="submit" disabled={loading}>
            {loading ? 'Processing Operations...' : isRegistering ? 'Register Profile' : 'Authenticate User'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem' }}>
          <button 
            className="tab-btn" 
            style={{ padding: 4, color: 'var(--color-primary)' }}
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
            }}
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
