import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Search, Plus, RefreshCw, ShieldCheck, Eye } from 'lucide-react';

const KnowledgeBasePanel = () => {
  const { getAuthHeaders } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const [newArticle, setNewArticle] = useState({
    title: '',
    crop_name: 'Rice',
    region: 'General',
    category: 'PEST',
    content: '',
    treatment_protocol: '',
    severity_level: 'MEDIUM',
  });

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterCategory) params.append('category', filterCategory);
      const res = await fetch(`http://localhost:5000/api/knowledge/articles?${params.toString()}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) setArticles(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchArticles(); }, [search, filterCategory]);

  const createArticle = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/knowledge/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(newArticle),
      });
      if (res.ok) {
        setShowAdd(false);
        setNewArticle({ title: '', crop_name: 'Rice', region: 'General', category: 'PEST', content: '', treatment_protocol: '', severity_level: 'MEDIUM' });
        fetchArticles();
      }
    } catch (err) { console.error(err); }
  };

  const categoryBadge = (c) => {
    const map = { PEST: 'badge-abandoned', DISEASE: 'badge-premium', NUTRIENT: 'badge-active', IRRIGATION: 'badge-free', HARVEST: 'badge-premium', SOIL: 'badge-active', GENERAL: 'badge-free' };
    return map[c] || 'badge-free';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2><BookOpen size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />Agronomic Knowledge Base</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Regional pest management, nutrient protocols, and verified treatment plans.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className="input-field" style={{ padding: '6px 12px', fontSize: '0.85rem', minWidth: 200 }} placeholder="Search articles..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="input-field" style={{ padding: '6px 12px', fontSize: '0.85rem' }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option value="PEST">Pest</option>
              <option value="DISEASE">Disease</option>
              <option value="NUTRIENT">Nutrient</option>
              <option value="IRRIGATION">Irrigation</option>
              <option value="HARVEST">Harvest</option>
              <option value="SOIL">Soil</option>
              <option value="GENERAL">General</option>
            </select>
            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setShowAdd(!showAdd)}>
              <Plus size={14} /> New Article
            </button>
          </div>
        </div>

        {showAdd && (
          <form onSubmit={createArticle} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <span className="input-label">Title</span>
              <input className="input-field" value={newArticle.title} onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Crop</span>
                <select className="input-field" value={newArticle.crop_name} onChange={(e) => setNewArticle({ ...newArticle, crop_name: e.target.value })}>
                  <option value="Rice">Rice</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Onion">Onion</option>
                  <option value="Potato">Potato</option>
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Category</span>
                <select className="input-field" value={newArticle.category} onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}>
                  <option value="PEST">Pest</option>
                  <option value="DISEASE">Disease</option>
                  <option value="NUTRIENT">Nutrient</option>
                  <option value="IRRIGATION">Irrigation</option>
                  <option value="HARVEST">Harvest</option>
                  <option value="SOIL">Soil</option>
                  <option value="GENERAL">General</option>
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Severity</span>
                <select className="input-field" value={newArticle.severity_level} onChange={(e) => setNewArticle({ ...newArticle, severity_level: e.target.value })}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <span className="input-label">Content</span>
              <textarea className="input-field" rows={3} value={newArticle.content} onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })} required />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <span className="input-label">Treatment Protocol</span>
              <textarea className="input-field" rows={2} value={newArticle.treatment_protocol} onChange={(e) => setNewArticle({ ...newArticle, treatment_protocol: e.target.value })} />
            </div>
            <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-start' }}>Publish Article</button>
          </form>
        )}

        {loading ? (
          <div className="flex-center" style={{ padding: 40 }}><RefreshCw className="animate-spin" /></div>
        ) : articles.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {articles.map((article) => (
              <div key={article._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{article.title}</span>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{article.crop_name} • {article.region}</p>
                  </div>
                  <span className={`badge ${categoryBadge(article.category)}`}>{article.category}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {article.content}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {article.is_verified ? <><ShieldCheck size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />Verified</> : 'Unverified'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}><Eye size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />{article.views} views</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-center" style={{ padding: 40, flexDirection: 'column', gap: 12 }}>
            <BookOpen size={32} className="text-muted" />
            <p className="text-secondary">No articles found. Create the first agronomic article for your region.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBasePanel;
