const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { getGuestInfoByLocation } = require('./data');
const { generateMockPayload } = require('./mockData');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Task 1: The Heartbeat (Backend)
const activeNodes = new Set();

io.on('connection', (socket) => {
  console.log('[Apex Guardian] Node connected:', socket.id);
  activeNodes.add(socket.id);

  // Broadcast updated count
  io.emit('node_count', activeNodes.size);

  socket.on('send_message', (msg) => {
    io.emit('receive_message', { ...msg, id: `msg-${Date.now()}` });
  });

  socket.on('voice_message', (payload) => {
    // Broadcast voice messages to all nodes EXCEPT the sender
    socket.broadcast.emit('voice_message', payload);
  });

  socket.on('clear_all_comms', () => {
    // Global clear for everyone
    io.emit('clear_all_comms');
  });

  // Task 2: Listen for CRISIS_EVENT
  socket.on('CRISIS_EVENT', (data) => {
    console.log('[Gravity Engine] CRISIS_EVENT received', data);

    // FETCH UNIFIED DB INFO
    const loc = data.location || { x: 0, z: 0 };
    const locationInfo = getGuestInfoByLocation(loc.x, loc.z);

    // Inject mock telemetry from server layer
    const mockData = generateMockPayload(activeNodes);

    const sitrep = {
      incidentId: `INC-${Date.now()}`,
      type: data.type || "UNKNOWN_HAZARD",
      location: loc,
      severity: data.type === 'ANIMAL_AGGRESSION' ? "WARNING" : "CRITICAL",
      description: data.description || "Simulated Crisis Event",
      weight: data.type === 'ANIMAL_AGGRESSION' ? 80 : 100,
      timestamp: new Date().toISOString(),
      zone: locationInfo.zone,
      peopleAtRisk: locationInfo.peopleAtRisk,
      guestInfo: locationInfo.guestInfo,
      nearestStaff: locationInfo.nearestStaff,
      vulnerabilities: locationInfo.vulnerabilities,
      ...mockData
    };

    // Broadcast gravity_alert to trigger the override protocol
    io.emit('gravity_alert', sitrep);
  });

  socket.on('manual_shout_trigger', (data) => {
    console.log('[Gravity Engine] MANUAL SHOUT DETECTED', data);
    const sitrep = {
      incidentId: `INC-SHOUT-${Date.now()}`,
      type: "HUMAN DISTRESS / SHOUTING",
      location: data.location,
      severity: "CRITICAL",
      description: "AI Acoustics classified: Immediate vocal distress detected at Node Location.",
      isManual: true,
      timestamp: new Date().toISOString(),
      zone: "Dynamic Sector (Audio Origin)",
      peopleAtRisk: 1,
      nearestStaff: "Locating nearest responder...",
      iotStats: {
        decibel: 95,
        location: data.location,
        temperature: 22,
        smoke_level: 'low'
      }
    };
    io.emit('gravity_alert', sitrep);
  });

  socket.on('disconnect', () => {
    console.log('[Apex Guardian] Node disconnected:', socket.id);
    activeNodes.delete(socket.id);
    io.emit('node_count', activeNodes.size);
  });
});

// Periodic IoT Sensor polling
setInterval(() => {
  // Simulate pseudo-random sensor states
  const statuses = ['ONLINE', 'ONLINE', 'ONLINE', 'WARNING', 'OFFLINE'];
  const iotState = {
    cctv: statuses[Math.floor(Math.random() * 3)], // higher chance of ONLINE
    fireAlarm: statuses[Math.floor(Math.random() * 2)],
    smokeDetector: 'ACTIVE',
    smartLocks: 'LOCKED'
  };
  io.emit('iot_status', iotState);
}, 5000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[Apex Guardian] Server listening on port ${PORT}`);
});
