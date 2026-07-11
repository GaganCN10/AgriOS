import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Package, Plus, RefreshCw, Wrench, AlertTriangle, Trash2 } from 'lucide-react';

const FarmerResourcesPanel = ({ selectedFarm }) => {
  const { getAuthHeaders } = useAuth();
  const { notify, notifySuccess } = useNotification();
  const [activeSection, setActiveSection] = useState('inventory');
  const [inventory, setInventory] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showAddInventory, setShowAddInventory] = useState(false);
  const [invName, setInvName] = useState('');
  const [invCategory, setInvCategory] = useState('SEEDS');
  const [invQty, setInvQty] = useState('');
  const [invUnit, setInvUnit] = useState('units');
  const [invThreshold, setInvThreshold] = useState('10');

  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [equipName, setEquipName] = useState('');
  const [equipType, setEquipType] = useState('TRACTOR');
  const [equipCondition, setEquipCondition] = useState('OPERATIONAL');

  const fetchData = async () => {
    if (!selectedFarm) return;
    setLoading(true);
    try {
      const invRes = await fetch(`http://localhost:5000/api/inventory/all?farm_id=${selectedFarm._id}`, {
        headers: getAuthHeaders()
      });
      const invData = await invRes.json();
      if (invRes.ok) setInventory(invData);

      const eqRes = await fetch(`http://localhost:5000/api/equipment/all?farm_id=${selectedFarm._id}`, {
        headers: getAuthHeaders()
      });
      const eqData = await eqRes.json();
      if (eqRes.ok) setEquipment(eqData);
    } catch (err) {
      notify(err, 'Load Failed', 'Could not load farm resources.', 'Retry in a moment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedFarm]);

  const addInventory = async (e) => {
    e.preventDefault();
    if (!invName || !invQty) {
      notify({ message: 'Please enter both item name and quantity.', error: 'VALIDATION' });
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/inventory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          farm_id: selectedFarm._id,
          item_name: invName,
          category: invCategory,
          quantity_on_hand: parseFloat(invQty),
          unit: invUnit,
          safety_threshold: parseFloat(invThreshold),
        })
      });
      if (res.ok) {
        setShowAddInventory(false);
        setInvName('');
        setInvQty('');
        setInvThreshold('10');
        fetchData();
        notifySuccess('Inventory item added.', 'Stock has been recorded in your farm register.');
      }
    } catch (err) {
      notify(err, 'Add Failed', 'Could not add inventory item.', 'Retry in a moment.');
    }
  };

  const addEquipment = async (e) => {
    e.preventDefault();
    if (!equipName) {
      notify({ message: 'Please enter equipment name.', error: 'VALIDATION' });
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/equipment/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          farm_id: selectedFarm._id,
          equipment_name: equipName,
          equipment_type: equipType,
          condition_status: equipCondition,
        })
      });
      if (res.ok) {
        setShowAddEquipment(false);
        setEquipName('');
        setEquipCondition('OPERATIONAL');
        fetchData();
        notifySuccess('Equipment registered.', 'Asset has been added to your farm inventory.');
      }
    } catch (err) {
      notify(err, 'Add Failed', 'Could not register equipment.', 'Retry in a moment.');
    }
  };

  const deleteInventory = async (itemId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/inventory/delete/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchData();
        notifySuccess('Item removed.', 'Inventory item has been deleted.');
      }
    } catch (err) {
      notify(err, 'Delete Failed', 'Could not delete inventory item.', 'Retry in a moment.');
    }
  };

  const deleteEquipment = async (equipId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/equipment/delete/${equipId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchData();
        notifySuccess('Equipment removed.', 'Asset has been deleted from your farm.');
      }
    } catch (err) {
      notify(err, 'Delete Failed', 'Could not delete equipment.', 'Retry in a moment.');
    }
  };

  const lowStockItems = inventory.filter(item => item.quantity_on_hand <= item.safety_threshold);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="grid-cols-3">
        <div className="glass-panel">
          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>INVENTORY ITEMS</span>
          <h2 style={{ fontSize: '2.3rem', margin: '8px 0', color: 'var(--color-primary)' }}>{inventory.length}</h2>
          <span className="badge badge-premium">Tracked stock</span>
        </div>
        <div className="glass-panel">
          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>EQUIPMENT ASSETS</span>
          <h2 style={{ fontSize: '2.3rem', margin: '8px 0', color: '#38bdf8' }}>{equipment.length}</h2>
          <span className="badge badge-premium">Registered</span>
        </div>
        <div className="glass-panel">
          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>LOW STOCK ALERTS</span>
          <h2 style={{ fontSize: '2.3rem', margin: '8px 0', color: lowStockItems.length > 0 ? 'var(--color-accent)' : 'var(--color-primary)' }}>{lowStockItems.length}</h2>
          <span className={`badge ${lowStockItems.length > 0 ? 'badge-abandoned' : 'badge-active'}`}>
            {lowStockItems.length > 0 ? 'Needs restock' : 'All stocked'}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <RefreshCw className="animate-spin" size={24} />
            <span className="text-secondary">Loading farm resources...</span>
          </div>
        </div>
      ) : (

      <div className="grid-cols-2">
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2><Package size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Inventory Register</h2>
            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setShowAddInventory(!showAddInventory)}>
              <Plus size={14} /> Add Item
            </button>
          </div>

          {showAddInventory && (
            <form onSubmit={addInventory} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border-glass)' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Item Name</span>
                <input className="input-field" value={invName} onChange={(e) => setInvName(e.target.value)} placeholder="e.g. Urea Fertilizer" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <span className="input-label">Category</span>
                  <select className="input-field" value={invCategory} onChange={(e) => setInvCategory(e.target.value)}>
                    <option value="SEEDS">Seeds</option>
                    <option value="FERTILIZER">Fertilizer</option>
                    <option value="PESTICIDE">Pesticide</option>
                    <option value="EQUIPMENT_PART">Equipment Part</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <span className="input-label">Quantity</span>
                  <input className="input-field" type="number" value={invQty} onChange={(e) => setInvQty(e.target.value)} placeholder="0" required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <span className="input-label">Unit</span>
                  <input className="input-field" value={invUnit} onChange={(e) => setInvUnit(e.target.value)} placeholder="bags" />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Safety Threshold</span>
                <input className="input-field" type="number" value={invThreshold} onChange={(e) => setInvThreshold(e.target.value)} placeholder="10" />
              </div>
              <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-start' }}>Save Inventory Item</button>
            </form>
          )}

          {lowStockItems.length > 0 && (
            <div style={{ padding: 12, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <AlertTriangle size={16} className="text-accent" />
              <span style={{ fontSize: '0.85rem' }}>{lowStockItems.length} item(s) below safety threshold. Consider restocking soon.</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
            {inventory.length > 0 ? inventory.map((item) => (
              <div key={item._id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{item.item_name}</span>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.category} • {item.quantity_on_hand} {item.unit}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge ${item.quantity_on_hand <= item.safety_threshold ? 'badge-abandoned' : 'badge-active'}`}>
                    {item.quantity_on_hand <= item.safety_threshold ? 'LOW' : 'OK'}
                  </span>
                  <button className="btn btn-secondary text-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => deleteInventory(item._id)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )) : <p className="text-secondary" style={{ fontSize: '0.9rem' }}>No inventory items tracked.</p>}
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2><Wrench size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Equipment Assets</h2>
            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setShowAddEquipment(!showAddEquipment)}>
              <Plus size={14} /> Add Asset
            </button>
          </div>

          {showAddEquipment && (
            <form onSubmit={addEquipment} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border-glass)' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Equipment Name</span>
                <input className="input-field" value={equipName} onChange={(e) => setEquipName(e.target.value)} placeholder="e.g. Tractor X200" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <span className="input-label">Type</span>
                  <select className="input-field" value={equipType} onChange={(e) => setEquipType(e.target.value)}>
                    <option value="TRACTOR">Tractor</option>
                    <option value="HARVESTER">Harvester</option>
                    <option value="IRRIGATION_PUMP">Irrigation Pump</option>
                    <option value="SPRAYER">Sprayer</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <span className="input-label">Condition</span>
                  <select className="input-field" value={equipCondition} onChange={(e) => setEquipCondition(e.target.value)}>
                    <option value="OPERATIONAL">Operational</option>
                    <option value="NEEDS_SERVICE">Needs Service</option>
                    <option value="RETIRED">Retired</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-start' }}>Save Equipment</button>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
            {equipment.length > 0 ? equipment.map((item) => (
              <div key={item._id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{item.equipment_name}</span>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.equipment_type} • {item.condition_status}</p>
                  {item.maintenance_history?.length > 0 && (
                    <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Last service: {item.last_service_date ? new Date(item.last_service_date).toLocaleDateString('en-IN') : 'Never'}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge ${item.condition_status === 'OPERATIONAL' ? 'badge-active' : item.condition_status === 'NEEDS_SERVICE' ? 'badge-abandoned' : 'badge-free'}`}>
                    {item.condition_status}
                  </span>
                  <button className="btn btn-secondary text-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => deleteEquipment(item._id)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )) : <p className="text-secondary" style={{ fontSize: '0.9rem' }}>No equipment assets registered.</p>}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default FarmerResourcesPanel;
