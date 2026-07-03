import React, { useMemo } from 'react';
import { TrendingUp, RefreshCw, Zap, AlertTriangle } from 'lucide-react';
import { DashboardPanel, DashboardCard, DashboardField } from '../../components/dashboard/DashboardSurface';

const FPOForecastPanel = ({
  forecastCrop,
  setForecastCrop,
  forecastVariety,
  setForecastVariety,
  forecastState,
  setForecastState,
  forecastDistrict,
  setForecastDistrict,
  forecastLoading,
  runPriceForecast,
  forecastResult,
}) => {
  const forecastSeries = useMemo(() => forecastResult?.forecasted_prices_inr || [], [forecastResult]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <DashboardPanel>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2><TrendingUp size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Market Price Intelligence</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ML-powered time-series forecasting to optimize your lot pricing strategy. Powered by Ridge regression on historical AGMARKNET data.</p>
          </div>
          <span className="badge badge-premium">ML Pipeline</span>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 24 }}>
          <DashboardField label="Crop" style={{ marginBottom: 0, flex: 1, minWidth: 160 }}>
            <select className="input-field" value={forecastCrop} onChange={(e) => setForecastCrop(e.target.value)}>
              <option value="Rice">Rice</option>
              <option value="Wheat">Wheat</option>
              <option value="Tomato">Tomato</option>
              <option value="Onion">Onion</option>
            </select>
          </DashboardField>
          <DashboardField label="Variety" style={{ marginBottom: 0, flex: 1, minWidth: 160 }}>
            <input className="input-field" value={forecastVariety} onChange={(e) => setForecastVariety(e.target.value)} />
          </DashboardField>
          <DashboardField label="State" style={{ marginBottom: 0, flex: 1, minWidth: 160 }}>
            <input className="input-field" value={forecastState} onChange={(e) => setForecastState(e.target.value)} />
          </DashboardField>
          <DashboardField label="District" style={{ marginBottom: 0, flex: 1, minWidth: 160 }}>
            <input className="input-field" value={forecastDistrict} onChange={(e) => setForecastDistrict(e.target.value)} />
          </DashboardField>
          <button className="btn btn-primary" onClick={runPriceForecast} disabled={forecastLoading}>
            {forecastLoading ? <><RefreshCw className="animate-spin" size={16} /> Computing...</> : <><Zap size={16} /> Run Forecast</>}
          </button>
        </div>

        {forecastResult && (
          <div className="prediction-card">
            <span className="input-label" style={{ display: 'block', marginBottom: 12 }}>Forecast Results — {forecastCrop} ({forecastVariety})</span>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <span className="text-secondary" style={{ fontSize: '0.75rem' }}>7-DAY FORECAST</span>
                <h2 style={{ margin: '4px 0 0', fontSize: '1.8rem', color: 'var(--color-primary)' }}>₹{Number(forecastResult.forecast_7d || 0).toLocaleString('en-IN')}</h2>
              </div>
              <div>
                <span className="text-secondary" style={{ fontSize: '0.75rem' }}>30-DAY FORECAST</span>
                <h2 style={{ margin: '4px 0 0', fontSize: '1.8rem', color: forecastResult.forecast_30d < 0 ? 'var(--color-danger)' : 'var(--color-primary)' }}>₹{Number(forecastResult.forecast_30d || 0).toLocaleString('en-IN')}</h2>
              </div>
              <div>
                <span className="text-secondary" style={{ fontSize: '0.75rem' }}>TREND DIRECTION</span>
                <h2 style={{ margin: '4px 0 0', fontSize: '1.8rem' }}>{forecastResult.estimated_price_trend || 'STABLE'}</h2>
              </div>
            </div>
            {forecastSeries.length > 0 && (
              <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                {forecastSeries.slice(0, 6).map((price, index) => (
                  <DashboardCard key={index} style={{ padding: 12, background: 'rgba(0,0,0,0.15)' }}>
                    <span className="text-secondary" style={{ fontSize: '0.72rem' }}>DAY {index + 1}</span>
                    <div style={{ marginTop: 6, fontSize: '1rem', fontWeight: 700 }}>₹{Number(price).toLocaleString('en-IN')}</div>
                  </DashboardCard>
                ))}
              </div>
            )}
            {forecastResult.degradation_notice && (
              <div style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--color-accent)', display: 'flex', gap: 6, alignItems: 'center' }}>
                <AlertTriangle size={14} /> {forecastResult.degradation_notice}
              </div>
            )}
            {forecastResult.advisory && (
              <p style={{ marginTop: 12, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <strong>Advisory:</strong> {forecastResult.advisory}
              </p>
            )}
          </div>
        )}
      </DashboardPanel>

      <div className="grid-cols-2">
        <DashboardPanel>
          <h2>Pricing Strategy Matrix</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {[
              { crop: 'Rice (Sona Masuri)', floor: 3800, ceiling: 4600, rec: 4200, trend: 'BULLISH' },
              { crop: 'Wheat (Sharbati)', floor: 2800, ceiling: 3400, rec: 3100, trend: 'STABLE' },
              { crop: 'Tomato (Local)', floor: 1400, ceiling: 2200, rec: 1800, trend: 'VOLATILE' },
              { crop: 'Onion (Red)', floor: 1800, ceiling: 2800, rec: 2200, trend: 'BEARISH' }
            ].map((item, idx) => (
              <DashboardCard key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{item.crop}</span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Range: ₹{item.floor} - ₹{item.ceiling}/Qtl</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>₹{item.rec}/Qtl</span>
                  <span className={`badge ${item.trend === 'BULLISH' ? 'badge-active' : item.trend === 'BEARISH' ? 'badge-abandoned' : 'badge-premium'}`} style={{ display: 'block', marginTop: 4 }}>
                    {item.trend}
                  </span>
                </div>
              </DashboardCard>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <h2>Seasonal Calendar Outlook</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {[
              { month: 'June - July', event: 'Kharif Sowing Window', impact: 'HIGH', desc: 'Peak demand for seeds, fertilizers. FPO should stockpile and negotiate bulk seed purchases.' },
              { month: 'Aug - Sep', event: 'Monsoon Peak / Pest Risk', impact: 'MEDIUM', desc: 'Monitor disease outbreak risk. Coordinate group pesticide procurement.' },
              { month: 'Oct - Nov', event: 'Kharif Harvest Window', impact: 'HIGH', desc: 'Aggregate harvest lots immediately. Early buyers pay premium.' },
              { month: 'Dec - Jan', event: 'Rabi Sowing Phase', impact: 'LOW', desc: 'Wheat and mustard cycles begin. Market liquidity is moderate.' }
            ].map((s, idx) => (
              <DashboardCard key={idx} style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{s.month} — {s.event}</span>
                  <span className={`badge ${s.impact === 'HIGH' ? 'badge-abandoned' : s.impact === 'MEDIUM' ? 'badge-premium' : 'badge-free'}`}>{s.impact} IMPACT</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{s.desc}</p>
              </DashboardCard>
            ))}
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
};

export default FPOForecastPanel;