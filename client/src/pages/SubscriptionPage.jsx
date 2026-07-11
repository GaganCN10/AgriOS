import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Check, CreditCard, Lock, Sparkles } from 'lucide-react';

const PLANS = [
  {
    id: 'FREE',
    name: 'Starter',
    price: '₹0',
    period: '/month',
    description: 'Basic farm logging and market price viewing',
    features: ['Farm mapping', 'Crop cycle tracking', 'Market prices', 'Basic support'],
    cta: 'Current Plan',
    disabled: true,
  },
  {
    id: 'PREMIUM_GROWER',
    name: 'Premium Grower',
    price: '₹499',
    period: '/month',
    description: 'Unlock AI diagnostics, yield prediction, and advisor chat',
    features: ['Everything in Starter', 'AI disease diagnostics', 'Yield prediction', 'GenAI advisor chat', 'Price alerts via email', 'Priority support'],
    cta: 'Upgrade to Premium',
    disabled: false,
    recommended: true,
  },
  {
    id: 'ENTERPRISE_FPO',
    name: 'Enterprise FPO',
    price: '₹2,499',
    period: '/month',
    description: 'Bulk operations, high-throughput compute, and dedicated APIs',
    features: ['Everything in Premium', 'Bulk KCC portfolio builder', 'High-throughput API access', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee'],
    cta: 'Contact Sales',
    disabled: false,
  },
];

const PaymentModal = ({ plan, onClose, onConfirm }) => {
  const [processing, setProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setProcessing(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      await onConfirm(plan.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div className="glass-panel" style={{ maxWidth: 480, width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Complete Payment</h2>
          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={onClose}>Close</button>
        </div>

        <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Lock size={16} className="text-primary" />
          <span style={{ fontSize: '0.9rem', color: '#065f46' }}>Secure mock payment — no real charges</span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid var(--border-glass)', borderRadius: 8, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>{plan.name}</span>
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{plan.price}{plan.period}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{plan.description}</p>
          </div>

          <div className="input-group">
            <span className="input-label">Name on Card</span>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
          </div>

          <div className="input-group">
            <span className="input-label">Card Number</span>
            <input className="input-field" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4242 4242 4242 4242" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <span className="input-label">Expiry</span>
              <input className="input-field" value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/YY" required />
            </div>
            <div className="input-group">
              <span className="input-label">CVV</span>
              <input className="input-field" value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="123" required />
            </div>
          </div>

          {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem', margin: 0 }}>{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={processing} style={{ width: '100%' }}>
            <CreditCard size={16} /> {processing ? 'Processing...' : `Pay ${plan.price}`}
          </button>
        </form>
      </div>
    </div>
  );
};

const SubscriptionPage = () => {
  const { user, upgradeSubscription } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [upgrading, setUpgrading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleUpgrade = async (tier) => {
    setUpgrading(true);
    try {
      const result = await upgradeSubscription(tier);
      setMessage({ type: 'success', text: `Successfully upgraded to ${tier}!` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Upgrade failed.' });
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ marginBottom: 8 }}>Choose Your Plan</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
          Unlock advanced AI analytics, higher API limits, and enterprise features.
        </p>
        {message.text && (
          <div style={{ 
            marginTop: 20, padding: '12px 16px', borderRadius: 8, display: 'inline-block',
            background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: message.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#6ee7b7' : '#fca5a5'}`
          }}>
            {message.text}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        {PLANS.map((plan) => {
          const isCurrent = user?.subscription_tier === plan.id;
          return (
            <div key={plan.id} className="glass-card" style={{ 
              display: 'flex', flexDirection: 'column', gap: 16, padding: 28,
              border: plan.recommended ? '2px solid var(--color-primary)' : undefined,
              position: 'relative'
            }}>
              {plan.recommended && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--color-primary)', color: '#fff', padding: '4px 12px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Sparkles size={12} /> RECOMMENDED
                </div>
              )}

              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>{plan.name}</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{plan.description}</p>
              </div>

              <div style={{ margin: '8px 0' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{plan.price}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{plan.period}</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map((feature, idx) => (
                  <li key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.95rem' }}>
                    <Check size={18} className="text-primary" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                className={`btn ${isCurrent ? 'btn-secondary' : 'btn-primary'}`}
                style={{ marginTop: 'auto', width: '100%' }}
                disabled={isCurrent || plan.disabled || upgrading}
                onClick={() => setSelectedPlan(plan)}
              >
                {isCurrent ? 'Current Plan' : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onConfirm={handleUpgrade}
        />
      )}
    </div>
  );
};

export default SubscriptionPage;
