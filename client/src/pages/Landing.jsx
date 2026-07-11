import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sprout, BrainCircuit, ShieldAlert, FileText, 
  Layers, ArrowRight, CloudSun, Sparkles, Database, ShieldCheck
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '20px 40px',
        borderBottom: '1px solid var(--border-glass)',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '2rem' }}>🌱</span>
          <div>
            <h3 style={{ margin: 0, fontWeight: 800, letterSpacing: -0.5 }}>AgriOS</h3>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Unified Agriculture OS</span>
          </div>
        </div>
        
        <button 
          className="btn btn-primary" 
          style={{ padding: '8px 20px', fontSize: '0.9rem' }}
          onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
        >
          {isAuthenticated ? 'Go to Dashboard' : 'Launch Platform'} <ArrowRight size={16} />
        </button>
      </header>

      {/* Hero Banner Section */}
      <section className="flex-center" style={{ 
        flexDirection: 'column', 
        padding: '80px 20px 60px 20px', 
        textAlign: 'center',
        background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.08) 0%, transparent 60%)'
      }}>
        <div className="badge badge-premium mb-4" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: '0.8rem', padding: '6px 14px' }}>
          <Sparkles size={12} /> Version 1.0.0 Live (Production Ready)
        </div>
        <h1 style={{ 
          fontSize: '3.5rem', 
          fontWeight: 800, 
          letterSpacing: -1, 
          maxWidth: 900, 
          lineHeight: 1.15,
          marginBottom: 16,
          color: 'var(--color-primary)'
        }}>
          The Enterprise Operating System for Modern Agriculture
        </h1>
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '1.25rem', 
          maxWidth: 750, 
          lineHeight: 1.6,
          marginBottom: 32
        }}>
          AgriOS consolidates remote sensing, crop cycle registers, KCC credit compliance documentation, AGMARKNET wholesale pricing, and image diagnostics sidecars into one workspace.
        </p>
        
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button 
            className="btn btn-primary glow-active" 
            style={{ padding: '14px 32px', fontSize: '1rem' }}
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
          >
            Access Platform Dashboard
          </button>
          <a 
            href="#features" 
            className="btn btn-secondary" 
            style={{ padding: '14px 32px', fontSize: '1rem', textDecoration: 'none' }}
          >
            Explore Core Modules
          </a>
        </div>
      </section>

      {/* Feature Section Grid */}
      <section id="features" style={{ padding: '60px 40px 100px 40px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.25rem', fontWeight: 700, marginBottom: 12 }}>
          8 Core Pillars of Crop Intelligence
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 48, maxWidth: 600, margin: '0 auto 48px auto' }}>
          Decoupled architectures integrating Express server workflows with machine learning prediction sidecars.
        </p>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: 24 
        }}>
          <div className="glass-panel glass-panel-hover" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="flex-center" style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', alignSelf: 'flex-start' }}>
              <CloudSun size={22} />
            </div>
            <h3>Field Intelligence</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Satellite remote sensing maps multi-spectral NDVI vegetation indices over GeoJSON defined land rings dynamically.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="flex-center" style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', alignSelf: 'flex-start' }}>
              <Sprout size={22} />
            </div>
            <h3>Crop Lifecycle Records</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Schedule seed sowing stages, allocate chemical fertilization intervals, and reconcile operational wages/fuel logs.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="flex-center" style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', alignSelf: 'flex-start' }}>
              <Layers size={22} />
            </div>
            <h3>Wholesale Market Analytics</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Queries, caches, and compares regional wholesale mandi prices to AGMARKNET standard categories.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="flex-center" style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', alignSelf: 'flex-start' }}>
              <FileText size={22} />
            </div>
            <h3>Kisan Credit Portfolio</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Calculates KCC loan limits, maps PMFBY insurance coverage metrics, and prints certified PDF underwriting packages.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="flex-center" style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', alignSelf: 'flex-start' }}>
              <BrainCircuit size={22} />
            </div>
            <h3>GenAI Conversational Advisor</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Context-aware chat agent evaluating prompt safety tokenization and local farm soil profile parameters.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="flex-center" style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', alignSelf: 'flex-start' }}>
              <ShieldAlert size={22} />
            </div>
            <h3>Computer Vision Diagnostics</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Convolutional classifiers evaluate leaf upload photographs to index pest infections and suggest remediation.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Branding section */}
      <footer style={{ 
        marginTop: 'auto', 
        padding: '30px 40px', 
        borderTop: '1px solid var(--border-glass)', 
        background: '#f1f5f9',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-muted)'
      }}>
        <div className="flex-center" style={{ gap: 8, marginBottom: 12 }}>
          <ShieldCheck size={14} className="text-primary" />
          <span>Indian Institutional Framework Compliant (KCC & PMFBY standard schemas)</span>
        </div>
        <p>© 2026 AgriOS Inc. Built for regional agricultural cooperatives and modern supply chains.</p>
      </footer>
    </div>
  );
};

export default Landing;
