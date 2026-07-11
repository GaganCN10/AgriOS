import React from 'react';
import { ShieldAlert, RefreshCw, AlertTriangle } from 'lucide-react';

const FarmerDiagnosticsPanel = ({
  user,
  diagFile,
  diagResult,
  diagnosing,
  diagError,
  handleDiagFileChange,
  runDiagnostics,
  diagHistory,
  diagHistoryLoading,
}) => {
  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Computer Vision Crop Diagnostics</h2>
        <span className="badge badge-premium">Premium Gated</span>
      </div>

      {user.subscription_tier === 'FREE' ? (
        <div className="flex-center" style={{ flexDirection: 'column', gap: 16, padding: '40px 0' }}>
          <ShieldAlert size={48} className="text-muted" />
          <h3>Diagnostic Image Classifier Locked</h3>
          <p className="text-secondary" style={{ textAlign: 'center', maxWidth: 450 }}>
            Analyze crop leaf health and download expert verification protocols by upgrading to the Premium subscription.
          </p>
        </div>
      ) : (
        <div className="grid-cols-2">
          <form onSubmit={runDiagnostics} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="input-group">
              <span className="input-label">Upload Crop Leaf Photo</span>
              <input className="input-field" type="file" accept="image/*" onChange={handleDiagFileChange} required />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supported formats: PNG, JPG, JPEG (Max 8MB size)</span>
            </div>

            <button className="btn btn-primary" type="submit" disabled={diagnosing || !diagFile} style={{ alignSelf: 'flex-start' }}>
              {diagnosing ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Analyzing Plant Tensors...
                </>
              ) : 'Execute Disease Diagnosis'}
            </button>

            {diagError && (
              <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--color-danger)', color: 'var(--color-danger)', fontSize: '0.9rem' }}>
                {diagError}
              </div>
            )}
          </form>

          <div>
            {diagResult ? (
              <div className="glass-panel" style={{ background: 'rgba(16, 185, 129, 0.03)', borderColor: 'rgba(16,185,129,0.3)' }}>
                <h3>Diagnostic Classification Results</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>DISEASE IDENTIFIED</span>
                    <h2 style={{ margin: 0, color: 'var(--color-primary)' }}>{diagResult.disease}</h2>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CONFIDENCE SCORE</span>
                    <h2 style={{ margin: 0 }}>{Math.round(diagResult.confidence * 100)}%</h2>
                  </div>
                </div>
                <span className="input-label">Remediation Protocol</span>
                <p className="text-secondary" style={{ fontSize: '0.9rem', marginTop: 6, lineHeight: 1.4 }}>
                  {diagResult.dynamic_remediation}
                </p>
                {diagResult.warning && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={12} /> {diagResult.warning}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-center" style={{ height: '100%', background: '#f1f5f9', borderRadius: 12, border: '1px dashed var(--border-glass)', padding: 30 }}>
                <p className="text-secondary">Please select and upload a picture to run the active inference pipeline.</p>
              </div>
            )}

            <div className="glass-panel" style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>My Diagnosis History</h3>
                {diagHistoryLoading && <RefreshCw className="animate-spin" size={14} />}
              </div>
              {diagHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
                  {diagHistory.slice(0, 5).map((item) => (
                     <div key={item._id} className="glass-card" style={{ padding: 12, background: '#f8fafc', border: '1px solid var(--border-glass)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <div>
                          <strong>{item.model_inference?.detected_disease || 'Unknown diagnosis'}</strong>
                          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {item.farm_id ? `${item.farm_id.farm_name} • ${item.farm_id.district}` : 'No farm linked'}
                          </p>
                        </div>
                        <span className="badge badge-premium">
                          {item.expert_validation?.is_verified ? 'VERIFIED' : 'PENDING'}
                        </span>
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(item.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-secondary" style={{ fontSize: '0.9rem', margin: 0 }}>
                  No diagnosis history recorded yet for this account.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerDiagnosticsPanel;