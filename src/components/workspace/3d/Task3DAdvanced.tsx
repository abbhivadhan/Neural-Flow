import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html, Cylinder, Sphere, Box, Float, Trail, Sparkles } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { Task, TaskStatus } from '../../../types/task';

interface Task3DAdvancedProps {
  task: Task;
  position: [number, number, number];
  onClick: (task: Task) => void;
  onMove: (taskId: string, newStatus: TaskStatus) => void;
  isSelected?: boolean;
  animationSpeed?: number;
}

export const Task3DAdvanced: React.FC<Task3DAdvancedProps> = ({
  task,
  position,
  onClick,
  onMove,
  isSelected = false,
  animationSpeed = 1
}) => {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Task visualization properties
  const taskProps = useMemo(() => {
    const getTaskColor = (status: TaskStatus): string => {
      switch (status) {
        case TaskStatus.TODO: return '#64748b';
        case TaskStatus.IN_PROGRESS: return '#3b82f6';
        case TaskStatus.REVIEW: return '#f59e0b';
        case TaskStatus.DONE: return '#10b981';
        case TaskStatus.BLOCKED: return '#ef4444';
        default: return '#64748b';
      }
    };

    const getPriorityScale = (priority: string): number => {
      switch (priority) {
        case 'high': return 1.5;
        case 'medium': return 1.2;
        case 'low': return 1;
        default: return 1.2;
      }
    };

    const getComplexityShape = (complexity?: string) => {
      switch (complexity) {
        case 'simple': return 'box';
        case 'moderate': return 'cylinder';
        case 'complex': return 'sphere';
        default: return 'cylinder';
      }
    };

    return {
      color: getTaskColor(task.status),
      scale: getPriorityScale(task.priority),
      shape: getComplexityShape(task.context?.complexity),
      height: task.estimatedDuration ? Math.min(task.estimatedDuration / 2, 3) : 1.5
    };
  }, [task]);

  // Enhanced animation loop
  useFrame((state) => {
    if (groupRef.current) {
      // Enhanced floating animation with different patterns per status
      const baseFloat = Math.sin(state.clock.elapsedTime * animationSpeed) * 0.15;
      const statusFloat = task.status === TaskStatus.IN_PROGRESS ? 
        Math.cos(state.clock.elapsedTime * animationSpeed * 1.5) * 0.1 : 0;
      
      groupRef.current.position.y = position[1] + baseFloat + statusFloat;
      
      // Status-based rotation and movement
      if (task.status === TaskStatus.IN_PROGRESS) {
        groupRef.current.rotation.y += 0.015 * animationSpeed;
        groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      } else if (task.status === TaskStatus.REVIEW) {
        groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
      } else if (task.status === TaskStatus.DONE) {
        // Gentle celebration rotation
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      }
      
      // Enhanced hover and selection effects
      const targetScale = (hovered || isSelected) ? taskProps.scale * 1.15 : taskProps.scale;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      
      if (meshRef.current && meshRef.current.material) {
        const material = meshRef.current.material as THREE.MeshStandardMaterial;
        const targetIntensity = (hovered || isSelected) ? 0.4 : 0.15;
        material.emissiveIntensity = THREE.MathUtils.lerp(material.emissiveIntensity, targetIntensity, 0.1);
      }

      // Enhanced pulsing effect for blocked tasks
      if (task.status === TaskStatus.BLOCKED) {
        const pulse = Math.sin(state.clock.elapsedTime * 4) * 0.15 + 1;
        const urgentPulse = Math.sin(state.clock.elapsedTime * 8) * 0.05 + 1;
        groupRef.current.scale.setScalar(taskProps.scale * pulse * urgentPulse);
        
        // Add red glow effect
        if (meshRef.current && meshRef.current.material) {
          const material = meshRef.current.material as THREE.MeshStandardMaterial;
          material.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 6) * 0.2;
        }
      }

      // Priority-based subtle effects
      if (task.priority === 'high') {
        groupRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 2) * 0.02;
      }
    }
  });

  // Render task shape based on complexity
  const renderTaskShape = () => {
    const commonProps = {
      ref: meshRef,
      onPointerOver: () => setHovered(true),
      onPointerOut: () => setHovered(false),
      onClick: () => onClick(task),
      onPointerDown: () => setIsDragging(true),
      onPointerUp: () => setIsDragging(false)
    };

    switch (taskProps.shape) {
      case 'box':
        return (
          <Box args={[2, taskProps.height, 0.5]} {...commonProps}>
            <meshStandardMaterial
              color={taskProps.color}
              emissive={taskProps.color}
              emissiveIntensity={0.1}
              transparent
              opacity={0.8}
              roughness={0.3}
              metalness={0.1}
            />
          </Box>
        );
      
      case 'sphere':
        return (
          <Sphere args={[1]} {...commonProps}>
            <meshStandardMaterial
              color={taskProps.color}
              emissive={taskProps.color}
              emissiveIntensity={0.1}
              transparent
              opacity={0.8}
              roughness={0.2}
              metalness={0.3}
            />
          </Sphere>
        );
      
      default:
        return (
          <Cylinder args={[0.8, 1, taskProps.height, 8]} {...commonProps}>
            <meshStandardMaterial
              color={taskProps.color}
              emissive={taskProps.color}
              emissiveIntensity={0.1}
              transparent
              opacity={0.8}
              roughness={0.4}
              metalness={0.2}
            />
          </Cylinder>
        );
    }
  };

  // Progress indicator
  const renderProgressIndicator = () => {
    if (task.status === TaskStatus.IN_PROGRESS && task.metadata?.progress) {
      const progress = task.metadata.progress as number;
      return (
        <Cylinder
          args={[0.9, 0.9, taskProps.height * (progress / 100), 8]}
          position={[0, -taskProps.height / 2 + (taskProps.height * progress / 100) / 2, 0]}
        >
          <meshStandardMaterial
            color="#10b981"
            transparent
            opacity={0.6}
            emissive="#059669"
            emissiveIntensity={0.2}
          />
        </Cylinder>
      );
    }
    return null;
  };

  // Dependencies visualization
  const renderDependencies = () => {
    if (task.dependencies.length > 0) {
      return task.dependencies.map((_, index) => (
        <Sphere
          key={index}
          args={[0.1]}
          position={[
            Math.cos((index / task.dependencies.length) * Math.PI * 2) * 1.5,
            taskProps.height / 2 + 0.3,
            Math.sin((index / task.dependencies.length) * Math.PI * 2) * 1.5
          ]}
        >
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#d97706"
            emissiveIntensity={0.3}
          />
        </Sphere>
      ));
    }
    return null;
  };

  return (
    <Float 
      speed={animationSpeed * 0.5} 
      rotationIntensity={task.status === TaskStatus.IN_PROGRESS ? 0.2 : 0.05} 
      floatIntensity={0.1}
    >
      <group ref={groupRef} position={position} name={task.id}>
        {/* Main task shape with enhanced effects */}
        {renderTaskShape()}
        
        {/* Progress indicator */}
        {renderProgressIndicator()}
        
        {/* Dependencies with connecting lines */}
        {renderDependencies()}

        {/* Enhanced Priority indicator */}
        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.05}>
          <Sphere
            args={[0.18]}
            position={[1.4, taskProps.height / 2, 0]}
          >
            <meshStandardMaterial
              color={
                task.priority === 'high' ? '#ef4444' :
                task.priority === 'medium' ? '#f59e0b' : '#10b981'
              }
              emissive={
                task.priority === 'high' ? '#dc2626' :
                task.priority === 'medium' ? '#d97706' : '#059669'
              }
              emissiveIntensity={0.5}
              transparent
              opacity={0.9}
            />
          </Sphere>
        </Float>

        {/* Status-specific effects */}
        {task.status === TaskStatus.IN_PROGRESS && (
          <Sparkles
            count={20}
            scale={[2, 2, 2]}
            size={1}
            speed={0.4}
            color={taskProps.color}
          />
        )}

        {task.status === TaskStatus.DONE && (
          <Sparkles
            count={30}
            scale={[3, 3, 3]}
            size={2}
            speed={0.2}
            color="#10b981"
          />
        )}

        {/* High priority tasks get a trail effect */}
        {task.priority === 'high' && (
          <Trail
            width={0.5}
            length={3}
            color="#ef4444"
            attenuation={(t) => t * t}
          >
            <Box args={[0.1, 0.1, 0.1]} position={[0, taskProps.height / 2 + 0.5, 0]}>
              <meshStandardMaterial color="#ef4444" transparent opacity={0.8} />
            </Box>
          </Trail>
        )}

      {/* Task title */}
      <Text
        position={[0, taskProps.height / 2 + 0.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={2.5}
        font="/fonts/inter-bold.woff"
      >
        {task.title}
      </Text>

      {/* AI confidence indicator */}
      {task.aiGenerated && task.aiConfidence && (
        <Text
          position={[0, -taskProps.height / 2 - 0.3, 0]}
          fontSize={0.15}
          color="#a855f7"
          anchorX="center"
          anchorY="middle"
        >
          AI: {Math.round(task.aiConfidence * 100)}%
        </Text>
      )}

      {/* Detailed info on hover */}
      {hovered && (
        <Html position={[0, taskProps.height + 1, 0]} center>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg shadow-xl border border-white/20 max-w-xs pointer-events-none"
          >
            <h4 className="font-semibold mb-2">{task.title}</h4>
            <p className="text-sm text-slate-300 mb-3 line-clamp-3">
              {task.description}
            </p>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className={`px-2 py-1 rounded-full ${
                  task.status === TaskStatus.DONE ? 'bg-green-500/20 text-green-300' :
                  task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-500/20 text-blue-300' :
                  task.status === TaskStatus.BLOCKED ? 'bg-red-500/20 text-red-300' :
                  'bg-slate-500/20 text-slate-300'
                }`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-400">Priority:</span>
                <span className={`px-2 py-1 rounded-full ${
                  task.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                  task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-green-500/20 text-green-300'
                }`}>
                  {task.priority}
                </span>
              </div>

              {task.estimatedDuration && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration:</span>
                  <span className="text-slate-300">{task.estimatedDuration}h</span>
                </div>
              )}

              {task.tags.length > 0 && (
                <div>
                  <span className="text-slate-400 block mb-1">Tags:</span>
                  <div className="flex flex-wrap gap-1">
                    {task.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {task.tags.length > 3 && (
                      <span className="text-slate-400 text-xs">
                        +{task.tags.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {task.context && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="text-slate-300 capitalize">
                    {task.context.workType}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </Html>
      )}

        {/* Enhanced Selection indicator */}
        {isSelected && (
          <Float speed={1} rotationIntensity={0.1} floatIntensity={0.05}>
            <Cylinder
              args={[1.8, 1.8, 0.15, 32]}
              position={[0, -taskProps.height / 2 - 0.3, 0]}
            >
              <meshStandardMaterial
                color="#3b82f6"
                transparent
                opacity={0.4}
                emissive="#1e40af"
                emissiveIntensity={0.6}
              />
            </Cylinder>
            
            {/* Selection ring animation */}
            <Cylinder
              args={[2.2, 2.2, 0.05, 32]}
              position={[0, -taskProps.height / 2 - 0.4, 0]}
            >
              <meshStandardMaterial
                color="#60a5fa"
                transparent
                opacity={0.2}
                emissive="#3b82f6"
                emissiveIntensity={0.8}
              />
            </Cylinder>
          </Float>
        )}
      </group>
    </Float>
  );
};