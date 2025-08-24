import React, { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Text, 
  Box, 
  Sphere, 
  Plane,
  Environment,
  PerspectiveCamera,
  Html,
  useTexture,
  Cylinder,
  Stars,
  Sparkles,
  Float,
  Backdrop,
  ContactShadows,
  PerformanceMonitor
} from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { Task, TaskStatus } from '../../types/task';
import { Project, ProjectStatus } from '../../types/project';
import { Task3DAdvanced } from './3d/Task3DAdvanced';
import { Project3DAdvanced } from './3d/Project3DAdvanced';
import { ParticleSystem, NeuralNetwork, DataFlow } from './3d/ParticleSystem';

interface Workspace3DProps {
  tasks: Task[];
  projects: Project[];
  onTaskClick: (task: Task) => void;
  onProjectClick: (project: Project) => void;
  onTaskMove: (taskId: string, newStatus: TaskStatus) => void;
  className?: string;
}

// Legacy components removed - using advanced versions

// Enhanced Workspace Environment Component
const WorkspaceEnvironment: React.FC<{ 
  showParticles?: boolean; 
  theme?: string;
  performanceLevel?: 'low' | 'medium' | 'high';
}> = ({ showParticles = true, theme = 'neural', performanceLevel = 'high' }) => {
  const environmentRef = useRef<THREE.Group>(null!);

  // Theme-based colors
  const themeColors = {
    neural: {
      ground: '#0f172a',
      primary: '#3b82f6',
      secondary: '#10b981',
      accent: '#f59e0b',
      fog: '#0f172a'
    },
    ocean: {
      ground: '#0c4a6e',
      primary: '#0ea5e9',
      secondary: '#06b6d4',
      accent: '#8b5cf6',
      fog: '#0c4a6e'
    },
    forest: {
      ground: '#14532d',
      primary: '#22c55e',
      secondary: '#84cc16',
      accent: '#eab308',
      fog: '#14532d'
    },
    sunset: {
      ground: '#7c2d12',
      primary: '#f97316',
      secondary: '#ef4444',
      accent: '#f59e0b',
      fog: '#7c2d12'
    }
  };

  const colors = themeColors[theme as keyof typeof themeColors] || themeColors.neural;

  useFrame((state) => {
    if (environmentRef.current) {
      // Subtle environment animation
      environmentRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.02;
    }
  });

  return (
    <group ref={environmentRef}>
      {/* Enhanced Ground Plane with distortion */}
      <Float speed={0.5} rotationIntensity={0.1} floatIntensity={0.1}>
        <Plane
          args={[120, 120]}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -5, 0]}
          receiveShadow
        >
          <meshStandardMaterial
            color={colors.ground}
            transparent
            opacity={0.6}
            roughness={0.8}
            metalness={0.2}
          />
        </Plane>
      </Float>

      {/* Animated Grid Helper */}
      <gridHelper 
        args={[120, 120, colors.primary, colors.primary]} 
        position={[0, -4.9, 0]} 
        material-opacity={0.3}
        material-transparent={true}
      />

      {/* Enhanced Particle Systems */}
      {showParticles && performanceLevel !== 'low' && (
        <>
          <ParticleSystem 
            count={performanceLevel === 'high' ? 1200 : 600} 
            color={colors.primary} 
            size={0.03} 
            speed={0.3} 
            opacity={0.4} 
          />
          <ParticleSystem 
            count={performanceLevel === 'high' ? 800 : 400} 
            color={colors.secondary} 
            size={0.02} 
            speed={0.5} 
            opacity={0.3} 
          />
          <ParticleSystem 
            count={performanceLevel === 'high' ? 400 : 200} 
            color={colors.accent} 
            size={0.025} 
            speed={0.2} 
            opacity={0.5} 
          />
        </>
      )}

      {/* Sparkles for magical effect */}
      {performanceLevel === 'high' && (
        <Sparkles
          count={100}
          scale={[20, 10, 20]}
          size={2}
          speed={0.3}
          color={colors.primary}
        />
      )}

      {/* Stars background */}
      <Stars
        radius={100}
        depth={50}
        count={performanceLevel === 'high' ? 5000 : 2000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Neural Network Background */}
      {performanceLevel !== 'low' && <NeuralNetwork />}
      
      {/* Data Flow Visualization */}
      {performanceLevel === 'high' && <DataFlow />}

      {/* Enhanced Environment */}
      <Environment preset="night" />
      
      {/* Advanced Lighting Setup */}
      <ambientLight intensity={0.2} color={colors.primary} />
      
      {/* Key Light */}
      <directionalLight
        position={[20, 20, 20]}
        intensity={1.5}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      {/* Fill Lights */}
      <pointLight position={[-15, 10, -15]} intensity={0.8} color={colors.primary} />
      <pointLight position={[15, 5, 15]} intensity={0.6} color={colors.secondary} />
      <pointLight position={[0, 25, 0]} intensity={0.4} color={colors.accent} />
      
      {/* Rim Light */}
      <spotLight
        position={[0, 30, -20]}
        angle={Math.PI / 3}
        penumbra={0.8}
        intensity={0.8}
        color={colors.accent}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Contact Shadows for better grounding */}
      <ContactShadows
        position={[0, -4.8, 0]}
        opacity={0.4}
        scale={50}
        blur={2}
        far={20}
        color={colors.ground}
      />

      {/* Backdrop for better composition */}
      <Backdrop
        floor={0.25}
        segments={20}
        position={[0, -2, -10]}
        scale={[50, 10, 10]}
      >
        <meshStandardMaterial color={colors.ground} transparent opacity={0.3} />
      </Backdrop>
      
      {/* Dynamic Fog */}
      <fog attach="fog" args={[colors.fog, 40, 120]} />
    </group>
  );
};

// Enhanced Camera Controller Component
const CameraController: React.FC<{
  view: 'overview' | 'tasks' | 'projects';
  selectedTaskId?: string | null;
  selectedProjectId?: string | null;
  autoRotate?: boolean;
}> = ({ view, selectedTaskId, selectedProjectId, autoRotate = false }) => {
  const { camera, scene } = useThree();
  const controlsRef = useRef<any>();

  // Camera positions for different views
  const cameraPositions = {
    overview: [0, 8, 20],
    tasks: [-5, 6, 15],
    projects: [5, 10, 18]
  };

  useFrame((state) => {
    if (controlsRef.current && autoRotate) {
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 0.5;
    } else if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
    }

    // Smooth camera transitions
    const targetPosition = cameraPositions[view];
    camera.position.lerp(new THREE.Vector3(...targetPosition), 0.02);

    // Focus on selected items
    if (selectedTaskId || selectedProjectId) {
      const target = scene.getObjectByName(selectedTaskId || selectedProjectId || '');
      if (target) {
        const targetPos = target.position.clone();
        targetPos.y += 2;
        camera.lookAt(targetPos);
      }
    }
  });

  useEffect(() => {
    camera.position.set(...cameraPositions[view]);
    camera.lookAt(0, 0, 0);
  }, [camera, view]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={5}
      maxDistance={60}
      maxPolarAngle={Math.PI / 2}
      minPolarAngle={0}
      enableDamping={true}
      dampingFactor={0.05}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      panSpeed={0.8}
    />
  );
};

// Main 3D Workspace Component
export const Workspace3D: React.FC<Workspace3DProps> = ({
  tasks,
  projects,
  onTaskClick,
  onProjectClick,
  onTaskMove,
  className = ''
}) => {
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([0, 8, 20]);
  const [selectedView, setSelectedView] = useState<'overview' | 'tasks' | 'projects'>('overview');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showParticles, setShowParticles] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [performanceLevel, setPerformanceLevel] = useState<'low' | 'medium' | 'high'>('high');
  const [theme, setTheme] = useState('neural');
  const [autoRotate, setAutoRotate] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Arrange tasks in a circular pattern by status
  const arrangeTasksByStatus = () => {
    const statusGroups = {
      [TaskStatus.TODO]: tasks.filter(t => t.status === TaskStatus.TODO),
      [TaskStatus.IN_PROGRESS]: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS),
      [TaskStatus.REVIEW]: tasks.filter(t => t.status === TaskStatus.REVIEW),
      [TaskStatus.DONE]: tasks.filter(t => t.status === TaskStatus.DONE),
      [TaskStatus.BLOCKED]: tasks.filter(t => t.status === TaskStatus.BLOCKED),
    };

    const arrangements: Array<{ task: Task; position: [number, number, number] }> = [];
    const statusPositions = {
      [TaskStatus.TODO]: { x: -8, z: -5 },
      [TaskStatus.IN_PROGRESS]: { x: -4, z: 0 },
      [TaskStatus.REVIEW]: { x: 0, z: 5 },
      [TaskStatus.DONE]: { x: 4, z: 0 },
      [TaskStatus.BLOCKED]: { x: 8, z: -5 },
    };

    Object.entries(statusGroups).forEach(([status, statusTasks]) => {
      const basePos = statusPositions[status as TaskStatus];
      statusTasks.forEach((task, index) => {
        const angle = (index / statusTasks.length) * Math.PI * 2;
        const radius = Math.min(2, statusTasks.length * 0.5);
        arrangements.push({
          task,
          position: [
            basePos.x + Math.cos(angle) * radius,
            index * 0.5,
            basePos.z + Math.sin(angle) * radius
          ]
        });
      });
    });

    return arrangements;
  };

  // Arrange projects in a grid
  const arrangeProjects = () => {
    const arrangements: Array<{ project: Project; position: [number, number, number] }> = [];
    const cols = Math.ceil(Math.sqrt(projects.length));
    
    projects.forEach((project, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      arrangements.push({
        project,
        position: [
          (col - cols / 2) * 4,
          2,
          (row - Math.ceil(projects.length / cols) / 2) * 4
        ]
      });
    });

    return arrangements;
  };

  // Performance monitoring callback
  const handlePerformanceChange = useCallback((api: any) => {
    if (api.factor < 0.5) {
      setPerformanceLevel('low');
    } else if (api.factor < 0.8) {
      setPerformanceLevel('medium');
    } else {
      setPerformanceLevel('high');
    }
  }, []);

  const taskArrangements = arrangeTasksByStatus();
  const projectArrangements = arrangeProjects();

  // Loading simulation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Loading Screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-900 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
              />
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-white mb-2"
              >
                Initializing Neural Flow 3D
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-slate-400"
              >
                Loading immersive workspace...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced 3D Controls */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute top-4 left-4 z-10 space-y-4"
      >
        {/* View Controls */}
        <div className="flex space-x-2">
          {(['overview', 'tasks', 'projects'] as const).map((view) => (
            <motion.button
              key={view}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedView(view)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                selectedView === view
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25 border border-blue-400'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20 backdrop-blur-sm border border-white/10'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </motion.button>
          ))}
        </div>

        {/* Visual Controls */}
        <div className="flex flex-wrap gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowParticles(!showParticles)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showParticles
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 backdrop-blur-sm'
            }`}
          >
            Particles
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              autoRotate
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 backdrop-blur-sm'
            }`}
          >
            Auto Rotate
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowStats(!showStats)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showStats
                ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/25'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 backdrop-blur-sm'
            }`}
          >
            Stats
          </motion.button>
        </div>

        {/* Advanced Controls */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
            <span className="text-slate-300 text-sm">Speed:</span>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
              className="w-20 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-slate-300 text-xs">{animationSpeed.toFixed(1)}x</span>
          </div>

          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
            <span className="text-slate-300 text-sm">Theme:</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-transparent text-slate-300 text-sm border-none outline-none"
            >
              <option value="neural" className="bg-slate-800">Neural</option>
              <option value="ocean" className="bg-slate-800">Ocean</option>
              <option value="forest" className="bg-slate-800">Forest</option>
              <option value="sunset" className="bg-slate-800">Sunset</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
            <span className="text-slate-300 text-sm">Quality:</span>
            <select
              value={performanceLevel}
              onChange={(e) => setPerformanceLevel(e.target.value as any)}
              className="bg-transparent text-slate-300 text-sm border-none outline-none"
            >
              <option value="low" className="bg-slate-800">Low</option>
              <option value="medium" className="bg-slate-800">Medium</option>
              <option value="high" className="bg-slate-800">High</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Status Legend */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="absolute top-4 right-4 z-10 bg-black/40 backdrop-blur-lg rounded-lg p-4 border border-white/20"
      >
        <h3 className="text-white font-medium mb-3">Status Legend</h3>
        <div className="space-y-2 text-sm">
          <motion.div 
            whileHover={{ scale: 1.05, x: 5 }}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <div className="w-4 h-4 bg-slate-500 rounded-full shadow-lg shadow-slate-500/25"></div>
            <span className="text-slate-300">To Do ({tasks.filter(t => t.status === TaskStatus.TODO).length})</span>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05, x: 5 }}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <div className="w-4 h-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500/25"></div>
            <span className="text-slate-300">In Progress ({tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length})</span>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05, x: 5 }}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <div className="w-4 h-4 bg-amber-500 rounded-full shadow-lg shadow-amber-500/25"></div>
            <span className="text-slate-300">Review ({tasks.filter(t => t.status === TaskStatus.REVIEW).length})</span>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05, x: 5 }}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <div className="w-4 h-4 bg-green-500 rounded-full shadow-lg shadow-green-500/25"></div>
            <span className="text-slate-300">Done ({tasks.filter(t => t.status === TaskStatus.DONE).length})</span>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05, x: 5 }}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <div className="w-4 h-4 bg-red-500 rounded-full shadow-lg shadow-red-500/25"></div>
            <span className="text-slate-300">Blocked ({tasks.filter(t => t.status === TaskStatus.BLOCKED).length})</span>
          </motion.div>
        </div>

        {/* Project Status */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <h4 className="text-white font-medium mb-2 text-sm">Projects</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-slate-300">Active ({projects.filter(p => p.status === ProjectStatus.ACTIVE).length})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span className="text-slate-300">Completed ({projects.filter(p => p.status === ProjectStatus.COMPLETED).length})</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: cameraPosition, fov: 75 }}
        className="w-full h-full"
        gl={{
          antialias: performanceLevel !== 'low',
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true
        }}
        dpr={performanceLevel === 'high' ? [1, 2] : 1}
        performance={{ min: 0.5 }}
      >
        <Suspense fallback={
          <Html center>
            <div className="text-white text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
              <p>Loading 3D Scene...</p>
            </div>
          </Html>
        }>
          {/* Performance Monitor */}
          <PerformanceMonitor onIncline={handlePerformanceChange} onDecline={handlePerformanceChange} />
          
          {/* Enhanced Camera Controller */}
          <CameraController 
            view={selectedView}
            selectedTaskId={selectedTaskId}
            selectedProjectId={selectedProjectId}
            autoRotate={autoRotate}
          />
          
          {/* Enhanced Environment */}
          <WorkspaceEnvironment 
            showParticles={showParticles} 
            theme={theme}
            performanceLevel={performanceLevel}
          />
          
          {/* Render Tasks */}
          {(selectedView === 'overview' || selectedView === 'tasks') &&
            taskArrangements.map(({ task, position }) => (
              <Task3DAdvanced
                key={task.id}
                task={task}
                position={position}
                onClick={(task) => {
                  setSelectedTaskId(task.id);
                  setSelectedProjectId(null);
                  onTaskClick(task);
                }}
                onMove={onTaskMove}
                isSelected={selectedTaskId === task.id}
                animationSpeed={animationSpeed}
              />
            ))
          }

          {/* Render Projects */}
          {(selectedView === 'overview' || selectedView === 'projects') &&
            projectArrangements.map(({ project, position }) => (
              <Project3DAdvanced
                key={project.id}
                project={project}
                position={position}
                onClick={(project) => {
                  setSelectedProjectId(project.id);
                  setSelectedTaskId(null);
                  onProjectClick(project);
                }}
                isSelected={selectedProjectId === project.id}
                animationSpeed={animationSpeed}
              />
            ))
          }
        </Suspense>
      </Canvas>

      {/* Enhanced Performance Stats */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-4 left-4 z-20 bg-black/40 backdrop-blur-lg rounded-lg p-4 border border-white/20"
          >
            <h4 className="text-white font-medium mb-3">Performance Stats</h4>
            <div className="text-xs text-slate-300 space-y-2">
              <div className="flex justify-between">
                <span>Tasks:</span>
                <span className="text-blue-400">{tasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Projects:</span>
                <span className="text-purple-400">{projects.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Tasks:</span>
                <span className="text-green-400">{tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed:</span>
                <span className="text-emerald-400">{tasks.filter(t => t.status === TaskStatus.DONE).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Quality:</span>
                <span className={`${
                  performanceLevel === 'high' ? 'text-green-400' :
                  performanceLevel === 'medium' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {performanceLevel.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Animation Speed:</span>
                <span className="text-cyan-400">{animationSpeed.toFixed(1)}x</span>
              </div>
              <div className="flex justify-between">
                <span>Theme:</span>
                <span className="text-pink-400 capitalize">{theme}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};