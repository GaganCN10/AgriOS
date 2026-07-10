import React from 'react';
import { CloudSun, Bell, Plus, RefreshCw } from 'lucide-react';

const FarmerFieldIntelligencePanel = ({
  selectedFarm,
  mandiPrices,
  mandiLoading,
  triggeredAlerts,
  showAlertForm,
  setShowAlertForm,
  alertCrop,
  setAlertCrop,
  alertVariety,
  setAlertVariety,
  alertPrice,
  setAlertPrice,
  alertDirection,
  setAlertDirection,
  userAlerts,
  createPriceAlert,
  fetchUserAlerts,
  weatherData,
  weatherLoading,
  ndviData,
  ndviLoading,
}) => {
  const weather = weatherData || {};
  const ndvi = ndviData || {};
  const meanNdvi = ndvi.mean_ndvi ?? 0.78;

  const ndviLabel = meanNdvi > 0.7 ? "High Vigor Vigorously Green" : meanNdvi > 0.5 ? "Moderate Vegetation" : meanNdvi > 0.3 ? "Stress Detected" : "Drought / Bare Soil";

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="grid-cols-3">
        <div className="glass-panel">
          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>VEGETATIONAL INDEX (NDVI)</span>
          <h2 style={{ color: 'var(--color-primary)', fontSize: '2.5rem', fontWeight: 800, margin: '8px 0' }}>
            {meanNdvi.toFixed(2)}
          </h2>
          <span className="badge badge-active">{ndviLabel}</span>
        </div>
        <div className="glass-panel">
          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>LOCAL GRID WEATHER FORECAST</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <div>
              {weatherLoading ? (
                <RefreshCw className="animate-spin" size={20} />
              ) : weather.temperature_celsius !== undefined ? (
                <>
                  <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{weather.temperature_celsius}°C</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {weather.description || "Clear"} • Humidity: {weather.humidity_percent}% • Wind: {weather.wind_speed_mps} m/s
                  </p>
                </>
              ) : (
                <>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-muted)' }}>--</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Configure OPENWEATHER_API_KEY to enable live weather</p>
                </>
              )}
            </div>
            <CloudSun size={36} className="text-primary" />
          </div>
        </div>
        <div className="glass-panel">
          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>SOIL NITRIC LEVEL BALANCE</span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '8px 0', color: '#38bdf8' }}>
            {selectedFarm?.soil_profile?.nitrogen_level ?? '--'} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>mg/kg</span>
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            pH factor: {selectedFarm?.soil_profile?.ph_level ?? '--'}
          </p>
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
                <div key={price.id || price.crop + price.variety} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{price.crop} ({price.variety})</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {price.district ? `${price.district}, ${price.state}` : price.unit || 'Local Mandi'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>INR {price.modal_price ?? price.price} / {price.unit || 'Qtl'}</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {price.min_price && price.max_price ? `Range: ${price.min_price} - ${price.max_price}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary">No regional wholesale rates cataloged.</p>
          )}

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
        </div>
      </div>

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
  );
};

export default FarmerFieldIntelligencePanel;