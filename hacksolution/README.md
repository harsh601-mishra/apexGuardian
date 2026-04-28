
# ApexGuardian

Decentralized Crisis Response Mesh Network Platform.

## The Problem: Hospitality Under Pressure 🏨

Hospitality venues (Hotels, Resorts, Restaurants) can suddenly face serious, unpredictable emergencies such as fires, medical crises, violent conflicts, or natural disasters. When these events occur, the environment becomes chaotic very quickly. 

- ⚡ **Things happen suddenly**: With no warning, people immediately panic, demanding lightning-fast decision-making.
- 🤝 **Everyone must act together**: Staff, security, and emergency teams need to work flawlessly as one unified team. If they fail to coordinate, the situation escalates.
- 🧠 **Information is scattered**: Critical data is split across different silos—reception holds the guest manifest, security monitors the danger zones via cameras, while boots-on-the-ground staff only understand their localized situation. They struggle to share this data effectively.
- 📉 **Communication breaks**: Due to poor information sharing, guests are left confused and afraid, staff are disorganized, and external responders (police/firefighters) arrive without the full picture. The result is a sluggish response that puts lives at risk.

> **🎯 The Core Mission**  
> Big emergencies require fast teamwork, but poor communication makes everything worse. Vortex Sentinel is built to eliminate these communication bottlenecks.

## Architecture

- **Frontend**: React + Vite + React Three Fiber (Port 5173). Manages the Glassmorphic UI Dashboard, the Digital Twin 3D view, AI Ghost Dispatcher, and Gravimetric Alerts (DeviceOrientation haptics + WebAudio spatial tracking).
- **Backend (Gravity Hub)**: Express + Socket.io Node server (Port 3001). Tracks real-world "Active Nodes" dynamically as tabs/devices connect. Propagates maximum-weight `CRISIS_EVENT` logs to all connected nodes instantly to trigger Force-Priority Override locks across the mesh.

## How to Run the Platform

You need two console windows running simultaneously:

### 1. Start the Gravity Engine (Backend)

Open a terminal and run the following commands:
```bash
cd server
npm i
npm start
# OR simply
node index.js
```
The server will boot up on `http://localhost:3001`.

### 2. Start the Cortex Dashboard (Frontend)

Open a second terminal window and run:
```bash
cd client
npm i
npm run dev
```
The Vite development server will start on `http://localhost:5173`.

### 3. Usage & Testing

1. **Verify Active Nodes:** Open `http://localhost:5173` in multiple tabs or devices. You will see the "Active Nodes" metric tick upwards on the dashboard in real time.
2. **Trigger an Event:** Click "Simulate Window Break" or "Simulate Medical Event".
3. **Observe the AI Ghost Dispatcher:** The component will switch to "Drafting SITREP..." indicating the autonomous agent is processing ambient anomalies.
4. **Crisis Override:** After 2 seconds, the `CRISIS_EVENT` triggers. A red Force-Priority locking overlay will block all interactions on every connected tab/device instantly. The 3D Digital Twin will pulse a red hazard indicator sphere at the calculated coordinates.
5. **Gravimetric Testing:** If you test on a mobile device and grant device orientation permissions, pointing the top of your phone directly towards the physical coordinate heading of the hazard point will trigger the device to pulse its vibration motor (`navigator.vibrate`), effectively pulling First Responders towards the location.
