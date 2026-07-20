import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { ClipboardList, Plus, RefreshCw, CheckCircle2, Circle, Trash2, AlertTriangle } from 'lucide-react';

const FarmerTaskPanel = ({ selectedFarm }) => {
  const { apiFetch } = useAuth();
  const { notify, notifySuccess } = useNotification();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('LABOR');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newDesc, setNewDesc] = useState('');

  const fetchTasks = async () => {
    if (!selectedFarm) return;
    setLoading(true);
    try {
      const res = await apiFetch(`http://localhost:5000/api/task/all?farm_id=${selectedFarm._id}`, {

      });
      const data = await res.json();
      if (res.ok) setTasks(data);
    } catch (err) {
      notify(err, 'Load Failed', 'Could not load tasks.', 'Retry in a moment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedFarm]);

  const createTask = async (e) => {
    e.preventDefault();
    if (!newTitle) {
      notify({ message: 'Please enter a task title.', error: 'VALIDATION' });
      return;
    }
    try {
      const res = await apiFetch('http://localhost:5000/api/task/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',  },
        body: JSON.stringify({
          farm_id: selectedFarm._id,
          title: newTitle,
          description: newDesc,
          category: newCategory,
          priority: newPriority,
        })
      });
      if (res.ok) {
        setShowAddTask(false);
        setNewTitle('');
        setNewDesc('');
        setNewPriority('MEDIUM');
        fetchTasks();
        notifySuccess('Task created.', 'The task has been added to your board.');
      }
    } catch (err) {
      notify(err, 'Create Failed', 'Could not create task.', 'Retry in a moment.');
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await apiFetch(`http://localhost:5000/api/task/update/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json',  },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        fetchTasks();
        notifySuccess('Task updated.', `Status changed to ${newStatus.replace('_', ' ')}.`);
        if (data.inventory_deducted) {
          notifySuccess('Inventory deducted.', 'Consumables were automatically deducted from inventory based on task category.');
        }
      }
    } catch (err) {
      notify(err, 'Update Failed', 'Could not update task status.', 'Retry in a moment.');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const res = await apiFetch(`http://localhost:5000/api/task/delete/${taskId}`, {
        method: 'DELETE',

      });
      if (res.ok) {
        fetchTasks();
        notifySuccess('Task deleted.', 'The task has been removed from your board.');
      }
    } catch (err) {
      notify(err, 'Delete Failed', 'Could not delete task.', 'Retry in a moment.');
    }
  };

  const filteredTasks = filterStatus === 'ALL' ? tasks : tasks.filter(t => t.status === filterStatus);
  const pendingCount = tasks.filter(t => t.status === 'PENDING').length;
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;

  const priorityBadge = (p) => p === 'URGENT' ? 'badge-abandoned' : p === 'HIGH' ? 'badge-premium' : 'badge-free';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="grid-cols-3">
        <div className="glass-panel">
          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>TOTAL TASKS</span>
          <h2 style={{ fontSize: '2.3rem', margin: '8px 0', color: 'var(--color-primary)' }}>{tasks.length}</h2>
          <span className="badge badge-premium">All tasks</span>
        </div>
        <div className="glass-panel">
          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>PENDING</span>
          <h2 style={{ fontSize: '2.3rem', margin: '8px 0', color: '#f59e0b' }}>{pendingCount}</h2>
          <span className="badge badge-premium">Awaiting action</span>
        </div>
        <div className="glass-panel">
          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>COMPLETED</span>
          <h2 style={{ fontSize: '2.3rem', margin: '8px 0', color: '#10b981' }}>{completedCount}</h2>
          <span className="badge badge-active">Done</span>
        </div>
      </div>

      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2><ClipboardList size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Field Task Board</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select className="input-field" style={{ padding: '6px 10px', fontSize: '0.85rem' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setShowAddTask(!showAddTask)}>
              <Plus size={14} /> New Task
            </button>
          </div>
        </div>

        {showAddTask && (
           <form onSubmit={createTask} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border-glass)' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <span className="input-label">Task Title</span>
              <input className="input-field" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Irrigate north field" required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Category</span>
                <select className="input-field" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                  <option value="LABOR">Labor</option>
                  <option value="IRRIGATION">Irrigation</option>
                  <option value="FERTILIZER">Fertilizer</option>
                  <option value="PEST_CONTROL">Pest Control</option>
                  <option value="HARVEST">Harvest</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Priority</span>
                <select className="input-field" value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <span className="input-label">Description</span>
              <textarea className="input-field" rows={2} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Task details, completion criteria..." />
            </div>
            <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-start' }}>Create Task</button>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 500, overflowY: 'auto' }}>
          {loading ? (
            <div className="flex-center" style={{ padding: 40 }}><RefreshCw className="animate-spin" /></div>
          ) : filteredTasks.length > 0 ? filteredTasks.map((task) => (
            <div key={task._id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{task.title}</span>
                  <span className={`badge ${priorityBadge(task.priority)}`}>{task.priority}</span>
                  <span className={`badge ${task.status === 'COMPLETED' ? 'badge-active' : task.status === 'IN_PROGRESS' ? 'badge-premium' : 'badge-free'}`}>{task.status.replace('_', ' ')}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {task.description || 'No description'} • {task.category}
                  {task.labor_hours > 0 && ` • ${task.labor_hours} hrs`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 12 }}>
                {task.status !== 'COMPLETED' && (
                  <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'var(--color-primary)' }} onClick={() => updateTaskStatus(task._id, 'COMPLETED')} title="Mark complete">
                    <CheckCircle2 size={16} />
                  </button>
                )}
                {task.status === 'PENDING' && (
                  <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#38bdf8' }} onClick={() => updateTaskStatus(task._id, 'IN_PROGRESS')} title="Start task">
                    <Circle size={16} />
                  </button>
                )}
                <button className="btn btn-secondary text-danger" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => deleteTask(task._id)} title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )) : (
            <div className="flex-center" style={{ padding: 40, flexDirection: 'column', gap: 12 }}>
              <ClipboardList size={32} className="text-muted" />
              <p className="text-secondary">No tasks found. Create your first field task to track labor, irrigation, and harvest operations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmerTaskPanel;
