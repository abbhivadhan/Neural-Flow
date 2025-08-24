import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html, Cylinder, Sphere, Box, Torus } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { Project, ProjectStatus } from '../../../types/project';

interface Project3DAdvancedProps {
  project: Project;
  position: [number, number, number];
  onClick: (project: Project) => void;
  isSelected?: boolean;
  animationSpeed?: number;
}

export const Project3DAdvanced: React.FC<Project3DAdvancedProps> = ({
  project,
  position,
  onClick,
  isSelected = false,
  animationSpeed = 1
}) => {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  // Project visualization properties
  const projectProps = useMemo(() => {
    const getProjectColor = (status: ProjectStatus): string => {
      switch (status) {
        case ProjectStatus.PLANNING: return '#3b82f6';
        case ProjectStatus.ACTIVE: return '#10b981';
        case ProjectStatus.ON_HOLD: return '#f59e0b';
        case ProjectStatus.COMPLETED: return '#8b5cf6';
        case ProjectStatus.CANCELLED: return '#ef4444';
        case ProjectStatus.ARCHIVED: return '#64748b';
        default: return '#64748b';
      }
    };

    const getProjectScale = (taskCount: number): number => {
      return Math.min(1 + taskCount * 0.1, 2.5);
    };

    const getHealthColor = (healthScore?: number): string => {
      if (!healthScore) return '#64748b';
      if (healthScore >= 80) return '#10b981';
      if (healthScore >= 60) return '#f59e0b';
      return '#ef4444';
    };

    return {
      color: getProjectColor(project.status),
      scale: getProjectScale(project.tasks.length),
      healthColor: getHealthColor(project.aiInsights?.healthScore),
      height: Math.min(project.tasks.length * 0.3 + 1, 4)
    };
  }, [project]);

  // Animation loop
  useFrame((state) => {
    if (groupRef.current) {
      // Floating animation
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * animationSpeed * 0.7) * 0.15;
      
      // Rotation based on status
      if (project.status === ProjectStatus.ACTIVE) {
        groupRef.current.rotation.y += 0.005;
      }
      
      // Hover and selection effects
      if (hovered || isSelected) {
        groupRef.current.scale.setScalar(1.1);
        if (meshRef.current && meshRef.current.material) {
          (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4;
        }
      } else {
        groupRef.current.scale.setScalar(1);
        if (meshRef.current && meshRef.current.material) {
          (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2;
        }
      }

      // Pulsing effect for projects with issues
      if (project.aiInsights?.healthScore && project.aiInsights.healthScore < 60) {
        const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1;
        groupRef.current.scale.setScalar(pulse);
      }
    }
  });

  // Calculate project progress
  const projectProgress = useMemo(() => {
    if (project.tasks.length === 0) return 0;
    // This would normally come from actual task completion data
    // For demo purposes, we'll simulate based on status
    switch (project.status) {
      case ProjectStatus.PLANNING: return 10;
      case ProjectStatus.ACTIVE: return 45;
      case ProjectStatus.ON_HOLD: return 30;
      case ProjectStatus.COMPLETED: return 100;
      case ProjectStatus.CANCELLED: return 0;
      case ProjectStatus.ARCHIVED: return 100;
      default: return 0;
    }
  }, [project]);

  // Render project milestones
  const renderMilestones = () => {
    if (!project.milestones || project.milestones.length === 0) return null;

    return project.milestones.slice(0, 5).map((milestone, index) => {
      const angle = (index / project.milestones.length) * Math.PI * 2;
      const radius = 2.5;
      
      return (
        <Sphere
          key={milestone.id}
          args={[0.2]}
          position={[
            Math.cos(angle) * radius,
            projectProps.height / 2 + 0.5,
            Math.sin(angle) * radius
          ]}
        >
          <meshStandardMaterial
            color={
              milestone.status === 'completed' ? '#10b981' :
              milestone.status === 'at_risk' ? '#f59e0b' :
              milestone.status === 'missed' ? '#ef4444' : '#3b82f6'
            }
            emissive={
              milestone.status === 'completed' ? '#059669' :
              milestone.status === 'at_risk' ? '#d97706' :
              milestone.status === 'missed' ? '#dc2626' : '#1e40af'
            }
            emissiveIntensity={0.3}
          />
        </Sphere>
      );
    });
  };

  // Render team members indicator
  const renderTeamIndicators = () => {
    const memberCount = project.collaborators.length;
    if (memberCount === 0) return null;

    return Array.from({ length: Math.min(memberCount, 8) }).map((_, index) => {
      const angle = (index / Math.min(memberCount, 8)) * Math.PI * 2;
      const radius = 1.8;
      
      return (
        <Box
          key={index}
          args={[0.2, 0.2, 0.2]}
          position={[
            Math.cos(angle) * radius,
            -projectProps.height / 2 - 0.3,
            Math.sin(angle) * radius
          ]}
        >
          <meshStandardMaterial
            color="#60a5fa"
            emissive="#3b82f6"
            emissiveIntensity={0.2}
          />
        </Box>
      );
    });
  };

  // Render progress ring
  const renderProgressRing = () => {
    const progress = projectProgress / 100;
    
    return (
      <>
        {/* Background ring */}
        <Torus
          args={[2, 0.1, 8, 32]}
          position={[0, projectProps.height / 2 + 1, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial
            color="#374151"
            transparent
            opacity={0.3}
          />
        </Torus>
        
        {/* Progress ring */}
        <Torus
          args={[2, 0.12, 8, Math.max(1, Math.floor(32 * progress))]}
          position={[0, projectProps.height / 2 + 1, 0]}
          rotation={[Math.PI / 2, 0, -Math.PI / 2]}
        >
          <meshStandardMaterial
            color={projectProps.healthColor}
            emissive={projectProps.healthColor}
            emissiveIntensity={0.3}
          />
        </Torus>
      </>
    );
  };

  return (
    <group ref={groupRef} position={position}>
      {/* Main project cylinder */}
      <Cylinder
        ref={meshRef}
        args={[1.5, 1.2, projectProps.height, 12]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onClick(project)}
      >
        <meshStandardMaterial
          color={projectProps.color}
          emissive={projectProps.color}
          emissiveIntensity={0.2}
          transparent
          opacity={0.8}
          roughness={0.3}
          metalness={0.4}
        />
      </Cylinder>

      {/* Progress ring */}
      {renderProgressRing()}

      {/* Project name */}
      <Text
        position={[0, projectProps.height / 2 + 2, 0]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={3}
        font="/fonts/inter-bold.woff"
      >
        {project.name}
      </Text>

      {/* Task count indicator */}
      <Text
        position={[0, 0, 1.6]}
        fontSize={0.6}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {project.tasks.length}
      </Text>

      <Text
        position={[0, -0.4, 1.6]}
        fontSize={0.2}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        tasks
      </Text>

      {/* Health score indicator */}
      {project.aiInsights?.healthScore && (
        <Sphere
          args={[0.3]}
          position={[2, projectProps.height / 2, 0]}
        >
          <meshStandardMaterial
            color={projectProps.healthColor}
            emissive={projectProps.healthColor}
            emissiveIntensity={0.4}
          />
        </Sphere>
      )}

      {/* Milestones */}
      {renderMilestones()}

      {/* Team indicators */}
      {renderTeamIndicators()}

      {/* Priority indicator based on project priority */}
      <Box
        args={[0.3, 0.3, 0.3]}
        position={[-2, projectProps.height / 2, 0]}
      >
        <meshStandardMaterial
          color={
            project.priority === 'high' ? '#ef4444' :
            project.priority === 'medium' ? '#f59e0b' : '#10b981'
          }
          emissive={
            project.priority === 'high' ? '#dc2626' :
            project.priority === 'medium' ? '#d97706' : '#059669'
          }
          emissiveIntensity={0.4}
        />
      </Box>

      {/* Detailed info on hover */}
      {hovered && (
        <Html position={[0, projectProps.height + 3, 0]} center>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-black/80 backdrop-blur-sm text-white p-5 rounded-lg shadow-xl border border-white/20 max-w-md pointer-events-none"
          >
            <h4 className="font-semibold text-lg mb-2">{project.name}</h4>
            <p className="text-sm text-slate-300 mb-4 line-clamp-3">
              {project.description}
            </p>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Status:</span>
                <span className={`px-2 py-1 rounded-full ${
                  project.status === ProjectStatus.COMPLETED ? 'bg-purple-500/20 text-purple-300' :
                  project.status === ProjectStatus.ACTIVE ? 'bg-green-500/20 text-green-300' :
                  project.status === ProjectStatus.ON_HOLD ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-slate-500/20 text-slate-300'
                }`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              
              <div>
                <span className="text-slate-400 block mb-1">Progress:</span>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${projectProgress}%` }}
                    />
                  </div>
                  <span className="text-slate-300">{projectProgress}%</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Tasks:</span>
                <span className="text-slate-300">{project.tasks.length} total</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Team:</span>
                <span className="text-slate-300">{project.collaborators.length} members</span>
              </div>

              {project.aiInsights?.healthScore && (
                <div>
                  <span className="text-slate-400 block mb-1">Health Score:</span>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          project.aiInsights.healthScore >= 80 ? 'bg-green-500' :
                          project.aiInsights.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${project.aiInsights.healthScore}%` }}
                      />
                    </div>
                    <span className="text-slate-300">{project.aiInsights.healthScore}</span>
                  </div>
                </div>
              )}

              {project.milestones && project.milestones.length > 0 && (
                <div>
                  <span className="text-slate-400 block mb-1">Milestones:</span>
                  <span className="text-slate-300">
                    {project.milestones.filter(m => m.status === 'completed').length} / {project.milestones.length}
                  </span>
                </div>
              )}
            </div>

            {project.tags.length > 0 && (
              <div className="mt-4">
                <span className="text-slate-400 block mb-2">Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {project.tags.slice(0, 4).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {project.tags.length > 4 && (
                    <span className="text-slate-400 text-xs">
                      +{project.tags.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {project.aiInsights?.riskFactors && project.aiInsights.riskFactors.length > 0 && (
              <div className="mt-4">
                <span className="text-slate-400 block mb-2">Risk Factors:</span>
                <div className="space-y-1">
                  {project.aiInsights.riskFactors.slice(0, 2).map((risk, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        risk.severity === 'critical' ? 'bg-red-500' :
                        risk.severity === 'high' ? 'bg-orange-500' :
                        risk.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <span className="text-xs text-slate-300 capitalize">
                        {risk.type.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </Html>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <Torus
          args={[2.5, 0.1, 8, 32]}
          position={[0, -projectProps.height / 2 - 0.5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial
            color="#3b82f6"
            transparent
            opacity={0.6}
            emissive="#1e40af"
            emissiveIntensity={0.5}
          />
        </Torus>
      )}
    </group>
  );
};