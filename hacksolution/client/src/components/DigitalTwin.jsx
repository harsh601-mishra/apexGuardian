import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, Sphere, Line, Plane, Ring, Circle, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useCrisis } from '../contexts/CrisisProvider';

// Utility for severity colors
const getCrisisColors = (type) => {
  const t = type?.toUpperCase() || "";
  if (t.includes('BALLISTIC') || t.includes('GUNSHOT')) return { main: "#ff0000", glow: "#8b0000", intensity: 3 };
  if (t.includes('HUMAN') || t.includes('SCREAM') || t.includes('DISTRESS')) return { main: "#ff6a00", glow: "#ff4500", intensity: 2.5 };
  if (t.includes('ANIMAL')) return { main: "#ffcc00", glow: "#b8860b", intensity: 2 };
  if (t.includes('CARDIAC')) return { main: "#3b82f6", glow: "#1d4ed8", intensity: 3 };
  if (t.includes('FIGHT')) return { main: "#ef4444", glow: "#991b1b", intensity: 3 };
  return { main: "#ef4444", glow: "#991b1b", intensity: 2 }; 
};

// Smooth Camera Controller
const CameraController = ({ alertPos, controlsRef, isAutoFollow }) => {
  const { camera } = useThree();

  useFrame(() => {
    if (!isAutoFollow) return;

    if (alertPos && controlsRef.current) {
      const target = new THREE.Vector3(alertPos[0], 0, alertPos[2]);
      controlsRef.current.target.lerp(target, 0.05);

      const desiredPos = new THREE.Vector3(alertPos[0], 12, alertPos[2] + 15);
      camera.position.lerp(desiredPos, 0.03);
    } else if (controlsRef.current) {
      const target = new THREE.Vector3(0, 0, 0);
      controlsRef.current.target.lerp(target, 0.02);
      
      const desiredPos = new THREE.Vector3(0, 25, 30);
      camera.position.lerp(desiredPos, 0.02);
    }
  });

  return null;
};

const DangerHeatmap = ({ position, color, severity, isResolved }) => {
  if (severity !== "CRITICAL" || isResolved) return null;
  return (
    <Circle position={[position[0], 0.05, position[2]]} rotation={[-Math.PI / 2, 0, 0]} args={[15, 32]}>
      <meshBasicMaterial color={color} transparent opacity={0.15} depthWrite={false} />
    </Circle>
  );
};

// Pulsing Hazard Origin with Expanding Ripples
const HazardNode = ({ position, colors, isResolved }) => {
  const meshRef = useRef();
  const ringsRef = useRef([]);

  const finalColors = isResolved ? { main: "#3b82f6", glow: "#1d4ed8", intensity: 1.5 } : colors;

  useFrame((state) => {
    if (meshRef.current) {
      const scale = (isResolved ? 1.0 : 1.2) + Math.sin(state.clock.elapsedTime * (isResolved ? 2 : 6)) * 0.4;
      meshRef.current.scale.set(scale, scale, scale);
    }
    ringsRef.current.forEach((ring, i) => {
      if (!ring) return;
      const time = (state.clock.elapsedTime * (isResolved ? 0.5 : 1.5) + i * 1.5) % 4; // Expand scale
      const size = time * 3;
      ring.scale.set(size, size, size);
      ring.material.opacity = Math.max(0, (isResolved ? 0.4 : 0.8) - (time / 4));
    });
  });

  return (
    <group position={position}>
      <Sphere ref={meshRef} args={[1.5, 32, 32]}>
        <meshStandardMaterial
          color={finalColors.main}
          transparent
          opacity={0.8}
          emissive={finalColors.glow}
          emissiveIntensity={finalColors.intensity}
        />
      </Sphere>
      
      {/* Expanding Floor Ripples */}
      {[0, 1, 2].map((i) => (
        <Ring
          key={i}
          ref={(el) => (ringsRef.current[i] = el)}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.4, 0]}
          args={[0.8, 1, 32]}
        >
          <meshBasicMaterial color={finalColors.main} transparent opacity={0} depthWrite={false} />
        </Ring>
      ))}
    </group>
  );
};

const ActiveUserNode = ({ position }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
      meshRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
      meshRef.current.scale.z = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
    }
  });

  return (
    <Sphere ref={meshRef} position={position} args={[0.5, 16, 16]}>
      <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={1.5} />
    </Sphere>
  );
};

const ShadowNode = ({ position }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      const s = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={position}>
      <Sphere ref={meshRef} args={[0.5, 12, 12]}>
        <meshStandardMaterial color="#64748b" transparent opacity={0.6} />
      </Sphere>
      <Html center position={[0, 1.2, 0]}>
        <div style={{ color: '#94a3b8', fontSize: '9px', background: 'rgba(15, 23, 42, 0.6)', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap', border: '1px solid #475569' }}>
          Estimated Occupant (Sensor Detected)
        </div>
      </Html>
    </group>
  );
};

const GuestNode = ({ position, id, isActiveRescue, type, role, isMedical, isCrisisMode, privacyMode }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Pulse animation for glowing presence dots (Zero-knowledge occupancy)
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
      meshRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
      meshRef.current.scale.z = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.15;

      // Responder Active Sweep Animation
      if (type === 'Staff') {
        const offset = id.charCodeAt(id.length - 1) * 10;
        meshRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.8 + offset) * 3;
        meshRef.current.position.z = Math.cos(state.clock.elapsedTime * 0.8 + offset) * 3;
      }
    }
  });

  let color = isActiveRescue ? "#ef4444" : (type === 'Staff' ? "#10b981" : "#ec4899");
  let size = isActiveRescue ? 0.8 : 0.4;
  let intensity = isActiveRescue ? 2 : 1;

  // Role-Based Visualization
  if (type === 'Critical') {
    if (role === 'Emergency') {
      color = "#a855f7"; // Pulsing Purple
      size = 0.9;
      intensity = 2.5;
    } else {
      color = "#f97316"; // Highlight critical nodes (infants/elderly) in orange for all
      size = 0.9;
      intensity = 2.5;
    }
  }

  if (role === 'Security' && isMedical && type === 'Staff') {
    color = "#10b981"; // Highlight nearest staff in bright green
    size = 1.0;
    intensity = 3;
  }

  // Privacy First Mode Overrides
  const displayLabel = privacyMode 
    ? (type === 'Staff' ? 'Protected Responder' : 'Protected Unit')
    : (type === 'Staff' ? `Responder - Unit Active` : type === 'Critical' ? `Protocol Override Priority` : `Occupant / Guest - Protected Node`);
  
  const displayColor = privacyMode ? "#64748b" : color;
  const displayIntensity = privacyMode ? 0.5 : intensity;

  return (
    <group position={position}>
      <Sphere 
        ref={meshRef} 
        args={[size, 16, 16]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={displayColor}
          emissive={displayColor}
          emissiveIntensity={displayIntensity}
        />
      </Sphere>

      {hovered && (
        <Html center position={[0, size + 1.2, 0]}>
          <div style={{ background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: '4px', border: '1px solid currentColor', color: displayColor, fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
            {displayLabel}
          </div>
        </Html>
      )}
      {!privacyMode && isCrisisMode && type === 'Critical' && (
        <Html center position={[0, size + 0.8, 0]}>
          <div style={{ background: '#f97316', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: 'white', fontWeight: 'bold', border: '1px solid #ffedd5', boxShadow: '0 2px 10px rgba(249, 115, 22, 0.4)' }}>
            VULNERABLE
          </div>
        </Html>
      )}
    </group>
  );
};

const ResponderNode = ({ initialPos, targetPos, label, color, onArrival }) => {
  const meshRef = useRef();
  const currentPos = useRef(new THREE.Vector3(...initialPos));
  const [arrived, setArrived] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      const target = new THREE.Vector3(...targetPos);
      const dist = currentPos.current.distanceTo(target);

      if (dist > 0.5) {
        // Move towards target over ~12 seconds (delta * speed)
        currentPos.current.lerp(target, delta * 0.15);
        meshRef.current.position.copy(currentPos.current);
      } else if (!arrived) {
        setArrived(true);
        onArrival && onArrival();
      }
      
      // Gentle pulse
      const s = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group ref={meshRef} position={initialPos}>
      <Sphere args={[0.7, 16, 16]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </Sphere>
      <Html center position={[0, 1.5, 0]}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(4px)',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 'bold',
          border: `1px solid ${color}`,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          boxShadow: `0 0 10px ${color}44`
        }}>
          {label}
        </div>
      </Html>
    </group>
  );
};

export const DigitalTwinScene = () => {
  const { alert, acknowledgedIncident, clearAcknowledgedIncident, role, setResponderStatus, userPosition, nodeCount, meshPeers, privacyMode } = useCrisis();
  const [isAutoFollow, setIsAutoFollow] = useState(true);
  const [arrivedNodes, setArrivedNodes] = useState(0);
  
  const userPos = [userPosition.x, 0.5, userPosition.z]; // Use shared position from context
  
  const activeProblem = alert || acknowledgedIncident;
  const isCrisisMode = !!activeProblem;
  const isResolved = arrivedNodes >= 2; // Assume help arrived if at least 2 nodes reach

  // Reset auto-follow and arrival when a new alert arrives
  React.useEffect(() => {
    if (alert) {
      setIsAutoFollow(true);
      setArrivedNodes(0);
      setResponderStatus(null);
    }
  }, [alert]);

  const handleArrival = () => {
    setArrivedNodes(prev => {
      const next = prev + 1;
      if (next === 2) {
        setResponderStatus(role === 'Emergency' ? "Medical Team On-Site" : "Security Units In-Position");
      }
      return next;
    });
  };

  const controlsRef = useRef();

  // Active User / Responder standing at context position
  
  const alertPos = activeProblem?.location ? [activeProblem.location.x, 0.5, activeProblem.location.z] : null;
  const alertColors = activeProblem ? getCrisisColors(activeProblem.type) : null;

  const shadowNodes = useMemo(() => {
    if (!isCrisisMode || !alertPos) return [];
    return [
      [alertPos[0] + 5, 0.5, alertPos[2] + 2],
      [alertPos[0] - 4, 0.5, alertPos[2] - 5],
      [alertPos[0] + 2, 0.5, alertPos[2] - 3],
    ];
  }, [isCrisisMode, alertPos]);

  const guests = useMemo(() => {
    const defaultNodes = nodeCount > 0 ? nodeCount : 15; // Provide base nodes for test
    return Array.from({ length: defaultNodes }).map((_, i) => ({
      id: `guest_${i}`,
      x: (Math.random() - 0.5) * 35,
      z: (Math.random() - 0.5) * 35,
      type: i % 4 === 0 ? 'Staff' : (i % 5 === 0 ? 'Critical' : 'Normal')
    }));
  }, [nodeCount]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 25, 30], fov: 50 }}>
        <color attach="background" args={['#05080f']} />
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <CameraController alertPos={alertPos} controlsRef={controlsRef} isAutoFollow={isAutoFollow} />

        {/* Foundation Floor Plan */}
        <Box position={[0, -0.5, 0]} args={[40, 1, 40]}>
          <meshStandardMaterial color="#101827" transparent opacity={0.8} />
        </Box>

        {/* Blueprint Grid */}
        <gridHelper args={[40, 40, '#1d4ed8', '#1e293b']} position={[0, 0.01, 0]} />

        {isCrisisMode && alertPos && activeProblem && (
          <>
            {role !== 'Staff' && (
              <>
                <HazardNode position={alertPos} colors={alertColors} isResolved={isResolved} />
                <DangerHeatmap position={alertPos} color={alertColors.main} severity={activeProblem.severity} isResolved={isResolved} />
              </>
            )}
            
            {/* Role Wayfinding Paths */}
            <Line
              points={[userPos, alertPos]}
              color={role === 'Emergency' ? "#ffffff" : (role === 'Staff' ? "#10b981" : "#0ff")}
              lineWidth={(role === 'Staff' || role === 'Emergency') ? 4 : 3}
              dashed={role !== 'Emergency'}
              dashSize={1}
              gapSize={0.5}
            />
          </>
        )}

        <ActiveUserNode position={userPos} />

        {/* Render Occupants */}
        {guests.map((g) => {
          let isDanger = false;
          if (isCrisisMode && activeProblem?.location) {
            const dx = g.x - activeProblem.location.x;
            const dz = g.z - activeProblem.location.z;
            if (Math.sqrt(dx * dx + dz * dz) < 12) isDanger = true;
          }
          return <GuestNode 
            key={g.id} 
            id={g.id} 
            position={[g.x, 0.5, g.z]} 
            isActiveRescue={isDanger} 
            type={g.type}
            role={role}
            isMedical={activeProblem?.type.includes('MEDICAL')}
            isCrisisMode={isCrisisMode}
            privacyMode={privacyMode}
          />;
        })}

        {/* Render Shadow Nodes */}
        {shadowNodes.map((pos, i) => (
          <ShadowNode key={`shadow-${i}`} position={pos} />
        ))}

        {/* Dynamic Responders Logic */}
        {isCrisisMode && alertPos && (
          <>
            {role === 'Emergency' && (
              <>
                <ResponderNode key="med-1" initialPos={[-20, 0.5, 20]} targetPos={alertPos} label="Medical Team 01" color="#10b981" onArrival={handleArrival} />
                <ResponderNode key="med-2" initialPos={[20, 0.5, 20]} targetPos={alertPos} label="Medical Team 02" color="#10b981" onArrival={handleArrival} />
              </>
            )}
            {role === 'Security' && (
              <>
                <ResponderNode key="sec-1" initialPos={[-15, 0.5, -15]} targetPos={alertPos} label="Security Unit Alpha" color="#38bdf8" onArrival={handleArrival} />
                <ResponderNode key="sec-2" initialPos={[15, 0.5, -15]} targetPos={alertPos} label="Security Unit Beta" color="#38bdf8" onArrival={handleArrival} />
              </>
            )}
          </>
        )}

        {/* Render Offline Mesh Peers */}
        {Object.entries(meshPeers || {}).map(([id, pos]) => (
           <group key={id} position={pos}>
             <Sphere args={[0.5, 16, 16]}>
               <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.5} />
             </Sphere>
             <Html center position={[0, 1.2, 0]}>
                <div style={{ color: '#38bdf8', fontSize: '10px', background: 'rgba(0,0,0,0.5)', padding: '2px', borderRadius: '4px', whiteSpace: 'nowrap' }}>{id}</div>
             </Html>
           </group>
        ))}

        <OrbitControls 
          ref={controlsRef} 
          makeDefault 
          maxPolarAngle={Math.PI / 2 - 0.1} 
          onStart={() => setIsAutoFollow(false)}
        />
      </Canvas>

      {/* persistent controls overlay */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px', zIndex: 10 }}>
        {!isAutoFollow && activeProblem && (
          <button
            onClick={() => setIsAutoFollow(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0f172a',
              color: '#10b981',
              border: '1px solid #10b981',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.2s',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)'
            }}
          >
            Recenter View
          </button>
        )}

        {!alert && acknowledgedIncident && (
          <button
            onClick={clearAcknowledgedIncident}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0f172a',
              color: '#38bdf8',
              border: '1px solid #38bdf8',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.2s',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.2)'
            }}
          >
            Clear Path
          </button>
        )}
      </div>
    </div>
  );
};
