import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sprout, CloudSun, DollarSign, BrainCircuit, ShieldAlert, 
  ChevronRight, Calendar, User, LogOut, CheckCircle, HelpCircle, 
  MapPin, Plus, FileText, Download, Send, RefreshCw, AlertTriangle,
  Bell, Target, TrendingUp, Zap, Check
} from 'lucide-react';
import FarmerAdvisorPanel from './farmer/FarmerAdvisorPanel';
import FarmerDiagnosticsPanel from './farmer/FarmerDiagnosticsPanel';
import FarmerFinancialPanel from './farmer/FarmerFinancialPanel';
import FarmerFieldIntelligencePanel from './farmer/FarmerFieldIntelligencePanel';
import FarmerCropOperationsPanel from './farmer/FarmerCropOperationsPanel';

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
  const [stageUpdate, setStageUpdate] = useState('VEGETATIVE');

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
  const [diagHistory, setDiagHistory] = useState([]);
  const [diagHistoryLoading, setDiagHistoryLoading] = useState(false);

  // Mandi prices State
  const [mandiPrices, setMandiPrices] = useState([]);
  const [mandiLoading, setMandiLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);
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
        setTriggeredAlerts(data.triggered_alerts || []);
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

  const updateCropStage = async () => {
    if (!activeCycle) return;

    let actualYieldMetricTons = undefined;
    if (stageUpdate === 'HARVESTED') {
      const enteredYield = prompt('Enter actual harvest yield in metric tons:');
      if (enteredYield === null) {
        return;
      }
      if (enteredYield.trim() === '' || Number.isNaN(Number(enteredYield))) {
        alert('Please enter a valid harvest yield.');
        return;
      }
      actualYieldMetricTons = parseFloat(enteredYield);
    }

    try {
      const res = await fetch(`http://localhost:5000/api/farm/crop/stage/${activeCycle._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          stage: stageUpdate,
          ...(actualYieldMetricTons !== undefined ? { actual_yield_metric_tons: actualYieldMetricTons } : {})
        })
      });

      const data = await res.json();
      if (res.ok) {
        fetchCropCycles(selectedFarm._id);
        fetchFinancialProfile(selectedFarm._id);
      } else {
        alert(data.error || 'Failed to update crop stage.');
      }
    } catch (err) {
      alert('Failed to update crop stage.');
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
        fetchMyDiseaseLogs();
      } else {
        setDiagError(data.error || 'AI Sidecar offline or rejected form payload.');
      }
    } catch (err) {
      setDiagError('Failed to execute diagnostic request.');
    } finally {
      setDiagnosing(false);
    }
  };

  const fetchMyDiseaseLogs = async () => {
    try {
      setDiagHistoryLoading(true);
      const res = await fetch('http://localhost:5000/api/analytics/disease-logs/mine', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setDiagHistory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDiagHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'crop-diagnostics' && user.subscription_tier !== 'FREE') {
      fetchMyDiseaseLogs();
    }
  }, [activeTab, user.subscription_tier]);

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

                  {triggeredAlerts.length > 0 && (
                    <div style={{ marginTop: 18, padding: 14, borderRadius: 12, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Bell size={14} className="text-primary" />
                        <strong>Triggered Price Alerts</strong>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {triggeredAlerts.map((alert) => (
                          <div key={alert.id} className="glass-card" style={{ padding: 10, background: 'rgba(0,0,0,0.15)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                              <div>
                                <strong>{alert.crop_name} ({alert.variety})</strong>
                                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                  Market price {alert.comparison === 'ABOVE' ? 'rose above' : 'fell below'} ₹{alert.target_price}/Qtl in {alert.market}.
                                </p>
                              </div>
                              <span className="badge badge-active">Triggered</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
              <FarmerFieldIntelligencePanel
                selectedFarm={selectedFarm}
                mandiPrices={mandiPrices}
                mandiLoading={mandiLoading}
                triggeredAlerts={triggeredAlerts}
                showAlertForm={showAlertForm}
                setShowAlertForm={setShowAlertForm}
                alertCrop={alertCrop}
                setAlertCrop={setAlertCrop}
                alertVariety={alertVariety}
                setAlertVariety={setAlertVariety}
                alertPrice={alertPrice}
                setAlertPrice={setAlertPrice}
                alertDirection={alertDirection}
                setAlertDirection={setAlertDirection}
                userAlerts={userAlerts}
                createPriceAlert={createPriceAlert}
                fetchUserAlerts={fetchUserAlerts}
              />
            )}

            {/* Tab 2: Crop Operations & Expense Logs */}
            {activeTab === 'crop-operations' && (
              <FarmerCropOperationsPanel
                activeCycle={activeCycle}
                cropCycles={cropCycles}
                newCropName={newCropName}
                setNewCropName={setNewCropName}
                newVariety={newVariety}
                setNewVariety={setNewVariety}
                newTargetYield={newTargetYield}
                setNewTargetYield={setNewTargetYield}
                newSowingDate={newSowingDate}
                setNewSowingDate={setNewSowingDate}
                showAddCycle={showAddCycle}
                setShowAddCycle={setShowAddCycle}
                registerCropCycle={registerCropCycle}
                showAddExpense={showAddExpense}
                setShowAddExpense={setShowAddExpense}
                expCategory={expCategory}
                setExpCategory={setExpCategory}
                expAmount={expAmount}
                setExpAmount={setExpAmount}
                expDesc={expDesc}
                setExpDesc={setExpDesc}
                addExpense={addExpense}
                stageUpdate={stageUpdate}
                setStageUpdate={setStageUpdate}
                updateCropStage={updateCropStage}
                selectedFarm={selectedFarm}
                yieldPrediction={yieldPrediction}
                yieldLoading={yieldLoading}
                runYieldPrediction={runYieldPrediction}
                user={user}
                completedMilestones={completedMilestones}
                generateMilestones={generateMilestones}
                toggleMilestone={toggleMilestone}
                fetchFinancialProfile={fetchFinancialProfile}
                fetchCropCycles={fetchCropCycles}
              />
            )}

            {/* Tab 3: AI Advisor */}
            {activeTab === 'ai-advisor' && (
              <FarmerAdvisorPanel
                user={user}
                chatMessages={chatMessages}
                sendingChat={sendingChat}
                chatError={chatError}
                chatInput={chatInput}
                setChatInput={setChatInput}
                sendChatMessage={sendChatMessage}
              />
            )}

            {/* Tab 4: Crop Disease Diagnostics */}
            {activeTab === 'crop-diagnostics' && (
              <FarmerDiagnosticsPanel
                user={user}
                diagFile={diagFile}
                diagResult={diagResult}
                diagnosing={diagnosing}
                diagError={diagError}
                handleDiagFileChange={handleDiagFileChange}
                runDiagnostics={runDiagnostics}
                diagHistory={diagHistory}
                diagHistoryLoading={diagHistoryLoading}
              />
            )}

            {/* Tab 5: Credit Portfolio & PMFBY Compliance */}
            {activeTab === 'financial-profile' && (
              <FarmerFinancialPanel
                finLoading={finLoading}
                finProfile={finProfile}
                triggerPDFDownload={triggerPDFDownload}
              />
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
