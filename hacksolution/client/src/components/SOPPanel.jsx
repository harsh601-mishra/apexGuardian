import React, { useState, useEffect } from 'react';
import { useCrisis } from '../contexts/CrisisProvider';
import { CheckSquare, Square, AlertTriangle } from 'lucide-react';

const SOP_DATABASE = {
  FIRE: [
    "Confirm alarm location and dispatch scout.",
    "Trigger zone evacuation protocol.",
    "Unlock emergency exits in Sector.",
    "Verify no occupants remain in marked danger zone."
  ],
  MEDICAL: [
    "Dispatch nearest medically-trained staff.",
    "Clear pathways for EMT access.",
    "Fetch AED or necessary first-aid kits.",
    "Secure area to ensure patient privacy."
  ],
  SECURITY: [
    "Dispatch Security Unit Alpha/Beta to location.",
    "Isolate the area to prevent crowd gathering.",
    "De-escalate situation or detain aggressors.",
    "Report status to Safety Command immediately."
  ],
  DEFAULT: [
    "Assess the situation and report to Hub.",
    "Ensure immediate safety of nearby occupants.",
    "Await further instructions from Gravity Engine."
  ]
};

export const SOPPanel = () => {
  const { alert, acknowledgedIncident, responderStatus } = useCrisis();
  const [tasks, setTasks] = useState([]);

  const activeCrisis = alert || acknowledgedIncident;
  const [activeTimer, setActiveTimer] = useState("00:00");

  useEffect(() => {
    let timer;
    if (activeCrisis?.timestamp) {
      const startTime = new Date(activeCrisis.timestamp).getTime();
      timer = setInterval(() => {
        const diff = Math.floor((Date.now() - startTime) / 1000);
        const mins = String(Math.floor(diff / 60)).padStart(2, '0');
        const secs = String(diff % 60).padStart(2, '0');
        setActiveTimer(`${mins}:${secs}`);
      }, 1000);
    } else {
      setActiveTimer("00:00");
    }
    return () => clearInterval(timer);
  }, [activeCrisis]);

  useEffect(() => {
    if (activeCrisis) {
      const typeStr = activeCrisis.type?.toUpperCase() || "DEFAULT";
      let checklist = SOP_DATABASE.DEFAULT;
      
      if (typeStr.includes("FIRE")) checklist = SOP_DATABASE.FIRE;
      else if (typeStr.includes("MEDICAL") || typeStr.includes("INJURY") || typeStr.includes("CARDIAC")) checklist = SOP_DATABASE.MEDICAL;
      else if (typeStr.includes("FIGHT") || typeStr.includes("SECURITY")) checklist = SOP_DATABASE.SECURITY;
      
      setTasks(checklist.map((text, i) => ({ id: i, text, completed: false })));
    } else {
      setTasks([]);
    }
  }, [activeCrisis]);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  if (!activeCrisis) return null;

  const progress = tasks.length ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0;

  return (
    <div className="glass-panel" style={{ border: '1px solid var(--glass-border)' }}>
      <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
        <AlertTriangle size={20} color="#f97316" />
        <span style={{ flex: 1 }}>Active SOP: {activeCrisis.type || "EMERGENCY"}</span>
        <span style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 'bold', animation: 'pulseText 2s infinite alternate' }}>{activeTimer}</span>
      </h3>

      {responderStatus && (
        <div style={{ 
          marginBottom: '1rem', 
          background: 'rgba(59, 130, 246, 0.2)', 
          border: '1px solid #3b82f6', 
          color: '#3b82f6', 
          padding: '0.5rem 1rem', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          animation: 'fadeIn 0.5s ease'
        }}>
          <Activity size={16} />
          {responderStatus}
        </div>
      )}
      
      <div style={{ marginBottom: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#10b981' : '#f97316', transition: 'width 0.3s ease' }}></div>
      </div>

      {tasks.length > 0 && tasks.find(t => !t.completed) && (
        <div style={{ marginBottom: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.8rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.75rem', color: '#10b981', textTransform: 'uppercase', marginBottom: '0.2rem', fontWeight: 'bold' }}>Next Best Action</div>
          <div style={{ color: 'white', fontSize: '0.9rem' }}>{tasks.find(t => !t.completed).text}</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {tasks.map((task) => (
          <div 
            key={task.id} 
            onClick={() => toggleTask(task.id)}
            style={{ 
              display: 'flex', alignItems: 'flex-start', gap: '0.8rem', 
              padding: '0.6rem', background: task.completed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.2)', 
              borderRadius: '6px', cursor: 'pointer',
              border: `1px solid ${task.completed ? 'rgba(16, 185, 129, 0.3)' : 'transparent'}`
            }}
          >
            <div style={{ color: task.completed ? '#10b981' : '#64748b', marginTop: '2px' }}>
              {task.completed ? <CheckSquare size={18} /> : <Square size={18} />}
            </div>
            <span style={{ 
              fontSize: '0.9rem', 
              color: task.completed ? 'var(--text-secondary)' : '#e2e8f0',
              textDecoration: task.completed ? 'line-through' : 'none'
            }}>
              {task.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
