/**
 * Neon Nomad Empire - Enhanced Neural Network
 * 3D globe with glowing nodes for Mantra agents
 */
import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Line, Html, Text } from "@react-three/drei";
import * as THREE from "three";

interface Node {
  id: string;
  position: [number, number, number];
  color: string;
  label: string;
  size: number;
  connections: string[];
}

const PILAR_NODES: Node[] = [
  { id: "nomad", position: [2, 1, 0], color: "#00f5ff", label: "Nomad Navigator", size: 0.15, connections: ["tax", "legal", "wellness"] },
  { id: "tax", position: [-1, 2, 1], color: "#ffd700", label: "Tax Strategist", size: 0.12, connections: ["nomad", "wealth"] },
  { id: "legal", position: [-2, 0, 1], color: "#ff00aa", label: "Legal Guardian", size: 0.12, connections: ["nomad", "wellness"] },
  { id: "wellness", position: [1, -1, 2], color: "#00ffcc", label: "Wellness Director", size: 0.11, connections: ["nomad", "luxury"] },
  { id: "luxury", position: [0, 2, -1], color: "#ff6600", label: "Luxury Optimiser", size: 0.1, connections: ["wellness", "wealth"] },
  { id: "wealth", position: [-1, -2, 0], color: "#8844ff", label: "Wealth Architect", size: 0.1, connections: ["tax", "luxury"] },
  { id: "compliance", position: [0, 0, -2], color: "#00ff88", label: "Compliance Auditor", size: 0.09, connections: ["legal", "tax"] },
];

const CITIES = [
  { name: "Lisbon", position: [-0.4, 0.3, 1.2] as [number, number, number], color: "#00f5ff" },
  { name: "Dubai", position: [1.5, 0.8, 0.5] as [number, number, number], color: "#ffd700" },
  { name: "Singapore", position: [2.0, -0.2, -0.8] as [number, number, number], color: "#ff00aa" },
  { name: "Prague", position: [0.5, 0.9, 1.5] as [number, number, number], color: "#00ffcc" },
  { name: "UAE", position: [1.2, 0.5, 0.2] as [number, number, number], color: "#ff6600" },
];

function GlowingNode({ node, isActive, onHover }: { node: Node; isActive: boolean; onHover: (id: string | null) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2 + node.position[0]) * 0.1;
      meshRef.current.scale.setScalar(1 + pulse * (isActive ? 0.3 : 0.1));
    }
  });

  return (
    <group position={node.position}>
      <Sphere
        ref={meshRef}
        args={[node.size, 32, 32]}
        onPointerOver={() => { setHovered(true); onHover(node.id); }}
        onPointerOut={() => { setHovered(false); onHover(null); }}
      >
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={hovered || isActive ? 2 : 0.5}
          transparent
          opacity={0.9}
        />
      </Sphere>
      {(hovered || isActive) && (
        <Html distanceFactor={4}>
          <div className="bg-black/90 border border-cyan-500/50 rounded-lg px-3 py-2 text-xs text-white whitespace-nowrap backdrop-blur-xl">
            <div className="font-bold text-cyan-400">{node.label}</div>
            <div className="text-[10px] text-gray-400">{node.connections.length} connections</div>
          </div>
        </Html>
      )}
    </group>
  );
}

function ConnectionLines({ nodes, activeId }: { nodes: Node[]; activeId: string | null }) {
  const lines: JSX.Element[] = [];
  
  nodes.forEach((node) => {
    node.connections.forEach((connId) => {
      const target = nodes.find(n => n.id === connId);
      if (target) {
        const isActive = activeId === node.id || activeId === connId;
        lines.push(
          <Line
            key={`${node.id}-${connId}`}
            points={[node.position, target.position]}
            color={isActive ? "#00f5ff" : "#334455"}
            lineWidth={isActive ? 2 : 0.5}
            transparent
            opacity={isActive ? 0.8 : 0.3}
          />
        );
      }
    });
  });

  return <>{lines}</>;
}

function GlobeCity({ city, isActive }: { city: typeof CITIES[0]; isActive: boolean }) {
  return (
    <group position={city.position}>
      <Sphere args={[0.03, 16, 16]}>
        <meshStandardMaterial
          color={city.color}
          emissive={city.color}
          emissiveIntensity={isActive ? 3 : 0.5}
        />
      </Sphere>
    </group>
  );
}

function ParticleField() {
  const count = 200;
  const mesh = useRef<THREE.Points>(null);
  
  const [positions] = useState(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.5 + Math.random() * 0.5;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  });

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.015} color="#00f5ff" transparent opacity={0.6} />
    </points>
  );
}

export default function NeuralGlobe({ activePillar }: { activePillar?: string }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff00aa" />
        
        {/* Main globe */}
        <Sphere args={[2, 64, 64]}>
          <meshStandardMaterial
            color="#0a0a1a"
            emissive="#001122"
            emissiveIntensity={0.2}
            transparent
            opacity={0.4}
            wireframe={false}
          />
        </Sphere>

        {/* Grid lines */}
        <Sphere args={[2.05, 32, 32]}>
          <meshBasicMaterial color="#00f5ff" wireframe transparent opacity={0.1} />
        </Sphere>

        {/* Pillar nodes */}
        {PILAR_NODES.map((node) => (
          <GlowingNode
            key={node.id}
            node={node}
            isActive={activePillar === node.id}
            onHover={setHoveredId}
          />
        ))}

        {/* Connection lines */}
        <ConnectionLines nodes={PILAR_NODES} activeId={hoveredId} />

        {/* City markers */}
        {CITIES.map((city) => (
          <GlobeCity key={city.name} city={city} isActive={Math.random() > 0.7} />
        ))}

        {/* Particles */}
        <ParticleField />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
}
