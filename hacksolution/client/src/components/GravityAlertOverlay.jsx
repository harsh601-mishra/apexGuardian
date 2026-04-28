import React from 'react';
import { useCrisis } from '../contexts/CrisisProvider';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const GravityAlertOverlay = () => {
  const { alert, dismissAlert, role } = useCrisis();

  if (!alert) return null;

  // 2. Visual & Severity Update
  const isWarning = alert.type === 'ANIMAL_AGGRESSION' || (alert.confidence && alert.confidence < 80);
  const colorHex = isWarning ? '#fbbf24' : '#ef4444'; // Amber vs Red
  const rgbAlert = isWarning ? '251, 191, 36' : '239, 68, 68';

  return (
    <div className="gravity-alert-overlay" style={{
      background: `rgba(${rgbAlert}, 0.15)`,
      animation: `bgFlash${isWarning ? 'Warning' : ''} 2s infinite alternate`
    }}>
      <style>{`
        @keyframes bgFlashWarning {
          0% { background: rgba(251, 191, 36, 0.15); }
          100% { background: rgba(251, 191, 36, 0.35); }
        }
      `}</style>
      <div className="glass-panel" style={{ 
        maxWidth: '600px', 
        width: '100%', 
        border: `2px solid rgba(${rgbAlert}, 0.8)`,
        boxShadow: `0 0 50px rgba(${rgbAlert}, 0.5)`,
        textAlign: 'center',
        padding: '3rem 2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <AlertTriangle size={64} color={colorHex} />
        </div>
        <h1 style={{ color: colorHex, fontSize: '2.5rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
          {isWarning ? 'Priority Alert' : 'Force-Priority Override'}
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <h2 style={{ color: 'white', margin: 0 }}>{alert.type.replace(/_/g, ' ')}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', width: '200px' }}>
             <span style={{ fontSize: '0.7rem', color: colorHex, fontWeight: 'bold' }}>CONFIDENCE</span>
             <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${alert.confidence || 100}%`, height: '100%', background: colorHex, transition: 'width 1s ease-out' }} />
             </div>
             <span style={{ fontSize: '0.7rem', color: 'white' }}>{alert.confidence || 100}%</span>
          </div>
        </div>
        
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '8px', textAlign: 'left', marginBottom: '2rem' }}>
          <p><strong>Incident ID:</strong> {alert.incidentId}</p>
          <p><strong>Severity:</strong> {alert.severity} (WEIGHT: {alert.weight})</p>
          <p><strong>SITREP:</strong> <span style={{ color: '#fbbf24' }}>{alert.description}</span></p>
          <p style={{ marginTop: '1rem', color: '#94a3b8' }}>
            <em>Gravimetric tracking engaged. Move towards Sector [{alert.location.x}, {alert.location.z}].</em>
          </p>
          {role === 'Security' && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <strong style={{ color: '#38bdf8' }}>OCCUPANCY DATA:</strong>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                <span>Area Load: ~45 Guests</span>
                <span>Priorities: 4</span>
                <span>Vulnerabilities: Detected</span>
              </div>
            </div>
          )}
        </div>

        <button 
          className="glass-btn danger" 
          onClick={dismissAlert}
          style={{ 
            padding: '1rem 3rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', 
            gap: '0.5rem', margin: '0 auto',
            background: `rgba(${rgbAlert}, 0.2)`,
            border: `1px solid rgba(${rgbAlert}, 0.4)`
          }}
        >
          <ShieldCheck />
          Acknowledge SITREP
        </button>
      </div>
    </div>
  );
};
