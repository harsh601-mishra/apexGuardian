import React, { useState } from 'react';
import { useCrisis } from '../contexts/CrisisProvider';
import { Send, MessageSquare, Trash2 } from 'lucide-react';

export const CommunicationPanel = () => {
  const { messages, sendMessage, role, clearChatHistory } = useCrisis();
  const [inputText, setInputText] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '300px' }}>
      <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
        <MessageSquare size={20} />
        Mesh Comms
        <button 
          onClick={() => {
            const isGlobal = role === 'Security';
            const msg = isGlobal 
              ? "ADMIN ACTION: Are you sure you want to clear communication logs for ALL nodes?" 
              : "Are you sure you want to clear your local chat history?";
            
            if (window.confirm(msg)) {
              clearChatHistory(isGlobal);
            }
          }}
          style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          title={role === 'Security' ? "Global Clear (Admin)" : "Local Clear"}
        >
          <Trash2 size={16} />
        </button>
      </h3>
      
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            background: msg.sender === 'You' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(0,0,0,0.3)',
            borderLeft: `3px solid ${msg.role === 'Security' ? '#ef4444' : msg.role === 'Emergency' ? '#f97316' : '#10b981'}`,
            padding: '0.5rem 0.8rem',
            borderRadius: '4px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
              <span style={{ fontWeight: 'bold', color: 'white' }}>{msg.sender !== 'You' ? `[${msg.role}]` : 'You'}</span>
              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>{msg.text}</div>
          </div>
        ))}
        {messages.length === 0 && (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem' }}>
            No communication in this sector yet.
          </div>
        )}
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Transmit SITREP..."
          style={{ flex: 1, padding: '0.6rem 1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', borderRadius: '50px', color: 'white', outline: 'none' }}
        />
        <button type="submit" style={{ background: 'var(--accent-blue)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
          <Send size={18} />
        </button>
      </form>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
        {["Evacuate Now", "Need Backup", "Area Secured"].map(action => (
           <button 
             key={action} 
             onClick={(e) => { e.preventDefault(); sendMessage(action); }} 
             style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
           >
             {action}
           </button>
        ))}
      </div>
    </div>
  );
};
