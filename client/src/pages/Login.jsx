import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Sprout, Lock, Mail, User } from 'lucide-react';

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
    <div style={{ minHeight: '100vh', display: 'flex', width: '100%' }}>
      {/* LEFT SIDE: Form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 48px', backgroundColor: '#ffffff' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>AgriOS</div>
          <h2 style={{ marginTop: 24, fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
            {isRegistering ? 'Create your account' : 'Welcome back'}
          </h2>
          <p style={{ marginTop: 8, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {isRegistering
              ? 'Register to access the unified agriculture operating system.'
              : 'Please enter your details to access your dashboard.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 420, width: '100%' }}>
          {isRegistering && (
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                <input
                  required
                  style={{ width: '100%', paddingLeft: 40, padding: '10px 12px 10px 40px', fontSize: '0.95rem', border: '1px solid var(--border-glass)', borderRadius: 8 }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Farmer or Agent Name"
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input
                name="email"
                type="email"
                required
                style={{ width: '100%', paddingLeft: 40, padding: '10px 12px 10px 40px', fontSize: '0.95rem', border: '1px solid var(--border-glass)', borderRadius: 8 }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@agrios.org"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input
                name="password"
                type="password"
                required
                style={{ width: '100%', paddingLeft: 40, padding: '10px 12px 10px 40px', fontSize: '0.95rem', border: '1px solid var(--border-glass)', borderRadius: 8 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          {isRegistering && (
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>Platform Role Clearance</label>
              <select
                style={{ width: '100%', padding: '10px 12px', fontSize: '0.95rem', border: '1px solid var(--border-glass)', borderRadius: 8, backgroundColor: '#fff' }}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="FARMER">Farmer (Single Land Scans)</option>
                <option value="FPO_ADMIN">FPO Manager (Bulk Harvest consolidation)</option>
                <option value="AGRI_BUSINESS">Enterprise Buyer (B2B Procurement)</option>
                <option value="EXPERT">Agronomist Expert (Diagnostics override)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '10px', fontSize: '0.95rem', fontWeight: 600, borderRadius: 8, border: 'none', backgroundColor: 'var(--color-primary)', color: '#fff', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Processing...' : isRegistering ? 'Register Profile' : 'Authenticate User'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: 420, width: '100%' }}>
          {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            style={{ color: 'var(--color-primary)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isRegistering ? 'Sign In' : 'Register'}
          </button>
        </div>
      </div>

      {/* RIGHT SIDE: Image placeholder */}
      <div className="hidden lg:block" style={{ width: '50%', backgroundColor: '#059669', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)', opacity: 0.7 }} />
        <div style={{ position: 'absolute', bottom: 48, left: 48, right: 48 }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#fff', marginBottom: 16 }}>Innovation meets Nature.</h2>
          <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.85)', maxWidth: 400 }}>
            Join a community of farmers dedicated to modern agriculture through technology.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
