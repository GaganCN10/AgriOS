import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  Users, Sprout, TrendingUp, DollarSign, Plus, Check, X,
  Layers, ChevronRight, User, LogOut, ArrowRight, Building,
  BarChart3, RefreshCw, AlertTriangle, Zap, Calendar, Truck, CreditCard, Menu
} from 'lucide-react';
import FPOForecastPanel from './fpo/FPOForecastPanel';
import FPOTraceabilityPanel from './fpo/FPOTraceabilityPanel';
import FPOMembersPanel from './fpo/FPOMembersPanel';
import ProfilePage from './ProfilePage';
import SubscriptionPage from './SubscriptionPage';

const FPODashboard = () => {
  const { user, logout, apiFetch } = useAuth();
  const { notify, notifySuccess } = useNotification();
  const [activeTab, setActiveTab] = useState('catalogue');
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [traceRecords, setTraceRecords] = useState([]);
  const [traceLoading, setTraceLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Sale Lot compilation form
  const [showAddLot, setShowAddLot] = useState(false);
  const [cropName, setCropName] = useState('Rice');
  const [variety, setVariety] = useState('Sona Masuri');
  const [totalQty, setTotalQty] = useState('');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [farmerContributions, setFarmerContributions] = useState([
    { farmerName: 'Ramesh Patel', farmArea: '1.2 Ha', quantity: 2.5 },
    { farmerName: 'Anil Kumar', farmArea: '2.5 Ha', quantity: 4.8 },
    { farmerName: 'Vijay Gowda', farmArea: '1.8 Ha', quantity: 3.2 }
  ]);

  // Price Forecast state
  const [forecastCrop, setForecastCrop] = useState('Rice');
  const [forecastVariety, setForecastVariety] = useState('Sona Masuri');
  const [forecastState, setForecastState] = useState('Karnataka');
  const [forecastDistrict, setForecastDistrict] = useState('Mysore');
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastResult, setForecastResult] = useState(null);

  const [traceForm, setTraceForm] = useState({
    lot_id: '',
    handler_name: user.name || '',
    dispatch_date: new Date().toISOString().slice(0, 10),
    destination: '',
    vehicle_number: '',
    temperature_c: '',
    humidity_percent: '',
    moisture_percent: '',
    ventilation: '',
    grade: 'B',
    weight_metric_tons: '',
    logistics_status: 'READY',
    notes: ''
  });

  const fetchLots = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('http://localhost:5000/api/market/lot/all', {

      });
      const data = await res.json();
      if (res.ok) {
        setLots(data);
      }
    } catch (err) {
      notify(err, 'Load Failed', 'Could not load market lots.', 'Retry in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTraceRecords = async () => {
    try {
      setTraceLoading(true);
      const res = await apiFetch('http://localhost:5000/api/logistics/trace/all', {

      });
      const data = await res.json();
      if (res.ok) {
        setTraceRecords(data);
      }
    } catch (err) {
      notify(err, 'Load Failed', 'Could not load traceability records.', 'Retry in a moment.');
    } finally {
      setTraceLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
    fetchTraceRecords();
  }, []);

  const createSaleLot = async (e) => {
    e.preventDefault();
    if (!totalQty || !expectedPrice) {
      notify({ message: 'Please enter both total quantity and expected price to create a sale lot.', error: 'VALIDATION' });
      return;
    }

    try {
      const res = await apiFetch('http://localhost:5000/api/market/lot/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify({
          crop_name: cropName,
          variety,
          total_quantity_metric_tons: parseFloat(totalQty),
          expected_price_per_ton_inr: parseFloat(expectedPrice),
          member_contributions: farmerContributions.map((fc, i) => ({
            farmer_id: user.id,
            quantity_tons: fc.quantity
          }))
        })
      });
      if (res.ok) {
        notifySuccess('Bulk sale lot published!', 'Your consolidated harvest lot is now visible to enterprise buyers.');
        setShowAddLot(false);
        setTotalQty('');
        setExpectedPrice('');
        fetchLots();
      } else {
        const errorData = await res.json();
        notify(errorData, 'Publish Failed', errorData.error || 'Could not publish the sale lot.', 'Check your inputs and try again.');
      }
    } catch (err) {
      notify(err, 'Connection Error', 'Could not publish sale lot due to a network issue.', 'Retry in a moment.');
    }
  };

  const handleBidResponse = async (lotId, bidId, action) => {
    try {
      const res = await apiFetch('http://localhost:5000/api/market/lot/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify({
          lot_id: lotId,
          bid_id: bidId,
          action
        })
      });
      if (res.ok) {
        notifySuccess(`Bid ${action === 'ACCEPT' ? 'accepted' : 'rejected'} successfully.`, 'The buyer has been notified of your decision.');
        fetchLots();
      } else {
        const errorData = await res.json();
        notify(errorData, 'Action Failed', errorData.error || `Could not ${action.toLowerCase()} the bid.`, 'Retry or contact support.');
      }
    } catch (err) {
      notify(err, 'Connection Error', 'Could not reach the server while responding to the bid.', 'Retry in a moment.');
    }
  };

  const createTraceRecord = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...traceForm,
        storage_environment: {
          temperature_c: traceForm.temperature_c ? parseFloat(traceForm.temperature_c) : null,
          humidity_percent: traceForm.humidity_percent ? parseFloat(traceForm.humidity_percent) : null,
          ventilation: traceForm.ventilation || null
        },
        quality_grading: {
          grade: traceForm.grade,
          moisture_percent: traceForm.moisture_percent ? parseFloat(traceForm.moisture_percent) : null,
          weight_metric_tons: parseFloat(traceForm.weight_metric_tons)
        },
        weight_metric_tons: undefined
      };

      const res = await apiFetch('http://localhost:5000/api/logistics/trace/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        notifySuccess('Traceability record saved.', 'The logistics record has been added to your batch history.');
        setTraceForm((prev) => ({
          ...prev,
          destination: '',
          vehicle_number: '',
          temperature_c: '',
          humidity_percent: '',
          moisture_percent: '',
          ventilation: '',
          weight_metric_tons: '',
          notes: '',
          logistics_status: 'READY'
        }));
        fetchTraceRecords();
      } else {
        const errorData = await res.json();
        notify(errorData, 'Save Failed', errorData.error || 'Could not save traceability record.', 'Check the form fields and retry.');
      }
    } catch (err) {
      notify(err, 'Connection Error', 'Could not reach the server while saving traceability record.', 'Retry in a moment.');
    }
  };

  const runPriceForecast = async () => {
    setForecastLoading(true);
    setForecastResult(null);
    try {
      const res = await apiFetch('http://localhost:5000/api/analytics/predict-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop_name: forecastCrop,
          state: forecastState,
          district: forecastDistrict,
          last_price_90_days: 4000,
          last_price_60_days: 4100,
          last_price_30_days: 4200
        })
      });
      const data = await res.json();
      setForecastResult(data);
    } catch (err) {
      setForecastResult({ degradation_notice: 'ML sidecar unreachable. Displaying cached estimates.', estimated_price_trend: 'STABLE', forecast_7d: 4230, forecast_30d: 4210, forecasted_prices_inr: [] });
    } finally {
      setForecastLoading(false);
    }
  };

  const forecastSeries = useMemo(() => forecastResult?.forecasted_prices_inr || [], [forecastResult]);

  // Compute aggregated analytics from lots
  const totalVolume = lots.reduce((sum, l) => sum + l.total_quantity_metric_tons, 0);
  const totalBids = lots.reduce((sum, l) => sum + (l.bids?.length || 0), 0);
  const contractedLots = lots.filter(l => l.status === 'CONTRACTED').length;
  const totalRevenue = lots
    .filter(l => l.status === 'CONTRACTED')
    .reduce((sum, l) => {
      const acceptedBid = l.bids?.find(b => b.status === 'ACCEPTED');
      return sum + (acceptedBid ? acceptedBid.bid_price_per_ton_inr * l.total_quantity_metric_tons : 0);
    }, 0);

  return (
    <div className={`app-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Sidebar Nav */}
      <aside className="sidebar">
        <div className="flex-center" style={{ gap: 8, marginBottom: 32, justifyContent: 'flex-start' }}>
          <span style={{ fontSize: '1.75rem' }}>🌱</span>
          <div>
            <h3 style={{ margin: 0, fontWeight: 700 }}>AgriOS</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FPO Admin console</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 12, marginBottom: 24, background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="flex-center" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-primary-glow)' }}>
              <User size={18} className="text-primary" />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user.name}</p>
              <span className="badge badge-premium" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>FPO Admin</span>
            </div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <button 
            className={`btn btn-secondary ${activeTab === 'catalogue' ? 'btn-primary' : ''}`} 
            style={{ justifyContent: 'flex-start', width: '100%' }}
            onClick={() => setActiveTab('catalogue')}
          >
            <Layers size={18} /> Sale Catalogue
          </button>
          <button 
            className={`btn btn-secondary ${activeTab === 'analytics' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={18} /> Trade Analytics
          </button>
          <button 
            className={`btn btn-secondary ${activeTab === 'forecast' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
            onClick={() => setActiveTab('forecast')}
          >
            <TrendingUp size={18} /> Price Forecast
          </button>
          <button 
            className={`btn btn-secondary ${activeTab === 'traceability' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
            onClick={() => setActiveTab('traceability')}
          >
            <Truck size={18} /> Traceability
          </button>
          <button 
            className={`btn btn-secondary ${activeTab === 'members' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
            onClick={() => setActiveTab('members')}
          >
            <Users size={18} /> Members
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

      {/* Sidebar backdrop for mobile */}
      <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />

      {/* Main Panel Content */}
      <main className="main-content">
        <header className="mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={24} />
            </button>
            <div>
              <h1>Farmer Producer Organisation (FPO) Admin Portal</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Consolidate member crop cycles, aggregate yield outputs, and negotiate B2B contracts.</p>
            </div>
          </div>
          {activeTab === 'catalogue' && (
            <button className="btn btn-primary" onClick={() => setShowAddLot(true)}>
              <Plus size={16} /> Publish Sale Lot
            </button>
          )}
        </header>

        {/* Aggregated analytics widgets */}
        <div className="grid-cols-4 mb-6">
          <div className="glass-panel stat-counter">
            <span className="stat-value">128</span>
            <span className="stat-label">Registered Farmers</span>
          </div>
          <div className="glass-panel stat-counter">
            <span className="stat-value" style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{totalVolume.toFixed(1)}</span>
            <span className="stat-label">Tons Listed</span>
          </div>
          <div className="glass-panel stat-counter">
            <span className="stat-value" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{totalBids}</span>
            <span className="stat-label">Total Bids</span>
          </div>
          <div className="glass-panel stat-counter">
            <span className="stat-value">{contractedLots}</span>
            <span className="stat-label">Contracts Signed</span>
          </div>
        </div>

        {/* Tab: Catalogue */}
        {activeTab === 'catalogue' && (
          <>
            {/* Add Lot compilation Form */}
            {showAddLot && (
              <form className="glass-panel mb-6" onSubmit={createSaleLot} style={{ border: '1px solid var(--color-primary)' }}>
                <h2>Compile Crop Harvest Sale Lot</h2>
                <p className="text-secondary mb-4">Aggregate farmer harvest volumes into a single lot to command premium B2B bulk wholesale pricing.</p>
                
                <div className="grid-cols-2">
                  <div className="input-group">
                    <span className="input-label">Crop Category</span>
                    <select className="input-field" value={cropName} onChange={(e) => setCropName(e.target.value)}>
                      <option value="Rice">Rice</option>
                      <option value="Wheat">Wheat</option>
                      <option value="Tomato">Tomato</option>
                      <option value="Onion">Onion</option>
                      <option value="Potato">Potato</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <span className="input-label">Variety Standard</span>
                    <select className="input-field" value={variety} onChange={(e) => setVariety(e.target.value)}>
                      <option value="Sona Masuri">Sona Masuri</option>
                      <option value="Jyothi">Jyothi</option>
                      <option value="Lok-1">Lok-1</option>
                      <option value="Sharbati">Sharbati</option>
                      <option value="Local">Local / Red</option>
                    </select>
                  </div>
                </div>

                <div className="grid-cols-2">
                  <div className="input-group">
                    <span className="input-label">Aggregated Volume (Metric Tons)</span>
                    <input className="input-field" type="number" required value={totalQty} onChange={(e) => setTotalQty(e.target.value)} placeholder="e.g. 10.5" />
                  </div>
                  <div className="input-group">
                    <span className="input-label">Expected Wholesale Price (INR per Ton)</span>
                    <input className="input-field" type="number" required value={expectedPrice} onChange={(e) => setExpectedPrice(e.target.value)} placeholder="e.g. 42000" />
                  </div>
                </div>

                {/* Simulated Member Contributions */}
                <div className="mb-4">
                  <span className="input-label">Farmer Harvest Contributions</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    {farmerContributions.map((fc, i) => (
                      <div key={i} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px' }}>
                        <span>{fc.farmerName} ({fc.farmArea})</span>
                        <span style={{ fontWeight: 600 }}>{fc.quantity} Tons contribution</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-primary" type="submit">Compile & Publish Lot</button>
                  <button className="btn btn-secondary" type="button" onClick={() => setShowAddLot(false)}>Cancel</button>
                </div>
              </form>
            )}

            {/* FPO Active Lots and Bids */}
            <div className="glass-panel">
              <h2>Active Bulk Sale Lots</h2>
              {loading ? (
                <div className="flex-center" style={{ height: 200 }}><RefreshCw className="animate-spin" /></div>
              ) : lots.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 16 }}>
                  {lots.map((lot) => (
                    <div key={lot._id} className="glass-card" style={{ border: '1px solid var(--border-glass)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: 12, marginBottom: 12 }}>
                        <div>
                          <h3 style={{ margin: 0 }}>{lot.crop_name} - {lot.variety}</h3>
                          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>Expected Base: INR {lot.expected_price_per_ton_inr.toLocaleString('en-IN')}/ton</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>{lot.total_quantity_metric_tons} Tons</span>
                          <span className={`badge ${lot.status === 'CONTRACTED' ? 'badge-active' : 'badge-premium'}`} style={{ display: 'block', textAlign: 'center', marginTop: 4 }}>
                            {lot.status}
                          </span>
                        </div>
                      </div>

                      {/* Bids received on this lot */}
                      <div>
                        <h4 className="input-label" style={{ marginBottom: 8 }}>Bids Received from Buyers</h4>
                        {lot.bids && lot.bids.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {lot.bids.map((bid) => (
                               <div key={bid._id} className="glass-panel" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid var(--border-glass)' }}>
                                <div>
                                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Buyer ID: {bid.buyer_id.substring(18).toUpperCase()}</p>
                                  <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>INR {bid.bid_price_per_ton_inr.toLocaleString('en-IN')} / Ton</p>
                                </div>
                                
                                {bid.status === 'PENDING' && lot.status !== 'CONTRACTED' ? (
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleBidResponse(lot._id, bid._id, 'ACCEPT')}>
                                      <Check size={14} /> Accept
                                    </button>
                                    <button className="btn btn-secondary text-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleBidResponse(lot._id, bid._id, 'REJECT')}>
                                      <X size={14} /> Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className={`badge ${bid.status === 'ACCEPTED' ? 'badge-active' : 'badge-abandoned'}`}>
                                    {bid.status}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-secondary" style={{ fontSize: '0.85rem' }}>No purchase bids logged on this lot yet.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-secondary mt-4">No active sale catalog lots published.</p>
              )}
            </div>
          </>
        )}

        {/* Tab: Analytics */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="grid-cols-2">
              <div className="glass-panel">
                <h2>Revenue Breakdown</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: 12 }}>
                    <span className="text-secondary">Total Contracted Revenue</span>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>₹{totalRevenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: 12 }}>
                    <span className="text-secondary">Lots Published</span>
                    <span style={{ fontWeight: 700 }}>{lots.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: 12 }}>
                    <span className="text-secondary">Bid-to-Contract Ratio</span>
                    <span style={{ fontWeight: 700 }}>{totalBids > 0 ? `${Math.round((contractedLots / Math.max(lots.length, 1)) * 100)}%` : 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12 }}>
                    <span className="text-secondary">Avg Price Realized (per Ton)</span>
                    <span style={{ fontWeight: 700 }}>₹{contractedLots > 0 ? Math.round(totalRevenue / totalVolume).toLocaleString('en-IN') : 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel">
                <h2>Member Performance Leaderboard</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                  {[
                    { name: 'Ramesh Patel', area: '1.2 Ha', contributed: 2.5, cycles: 3, rank: 1 },
                    { name: 'Anil Kumar', area: '2.5 Ha', contributed: 4.8, cycles: 2, rank: 2 },
                    { name: 'Vijay Gowda', area: '1.8 Ha', contributed: 3.2, cycles: 2, rank: 3 },
                    { name: 'Suresh Rao', area: '3.1 Ha', contributed: 2.1, cycles: 1, rank: 4 },
                    { name: 'Manjunath K.', area: '0.8 Ha', contributed: 1.4, cycles: 1, rank: 5 }
                  ].map((m) => (
                    <div key={m.rank} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="flex-center" style={{ width: 28, height: 28, borderRadius: '50%', background: m.rank <= 3 ? 'var(--color-primary-glow)' : 'rgba(255,255,255,0.05)', fontSize: '0.8rem', fontWeight: 700, color: m.rank <= 3 ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                          {m.rank}
                        </div>
                        <div>
                          <span style={{ fontWeight: 600 }}>{m.name}</span>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{m.area} | {m.cycles} cycles</p>
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{m.contributed} Tons</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Procurement activity timeline */}
            <div className="glass-panel">
              <h2>Recent Procurement Activity</h2>
              <div className="milestone-timeline" style={{ marginTop: 16 }}>
                {lots.slice(0, 5).map((lot, idx) => (
                  <div key={lot._id} className="milestone-item">
                    <div className="milestone-track">
                      <div className={`milestone-dot ${lot.status === 'CONTRACTED' ? 'completed' : ''}`}>
                        {lot.status === 'CONTRACTED' ? <Check size={14} color="#fff" /> : <Layers size={12} />}
                      </div>
                      {idx < Math.min(lots.length, 5) - 1 && (
                        <div className={`milestone-line ${lot.status === 'CONTRACTED' ? 'completed' : ''}`} />
                      )}
                    </div>
                    <div className="milestone-body">
                      <h4>{lot.crop_name} - {lot.variety} ({lot.total_quantity_metric_tons} Tons)</h4>
                      <span className="milestone-date">
                        <Calendar size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        Published: {new Date(lot.createdAt || Date.now()).toLocaleDateString('en-IN')}
                      </span>
                      <span className={`milestone-category ${lot.status === 'CONTRACTED' ? 'cat-HARVEST' : lot.status === 'BIDDED' ? 'cat-MONITORING' : 'cat-SOWING'}`}>
                        {lot.status} • {lot.bids?.length || 0} bids
                      </span>
                    </div>
                  </div>
                ))}
                {lots.length === 0 && <p className="text-secondary">No activity to display yet.</p>}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Price Forecast */}
        {activeTab === 'forecast' && (
          <FPOForecastPanel
            forecastCrop={forecastCrop}
            setForecastCrop={setForecastCrop}
            forecastVariety={forecastVariety}
            setForecastVariety={setForecastVariety}
            forecastState={forecastState}
            setForecastState={setForecastState}
            forecastDistrict={forecastDistrict}
            setForecastDistrict={setForecastDistrict}
            forecastLoading={forecastLoading}
            runPriceForecast={runPriceForecast}
            forecastResult={forecastResult}
          />
        )}

        {activeTab === 'traceability' && (
          <FPOTraceabilityPanel
            lots={lots}
            traceRecords={traceRecords}
            traceLoading={traceLoading}
            traceForm={traceForm}
            setTraceForm={setTraceForm}
            createTraceRecord={createTraceRecord}
            apiFetch={apiFetch}
            notify={notify}
            notifySuccess={notifySuccess}
            fetchTraceRecords={fetchTraceRecords}
          />
        )}

        {activeTab === 'members' && (
          <FPOMembersPanel />
        )}

        {activeTab === 'profile' && (
          <ProfilePage />
        )}

        {activeTab === 'subscription' && (
          <SubscriptionPage />
        )}
      </main>
    </div>
  );
};

export default FPODashboard;
