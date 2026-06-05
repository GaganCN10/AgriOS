import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  UserCheck, ShieldAlert, Award, FileText, CheckCircle, 
  HelpCircle, User, LogOut, RefreshCw, Check, X, ShieldCheck
} from 'lucide-react';

const ExpertDashboard = () => {
  const { user, logout, getAuthHeaders } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selection & Validation state
  const [selectedLog, setSelectedLog] = useState(null);
  const [correctedDisease, setCorrectedDisease] = useState('');
  const [expertNotes, setExpertNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/analytics/disease-logs', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const submitValidation = async (e) => {
    e.preventDefault();
    if (!selectedLog) return;

    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/analytics/disease-logs/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          log_id: selectedLog._id,
          is_verified: !correctedDisease, // If no correction entered, it is verified as correct
          corrected_disease_string: correctedDisease || null,
          expert_notes: expertNotes
        })
      });
      if (res.ok) {
        alert('Validation submitted successfully!');
        setSelectedLog(null);
        setCorrectedDisease('');
        setExpertNotes('');
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Nav */}
      <aside className="sidebar">
        <div className="flex-center" style={{ gap: 8, marginBottom: 32, justifyContent: 'flex-start' }}>
          <span style={{ fontSize: '1.75rem' }}>🌱</span>
          <div>
            <h3 style={{ margin: 0, fontWeight: 700 }}>AgriOS</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Agronomist Panel</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 12, marginBottom: 24, background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="flex-center" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-primary-glow)' }}>
              <UserCheck size={18} className="text-primary" />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</p>
              <span className="badge badge-premium" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>Expert Advisor</span>
            </div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <button className="btn btn-primary" style={{ justifyContent: 'flex-start', width: '100%' }}>
            <ShieldAlert size={18} /> Disease Diagnosis
          </button>
        </nav>

        <button className="btn btn-secondary text-danger" style={{ marginTop: 'auto', justifyContent: 'flex-start' }} onClick={logout}>
          <LogOut size={18} /> Disconnect
        </button>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        <header className="mb-6">
          <h1>Agronomist Peer Verification Panel</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Review crop diseases detected by GenAI models, log corrections, and issue treatment approvals.</p>
        </header>

        <div className="grid-cols-2">
          {/* List of uploaded logs */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2>Crop Disease Submissions</h2>
            {loading ? (
              <div className="flex-center" style={{ height: 200 }}><RefreshCw className="animate-spin" /></div>
            ) : logs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', maxHeight: 500 }}>
                {logs.map((log) => (
                  <div 
                    key={log._id} 
                    className="glass-card" 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      cursor: 'pointer',
                      border: selectedLog && selectedLog._id === log._id ? '1px solid var(--color-primary)' : '1px solid var(--border-glass)'
                    }}
                    onClick={() => {
                      setSelectedLog(log);
                      setCorrectedDisease(log.expert_validation.corrected_disease_string || '');
                      setExpertNotes(log.expert_validation.expert_notes || '');
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0 }}>Model Class: {log.model_inference.detected_disease}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Farmer: {log.farmer_id ? log.farmer_id.name : 'Unknown'} | District: {log.farm_id ? log.farm_id.district : 'N/A'}
                      </p>
                    </div>
                    <div>
                      {log.expert_validation.is_verified ? (
                        <span className="badge badge-active flex-center" style={{ gap: 4 }}><ShieldCheck size={12} /> Verified</span>
                      ) : (
                        <span className="badge badge-premium">Pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary">No leaf diagnostics logs submitted.</p>
            )}
          </div>

          {/* Validation Form */}
          <div className="glass-panel">
            <h2>Expert Validation Console</h2>
            
            {selectedLog ? (
              <form onSubmit={submitValidation} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                <div className="glass-card" style={{ background: 'rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ margin: 0 }}><strong>Model Prediction:</strong> {selectedLog.model_inference.detected_disease} ({Math.round(selectedLog.model_inference.confidence_score * 100)}% confidence)</p>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}><strong>Suggested Advice:</strong> {selectedLog.model_inference.remediation_protocol}</p>
                </div>

                <div className="input-group">
                  <span className="input-label">Correction string (Leave empty if Model is correct)</span>
                  <input 
                    className="input-field" 
                    value={correctedDisease}
                    onChange={(e) => setCorrectedDisease(e.target.value)}
                    placeholder="e.g. Rice Brown Spot"
                  />
                </div>

                <div className="input-group">
                  <span className="input-label">Agronomist Clinical Advice & Warnings</span>
                  <textarea 
                    className="input-field" 
                    rows={4}
                    required
                    value={expertNotes}
                    onChange={(e) => setExpertNotes(e.target.value)}
                    placeholder="Provide detailed chemical ratios, water adjustments, or pesticide warning indices..."
                  />
                </div>

                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? 'Registering Verification...' : 'Log Validation Override'}
                </button>
              </form>
            ) : (
              <div className="flex-center" style={{ height: '80%', background: 'rgba(0,0,0,0.1)', borderRadius: 12, border: '1px dashed var(--border-glass)', padding: 30, marginTop: 16 }}>
                <p className="text-secondary" style={{ textAlign: 'center' }}>Select a farmer submission from the panel on the left to verify diagnostics details.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExpertDashboard;
