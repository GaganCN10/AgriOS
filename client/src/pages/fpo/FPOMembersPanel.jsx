import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Users, Plus, Check, X, RefreshCw, Mail, ShieldCheck } from 'lucide-react';

const FPOMembersPanel = () => {
  const { apiFetch } = useAuth();
  const { notify, notifySuccess } = useNotification();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('http://localhost:5000/api/fpo/members', {  });
      const data = await res.json();
      if (res.ok) setMembers(data);
    } catch (err) {
      notify(err, 'Load Failed', 'Could not load FPO members.', 'Retry in a moment.');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, []);

  const addMember = async (e) => {
    e.preventDefault();
    if (!memberEmail) return;
    setSubmitting(true);
    try {
      const res = await apiFetch('http://localhost:5000/api/fpo/members/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',  },
        body: JSON.stringify({ email: memberEmail, farm_ids: [] }),
      });
      if (res.ok) {
        setShowAdd(false);
        setMemberEmail('');
        fetchMembers();
        notifySuccess('Member added.', 'The farmer has been invited to your FPO network.');
      }
    } catch (err) {
      notify(err, 'Add Failed', 'Could not add member.', 'Check the email and try again.');
    }
    finally { setSubmitting(false); }
  };

  const validateMember = async (memberId, status) => {
    try {
      const res = await apiFetch(`http://localhost:5000/api/fpo/members/validate/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json',  },
        body: JSON.stringify({ validation_status: status }),
      });
      if (res.ok) {
        fetchMembers();
        notifySuccess(`Member ${status === 'PASSED' ? 'approved' : 'rejected'}.`, 'The validation status has been updated.');
      }
    } catch (err) {
      notify(err, 'Validation Failed', 'Could not update member validation status.', 'Retry in a moment.');
    }
  };

  const removeMember = async (memberId) => {
    if (!confirm('Remove this member?')) return;
    try {
      const res = await apiFetch(`http://localhost:5000/api/fpo/members/remove/${memberId}`, { method: 'DELETE',  });
      if (res.ok) {
        fetchMembers();
        notifySuccess('Member removed.', 'The member has been removed from your FPO network.');
      }
    } catch (err) {
      notify(err, 'Remove Failed', 'Could not remove member.', 'Retry in a moment.');
    }
  };

  const statusBadge = (s) => s === 'PASSED' ? 'badge-active' : s === 'FAILED' ? 'badge-abandoned' : 'badge-premium';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2><Users size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />FPO Member Registry</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage affiliated farmer members and validation statuses.</p>
          </div>
          <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setShowAdd(!showAdd)}>
            <Plus size={14} /> Add Member
          </button>
        </div>

        {showAdd && (
          <form onSubmit={addMember} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border-glass)' }}>
            <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
              <span className="input-label">Member Email</span>
              <input className="input-field" type="email" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} placeholder="farmer@example.com" required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? <><RefreshCw className="animate-spin" size={14} /> Adding...</> : 'Add Member'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="flex-center" style={{ padding: 40 }}><RefreshCw className="animate-spin" /></div>
        ) : members.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 500, overflowY: 'auto' }}>
            {members.map((m) => (
              <div key={m._id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{m.email}</span>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {m.affiliated_farms?.length || 0} affiliated farms
                    {m.validation_notes && ` • ${m.validation_notes}`}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className={`badge ${statusBadge(m.validation_status)}`}>{m.validation_status}</span>
                  {m.validation_status === 'PENDING' && (
                    <>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--color-primary)' }} onClick={() => validateMember(m._id, 'PASSED')} title="Approve">
                        <Check size={14} />
                      </button>
                      <button className="btn btn-secondary text-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => validateMember(m._id, 'FAILED')} title="Reject">
                        <X size={14} />
                      </button>
                    </>
                  )}
                  <button className="btn btn-secondary text-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => removeMember(m._id)} title="Remove">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-center" style={{ padding: 40, flexDirection: 'column', gap: 12 }}>
            <Users size={32} className="text-muted" />
            <p className="text-secondary">No members affiliated yet. Add member emails to build your FPO network.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FPOMembersPanel;
