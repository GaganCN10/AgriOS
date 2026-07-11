import React from 'react';
import { Truck, RefreshCw, Package, ThermometerSun, Droplets, MapPinned, ClipboardList } from 'lucide-react';

const FPOTraceabilityPanel = ({
  lots,
  traceRecords,
  traceLoading,
  traceForm,
  setTraceForm,
  createTraceRecord,
}) => {
  const activeRecords = traceRecords.filter((record) => record.logistics_status !== 'RECEIVED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="grid-cols-3">
        <div className="glass-panel">
          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>TRACE RECORDS</span>
          <h2 style={{ fontSize: '2.3rem', margin: '8px 0', color: 'var(--color-primary)' }}>{traceRecords.length}</h2>
          <span className="badge badge-active">Lot-level lineage</span>
        </div>
        <div className="glass-panel">
          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>ACTIVE SHIPMENTS</span>
          <h2 style={{ fontSize: '2.3rem', margin: '8px 0', color: '#38bdf8' }}>{activeRecords}</h2>
          <span className="badge badge-premium">In motion</span>
        </div>
        <div className="glass-panel">
          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>QUALITY CHECKS</span>
          <h2 style={{ fontSize: '2.3rem', margin: '8px 0', color: '#f59e0b' }}>{traceRecords.filter((record) => record.quality_grading?.grade === 'A').length}</h2>
          <span className="badge badge-premium">Grade A lots</span>
        </div>
      </div>

      <div className="grid-cols-2">
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ marginBottom: 6 }}><ClipboardList size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Create Traceability Record</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Log dispatch, storage, grading, and transit details for harvested lots.</p>
            </div>
            <span className="badge badge-premium">Post-harvest</span>
          </div>

          <form onSubmit={createTraceRecord} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="input-group">
              <span className="input-label">Consolidated Lot</span>
              <select className="input-field" value={traceForm.lot_id} onChange={(e) => setTraceForm({ ...traceForm, lot_id: e.target.value })} required>
                <option value="">Select a published lot</option>
                {lots.map((lot) => (
                  <option key={lot._id} value={lot._id}>
                    {lot.crop_name} - {lot.variety} ({lot.total_quantity_metric_tons} tons)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid-cols-2">
              <div className="input-group">
                <span className="input-label">Handler Name</span>
                <input className="input-field" value={traceForm.handler_name} onChange={(e) => setTraceForm({ ...traceForm, handler_name: e.target.value })} placeholder="Warehouse operator" required />
              </div>
              <div className="input-group">
                <span className="input-label">Dispatch Date</span>
                <input className="input-field" type="date" value={traceForm.dispatch_date} onChange={(e) => setTraceForm({ ...traceForm, dispatch_date: e.target.value })} required />
              </div>
            </div>

            <div className="grid-cols-2">
              <div className="input-group">
                <span className="input-label">Destination</span>
                <input className="input-field" value={traceForm.destination} onChange={(e) => setTraceForm({ ...traceForm, destination: e.target.value })} placeholder="Processing center / buyer depot" required />
              </div>
              <div className="input-group">
                <span className="input-label">Vehicle Number</span>
                <input className="input-field" value={traceForm.vehicle_number} onChange={(e) => setTraceForm({ ...traceForm, vehicle_number: e.target.value })} placeholder="KA-01-AB-1234" />
              </div>
            </div>

            <div className="grid-cols-2">
              <div className="input-group">
                <span className="input-label">Weight (Metric Tons)</span>
                <input className="input-field" type="number" step="0.1" value={traceForm.weight_metric_tons} onChange={(e) => setTraceForm({ ...traceForm, weight_metric_tons: e.target.value })} required />
              </div>
              <div className="input-group">
                <span className="input-label">Quality Grade</span>
                <select className="input-field" value={traceForm.grade} onChange={(e) => setTraceForm({ ...traceForm, grade: e.target.value })}>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            </div>

            <div className="grid-cols-3">
              <div className="input-group">
                <span className="input-label">Storage Temp (°C)</span>
                <input className="input-field" type="number" step="0.1" value={traceForm.temperature_c} onChange={(e) => setTraceForm({ ...traceForm, temperature_c: e.target.value })} />
              </div>
              <div className="input-group">
                <span className="input-label">Humidity (%)</span>
                <input className="input-field" type="number" step="0.1" value={traceForm.humidity_percent} onChange={(e) => setTraceForm({ ...traceForm, humidity_percent: e.target.value })} />
              </div>
              <div className="input-group">
                <span className="input-label">Moisture (%)</span>
                <input className="input-field" type="number" step="0.1" value={traceForm.moisture_percent} onChange={(e) => setTraceForm({ ...traceForm, moisture_percent: e.target.value })} />
              </div>
            </div>

            <div className="input-group">
              <span className="input-label">Ventilation Notes</span>
              <input className="input-field" value={traceForm.ventilation} onChange={(e) => setTraceForm({ ...traceForm, ventilation: e.target.value })} placeholder="Natural airflow / cold storage / sealed crate" />
            </div>

            <div className="input-group">
              <span className="input-label">Logistics Status</span>
              <select className="input-field" value={traceForm.logistics_status} onChange={(e) => setTraceForm({ ...traceForm, logistics_status: e.target.value })}>
                <option value="READY">READY</option>
                <option value="DISPATCHED">DISPATCHED</option>
                <option value="IN_TRANSIT">IN_TRANSIT</option>
                <option value="DELAYED">DELAYED</option>
                <option value="RECEIVED">RECEIVED</option>
              </select>
            </div>

            <div className="input-group">
              <span className="input-label">Notes</span>
              <textarea className="input-field" rows="3" value={traceForm.notes} onChange={(e) => setTraceForm({ ...traceForm, notes: e.target.value })} placeholder="Carrier handoff, weighing station, inspection comments" />
            </div>

            <button className="btn btn-primary" type="submit" disabled={traceLoading} style={{ alignSelf: 'flex-start' }}>
              {traceLoading ? <><RefreshCw className="animate-spin" size={16} /> Saving...</> : <><Truck size={16} /> Save Trace Record</>}
            </button>
          </form>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ marginBottom: 6 }}><Package size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Traceability Register</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Most recent harvest batch records and dispatch telemetry.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 680, overflowY: 'auto' }}>
            {traceRecords.length > 0 ? (
              traceRecords.map((record) => (
                <div key={record._id} className="glass-card" style={{ padding: 14, background: '#f8fafc', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{record.crop_name} - {record.variety}</h3>
                      <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{record.batch_code}</p>
                    </div>
                    <span className={`badge ${record.logistics_status === 'RECEIVED' ? 'badge-active' : record.logistics_status === 'DELAYED' ? 'badge-abandoned' : 'badge-premium'}`}>
                      {record.logistics_status}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, fontSize: '0.85rem' }}>
                    <div><strong>Handler:</strong> {record.handler_name}</div>
                    <div><strong>Vehicle:</strong> {record.vehicle_number || 'N/A'}</div>
                    <div><strong>Destination:</strong> {record.destination}</div>
                    <div><strong>Dispatch:</strong> {new Date(record.dispatch_date).toLocaleDateString('en-IN')}</div>
                    <div><strong>Grade:</strong> {record.quality_grading?.grade || 'N/A'}</div>
                    <div><strong>Weight:</strong> {record.quality_grading?.weight_metric_tons ?? 0} tons</div>
                  </div>

                  <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><ThermometerSun size={14} /> {record.storage_environment?.temperature_c ?? 'N/A'}°C</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Droplets size={14} /> {record.storage_environment?.humidity_percent ?? 'N/A'}%</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPinned size={14} /> {record.storage_environment?.ventilation || 'Unspecified ventilation'}</span>
                  </div>

                  {record.notes && (
                    <p style={{ margin: '10px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{record.notes}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-secondary" style={{ margin: 0 }}>No traceability records logged yet for this account.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FPOTraceabilityPanel;
