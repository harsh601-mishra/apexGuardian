import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const CrisisContext = createContext();

export const useCrisis = () => useContext(CrisisContext);

export const CrisisProvider = ({ children }) => {
  const [alert, setAlert] = useState(null);
  const [acknowledgedIncident, setAcknowledgedIncident] = useState(null); // Post-Acknowledge status
  const [socket, setSocket] = useState(null);
  const [nodeCount, setNodeCount] = useState(0);
  const [role, setRole] = useState('Security'); // Roles: Security, Staff, Emergency
  const [isMeshActive, setIsMeshActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [iotData, setIotData] = useState(null);
  const [activeTasks, setActiveTasks] = useState([]);
  const [meshPeers, setMeshPeers] = useState({}); // Track P2P nodes
  const [responderStatus, setResponderStatus] = useState(null); // e.g. "Medical Team On-Site"
  const [userPosition, setUserPosition] = useState({ x: 0, z: 12 }); // Simulated node position
  const [privacyMode, setPrivacyMode] = useState(false);
  const [isVoiceBroadcastActive, setIsVoiceBroadcastActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingLevel, setRecordingLevel] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const broadcastChannel = useRef(null);
  
  const lastVibrateTime = useRef(0);

  useEffect(() => {
    // Connect to the server hosted on the same IP address
    const serverUrl = `http://${window.location.hostname}:3001`;
    const newSocket = io(serverUrl, { transports: ['websocket'] });
    setSocket(newSocket);

    newSocket.on('connect', () => setIsMeshActive(false));
    newSocket.on('disconnect', () => setIsMeshActive(true));

    newSocket.on('node_count', (count) => {
      setNodeCount(count);
    });

    newSocket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg].slice(-50)); // keep last 50
    });

    newSocket.on('iot_status', (data) => {
      setIotData(data);
    });

    newSocket.on('voice_message', (payload) => {
      handleIncomingVoice(payload);
    });

    newSocket.on('clear_all_comms', () => {
      setMessages([]);
      localStorage.removeItem('mesh_messages');
    });

    newSocket.on('gravity_alert', (data) => {
      console.error('[APEX RESPONSE ENGINE OVERRIDE]', data);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification("🚨 EMERGENCY: GET TO SAFETY", {
          body: `Hazard: ${data.type || 'Unknown'}`
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification("🚨 EMERGENCY: GET TO SAFETY", {
              body: `Hazard: ${data.type || 'Unknown'}`
            });
          }
        });
      }

      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.5);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 1.0);
        
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2.0);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 2.0);
      } catch (e) {
        console.error("Audio playback failed", e);
      }

      setAlert(prev => {
        if (!prev) {
          // Haptics on initial alert
          if (navigator.vibrate) {
            navigator.vibrate([100, 100, 100, 300, 300, 300]);
          }
        }
        return data; 
      });
      // Clear past acknowledged incident when a new one comes in
      setAcknowledgedIncident(null);
    });

    // Offline MESH Synchronization Layer
    broadcastChannel.current = new BroadcastChannel('mesh_sync_channel');
    
    // Load local messages cache or preload demo
    const cachedMessages = localStorage.getItem('mesh_messages');
    if (cachedMessages) {
      try { setMessages(JSON.parse(cachedMessages)); } catch(e){}
      const demoMessages = [
        { id: 'startup', text: "Apex Guardian System Online. Monitoring active nodes...", sender: "SYSTEM", role: "Security", timestamp: new Date().toISOString() }
      ];
      setMessages(demoMessages);
      localStorage.setItem('mesh_messages', JSON.stringify(demoMessages));
    }

    broadcastChannel.current.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'MESH_CHAT') {
        setMessages(prev => {
           const updated = [...prev, payload].slice(-50);
           localStorage.setItem('mesh_messages', JSON.stringify(updated));
           return updated;
        });
      } else if (type === 'MESH_VOICE') {
        handleIncomingVoice(payload);
      } else if (type === 'MESH_CLEAR') {
        setMessages([]);
        localStorage.removeItem('mesh_messages');
      } else if (type === 'MESH_NODE_SYNC') {
        setMeshPeers(prev => ({ ...prev, [payload.id]: payload.position }));
      }
    };

    return () => {
      newSocket.disconnect();
      if (broadcastChannel.current) broadcastChannel.current.close();
    };
  }, []);

  // Sync P2P Node movements offline
  useEffect(() => {
    if (isMeshActive && broadcastChannel.current) {
      const interval = setInterval(() => {
         const myPos = [
            Math.sin(Date.now() / 2000) * 10,
            0.5,
            12 + Math.cos(Date.now() / 2000) * 5
         ];
         broadcastChannel.current.postMessage({
            type: 'MESH_NODE_SYNC',
            payload: { id: `MeshPeer-[${role}]`, position: myPos }
         });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isMeshActive, role]);

  // Gravity Orientation (Hardware API)
  useEffect(() => {
    if (!alert) return;

    const handleOrientation = (event) => {
      let currentHeading = event.webkitCompassHeading || event.alpha;
      if (currentHeading == null) return; 

      if (!alert.location) return;

      const hx = alert.location.x;
      const hz = alert.location.z; 
      
      const angleToHazard = (Math.atan2(hx, hz * -1) * 180 / Math.PI + 360) % 360;

      const diff = Math.abs(currentHeading - angleToHazard);
      const isPointing = diff < 20 || diff > 340; 

      if (isPointing) {
        const now = Date.now();
        if (now - lastVibrateTime.current > 1500) {
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          lastVibrateTime.current = now;
        }
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [alert]);

  const triggerCrisisEvent = (data) => {
    const loc = data.location || { x: 0, z: 0 };
    // ZERO LATENCY UI
    const sitrep = {
      incidentId: `INC-LOCAL-${Date.now()}`,
      type: data.type || "UNKNOWN_HAZARD",
      location: loc,
      severity: data.confidence < 80 ? "WARNING" : (data.type === 'ANIMAL_AGGRESSION' ? "WARNING" : "CRITICAL"),
      description: data.description || "Simulated Crisis Event",
      isManual: data.isManual || false,
      confidence: data.confidence || 100,
      weight: data.type === 'ANIMAL_AGGRESSION' ? 80 : 100,
      timestamp: new Date().toISOString(),
      // Mock local fallback until server replies
      zone: "Processing Apex Local Sector...",
      peopleAtRisk: "Calculating...",
      guestInfo: "Local Mesh: Re-syncing Apex database...",
      nearestStaff: "Scanning Apex mesh protocol..."
    };
    
    setAlert(sitrep);
    setAcknowledgedIncident(null);
    
    if (navigator.vibrate) navigator.vibrate([100, 100, 100, 300, 300, 300]);

    if (socket) {
      socket.emit('CRISIS_EVENT', data);
    }
  };

  const sendMessage = (text) => {
    if (text.trim()) {
      const msg = { id: Date.now(), text, sender: 'You', role, timestamp: new Date().toISOString() };
      
      if (socket && !isMeshActive) {
        socket.emit('chat_message', msg);
      } else {
        // Broadcast in Offline Mesh Mode
        const peerMsg = { ...msg, sender: `Peer-[${role}]` };
        setMessages(prev => {
          const updated = [...prev, msg].slice(-50);
          localStorage.setItem('mesh_messages', JSON.stringify(updated));
          return updated;
        });
        if (broadcastChannel.current) {
          broadcastChannel.current.postMessage({ type: 'MESH_CHAT', payload: peerMsg });
        }
      }
    }
  };

  const dismissAlert = () => {
    setAcknowledgedIncident(alert); // Keep track post-acknowledgement
    setAlert(null);
  }

  const clearAcknowledgedIncident = () => {
    setAcknowledgedIncident(null);
  }

  const toggleNetwork = (forceConnect) => {
    if (!socket) return;
    if (forceConnect === false || socket.connected) {
       socket.disconnect();
    } else {
       socket.connect();
    }
  };

  const playWalkieSound = (type) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (type === 'start') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
      } else {
        const bufferSize = audioCtx.sampleRate * 0.3;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
        const whiteNoise = audioCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        whiteNoise.connect(gain); gain.connect(audioCtx.destination);
        whiteNoise.start();
      }
    } catch (e) {}
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      // Setup Analyser for Volume Meter
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      analyserRef.current = audioCtx.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        setRecordingLevel(average);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      // Initialize Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          setInterimTranscript(interim);
          setTranscription(prev => prev + final);
        };
        
        recognitionRef.current.start();
      }

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result;
          sendVoiceMessage(base64Audio, transcription || interimTranscript);
          setTranscription('');
          setInterimTranscript('');
        };
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTranscription('');
      setInterimTranscript('');
      playWalkieSound('start');
    } catch (err) {
      console.error("Recording failed", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      analyserRef.current = null;
      setRecordingLevel(0);
      setIsRecording(false);
      playWalkieSound('stop');
    }
  };

  const sendVoiceMessage = (base64Audio, text = '') => {
    const payload = {
      id: Date.now(),
      sender: role === 'Security' ? 'Security Unit 01' : `Unit [${role}]`,
      role,
      audio: base64Audio,
      text: text,
      timestamp: new Date().toISOString()
    };
    
    if (socket && socket.connected) {
      socket.emit('voice_message', payload);
    }
    
    if (broadcastChannel.current) {
      broadcastChannel.current.postMessage({ type: 'MESH_VOICE', payload });
    }

    const displayMsg = text ? `[Voice-to-Text] "${text}"` : "🎤 Voice SITREP Transmitted";

    setMessages(prev => [...prev, { 
      id: payload.id, 
      text: displayMsg, 
      sender: 'You', 
      role, 
      timestamp: payload.timestamp 
    }].slice(-50));
  };

  const handleIncomingVoice = (payload) => {
    if (payload.sender === 'You') return;
    
    // Auto-play
    const audio = new Audio(payload.audio);
    audio.play().catch(e => console.error("Auto-play blocked", e));
    
    // Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Incoming SITREP from ${payload.sender}`, {
        body: payload.text ? `"${payload.text}"` : "Audio transmission received."
      });
    }

    const displayMsg = payload.text ? `[Voice-to-Text] "${payload.text}"` : `🎤 Incoming Voice: ${payload.sender}`;

    setMessages(prev => [...prev, { 
      id: payload.id, 
      text: displayMsg, 
      sender: payload.sender, 
      role: payload.role, 
      timestamp: payload.timestamp 
    }].slice(-50));
  };

  const clearChatHistory = (isGlobal = false) => {
    setMessages([]);
    localStorage.removeItem('mesh_messages');
    
    if (isGlobal) {
      if (socket && socket.connected) {
        socket.emit('clear_all_comms');
      }
      if (broadcastChannel.current) {
        broadcastChannel.current.postMessage({ type: 'MESH_CLEAR' });
      }
      sendMessage("SYSTEM: Communication logs cleared by Admin.");
    }
  };

  const triggerVoiceBroadcast = () => {
    if (role === 'Security') {
      const newState = !isVoiceBroadcastActive;
      setIsVoiceBroadcastActive(newState);
      if (newState) {
        sendMessage("SYSTEM: Voice Broadcast initiated by Safety Command.");
      }
    } else {
      window.alert(`Opening direct encrypted voice line to Gravity Hub...`);
      sendMessage(`REQUEST: ${role} initiating direct voice contact.`);
    }
  };

  return (
    <CrisisContext.Provider value={{ alert, acknowledgedIncident, nodeCount, socket, role, setRole, isMeshActive, messages, iotData, activeTasks, meshPeers, broadcastChannel, responderStatus, setResponderStatus, userPosition, setUserPosition, privacyMode, setPrivacyMode, isVoiceBroadcastActive, setIsVoiceBroadcastActive, isRecording, recordingLevel, transcription, interimTranscript, startRecording, stopRecording, triggerVoiceBroadcast, sendMessage, clearChatHistory, triggerCrisisEvent, dismissAlert, clearAcknowledgedIncident, toggleNetwork }}>
      {children}
    </CrisisContext.Provider>
  );
};
