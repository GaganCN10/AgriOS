import React, { useState, useEffect } from 'react';
import { Sprout, Plus, Calendar, Check, RefreshCw, TrendingUp, Zap, AlertTriangle } from 'lucide-react';

const FarmerCropOperationsPanel = ({
  activeCycle,
  cropCycles,
  newCropName,
  setNewCropName,
  newVariety,
  setNewVariety,
  newTargetYield,
  setNewTargetYield,
  newSowingDate,
  setNewSowingDate,
  showAddCycle,
  setShowAddCycle,
  registerCropCycle,
  showAddExpense,
  setShowAddExpense,
  expCategory,
  setExpCategory,
  expAmount,
  setExpAmount,
  expDesc,
  setExpDesc,
  addExpense,
  stageUpdate,
  setStageUpdate,
  updateCropStage,
  selectedFarm,
  yieldPrediction,
  yieldLoading,
  runYieldPrediction,
  user,
  completedMilestones,
  generateMilestones,
  toggleMilestone,
  fetchFinancialProfile,
  fetchCropCycles,
  fetchCropCalendar,
}) => {
  const [serverMilestones, setServerMilestones] = useState([]);

  useEffect(() => {
    const loadServerMilestones = async () => {
      if (!activeCycle || !fetchCropCalendar) {
        setServerMilestones([]);
        return;
      }
      const milestones = await fetchCropCalendar(activeCycle.crop_name, activeCycle.sowing_date);
      setServerMilestones(milestones || []);
    };
    loadServerMilestones();
  }, [activeCycle, fetchCropCalendar]);

  const displayMilestones = serverMilestones.length > 0 ? serverMilestones : generateMilestones(activeCycle);
  return (
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
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <select className="input-field" style={{ minWidth: 150 }} value={stageUpdate} onChange={(e) => setStageUpdate(e.target.value)}>
                  <option value="SOWING">Sowing</option>
                  <option value="VEGETATIVE">Vegetative</option>
                  <option value="FLOWERING">Flowering</option>
                  <option value="MATURITY">Maturity</option>
                  <option value="HARVESTED">Harvested</option>
                  <option value="ABANDONED">Abandoned</option>
                </select>
                <button className="btn btn-primary" onClick={updateCropStage}>Update Stage</button>
              </div>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowAddCycle(true)}>Start New Crop Cycle</button>
          )}
        </div>
      </div>

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

      {activeCycle && (
        <div className="grid-cols-2">
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h2>🗓️ Crop Calendar Timeline</h2>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {completedMilestones.length}/{displayMilestones.length}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Tasks Done</span>
              </div>
            </div>
            <div className="progress-bar-container" style={{ marginBottom: 20 }}>
              <div className="progress-bar-fill" style={{ width: `${(completedMilestones.length / Math.max(displayMilestones.length, 1)) * 100}%` }} />
            </div>
            <div className="milestone-timeline" style={{ maxHeight: 480, overflowY: 'auto', paddingRight: 8 }}>
              {displayMilestones.map((m, idx, arr) => {
                const isCompleted = completedMilestones.includes(m.id);
                const mDate = new Date(m.scheduled_date.split('/').reverse().join('-'));
                const isOverdue = !isCompleted && mDate < new Date();
                return (
                  <div key={m.id} className="milestone-item">
                    <div className="milestone-track">
                      <div 
                        className={`milestone-dot ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}
                        onClick={() => toggleMilestone(activeCycle._id, m.id)}
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
                          {Number(yieldPrediction.predicted_yield_metric_tons ?? yieldPrediction.estimated_yield_metric_tons ?? yieldPrediction.predicted_yield_tons ?? 0).toFixed(2) || 'N/A'}
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}> tons</span>
                        </h2>
                      </div>
                      <div>
                        <span className="text-secondary" style={{ fontSize: '0.75rem' }}>CONFIDENCE</span>
                        <h2 style={{ margin: '4px 0 0', fontSize: '2rem' }}>
                          {yieldPrediction.confidence !== undefined ? `${Math.round(yieldPrediction.confidence * 100)}%` : 'N/A'}
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
  );
};

export default FarmerCropOperationsPanel;