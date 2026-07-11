import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building, Layers, Truck, FileText, User, LogOut, RefreshCw, Check, X, ShieldCheck, Award, CreditCard
} from 'lucide-react';
import ProfilePage from './ProfilePage';
import SubscriptionPage from './SubscriptionPage';

const BusinessDashboard = () => {
  const { user, logout, getAuthHeaders } = useAuth();
  const { notify, notifySuccess } = useNotification();
  const [activeTab, setActiveTab] = useState('catalogue');
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidInputs, setBidInputs] = useState({}); // { lotId: price }

  const fetchLots = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/market/lot/all', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setLots(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
  }, []);

  const handlePlaceBid = async (lotId) => {
    const price = bidInputs[lotId];
    if (!price || isNaN(price) || parseFloat(price) <= 0) {
      notify({ message: 'Please enter a valid bid price greater than zero.', error: 'VALIDATION' });
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/market/lot/bid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          lot_id: lotId,
          bid_price_per_ton_inr: parseFloat(price)
        })
      });
      if (res.ok) {
        notifySuccess('Bid placed successfully!', 'Your offer has been submitted to the FPO. You will be notified if it is accepted.');
        setBidInputs(prev => ({ ...prev, [lotId]: '' }));
        fetchLots();
      } else {
        const errorData = await res.json();
        notify(errorData, 'Bid Failed', errorData.error || 'Could not place your purchase offer.', 'Review the lot details and try again.');
      }
    } catch (err) {
      notify(err, 'Connection Error', 'Could not place bid due to a network issue.', 'Retry in a moment.');
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
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Business Buyer console</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 12, marginBottom: 24, background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="flex-center" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-primary-glow)' }}>
              <Building size={18} className="text-primary" />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</p>
              <span className="badge badge-premium" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>Enterprise Agent</span>
            </div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <button className="btn btn-primary" style={{ justifyContent: 'flex-start', width: '100%' }}>
            <Layers size={18} /> Procurement Catalogue
          </button>
          <button 
            className={`btn btn-secondary ${activeTab === 'profile' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} /> Profile
          </button>
          <button 
            className={`btn btn-secondary ${activeTab === 'subscription' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
            onClick={() => setActiveTab('subscription')}
          >
            <CreditCard size={18} /> Subscription
          </button>
        </nav>

        <button className="btn btn-secondary text-danger" style={{ marginTop: 'auto', justifyContent: 'flex-start' }} onClick={logout}>
          <LogOut size={18} /> Disconnect
        </button>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        {activeTab === 'profile' ? (
          <ProfilePage />
        ) : activeTab === 'subscription' ? (
          <SubscriptionPage />
        ) : (
        <>
        <header className="mb-6">
          <h1>Enterprise Procurement Hub</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Browse consolidated agricultural lots, place bidding proposals, and verify trace records.</p>
        </header>

        {/* B2B inventory lists */}
        <div className="glass-panel">
          <h2>FPO Harvest Sales Catalogue</h2>
          {loading ? (
            <div className="flex-center" style={{ height: 200 }}><RefreshCw className="animate-spin" /></div>
          ) : lots.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24, marginTop: 16 }}>
              {lots.map((lot) => {
                // Check if user already placed a bid
                const myBids = lot.bids.filter(b => b.buyer_id === user.id);
                const hasAccepted = lot.bids.some(b => b.buyer_id === user.id && b.status === 'ACCEPTED');

                return (
                  <div key={lot._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span className="text-secondary" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>PUBLISHED BY FPO</span>
                        <h3 style={{ margin: '2px 0 0 0' }}>{lot.crop_name}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Variety: {lot.variety}</p>
                      </div>
                      <span className="badge badge-active" style={{ fontSize: '0.85rem' }}>{lot.total_quantity_metric_tons} Tons</span>
                    </div>

                     <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', border: '1px solid var(--border-glass)' }}>
                      <span className="text-secondary">Expected Price:</span>
                      <span style={{ fontWeight: 600 }}>INR {lot.expected_price_per_ton_inr.toLocaleString('en-IN')} / Ton</span>
                    </div>

                    {/* Bids history for buyer */}
                    {myBids.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 10 }}>
                        <span className="input-label" style={{ fontSize: '0.7rem' }}>Your Bid Status</span>
                        {myBids.map((b) => (
                          <div key={b._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                            <span style={{ fontWeight: 700 }}>INR {b.bid_price_per_ton_inr.toLocaleString('en-IN')}</span>
                            <span className={`badge ${b.status === 'ACCEPTED' ? 'badge-active' : b.status === 'REJECTED' ? 'badge-abandoned' : 'badge-premium'}`}>
                              {b.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Submit bid inputs if not contracted */}
                    {lot.status !== 'CONTRACTED' ? (
                      <div style={{ display: 'flex', gap: 8, marginTop: 'auto', borderTop: '1px solid var(--border-glass)', paddingTop: 12 }}>
                        <input 
                          className="input-field" 
                          style={{ padding: '8px 12px', flex: 1, fontSize: '0.85rem' }} 
                          type="number"
                          placeholder="Bid INR/Ton"
                          value={bidInputs[lot._id] || ''}
                          onChange={(e) => setBidInputs({ ...bidInputs, [lot._id]: e.target.value })}
                        />
                        <button className="btn btn-primary" style={{ padding: '8px 12px', fontSize: '0.85rem' }} onClick={() => handlePlaceBid(lot._id)}>
                          Offer Bid
                        </button>
                      </div>
                    ) : (
                      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-glass)' }}>
                        {hasAccepted ? (
                          <div className="flex-center" style={{ gap: 6, color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 600 }}>
                            <ShieldCheck size={16} /> B2B Contract Validated
                          </div>
                        ) : (
                          <div className="flex-center" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Lot Sold to Another Agent
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-secondary mt-4">No bulk inventory sale catalog listings available.</p>
          )}
        </div>
        </>
        )}
      </main>
    </div>
  );
};

export default BusinessDashboard;
