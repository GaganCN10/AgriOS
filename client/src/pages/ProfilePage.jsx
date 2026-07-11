import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Save, ShieldCheck } from 'lucide-react';

const ProfilePage = () => {
  const { user, getAuthHeaders, updateProfile, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = { name, email };
      if (currentPassword || newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || data.msg || 'Failed to update profile.' });
        setSaving(false);
        return;
      }

      updateProfile(data.user);
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: 'Server error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="glass-panel" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div className="flex-center" style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-primary-glow)', color: 'var(--color-primary)' }}>
            <User size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0 }}>My Profile</h2>
            <span className="badge" style={{ marginTop: 4, display: 'inline-flex' }}>{user?.role}</span>
          </div>
        </div>

        {message.text && (
          <div style={{ 
            padding: '12px 16px', 
            borderRadius: 8, 
            marginBottom: 20, 
            background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: message.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#6ee7b7' : '#fca5a5'}`
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="input-group">
            <span className="input-label"><User size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Full Name</span>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="input-group">
            <span className="input-label"><Mail size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />Email Address</span>
            <input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 20, marginTop: 4 }}>
            <h3 style={{ marginBottom: 16, fontSize: '1.1rem' }}><Lock size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Change Password</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Current Password</span>
                <input className="input-field" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Leave blank to keep current" />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">New Password</span>
                <input className="input-field" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank to keep current" />
              </div>
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={saving} style={{ alignSelf: 'flex-start' }}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px' }}>
        <ShieldCheck size={18} className="text-primary" />
        <div>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Account Security</span>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Subscription Tier: <span className="badge badge-premium" style={{ marginLeft: 6 }}>{user?.subscription_tier || 'FREE'}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
