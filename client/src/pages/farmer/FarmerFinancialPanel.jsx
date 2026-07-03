import React from 'react';
import { Download, RefreshCw } from 'lucide-react';

const FarmerFinancialPanel = ({ finLoading, finProfile, triggerPDFDownload }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Digital Kisan Credit Card (KCC) Portfolio</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Download bank certified underwriting packets containing land boundaries, soil assays, and NDVI logs.</p>
        </div>
        <button className="btn btn-primary" onClick={triggerPDFDownload}>
          <Download size={16} /> Download certified PDF Pack
        </button>
      </div>

      {finLoading ? (
        <div className="flex-center" style={{ height: 200 }}><RefreshCw className="animate-spin" /></div>
      ) : finProfile ? (
        <div className="grid-cols-2">
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3>Bank Underwriting Evaluation</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: 12 }}>
              <span className="text-secondary">Risk Credit Rating Score:</span>
              <span style={{ fontWeight: 700, color: finProfile.credit_evaluation.risk_score >= 650 ? 'var(--color-primary)' : 'var(--color-accent)' }}>
                {finProfile.credit_evaluation.risk_score} / 850 ({finProfile.credit_evaluation.risk_grade} RISK)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: 12 }}>
              <span className="text-secondary">KCC Recommended Loan limit:</span>
              <span style={{ fontWeight: 700 }}>INR {finProfile.credit_evaluation.kcc_recommended_limit_inr.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12 }}>
              <span className="text-secondary">Pre-approved Loan Status:</span>
              <span className="badge badge-active" style={{ fontSize: '0.8rem' }}>{finProfile.credit_evaluation.loan_eligibility_status}</span>
            </div>
          </div>

          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3>PMFBY Insurance Alignment</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: 12 }}>
              <span className="text-secondary">Active Policy Code:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{finProfile.pmfby_insurance.policy_number}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: 12 }}>
              <span className="text-secondary">PMFBY Coverage Amount:</span>
              <span style={{ fontWeight: 700 }}>INR {finProfile.pmfby_insurance.coverage_amount_inr.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: 12 }}>
              <span className="text-secondary">Premium Payable:</span>
              <span>INR {finProfile.pmfby_insurance.premium_payable_inr.toLocaleString('en-IN')} (Paid)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12 }}>
              <span className="text-secondary">Claims Payout Status:</span>
              <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{finProfile.pmfby_insurance.claim_status}</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-secondary">No credit evaluation profile computed.</p>
      )}
    </div>
  );
};

export default FarmerFinancialPanel;