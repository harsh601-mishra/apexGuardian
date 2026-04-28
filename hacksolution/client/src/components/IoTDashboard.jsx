import React from 'react';
import { useCrisis } from '../contexts/CrisisProvider';
import { Video, Flame, Lock, BellRing, ServerCrash } from 'lucide-react';

export const IoTDashboard = () => {
  const { iotData, alert, privacyMode, setPrivacyMode } = useCrisis();

  const getStatusColor = (status) => {
    switch(status) {
      case 'ONLINE': case 'LOCKED': return '#10b981'; // Green
      case 'WARNING': return '#eab308'; // Yellow
      case 'OFFLINE': case 'UNLOCKED': return '#64748b'; // Gray
      case 'ACTIVE': return '#ef4444'; // Red
      default: return '#64748b';
    }
  };

  const getAnimation = (status) => {
    if (status === 'ACTIVE') return 'bgFlash 1s infinite alternate';
    if (status === 'WARNING') return 'pulseText 2s infinite alternate';
    return 'none';
  };

  if (!iotData) {
    return (
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '200px' }}>
         <ServerCrash size={32} color="#64748b" style={{ marginBottom: '1rem' }} />
         <p style={{ color: 'var(--text-secondary)' }}>Awaiting IoT Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
        <BellRing size={20} />
        Apex Building IoT {alert?.iotStats && <span style={{ marginLeft: 'auto', color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold', animation: 'bgFlash 1s infinite alternate', padding: '2px 8px', borderRadius: '4px', border: '1px solid #ef4444' }}>LIVE</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.65rem', color: privacyMode ? '#38bdf8' : 'var(--text-secondary)', fontWeight: 'bold' }}>PRIVACY FIRST</span>
          <button 
            onClick={() => setPrivacyMode(!privacyMode)}
            style={{
              width: '32px', height: '16px', borderRadius: '8px', background: privacyMode ? '#38bdf8' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'all 0.3s'
            }}
          >
            <div style={{
              width: '12px', height: '12px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: privacyMode ? '18px' : '2px', transition: 'all 0.3s'
            }} />
          </button>
        </div>
      </h3>
      
      {alert?.iotStats ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
           <div style={{ background: 'rgba(239,68,68,0.1)', padding: '0.8rem', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                 <span>Decibel Peak</span><span>Acoustic Epicenter</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', alignItems: 'flex-end' }}>
                 <span style={{ color: '#ef4444', fontSize: '1.2rem' }}>{alert.iotStats.decibel} dB</span>
                 <span style={{ color: 'var(--text-secondary)' }}>Sector [{alert.iotStats.location.x}, {alert.iotStats.location.y}]</span>
              </div>
           </div>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '8px', borderLeft: `4px solid ${alert.iotStats.temperature > 40 ? '#ef4444' : '#f97316'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                  <Flame size={16} /> <span style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Core Temp</span>
                </div>
                <div style={{ fontWeight: 'bold', color: alert.iotStats.temperature > 40 ? '#ef4444' : '#f97316', fontSize: '1.2rem' }}>{alert.iotStats.temperature}°C</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '8px', borderLeft: `4px solid ${alert.iotStats.smoke_level === 'high' ? '#ef4444' : '#fbbf24'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                  <BellRing size={16} /> <span style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Smoke Lvl</span>
                </div>
                <div style={{ fontWeight: 'bold', color: alert.iotStats.smoke_level === 'high' ? '#ef4444' : '#fbbf24', fontSize: '1.2rem', textTransform: 'capitalize' }}>{alert.iotStats.smoke_level}</div>
              </div>
           </div>
        </div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '8px', borderLeft: `4px solid ${getStatusColor(iotData.fireAlarm)}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
             <Flame size={16} /> <span style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Fire System</span>
          </div>
          <div style={{ fontWeight: 'bold', animation: getAnimation(iotData.fireAlarm), color: getStatusColor(iotData.fireAlarm) }}>
            {iotData.fireAlarm}
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '8px', borderLeft: `4px solid ${getStatusColor(iotData.cctv)}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
             <Video size={16} /> <span style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>CCTV Core</span>
          </div>
          <div style={{ fontWeight: 'bold', animation: getAnimation(iotData.cctv), color: getStatusColor(iotData.cctv) }}>
            {iotData.cctv}
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '8px', borderLeft: `4px solid ${getStatusColor(iotData.smokeDetector)}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
             <BellRing size={16} /> <span style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Smoke Detectors</span>
          </div>
          <div style={{ fontWeight: 'bold', animation: getAnimation(iotData.smokeDetector), color: getStatusColor(iotData.smokeDetector) }}>
            {iotData.smokeDetector}
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '8px', borderLeft: `4px solid ${getStatusColor(iotData.smartLocks)}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
             <Lock size={16} /> <span style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Smart Locks</span>
          </div>
          <div style={{ fontWeight: 'bold', animation: getAnimation(iotData.smartLocks), color: getStatusColor(iotData.smartLocks) }}>
            {iotData.smartLocks}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
