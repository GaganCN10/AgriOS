import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sprout, CloudSun, DollarSign, BrainCircuit, ShieldAlert, 
  ChevronRight, Calendar, User, LogOut, CheckCircle, HelpCircle, 
  MapPin, Plus, FileText, Download, Send, RefreshCw, AlertTriangle,
  Bell, Target, TrendingUp, Zap, Check
} from 'lucide-react';

const FarmerDashboard = () => {
  const { user, logout, getAuthHeaders, upgradeSubscription } = useAuth();
  const [activeTab, setActiveTab] = useState('field-intelligence');
  
  // Farm State
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [loadingFarms, setLoadingFarms] = useState(true);
  
  // Forms & Registration
  const [showAddFarm, setShowAddFarm] = useState(false);
  const [newFarmName, setNewFarmName] = useState('');
  const [newState, setNewState] = useState('Karnataka');
  const [newDistrict, setNewDistrict] = useState('Mysore');
  const [newSubDistrict, setNewSubDistrict] = useState('Hunsur');
  const [newSurvey, setNewSurvey] = useState('');
  const [drawCoords, setDrawCoords] = useState([]);
  const canvasRef = useRef(null);

  // Crop Cycle State
  const [cropCycles, setCropCycles] = useState([]);
  const [activeCycle, setActiveCycle] = useState(null);
  const [showAddCycle, setShowAddCycle] = useState(false);
  const [newCropName, setNewCropName] = useState('Rice');
  const [newVariety, setNewVariety] = useState('Sona Masuri');
  const [newTargetYield, setNewTargetYield] = useState(5.0);
  const [newSowingDate, setNewSowingDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Expenses State
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expCategory, setExpCategory] = useState('SEEDS');
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');

  // Milestones State
  const [completedMilestones, setCompletedMilestones] = useState(() => {
    const saved = localStorage.getItem('agrios_completed_milestones');
    return saved ? JSON.parse(saved) : {};
  });

  const toggleMilestone = (cycleId, milestoneId) => {
    setCompletedMilestones(prev => {
      const current = prev[cycleId] || [];
      const updated = current.includes(milestoneId)
        ? current.filter(id => id !== milestoneId)
        : [...current, milestoneId];
      const next = { ...prev, [cycleId]: updated };
      localStorage.setItem('agrios_completed_milestones', JSON.stringify(next));
      return next;
    });
  };

  // AI Advisor State
  const [chatMessages, setChatMessages] = useState([
    { text: "Greetings! I am your GenAI Agronomy Advisor. I have synchronized with your farm parameters, local weather grids, and soil profile. Ask me anything about fertilizers, water intervals, or pest concerns.", sender: 'bot' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatSession, setChatSession] = useState(`session_${Date.now()}`);
  const [sendingChat, setSendingChat] = useState(false);
  const [chatError, setChatError] = useState(null);

  // Diagnostics State
  const [diagFile, setDiagFile] = useState(null);
  const [diagResult, setDiagResult] = useState(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagError, setDiagError] = useState(null);

  // Mandi prices State
  const [mandiPrices, setMandiPrices] = useState([]);
  const [mandiLoading, setMandiLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [targetAlertCrop, setTargetAlertCrop] = useState('Rice');
  const [targetAlertVariety, setTargetAlertVariety] = useState('Sona Masuri');
  const [targetAlertPrice, setTargetAlertPrice] = useState('');

  // Financial Profile State
  const [finProfile, setFinProfile] = useState(null);
  const [finLoading, setFinLoading] = useState(false);

  // Fetch Farms
  const fetchFarms = async () => {
    try {
      setLoadingFarms(true);
      const res = await fetch('http://localhost:5000/api/farm/all', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setFarms(data);
        if (data.length > 0) {
          setSelectedFarm(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFarms(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  // Fetch Crop Cycles & Mandi Prices when selected farm changes
  useEffect(() => {
    if (selectedFarm) {
      fetchCropCycles(selectedFarm._id);
      fetchMandiPrices(selectedFarm.state, selectedFarm.district);
      fetchFinancialProfile(selectedFarm._id);
    } else {
      setCropCycles([]);
      setActiveCycle(null);
      setFinProfile(null);
    }
  }, [selectedFarm]);

  const fetchCropCycles = async (farmId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/farm/crop/cycles/${farmId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setCropCycles(data);
        const active = data.find(c => c.stage !== 'HARVESTED' && c.stage !== 'ABANDONED');
        setActiveCycle(active || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMandiPrices = async (state, district) => {
    try {
      setMandiLoading(true);
      const res = await fetch(`http://localhost:5000/api/market/prices?state=${state}&district=${district}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setMandiPrices(data.market_prices || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMandiLoading(false);
    }
  };

  const fetchFinancialProfile = async (farmId) => {
    try {
      setFinLoading(true);
      const res = await fetch(`http://localhost:5000/api/farm/financial-profile/${farmId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setFinProfile(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFinLoading(false);
    }
  };

  // Canvas-based boundary mapper helper
  useEffect(() => {
    if (showAddFarm && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      // Draw grid
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      const step = 20;
      for (let i = 0; i < canvas.width; i += step) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw clicked nodes
      if (drawCoords.length > 0) {
        ctx.strokeStyle = '#10b981';
        ctx.fillStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(drawCoords[0][0], drawCoords[0][1], 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(drawCoords[0][0], drawCoords[0][1]);
        for (let idx = 1; idx < drawCoords.length; idx++) {
          ctx.lineTo(drawCoords[idx][0], drawCoords[idx][1]);
          ctx.arc(drawCoords[idx][0], drawCoords[idx][1], 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.moveTo(drawCoords[idx][0], drawCoords[idx][1]);
        }
        ctx.stroke();
      }
    }
  }, [showAddFarm, drawCoords]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setDrawCoords([...drawCoords, [x, y]]);
  };

  const clearCanvas = () => {
    setDrawCoords([]);
  };

  const registerFarm = async (e) => {
    e.preventDefault();
    if (!newFarmName || !newSurvey || drawCoords.length < 3) {
      alert('Please fill farm details and map at least 3 vertices.');
      return;
    }

    // Convert pixels to relative lat-lng mapping for simulated GeoJSON coordinates
    // We base it roughly around Karnataka coordinates (e.g. Lat 12.29, Lng 76.63)
    const baseLng = 76.63;
    const baseLat = 12.29;
    const geoCoords = drawCoords.map(c => [
      parseFloat((baseLng + (c[0] - 150) / 10000).toFixed(6)),
      parseFloat((baseLat + (150 - c[1]) / 10000).toFixed(6))
    ]);
    
    // GeoJSON Polygon requires closed ring: first and last point identical
    geoCoords.push(geoCoords[0]);

    const payload = {
      farm_name: newFarmName,
      state: newState,
      district: newDistrict,
      sub_district: newSubDistrict,
      survey_number: newSurvey,
      boundary_polygon: {
        type: 'Polygon',
        coordinates: [geoCoords]
      },
      soil_profile: {
        nitrogen_level: Math.round(30 + Math.random() * 40),
        phosphorus_level: Math.round(10 + Math.random() * 20),
        potassium_level: Math.round(15 + Math.random() * 25),
        ph_level: parseFloat((6.2 + Math.random() * 1.5).toFixed(1))
      }
    };

    try {
      const res = await fetch('http://localhost:5000/api/farm/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Farm successfully registered! Area Calculated: ${data.calculated_area_hectares} Ha`);
        setShowAddFarm(false);
        setNewFarmName('');
        setNewSurvey('');
        setDrawCoords([]);
        fetchFarms();
      } else {
        alert(data.error || 'Failed to log farm coordinates.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Start Crop Cycle
  const registerCropCycle = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/farm/crop/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          farm_id: selectedFarm._id,
          crop_name: newCropName,
          crop_variety: newVariety,
          sowing_date: newSowingDate,
          target_yield_metric_tons: newTargetYield
        })
      });
      if (res.ok) {
        setShowAddCycle(false);
        fetchCropCycles(selectedFarm._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Log Expense
  const addExpense = async (e) => {
    e.preventDefault();
    if (!expAmount || isNaN(expAmount)) {
      alert('Please fill a valid amount.');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/farm/crop/expense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          cycle_id: activeCycle._id,
          category: expCategory,
          amount_inr: parseFloat(expAmount),
          description: expDesc
        })
      });
      if (res.ok) {
        setExpAmount('');
        setExpDesc('');
        setShowAddExpense(false);
        fetchCropCycles(selectedFarm._id);
        fetchFinancialProfile(selectedFarm._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Chat Advisor
  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingChat) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
    setSendingChat(true);
    setChatError(null);

    try {
      const res = await fetch('http://localhost:5000/api/analytics/advisor-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          session_id: chatSession,
          user_prompt_string: userMsg,
          farm_id: selectedFarm ? selectedFarm._id : null
        })
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => [...prev, { 
          text: data.response_text, 
          sender: 'bot',
          warning: data.warning
        }]);
      } else {
        setChatError(data.error || 'Failed to establish connection to AI sidecar.');
      }
    } catch (err) {
      setChatError('Error connecting to Server.');
    } finally {
      setSendingChat(false);
    }
  };

  // Diagnostics Image Upload
  const handleDiagFileChange = (e) => {
    setDiagFile(e.target.files[0]);
    setDiagResult(null);
    setDiagError(null);
  };

  const runDiagnostics = async (e) => {
    e.preventDefault();
    if (!diagFile || !selectedFarm) {
      alert('Please upload an image and select a farm.');
      return;
    }

    setDiagnosing(true);
    setDiagError(null);
    setDiagResult(null);

    const formData = new FormData();
    formData.append('image_file', diagFile);
    formData.append('farm_id', selectedFarm._id);

    try {
      const res = await fetch('http://localhost:5000/api/analytics/diagnose', {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeaders().Authorization
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setDiagResult(data);
      } else {
        setDiagError(data.error || 'AI Sidecar offline or rejected form payload.');
      }
    } catch (err) {
      setDiagError('Failed to execute diagnostic request.');
    } finally {
      setDiagnosing(false);
    }
  };

  // Download Underwriting PDF
  const triggerPDFDownload = () => {
    if (!selectedFarm) return;
    const url = `http://localhost:5000/api/farm/pdf/${selectedFarm._id}`;
    // Trigger download in new tab
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `AgriOS_Financial_Pack_${selectedFarm.farm_name}.pdf`);
    // Pass JWT via query param or simple download?
    // Since browser <a> clicks can't set headers, we can fetch the blob instead!
    fetch(url, {
      headers: getAuthHeaders()
    })
    .then(response => {
      if (!response.ok) throw new Error('PDF Generation failed');
      return response.blob();
    })
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      a.href = blobUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    })
    .catch(err => alert('Failed to download PDF package: ' + err.message));
  };

  // NDVI Canvas simulation helper
  const renderNDVICanvas = (canvasId) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render multi-spectral simulated bands (Green vegetated patches, yellow stress lines)
    const size = 35;
    for (let x = 0; x < canvas.width; x += size) {
      for (let y = 0; y < canvas.height; y += size) {
        // Calculate dynamic NDVI index representing vegetational density (0.0 to 1.0)
        // High index: Healthy green. Low index: Yellow drought stress
        const ndviVal = parseFloat((0.45 + (Math.sin(x/50) * Math.cos(y/50) * 0.4) + Math.random() * 0.1).toFixed(2));
        
        // Define fill colors
        if (ndviVal > 0.7) {
          ctx.fillStyle = `rgba(5, 150, 105, ${ndviVal - 0.2})`; // Dense emerald
        } else if (ndviVal > 0.5) {
          ctx.fillStyle = `rgba(16, 185, 129, ${ndviVal - 0.2})`; // Light green
        } else if (ndviVal > 0.3) {
          ctx.fillStyle = `rgba(245, 158, 11, ${1 - ndviVal})`; // Amber stress
        } else {
          ctx.fillStyle = `rgba(239, 68, 68, 0.4)`; // Red/dry patch
        }
        ctx.fillRect(x, y, size, size);
        ctx.strokeStyle = 'rgba(255,255,255,0.02)';
        ctx.strokeRect(x, y, size, size);
        
        // Render tiny NDVI value text overlay
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '8px monospace';
        ctx.fillText(ndviVal.toString(), x + 4, y + 20);
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'field-intelligence' && selectedFarm) {
      setTimeout(() => renderNDVICanvas('ndvi-satellite-canvas'), 100);
    }
  }, [activeTab, selectedFarm]);

  // Dynamic Crop Calendar Milestone Generator
  const generateMilestones = (cycle) => {
    if (!cycle) return [];
    const sow = new Date(cycle.sowing_date);
    const add = (days) => new Date(sow.getTime() + days * 86400000).toLocaleDateString('en-IN');
    const cropPlans = {
      Rice: [
        { id: 'soil_prep', label: 'Soil Preparation & Ploughing', day: 0, icon: '🌾', category: 'PREPARATION' },
        { id: 'nursery', label: 'Nursery Bed & Seed Sowing', day: 3, icon: '🌱', category: 'SOWING' },
        { id: 'transplant', label: 'Transplanting Seedlings', day: 25, icon: '🌿', category: 'SOWING' },
        { id: 'fert1', label: 'Basal Fertilizer Application (NPK)', day: 28, icon: '⚗️', category: 'FERTILIZER' },
        { id: 'irr1', label: 'First Irrigation Cycle', day: 32, icon: '💧', category: 'IRRIGATION' },
        { id: 'weed1', label: 'Weed Control Spray', day: 40, icon: '🌿', category: 'WEED_CONTROL' },
        { id: 'fert2', label: 'Top Dressing - Urea Application', day: 50, icon: '⚗️', category: 'FERTILIZER' },
        { id: 'pest1', label: 'Pest Scouting & Insecticide Spray', day: 60, icon: '🔬', category: 'PEST_CONTROL' },
        { id: 'irr2', label: 'Second Irrigation Cycle', day: 70, icon: '💧', category: 'IRRIGATION' },
        { id: 'heading', label: 'Panicle Initiation & Heading Stage', day: 80, icon: '🌾', category: 'MONITORING' },
        { id: 'harvest', label: 'Harvest & Threshing Operations', day: 120, icon: '🚜', category: 'HARVEST' },
      ],
      Wheat: [
        { id: 'soil_prep', label: 'Deep Ploughing & Field Levelling', day: 0, icon: '🌾', category: 'PREPARATION' },
        { id: 'sow', label: 'Seed Drill Sowing', day: 2, icon: '🌱', category: 'SOWING' },
        { id: 'irr1', label: 'Crown Root Irrigation', day: 21, icon: '💧', category: 'IRRIGATION' },
        { id: 'fert1', label: 'Top Dressing Urea (1st Split)', day: 25, icon: '⚗️', category: 'FERTILIZER' },
        { id: 'irr2', label: 'Tillering Stage Irrigation', day: 42, icon: '💧', category: 'IRRIGATION' },
        { id: 'pest1', label: 'Yellow Rust & Aphid Monitoring', day: 55, icon: '🔬', category: 'PEST_CONTROL' },
        { id: 'fert2', label: 'Top Dressing Urea (2nd Split)', day: 60, icon: '⚗️', category: 'FERTILIZER' },
        { id: 'irr3', label: 'Flag Leaf Irrigation', day: 75, icon: '💧', category: 'IRRIGATION' },
        { id: 'harvest', label: 'Mechanical Harvesting & Bundling', day: 120, icon: '🚜', category: 'HARVEST' },
      ],
    };

    const plan = cropPlans[cycle.crop_name] || cropPlans.Rice;
    return plan.map(m => ({ ...m, scheduled_date: add(m.day) }));
  };

  // Yield Prediction State
  const [yieldPrediction, setYieldPrediction] = useState(null);
  const [yieldLoading, setYieldLoading] = useState(false);

  const runYieldPrediction = async () => {
    if (!activeCycle) return;
    setYieldLoading(true);
    setYieldPrediction(null);
    try {
      const res = await fetch('http://localhost:5000/api/analytics/predict-yield', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ crop_cycle_id: activeCycle._id, atmospheric_override: false })
      });
      const data = await res.json();
      if (res.ok) setYieldPrediction(data);
      else setYieldPrediction({ error: data.error || 'Prediction failed.' });
    } catch (err) {
      setYieldPrediction({ error: 'Server unreachable.' });
    } finally {
      setYieldLoading(false);
    }
  };

  // Price Alert creation state
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertCrop, setAlertCrop] = useState('Rice');
  const [alertVariety, setAlertVariety] = useState('Sona Masuri');
  const [alertPrice, setAlertPrice] = useState('');
  const [alertDirection, setAlertDirection] = useState('ABOVE');
  const [userAlerts, setUserAlerts] = useState([]);

  const fetchUserAlerts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/market/alert/all', { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) setUserAlerts(data);
    } catch (err) { console.error(err); }
  };

  const createPriceAlert = async (e) => {
    e.preventDefault();
    if (!alertPrice) return;
    try {
      const res = await fetch('http://localhost:5000/api/market/alert/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ crop_name: alertCrop, variety: alertVariety, target_price: parseFloat(alertPrice), comparison: alertDirection })
      });
      if (res.ok) {
        setShowAlertForm(false);
        setAlertPrice('');
        fetchUserAlerts();
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (activeTab === 'field-intelligence') fetchUserAlerts();
  }, [activeTab]);

  return (
    <div className="app-container">
      {/* Sidebar Nav */}
      <aside className="sidebar">
        <div className="flex-center" style={{ gap: 8, marginBottom: 32, justifyContent: 'flex-start' }}>
          <span style={{ fontSize: '1.75rem' }}>🌱</span>
          <div>
            <h3 style={{ margin: 0, fontWeight: 700, letterSpacing: -0.5 }}>AgriOS</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enterprise Agriculture OS</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 12, marginBottom: 24, background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="flex-center" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-primary-glow)' }}>
              <User size={18} className="text-primary" />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.name}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className={`badge ${user.subscription_tier !== 'FREE' ? 'badge-premium' : 'badge-free'}`} style={{ fontSize: '0.6rem', padding: '1px 6px' }}>
                  {user.subscription_tier}
                </span>
              </div>
            </div>
          </div>
          
          {user.subscription_tier === 'FREE' && (
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', fontSize: '0.75rem', padding: '6px 12px', marginTop: 12 }}
              onClick={async () => {
                try {
                  await upgradeSubscription('PREMIUM_GROWER');
                  alert('Upgraded to Premium Tier! High-compute ML pipelines active.');
                } catch (err) {
                  alert(err.message);
                }
              }}
            >
              Upgrade to Premium
            </button>
          )}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <button 
            className={`btn btn-secondary ${activeTab === 'field-intelligence' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
            onClick={() => setActiveTab('field-intelligence')}
          >
            <CloudSun size={18} /> Field Intelligence
          </button>
          
          <button 
            className={`btn btn-secondary ${activeTab === 'crop-operations' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
            onClick={() => setActiveTab('crop-operations')}
          >
            <Sprout size={18} /> Crop Operations
          </button>

          <button 
            className={`btn btn-secondary ${activeTab === 'ai-advisor' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
            onClick={() => setActiveTab('ai-advisor')}
          >
            <BrainCircuit size={18} /> GenAI advisor
          </button>

          <button 
            className={`btn btn-secondary ${activeTab === 'crop-diagnostics' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
            onClick={() => setActiveTab('crop-diagnostics')}
          >
            <ShieldAlert size={18} /> Disease Diagnostics
          </button>

          <button 
            className={`btn btn-secondary ${activeTab === 'financial-profile' ? 'btn-primary' : ''}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
            onClick={() => setActiveTab('financial-profile')}
          >
            <FileText size={18} /> Credit Portfolio
          </button>
        </nav>

        <button className="btn btn-secondary text-danger" style={{ marginTop: 'auto', justifyContent: 'flex-start' }} onClick={logout}>
          <LogOut size={18} /> Disconnect
        </button>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        <header className="mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Farmer Console</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Observe multi-spectral plots, schedule tasks, and evaluate credit eligibility.</p>
          </div>
          
          {/* Farm selector dropdown */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {loadingFarms ? (
              <RefreshCw className="animate-spin" size={20} />
            ) : farms.length > 0 ? (
              <select 
                className="input-field" 
                style={{ background: 'var(--bg-surface)', padding: '8px 16px', minWidth: 200 }}
                value={selectedFarm ? selectedFarm._id : ''}
                onChange={(e) => {
                  const farm = farms.find(f => f._id === e.target.value);
                  setSelectedFarm(farm);
                }}
              >
                {farms.map(f => (
                  <option key={f._id} value={f._id}>{f.farm_name} ({f.survey_number})</option>
                ))}
              </select>
            ) : (
              <span style={{ fontSize: '0.9rem', color: 'var(--color-danger)' }}>No Registered Land Holdings</span>
            )}
            
            <button className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={() => { setShowAddFarm(true); clearCanvas(); }}>
              <Plus size={16} /> Add Land
            </button>
          </div>
        </header>

        {/* Modal for adding farm */}
        {showAddFarm && (
          <div className="glass-panel" style={{ marginBottom: 30, border: '1px solid var(--color-primary)' }}>
            <h2>Register New Land Boundary</h2>
            <p className="mb-4 text-secondary">Click nodes inside the grid map coordinate to draw your farm outline. Ensure you click at least 3 points. The ring closes automatically.</p>
            
            <div className="grid-cols-2">
              <form onSubmit={registerFarm}>
                <div className="input-group">
                  <span className="input-label">Farm/Plot Identifier Name</span>
                  <input className="input-field" required value={newFarmName} onChange={(e) => setNewFarmName(e.target.value)} placeholder="e.g. Rice Plot West" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group">
                    <span className="input-label">State</span>
                    <input className="input-field" required value={newState} onChange={(e) => setNewState(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <span className="input-label">District</span>
                    <input className="input-field" required value={newDistrict} onChange={(e) => setNewDistrict(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group">
                    <span className="input-label">Sub-District / Taluk</span>
                    <input className="input-field" required value={newSubDistrict} onChange={(e) => setNewSubDistrict(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <span className="input-label">Government Survey Number</span>
                    <input className="input-field" required value={newSurvey} onChange={(e) => setNewSurvey(e.target.value)} placeholder="e.g. 142/3A" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <button className="btn btn-primary" type="submit">Log Plot Outlines</button>
                  <button className="btn btn-secondary" type="button" onClick={() => setShowAddFarm(false)}>Cancel</button>
                </div>
              </form>

              <div>
                <span className="input-label">Interactive Land Mapper</span>
                <div className="observation-map flex-center" style={{ height: 260, cursor: 'crosshair', position: 'relative' }}>
                  <canvas 
                    ref={canvasRef} 
                    width={300} 
                    height={240} 
                    onClick={handleCanvasClick}
                    style={{ background: '#0b0f19', borderRadius: 8 }}
                  />
                  <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={clearCanvas}>Clear Outline</button>
                  </div>
                </div>
                <span className="text-secondary" style={{ fontSize: '0.75rem', display: 'block', marginTop: 4 }}>
                  Mapped nodes: {drawCoords.length} vertices.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic content panels based on active tab */}
        {selectedFarm ? (
          <div>
            {/* Tab 1: Field Intelligence */}
            {activeTab === 'field-intelligence' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="grid-cols-3">
                  <div className="glass-panel">
                    <span className="text-secondary" style={{ fontSize: '0.8rem' }}>VEGETATIONAL INDEX (NDVI)</span>
                    <h2 style={{ color: 'var(--color-primary)', fontSize: '2.5rem', fontWeight: 800, margin: '8px 0' }}>0.78</h2>
                    <span className="badge badge-active">High Vigor Vigorously Green</span>
                  </div>
                  <div className="glass-panel">
                    <span className="text-secondary" style={{ fontSize: '0.8rem' }}>LOCAL GRID WEATHER FORECAST</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.5rem' }}>28.5°C</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rain: 120mm accum.</p>
                      </div>
                      <CloudSun size={36} className="text-primary" />
                    </div>
                  </div>
                  <div className="glass-panel">
                    <span className="text-secondary" style={{ fontSize: '0.8rem' }}>SOIL NITRIC LEVEL BALANCE</span>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '8px 0', color: '#38bdf8' }}>
                      {selectedFarm.soil_profile.nitrogen_level} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>mg/kg</span>
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>pH factor: {selectedFarm.soil_profile.ph_level}</p>
                  </div>
                </div>

                <div className="grid-cols-2">
                  <div className="glass-panel">
                    <h2>Sentinel Satellite Grid Inspection (NDVI)</h2>
                    <div className="observation-map mb-4">
                      <canvas id="ndvi-satellite-canvas" width={500} height={350} style={{ width: '100%', height: '100%' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', justifyContent: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 12, height: 12, background: 'rgba(5, 150, 105, 0.7)' }}></span> NDVI &gt; 0.7 (Healthy)</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 12, height: 12, background: 'rgba(245, 158, 11, 0.7)' }}></span> NDVI 0.3-0.5 (Stress)</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 12, height: 12, background: 'rgba(239, 68, 68, 0.4)' }}></span> NDVI &lt; 0.3 (Drought)</span>
                    </div>
                  </div>

                  <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <h2>AGMARKNET Local Wholesale Mandi Prices</h2>
                    {mandiLoading ? (
                      <div className="flex-center" style={{ flex: 1 }}><RefreshCw className="animate-spin" /></div>
                    ) : mandiPrices.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto', maxHeight: 350 }}>
                        {mandiPrices.map((price) => (
                          <div key={price.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <h3 style={{ margin: 0 }}>{price.crop} ({price.variety})</h3>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{price.market}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>INR {price.modal_price} / Qtl</span>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Range: {price.min_price} - {price.max_price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-secondary">No regional wholesale rates cataloged.</p>
                    )}
                  </div>
                </div>

                {/* Price Alert Management */}
                <div className="glass-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2><Bell size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Price Alert Watchlist</h2>
                    <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => setShowAlertForm(!showAlertForm)}>
                      <Plus size={14} /> New Alert
                    </button>
                  </div>

                  {showAlertForm && (
                    <form onSubmit={createPriceAlert} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16, padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 10 }}>
                      <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: 120 }}>
                        <span className="input-label">Crop</span>
                        <select className="input-field" style={{ padding: '8px 12px' }} value={alertCrop} onChange={(e) => setAlertCrop(e.target.value)}>
                          <option value="Rice">Rice</option>
                          <option value="Wheat">Wheat</option>
                          <option value="Tomato">Tomato</option>
                          <option value="Onion">Onion</option>
                          <option value="Potato">Potato</option>
                        </select>
                      </div>
                      <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: 120 }}>
                        <span className="input-label">Variety</span>
                        <input className="input-field" style={{ padding: '8px 12px' }} value={alertVariety} onChange={(e) => setAlertVariety(e.target.value)} />
                      </div>
                      <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: 100 }}>
                        <span className="input-label">Target Price (INR/Qtl)</span>
                        <input className="input-field" style={{ padding: '8px 12px' }} type="number" value={alertPrice} onChange={(e) => setAlertPrice(e.target.value)} placeholder="4500" />
                      </div>
                      <div className="input-group" style={{ marginBottom: 0, minWidth: 100 }}>
                        <span className="input-label">Trigger When</span>
                        <select className="input-field" style={{ padding: '8px 12px' }} value={alertDirection} onChange={(e) => setAlertDirection(e.target.value)}>
                          <option value="ABOVE">Price Goes Above</option>
                          <option value="BELOW">Price Falls Below</option>
                        </select>
                      </div>
                      <button className="btn btn-primary" type="submit" style={{ padding: '8px 16px' }}>Set Alert</button>
                    </form>
                  )}

                  {userAlerts.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {userAlerts.map((al) => (
                        <div key={al._id} className={`alert-card ${al.is_triggered ? 'alert-triggered' : ''}`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className={`pulse-dot ${al.is_triggered ? '' : 'pulse-dot-warn'}`} />
                            <div>
                              <span style={{ fontWeight: 600 }}>{al.crop_name} ({al.variety})</span>
                              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                                Alert when price goes {al.comparison === 'ABOVE' ? 'above' : 'below'} ₹{al.target_price}/Qtl
                              </p>
                            </div>
                          </div>
                          <span className={`badge ${al.is_triggered ? 'badge-active' : 'badge-premium'}`}>
                            {al.is_triggered ? 'TRIGGERED' : 'WATCHING'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-secondary" style={{ fontSize: '0.9rem' }}>No price alerts configured. Create one to receive market movement notifications.</p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Crop Operations & Expense Logs */}
            {activeTab === 'crop-operations' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2>Active Crop Cultivation lifecycle</h2>
                    {activeCycle ? (
                      <div>
                        <h3 style={{ color: 'var(--color-primary)' }}>{activeCycle.crop_name} - {activeCycle.crop_variety}</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Sowing scheduled: {new Date(activeCycle.sowing_date).toLocaleDateString()}</p>
                      </div>
                    ) : (
                      <p className="text-secondary">No active crop cycle registered for this plot.</p>
                    )}
                  </div>
                  <div>
                    {activeCycle ? (
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-secondary" onClick={() => setShowAddExpense(true)}><Plus size={16} /> Log Expense</button>
                        <button 
                          className="btn btn-primary"
                          onClick={async () => {
                            const y = prompt('Enter final yield in metric tons:');
                            if (!y || isNaN(y)) return;
                            try {
                              const res = await fetch(`http://localhost:5000/api/farm/crop/stage/${activeCycle._id}`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  ...getAuthHeaders()
                                },
                                body: JSON.stringify({ stage: 'HARVESTED', actual_yield_metric_tons: parseFloat(y) })
                              });
                              if (res.ok) {
                                alert('Crop cycle harvest finalized!');
                                fetchCropCycles(selectedFarm._id);
                                fetchFinancialProfile(selectedFarm._id);
                              }
                            } catch (err) { console.error(err); }
                          }}
                        >
                          Mark Harvested
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-primary" onClick={() => setShowAddCycle(true)}>Start New Crop Cycle</button>
                    )}
                  </div>
                </div>

                {/* Form to start crop cycle */}
                {showAddCycle && (
                  <form className="glass-panel" onSubmit={registerCropCycle} style={{ border: '1px solid var(--color-primary)' }}>
                    <h3>Initialize Sowing Schedule</h3>
                    <div className="grid-cols-2" style={{ marginTop: 12 }}>
                      <div className="input-group">
                        <span className="input-label">Crop Category</span>
                        <select className="input-field" value={newCropName} onChange={(e) => setNewCropName(e.target.value)}>
                          <option value="Rice">Rice</option>
                          <option value="Wheat">Wheat</option>
                          <option value="Tomato">Tomato</option>
                          <option value="Onion">Onion</option>
                          <option value="Potato">Potato</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <span className="input-label">Variety</span>
                        <input className="input-field" required value={newVariety} onChange={(e) => setNewVariety(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid-cols-2">
                      <div className="input-group">
                        <span className="input-label">Target Yield (Metric Tons)</span>
                        <input className="input-field" type="number" step="0.1" required value={newTargetYield} onChange={(e) => setNewTargetYield(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <span className="input-label">Sowing Date</span>
                        <input className="input-field" type="date" required value={newSowingDate} onChange={(e) => setNewSowingDate(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                      <button className="btn btn-primary" type="submit">Log Sowing Milestone</button>
                      <button className="btn btn-secondary" type="button" onClick={() => setShowAddCycle(false)}>Cancel</button>
                    </div>
                  </form>
                )}

                {/* Form to log expense */}
                {showAddExpense && (
                  <form className="glass-panel" onSubmit={addExpense} style={{ border: '1px solid var(--color-primary)' }}>
                    <h3>Log operational Expense</h3>
                    <div className="grid-cols-3" style={{ marginTop: 12 }}>
                      <div className="input-group">
                        <span className="input-label">Category</span>
                        <select className="input-field" value={expCategory} onChange={(e) => setExpCategory(e.target.value)}>
                          <option value="SEEDS">Seeds</option>
                          <option value="FERTILIZER">Fertilizers</option>
                          <option value="LABOR">Labor Wages</option>
                          <option value="IRRIGATION">Water Supply</option>
                          <option value="FUEL">Fuel / Transport</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <span className="input-label">Cost (INR)</span>
                        <input className="input-field" type="number" required value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="Amount in Rupees" />
                      </div>
                      <div className="input-group">
                        <span className="input-label">Description / Particulars</span>
                        <input className="input-field" value={expDesc} onChange={(e) => setExpDesc(e.target.value)} placeholder="e.g. 5 bags of urea" />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                      <button className="btn btn-primary" type="submit">Append Ledger Expense</button>
                      <button className="btn btn-secondary" type="button" onClick={() => setShowAddExpense(false)}>Cancel</button>
                    </div>
                  </form>
                )}

                {/* Crop cycles history */}
                <div className="glass-panel">
                  <h2>Crop Cycle Logs & Ledgers</h2>
                  {cropCycles.length > 0 ? (
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Crop</th>
                          <th>Variety</th>
                          <th>Stage</th>
                          <th>Sowing Date</th>
                          <th>Target Yield</th>
                          <th>Actual Yield</th>
                          <th>Cultivation Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cropCycles.map((c) => {
                          const totalExp = c.expense_ledger.reduce((sum, item) => sum + item.amount_inr, 0);
                          return (
                            <tr key={c._id}>
                              <td><strong>{c.crop_name}</strong></td>
                              <td>{c.crop_variety}</td>
                              <td>
                                <span className={`badge ${c.stage === 'HARVESTED' ? 'badge-active' : c.stage === 'ABANDONED' ? 'badge-abandoned' : 'badge-premium'}`}>
                                  {c.stage}
                                </span>
                              </td>
                              <td>{new Date(c.sowing_date).toLocaleDateString()}</td>
                              <td>{c.target_yield_metric_tons} tons</td>
                              <td>{c.stage === 'HARVESTED' ? `${c.actual_yield_metric_tons} tons` : 'N/A'}</td>
                              <td>INR {totalExp.toLocaleString('en-IN')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-secondary mt-4">No historical records logged for this land.</p>
                  )}
                </div>

                {/* Dynamic Crop Calendar Milestone Timeline */}
                {activeCycle && (
                  <div className="grid-cols-2">
                    <div className="glass-panel">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <h2>🗓️ Crop Calendar Timeline</h2>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                            {completedMilestones.length}/{generateMilestones(activeCycle).length}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Tasks Done</span>
                        </div>
                      </div>
                      <div className="progress-bar-container" style={{ marginBottom: 20 }}>
                        <div className="progress-bar-fill" style={{ width: `${(completedMilestones.length / Math.max(generateMilestones(activeCycle).length, 1)) * 100}%` }} />
                      </div>
                      <div className="milestone-timeline" style={{ maxHeight: 480, overflowY: 'auto', paddingRight: 8 }}>
                        {generateMilestones(activeCycle).map((m, idx, arr) => {
                          const isCompleted = completedMilestones.includes(m.id);
                          const mDate = new Date(m.scheduled_date.split('/').reverse().join('-'));
                          const isOverdue = !isCompleted && mDate < new Date();
                          return (
                            <div key={m.id} className="milestone-item">
                              <div className="milestone-track">
                                <div 
                                  className={`milestone-dot ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}
                                  onClick={() => toggleMilestone(m.id)}
                                  title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                                >
                                  {isCompleted ? <Check size={14} color="#fff" /> : <span>{m.icon}</span>}
                                </div>
                                {idx < arr.length - 1 && (
                                  <div className={`milestone-line ${isCompleted ? 'completed' : ''}`} />
                                )}
                              </div>
                              <div className="milestone-body">
                                <h4 style={{ textDecoration: isCompleted ? 'line-through' : 'none', opacity: isCompleted ? 0.6 : 1 }}>{m.label}</h4>
                                <span className="milestone-date">
                                  <Calendar size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                  Scheduled: {m.scheduled_date}
                                  {isOverdue && <span style={{ color: 'var(--color-accent)', marginLeft: 8, fontWeight: 600 }}>⚠ OVERDUE</span>}
                                </span>
                                <span className={`milestone-category cat-${m.category}`}>{m.category.replace('_', ' ')}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Yield Prediction Panel */}
                    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2><TrendingUp size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />ML Yield Forecast</h2>
                        <span className="badge badge-premium">Premium ML</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Run the AI yield regression model against current crop cycle parameters, soil profiles, and atmospheric data to estimate harvest output.
                      </p>

                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <div className="glass-card" style={{ flex: 1, minWidth: 140 }}>
                          <span className="text-secondary" style={{ fontSize: '0.75rem' }}>CROP</span>
                          <p style={{ fontWeight: 600, margin: '4px 0 0' }}>{activeCycle.crop_name}</p>
                        </div>
                        <div className="glass-card" style={{ flex: 1, minWidth: 140 }}>
                          <span className="text-secondary" style={{ fontSize: '0.75rem' }}>VARIETY</span>
                          <p style={{ fontWeight: 600, margin: '4px 0 0' }}>{activeCycle.crop_variety}</p>
                        </div>
                        <div className="glass-card" style={{ flex: 1, minWidth: 140 }}>
                          <span className="text-secondary" style={{ fontSize: '0.75rem' }}>TARGET YIELD</span>
                          <p style={{ fontWeight: 600, margin: '4px 0 0' }}>{activeCycle.target_yield_metric_tons} tons</p>
                        </div>
                        <div className="glass-card" style={{ flex: 1, minWidth: 140 }}>
                          <span className="text-secondary" style={{ fontSize: '0.75rem' }}>SOIL pH</span>
                          <p style={{ fontWeight: 600, margin: '4px 0 0' }}>{selectedFarm.soil_profile.ph_level}</p>
                        </div>
                      </div>

                      <button 
                        className="btn btn-primary" 
                        style={{ alignSelf: 'flex-start' }}
                        onClick={runYieldPrediction} 
                        disabled={yieldLoading || user.subscription_tier === 'FREE'}
                      >
                        {yieldLoading ? (
                          <><RefreshCw className="animate-spin" size={16} /> Computing Prediction Vector...</>
                        ) : (
                          <><Zap size={16} /> Execute Yield Prediction</>
                        )}
                      </button>

                      {user.subscription_tier === 'FREE' && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-accent)' }}>
                          <AlertTriangle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                          Premium subscription required for ML yield forecasting.
                        </p>
                      )}

                      {yieldPrediction && (
                        <div className="prediction-card">
                          {yieldPrediction.error ? (
                            <div style={{ color: 'var(--color-danger)' }}>
                              <AlertTriangle size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                              {yieldPrediction.error}
                            </div>
                          ) : (
                            <>
                              <span className="input-label" style={{ marginBottom: 12, display: 'block' }}>Prediction Results</span>
                              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                                <div>
                                  <span className="text-secondary" style={{ fontSize: '0.75rem' }}>ESTIMATED YIELD</span>
                                  <h2 style={{ color: 'var(--color-primary)', margin: '4px 0 0', fontSize: '2rem' }}>
                                    {yieldPrediction.predicted_yield_metric_tons?.toFixed(2) || yieldPrediction.estimated_yield_metric_tons?.toFixed(2) || 'N/A'}
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}> tons</span>
                                  </h2>
                                </div>
                                <div>
                                  <span className="text-secondary" style={{ fontSize: '0.75rem' }}>CONFIDENCE</span>
                                  <h2 style={{ margin: '4px 0 0', fontSize: '2rem' }}>
                                    {yieldPrediction.confidence ? `${Math.round(yieldPrediction.confidence * 100)}%` : 'N/A'}
                                  </h2>
                                </div>
                              </div>
                              {yieldPrediction.advisory && (
                                <p style={{ marginTop: 12, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                  <strong>Advisory:</strong> {yieldPrediction.advisory}
                                </p>
                              )}
                              {yieldPrediction.degradation_notice && (
                                <div style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--color-accent)', display: 'flex', gap: 6, alignItems: 'center' }}>
                                  <AlertTriangle size={14} /> {yieldPrediction.degradation_notice}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: AI Advisor */}
            {activeTab === 'ai-advisor' && (
              <div className="glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2>GenAI Agricultural Advisory</h2>
                  <span className="badge badge-premium">Premium Gated</span>
                </div>
                
                {user.subscription_tier === 'FREE' ? (
                  <div className="flex-center" style={{ flexDirection: 'column', gap: 16, padding: '40px 0' }}>
                    <BrainCircuit size={48} className="text-muted" />
                    <h3>Conversational Advisor Locked</h3>
                    <p className="text-secondary" style={{ textAlign: 'center', maxWidth: 450 }}>
                      Accessing the interactive context-aware RAG advisor requires upgrading your account to the premium tier.
                    </p>
                  </div>
                ) : (
                  <div className="chat-container">
                    <div className="chat-messages">
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`chat-bubble ${msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}`}>
                          {msg.text}
                          {msg.warning && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-accent)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <AlertTriangle size={10} /> {msg.warning}
                            </div>
                          )}
                        </div>
                      ))}
                      {sendingChat && (
                        <div className="chat-bubble chat-bubble-bot" style={{ display: 'flex', gap: 4 }}>
                          <span className="animate-pulse">●</span>
                          <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</span>
                          <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</span>
                        </div>
                      )}
                      {chatError && (
                        <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--color-danger)', color: 'var(--color-danger)', fontSize: '0.9rem', padding: '8px 12px', alignSelf: 'center' }}>
                          {chatError}
                        </div>
                      )}
                    </div>

                    <form onSubmit={sendChatMessage} style={{ display: 'flex', gap: 12 }}>
                      <input 
                        className="input-field" 
                        style={{ flex: 1 }} 
                        value={chatInput} 
                        onChange={(e) => setChatInput(e.target.value)} 
                        placeholder="Ask about fertilizer split doses, water schedules, or pest safety..." 
                        disabled={sendingChat}
                      />
                      <button className="btn btn-primary" type="submit" disabled={sendingChat}>
                        <Send size={16} /> Send
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Crop Disease Diagnostics */}
            {activeTab === 'crop-diagnostics' && (
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
                        <div className="flex-center" style={{ height: '100%', background: 'rgba(0,0,0,0.1)', borderRadius: 12, border: '1px dashed var(--border-glass)', padding: 30 }}>
                          <p className="text-secondary">Please select and upload a picture to run the active inference pipeline.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 5: Credit Portfolio & PMFBY Compliance */}
            {activeTab === 'financial-profile' && (
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
            )}
          </div>
        ) : (
          <div className="glass-panel flex-center" style={{ flexDirection: 'column', gap: 20, minHeight: 300, border: '1px dashed var(--border-glass)' }}>
            <MapPin size={48} className="text-muted" />
            <div style={{ textAlign: 'center' }}>
              <h3>No Registered Farm Profiles Found</h3>
              <p className="text-secondary mt-4">Please click the "Add Land" button to map your coordinate boundaries and launch crop intelligence operations.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FarmerDashboard;
