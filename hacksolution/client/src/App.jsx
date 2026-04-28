import React, { useEffect, useState } from 'react';
import { ShieldAlert, Activity, Wifi, WifiOff, PhoneCall } from 'lucide-react';
import { useCrisis } from './contexts/CrisisProvider';
import { DigitalTwinScene } from './components/DigitalTwin';
import { AIGhostDispatcher } from './components/AI_GhostDispatcher';
import { GravityAlertOverlay } from './components/GravityAlertOverlay';
import { IoTDashboard } from './components/IoTDashboard';
import { CommunicationPanel } from './components/CommunicationPanel';
import { SOPPanel } from './components/SOPPanel';

function App() {
  const { alert, socket, nodeCount, acknowledgedIncident, role, setRole, isMeshActive, toggleNetwork, triggerCrisisEvent, isVoiceBroadcastActive, triggerVoiceBroadcast, isRecording, recordingLevel, transcription, interimTranscript, startRecording, stopRecording } = useCrisis();
  const [isServerConnected, setIsServerConnected] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [activeTimer, setActiveTimer] = useState("00:00");
  const [showEmergencyMenu, setShowEmergencyMenu] = useState(false);

  useEffect(() => {
    let timer;
    if (alert?.timestamp) {
      const startTime = new Date(alert.timestamp).getTime();
      timer = setInterval(() => {
        const diff = Math.floor((Date.now() - startTime) / 1000);
        const mins = String(Math.floor(diff / 60)).padStart(2, '0');
        const secs = String(diff % 60).padStart(2, '0');
        setActiveTimer(`${mins}:${secs} sec`);
      }, 1000);
    } else {
      setActiveTimer("00:00");
    }
    return () => clearInterval(timer);
  }, [alert]);

  const triggerManualEmergency = (type, color) => {
    setShowEmergencyMenu(false);
    if (!alert) {
      triggerCrisisEvent({
        type,
        location: { x: (Math.random() - 0.5) * 20, z: (Math.random() - 0.5) * 20 },
        description: `Manual Report: ${type} reported via Hub Console.`,
        isManual: true
      });
    }
  };

  useEffect(() => {
    if (socket) {
      setIsServerConnected(socket.connected);
      socket.on('connect', () => setIsServerConnected(true));
      socket.on('disconnect', () => setIsServerConnected(false));
    }
  }, [socket]);

  useEffect(() => {
    if (isServerConnected) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isServerConnected]);

  // 3. Post-Acknowledge Feature Alert Modal
  const handleCallEmergency = () => {
    // If not security, we still use the old alert behavior or whatever is in triggerVoiceBroadcast
    if (role !== 'Security') triggerVoiceBroadcast();
  };

  return (
    <div className={isVoiceBroadcastActive ? "pulse-broadcast" : ""} style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <style>{`
        .pulse-broadcast {
          box-shadow: inset 0 0 50px rgba(239, 68, 68, 0.5);
          animation: broadcastPulse 1.5s infinite alternate;
        }
        @keyframes broadcastPulse {
          from { box-shadow: inset 0 0 20px rgba(239, 68, 68, 0.3); }
          to { box-shadow: inset 0 0 60px rgba(239, 68, 68, 0.7); }
        }
        .pulse-orange {
          box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7);
          animation: pulseOrange 1.2s infinite;
        }
        @keyframes pulseOrange {
          0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(249, 115, 22, 0); }
          100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
        }
      `}</style>
      {/* Header */}
      <header 
        className="glass-panel" 
        style={{ 
          borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'relative', zIndex: 10000
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ShieldAlert size={32} color={alert ? "#ef4444" : "var(--accent-blue)"} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', letterSpacing: '-0.02em' }}>
              Apex Guardian
              {alert && <span style={{ background: '#ef4444', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', letterSpacing: '0.1em', animation: 'bgFlash 1s infinite alternate' }}>CRISIS MODE</span>}
            </h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#38bdf8', fontWeight: '500', letterSpacing: '0.05em' }}>Every Sound Sensed, Every Life Protected. | Apex Response Engine</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {isRecording && (
            <div style={{ position: 'relative' }}>
              <div style={{ color: '#f97316', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', animation: 'pulseText 1s infinite alternate', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '2px', height: '12px', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{ 
                      width: '3px', 
                      height: `${Math.max(2, (recordingLevel / 100) * (i * 4 + 4))}px`, 
                      background: '#f97316', 
                      borderRadius: '1px',
                      transition: 'height 0.1s ease'
                    }} />
                  ))}
                </div>
                MIC ACTIVE: TRANSMITTING TO MESH...
              </div>
              <div style={{ 
                position: 'absolute', 
                bottom: '100%', 
                left: '50%', 
                transform: 'translateX(-50%) translateY(-10px)', 
                background: 'rgba(249, 115, 22, 0.9)', 
                color: 'white', 
                padding: '6px 12px', 
                borderRadius: '8px', 
                fontSize: '0.85rem', 
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.2)',
                zIndex: 100000
              }}>
                {transcription + interimTranscript || "Listening..."}
                <div style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: '50%', 
                  transform: 'translateX(-50%)', 
                  borderLeft: '6px solid transparent', 
                  borderRight: '6px solid transparent', 
                  borderTop: '6px solid rgba(249, 115, 22, 0.9)' 
                }} />
              </div>
            </div>
          )}
          {(acknowledgedIncident || role === 'Security') && !alert && (
            <button 
              onMouseDown={role === 'Security' ? (e) => { e.preventDefault(); startRecording(); } : undefined}
              onMouseUp={role === 'Security' ? (e) => { e.preventDefault(); stopRecording(); } : undefined}
              onMouseLeave={role === 'Security' ? (e) => { e.preventDefault(); stopRecording(); } : undefined}
              onTouchStart={role === 'Security' ? (e) => { e.preventDefault(); startRecording(); } : undefined}
              onTouchEnd={role === 'Security' ? (e) => { e.preventDefault(); stopRecording(); } : undefined}
              onClick={role !== 'Security' ? handleCallEmergency : undefined}
              title={role === 'Security' ? "Hold to Talk (Walkie-Talkie)" : "Initiate Emergency Call"}
              style={{ 
                background: isRecording ? '#f97316' : (isVoiceBroadcastActive ? '#ef4444' : 'rgba(239, 68, 68, 0.2)'), 
                color: (isRecording || isVoiceBroadcastActive) ? 'white' : '#ef4444', 
                border: `1px solid ${isRecording ? '#f97316' : (isVoiceBroadcastActive ? '#ef4444' : 'rgba(239,68,68,0.5)')}`, 
                borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', cursor: 'pointer', outline: 'none',
                transition: 'all 0.2s ease',
                boxShadow: isRecording ? '0 0 25px #f97316' : (isVoiceBroadcastActive ? '0 0 15px #ef4444' : 'none'),
                position: 'relative'
              }}
              className={isRecording ? "pulse-orange" : ""}
            >
              <PhoneCall size={20} className={(isVoiceBroadcastActive || isRecording) ? 'pulse-animation' : ''} />
            </button>
          )}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowEmergencyMenu(!showEmergencyMenu)} 
              className="glass-btn danger" 
              style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
            >
              Simulate Emergency
            </button>
            
            {showEmergencyMenu && (
              <div style={{ 
                position: 'absolute', 
                top: 'calc(100% + 8px)', 
                right: 0, 
                background: '#0f172a', 
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--glass-border)', 
                borderRadius: '12px', 
                padding: '0.8rem', 
                zIndex: 9999, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.6rem', 
                minWidth: '220px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 15px rgba(59, 130, 246, 0.1)',
                animation: 'slideDown 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '4px' }}>
                  Manual SITREP Override
                </div>
                <button 
                  onClick={() => triggerManualEmergency("CARDIAC ARREST", "blue")}
                  style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.8rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '600', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <Activity size={16} /> 🚑 Cardiac Arrest
                </button>
                <button 
                  onClick={() => triggerManualEmergency("PHYSICAL FIGHT", "red")}
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.8rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '600', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <ShieldAlert size={16} /> 👊 Physical Fight
                </button>
              </div>
            )}
          </div>
          
          <button 
             onClick={() => toggleNetwork()} 
             style={{ background: 'transparent', color: isMeshActive ? '#10b981' : '#f97316', border: `1px solid ${isMeshActive ? '#10b981' : '#f97316'}`, padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            {isMeshActive ? "Restore Internet" : "Internet Down"}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold', letterSpacing: '0.05em' }}>ROLE:</span>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '6px', padding: '0.3rem 0.5rem', outline: 'none', cursor: 'pointer' }}
            >
              <option value="Security">Apex Safety Command</option>
              <option value="Staff">On-Site Responders</option>
              <option value="Emergency">Emergency Services</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isServerConnected ? '#38bdf8' : '#ef4444' }}>
            {isServerConnected ? <Wifi size={20} /> : <WifiOff size={20} />}
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Apex Core</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isMeshActive ? '#ca8a04' : '#3b82f6' }}>
            <Activity size={20} />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>P2P Mesh</span>
          </div>
        </div>
      </header>

      {/* Dynamic Mesh Mode Banner */}
      {isMeshActive && (
        <div style={{ background: '#ef4444', color: 'white', padding: '0.6rem', textAlign: 'center', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Activity size={20} />
          OFFLINE MESH MODE ACTIVE
        </div>
      )}

      {/* Main Content */}
      <main key={role} className="role-transition" style={{ flex: 1, padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 340px 380px', gap: '1.5rem', minHeight: 0 }}>

        {/* Left Column: Digital Twin */}
        <section className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, position: 'relative' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Digital Twin Workspace
              <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: nodeCount > 0 ? '#10b981' : '#64748b', display: 'inline-block' }}></span>
                Active Nodes: {nodeCount}
              </span>
            </h2>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <DigitalTwinScene />
            
            {/* LEGEND overlay */}
            <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(10, 14, 23, 0.85)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '12px', zIndex: 100, fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>Role Legend</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }}></div> Teal: Responders (Active)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ec4899' }}></div> Pink: Protected Nodes (Passive)</div>
              {role === 'Emergency' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#a855f7', animation: 'pulseText 1s infinite alternate' }}></div> Purple: Priority Victim
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }}></div> Orange/Red: Incident Node</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 16, height: 4, background: '#10b981' }}></div> Neon Green: Safe Path</div>
              {role === 'Emergency' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 16, height: 4, background: '#ffffff' }}></div> Solid White: Access Route</div>
              )}
            </div>
          </div>
        </section>

        {/* Middle Column: IoT & AI Dispatcher */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
          {role !== 'Staff' && (
            <>
              <div style={{ flex: 'none', height: 'auto' }}>
                <IoTDashboard />
              </div>

              <div className="glass-panel">
                <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Metrics & Telemetry</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Occupancy Status</span>
                <div style={{ margin: '0.5rem 0 0 0', fontWeight: 600, color: '#10b981', fontSize: '1.2rem', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                  {alert?.metrics ? alert.metrics.safe : 450} Protected
                </div>
                <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '4px', fontWeight: 'bold' }}>
                  {alert?.metrics ? alert.metrics.at_risk : 0} At Risk
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Active Responders</span>
                  {alert && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{activeTimer}</span>}
                </div>
                <div style={{ margin: '0.5rem 0 0 0', fontWeight: 600, color: '#38bdf8', fontSize: '1.3rem', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                  {alert?.metrics ? alert.metrics.responders : 12}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>ON SITE</span>
                </div>
              </div>
            </div>

            {alert && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#ef4444' }}>Incident Status: ONGOING</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0' }}>Spatial Audio routing enabled. Haptics tracking to Sector.</p>
              </div>
            )}
          </div>
          </>
          )}

          <div style={{ flex: 1, minHeight: '300px' }}>
            <AIGhostDispatcher />
          </div>
        </section>

        {/* Right Column: Crisis Command, SOP, Comms */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
          {alert && (
            <div className="glass-panel" style={{ border: '1px solid #ef4444', animation: 'bgFlash 2s infinite alternate' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} />
                APEX CRISIS COMMAND
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Danger Zone</span>
                  <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold', color: 'white', fontSize: '1.1rem' }}>{alert.zone || "Identifying..."}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>At Risk</span>
                    <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold', color: '#fbbf24', fontSize: '1.1rem' }}>{alert.peopleAtRisk || 0}</p>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Nearest Staff</span>
                    <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold', color: '#10b981', fontSize: '0.9rem' }}>{alert.nearestStaff || "Locating..."}</p>
                  </div>
                </div>
                {alert.vulnerabilities && (
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '8px', borderLeft: '4px solid #f97316' }}>
                     <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Vulnerable Priorities</span>
                     <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold', color: '#38bdf8', fontSize: '0.9rem' }}>
                       Elderly: <span style={{color: '#f97316'}}>{alert.vulnerabilities.elderly}</span> | 
                       Children: <span style={{color: '#f97316'}}>{alert.vulnerabilities.children}</span> | 
                       Disabled: <span style={{color: '#f97316'}}>{alert.vulnerabilities.disabled}</span>
                     </p>
                  </div>
                )}
                {role === 'Staff' && (
                  <button style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid currentColor', color: '#10b981', padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', marginTop: '0.5rem', cursor: 'pointer', transition: 'all 0.2s ease' }} onClick={() => window.alert('Zone Secured marked successfully.')}>
                    Mark Area Evacuated
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={{ flex: role === 'Emergency' ? 1 : 'none', display: 'flex', flexDirection: 'column' }}>
             <SOPPanel />
          </div>

          <div style={{ flex: role === 'Emergency' ? 'none' : 1, display: 'flex', flexDirection: 'column', minHeight: '200px' }}>
             <CommunicationPanel />
          </div>
        </section>
      </main>

      {/* Auto-Broadcast Role Modals */}
      {alert && role === 'Staff' && alert.type.includes('FIRE') && (
        <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', background: '#3b82f6', color: 'white', padding: '2rem', borderRadius: '12px', zIndex: 1000, boxShadow: '0 10px 40px rgba(59, 130, 246, 0.5)', textAlign: 'center', border: '1px solid #93c5fd' }}>
          <h2 style={{ margin: '0 0 1rem 0' }}>🔥 EVACUATION DUTY ACTIVE</h2>
          <p style={{ fontSize: '1.1rem', margin: 0 }}>Please guide all occupants to safety. A Safe Exit Path has been routed to your device.</p>
        </div>
      )}

      {/* Global Priority Overlay */}
      <GravityAlertOverlay />

      {/* Network Status Toast */}
      <div 
        style={{
          position: 'fixed',
          bottom: showToast ? '20px' : '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#10b981',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '30px',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          zIndex: 1000
        }}
      >
        <Wifi size={18} />
        Connected to Server
      </div>
    </div>
  );
}

export default App;
