import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Trail, Float } from '@react-three/drei';
import * as THREE from 'three';

interface ParticleSystemProps {
  count?: number;
  color?: string;
  size?: number;
  speed?: number;
  opacity?: number;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  count = 1000,
  color = '#3b82f6',
  size = 0.02,
  speed = 0.5,
  opacity = 0.6
}) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const groupRef = useRef<THREE.Group>(null!);

  // Generate random particle positions and velocities
  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Position
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      
      // Velocity
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    return { positions, velocities };
  }, [count]);

  // Enhanced particle animation
  useFrame((state) => {
    if (pointsRef.current && groupRef.current) {
      // Global rotation
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * speed * 0.1) * 0.1;
      groupRef.current.rotation.y = state.clock.elapsedTime * speed * 0.05;
      
      // Update particle positions with physics-like movement
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      const time = state.clock.elapsedTime;
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // Apply velocity
        positions[i3] += velocities[i3] * speed;
        positions[i3 + 1] += velocities[i3 + 1] * speed + Math.sin(time + i * 0.1) * 0.002;
        positions[i3 + 2] += velocities[i3 + 2] * speed;
        
        // Boundary wrapping
        if (Math.abs(positions[i3]) > 30) positions[i3] *= -0.8;
        if (Math.abs(positions[i3 + 1]) > 20) positions[i3 + 1] *= -0.8;
        if (Math.abs(positions[i3 + 2]) > 30) positions[i3 + 2] *= -0.8;
        
        // Add some turbulence
        positions[i3] += Math.sin(time * 0.5 + i * 0.01) * 0.001;
        positions[i3 + 2] += Math.cos(time * 0.3 + i * 0.01) * 0.001;
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      <Points ref={pointsRef} positions={positions}>
        <PointMaterial
          color={color}
          size={size}
          transparent
          opacity={opacity}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
};

// Enhanced Neural Network Visualization Component
export const NeuralNetwork: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null!);
  const connectionsRef = useRef<THREE.Group>(null!);

  // Create neural network nodes and connections
  const { nodes, connections } = useMemo(() => {
    const nodes: Array<{ position: [number, number, number]; id: number; activation: number }> = [];
    const connections: Array<{ from: number; to: number; weight: number }> = [];

    // Create layers with different sizes for more realistic network
    const layers = [6, 10, 14, 18, 14, 10, 6];
    let nodeId = 0;

    layers.forEach((layerSize, layerIndex) => {
      for (let i = 0; i < layerSize; i++) {
        const y = (i - layerSize / 2) * 1.8;
        const x = (layerIndex - layers.length / 2) * 6;
        const z = Math.sin(i * 0.3) * 1.5 + Math.cos(layerIndex * 0.5) * 0.8;
        
        nodes.push({
          position: [x, y, z],
          id: nodeId++,
          activation: Math.random()
        });

        // Create connections to next layer
        if (layerIndex < layers.length - 1) {
          const currentNodeIndex = nodes.length - 1;
          const nextLayerStart = nodeId;
          const nextLayerSize = layers[layerIndex + 1];
          
          for (let j = 0; j < nextLayerSize; j++) {
            if (Math.random() > 0.2) { // 80% connection probability
              connections.push({
                from: currentNodeIndex,
                to: nextLayerStart + j,
                weight: Math.random() * 2 - 1 // Weight between -1 and 1
              });
            }
          }
        }
      }
    });

    return { nodes, connections };
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle rotation and breathing effect
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.2;
      groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.1) * 0.05;
      groupRef.current.scale.setScalar(0.25 + Math.sin(state.clock.elapsedTime * 0.3) * 0.02);
    }

    // Animate connection opacity based on "neural activity"
    if (connectionsRef.current) {
      connectionsRef.current.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          const connection = connections[index];
          if (connection) {
            const activity = Math.sin(state.clock.elapsedTime * 2 + index * 0.1) * 0.5 + 0.5;
            child.material.opacity = 0.1 + activity * 0.4 * Math.abs(connection.weight);
            child.material.emissiveIntensity = activity * 0.3;
          }
        }
      });
    }
  });

  return (
    <Float speed={0.5} rotationIntensity={0.1} floatIntensity={0.2}>
      <group ref={groupRef} position={[0, 0, -25]} scale={0.25}>
        {/* Neural nodes with pulsing effect */}
        {nodes.map((node, index) => (
          <Float key={index} speed={1 + index * 0.1} rotationIntensity={0.05} floatIntensity={0.1}>
            <mesh position={node.position}>
              <sphereGeometry args={[0.4 + node.activation * 0.2]} />
              <meshStandardMaterial
                color={new THREE.Color().setHSL(0.6 + node.activation * 0.2, 0.8, 0.6)}
                emissive={new THREE.Color().setHSL(0.6 + node.activation * 0.2, 0.8, 0.3)}
                emissiveIntensity={0.3 + node.activation * 0.4}
                transparent
                opacity={0.7 + node.activation * 0.3}
              />
            </mesh>
          </Float>
        ))}

        {/* Enhanced neural connections */}
        <group ref={connectionsRef}>
          {connections.map((connection, index) => {
            const fromNode = nodes[connection.from];
            const toNode = nodes[connection.to];
            
            if (!fromNode || !toNode) return null;

            const start = new THREE.Vector3(...fromNode.position);
            const end = new THREE.Vector3(...toNode.position);
            const distance = start.distanceTo(end);
            const midPoint = start.clone().lerp(end, 0.5);

            return (
              <mesh
                key={index}
                position={[midPoint.x, midPoint.y, midPoint.z]}
                lookAt={end}
              >
                <cylinderGeometry args={[
                  Math.abs(connection.weight) * 0.05,
                  Math.abs(connection.weight) * 0.05,
                  distance
                ]} />
                <meshStandardMaterial
                  color={connection.weight > 0 ? "#10b981" : "#ef4444"}
                  transparent
                  opacity={0.2}
                  emissive={connection.weight > 0 ? "#059669" : "#dc2626"}
                  emissiveIntensity={0.1}
                />
              </mesh>
            );
          })}
        </group>
      </group>
    </Float>
  );
};

// Enhanced Data Flow Visualization
export const DataFlow: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null!);
  const dataPacketsRef = useRef<THREE.Group>(null!);

  // Create data flow paths
  const flowPaths = useMemo(() => {
    const paths = [];
    const pathCount = 8;
    
    for (let i = 0; i < pathCount; i++) {
      const angle = (i / pathCount) * Math.PI * 2;
      const radius = 15 + Math.sin(i) * 5;
      const height = Math.cos(i * 0.5) * 3;
      
      paths.push({
        center: [Math.cos(angle) * radius, height, Math.sin(angle) * radius],
        radius: 3 + Math.sin(i) * 1,
        speed: 0.5 + Math.random() * 0.5,
        color: `hsl(${120 + i * 30}, 70%, 60%)`,
        emissive: `hsl(${120 + i * 30}, 70%, 30%)`
      });
    }
    
    return paths;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }

    if (dataPacketsRef.current) {
      dataPacketsRef.current.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh) {
          const pathIndex = Math.floor(index / 5);
          const path = flowPaths[pathIndex];
          
          if (path) {
            const time = state.clock.elapsedTime * path.speed + index * 0.5;
            const angle = time;
            
            child.position.x = path.center[0] + Math.cos(angle) * path.radius;
            child.position.y = path.center[1] + Math.sin(time * 0.3) * 0.5;
            child.position.z = path.center[2] + Math.sin(angle) * path.radius;
            
            // Pulsing effect
            const pulse = Math.sin(time * 3) * 0.3 + 0.7;
            child.scale.setScalar(pulse);
            
            if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.opacity = pulse * 0.8;
              child.material.emissiveIntensity = pulse * 0.4;
            }
          }
        }
      });
    }
  });

  return (
    <Float speed={0.3} rotationIntensity={0.05} floatIntensity={0.1}>
      <group ref={groupRef} position={[0, 8, 0]}>
        {/* Data flow paths */}
        {flowPaths.map((path, pathIndex) => (
          <group key={pathIndex}>
            {/* Path ring */}
            <mesh position={path.center}>
              <torusGeometry args={[path.radius, 0.05, 8, 32]} />
              <meshStandardMaterial
                color={path.color}
                transparent
                opacity={0.2}
                emissive={path.emissive}
                emissiveIntensity={0.1}
              />
            </mesh>
          </group>
        ))}

        {/* Data packets */}
        <group ref={dataPacketsRef}>
          {flowPaths.map((path, pathIndex) =>
            Array.from({ length: 5 }).map((_, packetIndex) => (
              <Trail
                key={`${pathIndex}-${packetIndex}`}
                width={0.5}
                length={2}
                color={path.color}
                attenuation={(t) => t * t}
              >
                <mesh>
                  <boxGeometry args={[0.3, 0.1, 0.1]} />
                  <meshStandardMaterial
                    color={path.color}
                    transparent
                    opacity={0.8}
                    emissive={path.emissive}
                    emissiveIntensity={0.3}
                  />
                </mesh>
              </Trail>
            ))
          )}
        </group>
      </group>
    </Float>
  );
};