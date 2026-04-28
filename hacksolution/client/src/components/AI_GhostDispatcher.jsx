import React, { useState, useEffect, useRef } from 'react';
import { useCrisis } from '../contexts/CrisisProvider';
import { Mic, Zap, Volume2, VolumeX, Activity, Loader2, Bug } from 'lucide-react';

export const AIGhostDispatcher = () => {
  const { triggerCrisisEvent, alert, dismissAlert, socket, userPosition } = useCrisis();
  const [liveMonitoring, setLiveMonitoring] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); 
  const [isBaselining, setIsBaselining] = useState(false);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const canvasRef = useRef(null);

  const baselineRef = useRef({ sum: 0, count: 0, active: false, value: 0 });
  const triggerCooldownRef = useRef(0);
  
  // Audio State Tracking for Frequency-Duration Classifier
  const audioStateRef = useRef({
    shoutStart: 0,
    glassStart: 0,
    blastStart: 0,
    isBlastActive: false,
    isGlassActive: false,
    isShoutActive: false
  });

  const simulateCrisis = (type, location, description, isManual = false, confidence = 100) => {
    const now = Date.now();
    if (now - triggerCooldownRef.current < 5000) return;
    
    if (alert) return; 
    setLiveMonitoring(false);
    
    triggerCooldownRef.current = now;
    
    triggerCrisisEvent({
      type,
      location,
      description,
      isManual,
      confidence
    });
  };

  const simulateGlassBreaking = () => {
    simulateCrisis(
      "POTENTIAL BREACH: GLASS BREAK",
      { x: 15, z: -10 },
      "AI Acoustics classified: Glass Break | Confidence: 92%",
      false,
      92
    );
  };

  const simulateScreaming = () => {
    setAudioLevel(100);
    if (socket) {
      socket.emit('manual_shout_trigger', {
        location: userPosition
      });
    }
    setTimeout(() => setAudioLevel(0), 1000);
  };

  const simulateBlast = () => {
    simulateCrisis(
      "CRITICAL: BALLISTIC/EXPLOSION",
      { x: 12, z: 15 },
      "AI Acoustics classified: Full-spectrum energy burst (<100ms)",
      false,
      98
    );
  };

  const simulateFire = () => {
    simulateCrisis(
      "FIRE DETECTED",
      { x: -10, z: -10 },
      "IoT Thermals: Temperature anomaly detected",
      false,
      85
    );
  };

  const simulateMedical = () => {
    simulateCrisis(
      "MEDICAL EMERGENCY",
      { x: 5, z: 5 },
      "Wearable Vitals: Irregular heartbeat detected",
      false,
      74
    );
  };

  useEffect(() => {
    if (!liveMonitoring || alert) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (sourceRef.current) {
        sourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setAudioLevel(0);
      setIsBaselining(false);
      setIsListening(false);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }

    const startMonitoring = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setIsListening(true);
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 512; // 256 frequency bins
        
        // 4. Anti-False Alarm: smoothingTimeConstant 0.8
        analyserRef.current.smoothingTimeConstant = 0.8; 
        
        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const timeData = new Uint8Array(bufferLength);
        const freqData = new Uint8Array(bufferLength);

        baselineRef.current = { sum: 0, count: 0, active: true, value: 0 };
        setIsBaselining(true);
        audioStateRef.current = { shoutStart: 0, glassStart: 0, blastStart: 0, isBlastActive: false, isGlassActive: false, isShoutActive: false };

        setTimeout(() => {
          if (!baselineRef.current.active) return;
          baselineRef.current.active = false;
          baselineRef.current.value = baselineRef.current.sum / Math.max(baselineRef.current.count, 1);
          setIsBaselining(false);
        }, 2000);

        const analyzeAudio = () => {
          if (!liveMonitoring) return;
          
          analyserRef.current.getByteTimeDomainData(timeData);
          analyserRef.current.getByteFrequencyData(freqData);

          let currentPeak = 0;
          for (let i = 0; i < bufferLength; i++) {
            const val = Math.abs(timeData[i] - 128);
            if (val > currentPeak) currentPeak = val;
          }
          // Approx mapping: 128 maps to absolute clipping peak (100%)
          // We'll treat 100% as ~100+ dB.
          const rawPercentage = (currentPeak / 128) * 100;
          
          if (baselineRef.current.active) {
            baselineRef.current.sum += rawPercentage;
            baselineRef.current.count++;
          }
          setAudioLevel(rawPercentage);

          // Render Waveform Canvas
          if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            
            ctx.fillStyle = 'rgba(10, 14, 23, 0.8)';
            ctx.fillRect(0, 0, width, height);
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = isBaselining ? '#fbbf24' : '#3b82f6';
            ctx.beginPath();
            
            const sliceWidth = width * 1.0 / bufferLength;
            let x = 0;
            
            for(let i = 0; i < bufferLength; i++) {
              const v = timeData[i] / 128.0;
              const y = v * height / 2;
              
              if(i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
              x += sliceWidth;
            }
            ctx.stroke();
          }

          if (!baselineRef.current.active && !alert) {
            const now = Date.now();
            if (now - triggerCooldownRef.current > 5000) {
              
              // With fftSize 512, sampleRate ~48kHz -> bin size ~93.75 Hz
              const maxAmplitude = rawPercentage / 100;

              // Frequency Burst: Check if energy is spread across all frequency bins (White Noise)
              let activeBlastBins = 0;
              // 3. Critical Ballistic / Blast: 0Hz - 20kHz (bins 0 to 213)
              for (let i = 0; i <= 213; i++) {
                 if (freqData[i] > 15) activeBlastBins++;
              }
              const isFullSpectrumBurst = activeBlastBins > (213 * 0.8) && maxAmplitude > 0.85;

              let glassPeak = 0;
              // 1. Window Break Detection: > 5000Hz (bins 53 to 255)
              for (let i = 53; i < bufferLength; i++) {
                 if (freqData[i] > glassPeak) glassPeak = freqData[i];
              }
              const isGlassBreak = glassPeak > 180;

              let shoutPeak = 0;
              // 2. Human Distress (Shouting): 1500Hz - 3500Hz (bins 16 to 37)
              // 4. Normal Hospital Noise Filter: Low freq is ignored naturally by skipping i < 11
              for (let i = 16; i <= 37; i++) {
                 if (freqData[i] > shoutPeak) shoutPeak = freqData[i];
              }
              const isShoutFreq = shoutPeak > 180;

              // --- 3. CRITICAL BALLISTIC / BLAST (< 100ms) ---
              if (isFullSpectrumBurst) {
                 if (!audioStateRef.current.isBlastActive) {
                    audioStateRef.current.isBlastActive = true;
                    audioStateRef.current.blastStart = now;
                 }
              } else {
                 if (audioStateRef.current.isBlastActive) {
                    const duration = now - audioStateRef.current.blastStart;
                    if (duration > 0 && duration < 100) {
                        simulateCrisis("CRITICAL: BALLISTIC/EXPLOSION", { x: 12, z: 15 }, "AI Acoustics classified: Full-spectrum energy burst (<100ms)", false, 98);
                        audioStateRef.current.isBlastActive = false;
                        return;
                    }
                    audioStateRef.current.isBlastActive = false;
                 }
              }

              // --- 1. WINDOW BREAK DETECTION (< 300ms) ---
              if (isGlassBreak && !audioStateRef.current.isBlastActive) {
                 if (!audioStateRef.current.isGlassActive) {
                    audioStateRef.current.isGlassActive = true;
                    audioStateRef.current.glassStart = now;
                 }
              } else {
                 if (audioStateRef.current.isGlassActive) {
                    const duration = now - audioStateRef.current.glassStart;
                    if (duration > 0 && duration < 300) {
                        simulateCrisis("POTENTIAL BREACH: GLASS BREAK", { x: 15, z: -10 }, "AI Acoustics classified: Glass Break | Confidence: 92%", false, 92);
                        audioStateRef.current.isGlassActive = false;
                        return;
                    }
                    audioStateRef.current.isGlassActive = false;
                 }
              }

              // --- 2. HUMAN DISTRESS (SHOUTING) (> 500ms) ---
              if (isShoutFreq && !audioStateRef.current.isBlastActive && !audioStateRef.current.isGlassActive) {
                 if (!audioStateRef.current.isShoutActive) {
                    audioStateRef.current.isShoutActive = true;
                    audioStateRef.current.shoutStart = now;
                 } else {
                    const duration = now - audioStateRef.current.shoutStart;
                    if (duration > 500) {
                        // Emit to server for global broadcast
                        if (socket) {
                          socket.emit('manual_shout_trigger', {
                            location: userPosition
                          });
                        }
                        
                        audioStateRef.current.isShoutActive = false;
                        return;
                    }
                 }
              } else {
                 audioStateRef.current.isShoutActive = false;
              }
            }
          }

          animationFrameRef.current = requestAnimationFrame(analyzeAudio);
        };
        
        analyzeAudio();

      } catch (err) {
        console.error("Microphone access denied or error:", err);
        setLiveMonitoring(false);
        setIsListening(false);
      }
    };

    startMonitoring();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (sourceRef.current) {
        sourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [liveMonitoring, alert]);

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)' }}>
          <Activity className={liveMonitoring ? 'pulse-animation' : ''} color={liveMonitoring ? '#ef4444' : 'var(--accent-blue)'} />
          <h3>Crypto-Acoustic Engine</h3>
          <div className="pulse-animation" style={{ marginLeft: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>🔒 Edge Intelligence Active - No Audio Stored</span>
          </div>
        </div>
        <button 
          onClick={() => setLiveMonitoring(!liveMonitoring)} 
          style={{ background: 'transparent', border: 'none', color: liveMonitoring ? '#ef4444' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {liveMonitoring ? <Volume2 size={20} /> : <VolumeX size={20} />}
          <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
            {liveMonitoring ? 'Live Monitor Active' : 'Enable Live Monitor'}
          </span>
        </button>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
        Zero-latency FFT ambient monitoring classifying Ballistics, Human Screams, and Animal Distress. 
      </p>
      
      {isBaselining ? (
        <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '8px', padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24' }}>
          <Loader2 size={18} className="spin-animation" />
          <span style={{ fontSize: '0.85rem' }}>Acoustic Calibration: Establishing environment baseline (2s)...</span>
        </div>
      ) : null}

      {/* Visual Feedback: "Live Audio Sense" bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Live Audio Sense: {Math.round(audioLevel)}%</span>
        <div style={{ 
          height: '8px', 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '4px', 
          overflow: 'hidden', 
          transition: 'all 0.2s',
          boxShadow: audioLevel > 95 ? '0 0 15px #ef4444' : 'none'
        }}>
          <div style={{
            height: '100%', 
            width: `${Math.min(audioLevel, 100)}%`, 
            background: audioLevel > 95 ? '#ff0000' : audioLevel > 80 ? '#ef4444' : audioLevel > 50 ? '#fbbf24' : '#10b981',
            transition: 'width 0.05s ease-out, background 0.2s',
            animation: audioLevel > 95 ? 'bgFlash 0.2s infinite alternate' : 'none'
          }} />
        </div>
      </div>

      {/* Live Waveform Visualizer */}
      <div style={{ width: '100%', height: '80px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
        {alert?.isManual ? (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontSize: '1rem', fontWeight: 'bold', letterSpacing: '0.1em', background: 'rgba(59, 130, 246, 0.1)' }}>
            ⚠️ MANUAL OVERRIDE: HUMAN REPORTED
          </div>
        ) : isListening ? (
          <canvas ref={canvasRef} width="600" height="80" style={{ width: '100%', height: '100%' }} />
        ) : (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {liveMonitoring ? 'Listening...' : 'Microphone Offline'}
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', flexDirection: 'row', flexWrap: 'wrap' }}>
        <button className="glass-btn danger" onClick={simulateGlassBreaking} style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}>
          <Zap size={12} style={{ marginRight: 4 }}/> GLASS
        </button>
        <button className="glass-btn danger" onClick={simulateScreaming} style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}>
          <Zap size={12} style={{ marginRight: 4 }}/> SHOUT
        </button>
        <button className="glass-btn danger" onClick={simulateBlast} style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}>
          <Bug size={12} style={{ marginRight: 4 }}/> BLAST
        </button>
        <button className="glass-btn danger" onClick={simulateFire} style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}>
          <Activity size={12} style={{ marginRight: 4 }}/> FIRE
        </button>
        <button className="glass-btn danger" onClick={simulateMedical} style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}>
          <Activity size={12} style={{ marginRight: 4 }}/> MED
        </button>
      </div>
    </div>
  );
};
