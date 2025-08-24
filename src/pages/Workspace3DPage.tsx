import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Workspace3D } from '../components/workspace/Workspace3D';
import { Task, TaskStatus } from '../types/task';
import { Project, ProjectStatus } from '../types/project';
import { sampleTasks, sampleProjects } from '../data/sampleData';
import { ArrowLeft, Settings, Maximize2, Minimize2 } from 'lucide-react';

interface Workspace3DPageProps {
  onBack?: () => void;
}

const Workspace3DPage: React.FC<Workspace3DPageProps> = ({ onBack }) => {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [projects, setProjects] = useState<Project[]>(sampleProjects);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // 3D Workspace Settings
  const [settings, setSettings] = useState({
    enableAnimations: true,
    showGrid: true,
    autoRotate: false,
    particleEffects: true,
    ambientSound: false,
    colorTheme: 'neural' as 'neural' | 'ocean' | 'forest' | 'sunset'
  });

  useEffect(() => {
    // Auto-save settings to localStorage
    localStorage.setItem('workspace3d-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('workspace3d-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setSelectedProject(null);
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setSelectedTask(null);
  };

  const handleTaskMove = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      )
    );
    setSelectedTask(updatedTask);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-0 left-0 right-0 z-20 bg-black/20 backdrop-blur-sm border-b border-white/10"
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            {onBack && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">3D Workspace</h1>
              <p className="text-sm text-slate-300">Immersive productivity environment</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute top-16 right-4 z-30 w-80 bg-black/40 backdrop-blur-lg rounded-lg border border-white/20 p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">3D Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">Animations</label>
                <button
                  onClick={() => setSettings(s => ({ ...s, enableAnimations: !s.enableAnimations }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.enableAnimations ? 'bg-blue-500' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.enableAnimations ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">Show Grid</label>
                <button
                  onClick={() => setSettings(s => ({ ...s, showGrid: !s.showGrid }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.showGrid ? 'bg-blue-500' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.showGrid ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">Auto Rotate</label>
                <button
                  onClick={() => setSettings(s => ({ ...s, autoRotate: !s.autoRotate }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.autoRotate ? 'bg-blue-500' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.autoRotate ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">Particle Effects</label>
                <button
                  onClick={() => setSettings(s => ({ ...s, particleEffects: !s.particleEffects }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.particleEffects ? 'bg-blue-500' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.particleEffects ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div>
                <label className="text-sm text-slate-300 block mb-2">Color Theme</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['neural', 'ocean', 'forest', 'sunset'] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setSettings(s => ({ ...s, colorTheme: theme }))}
                      className={`p-2 rounded-lg text-xs capitalize transition-colors ${
                        settings.colorTheme === theme
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/10 text-slate-300 hover:bg-white/20'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Detail Panel */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            className="absolute top-16 left-4 z-30 w-96 bg-black/40 backdrop-blur-lg rounded-lg border border-white/20 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Task Details</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-white mb-1">{selectedTask.title}</h4>
                <p className="text-sm text-slate-300">{selectedTask.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Status</label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as TaskStatus;
                      const updatedTask = { ...selectedTask, status: newStatus };
                      handleTaskUpdate(updatedTask);
                      handleTaskMove(selectedTask.id, newStatus);
                    }}
                    className="w-full p-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                  >
                    <option value={TaskStatus.TODO}>To Do</option>
                    <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                    <option value={TaskStatus.REVIEW}>Review</option>
                    <option value={TaskStatus.DONE}>Done</option>
                    <option value={TaskStatus.BLOCKED}>Blocked</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Priority</label>
                  <select
                    value={selectedTask.priority}
                    onChange={(e) => {
                      const updatedTask = { ...selectedTask, priority: e.target.value as any };
                      handleTaskUpdate(updatedTask);
                    }}
                    className="w-full p-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Tags</label>
                <div className="flex flex-wrap gap-1">
                  {selectedTask.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {selectedTask.estimatedDuration && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Estimated Duration</label>
                  <p className="text-sm text-white">{selectedTask.estimatedDuration} hours</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Detail Panel */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            className="absolute top-16 left-4 z-30 w-96 bg-black/40 backdrop-blur-lg rounded-lg border border-white/20 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Project Details</h3>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-white mb-1">{selectedProject.name}</h4>
                <p className="text-sm text-slate-300">{selectedProject.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Status</label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                    selectedProject.status === ProjectStatus.ACTIVE ? 'bg-green-100 text-green-800' :
                    selectedProject.status === ProjectStatus.COMPLETED ? 'bg-purple-100 text-purple-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {selectedProject.status}
                  </span>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tasks</label>
                  <p className="text-sm text-white">{selectedProject.tasks.length} tasks</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Collaborators</label>
                <p className="text-sm text-white">{selectedProject.collaborators.length} members</p>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Tags</label>
                <div className="flex flex-wrap gap-1">
                  {selectedProject.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Workspace */}
      <div className="pt-16 h-full">
        <Workspace3D
          tasks={tasks}
          projects={projects}
          onTaskClick={handleTaskClick}
          onProjectClick={handleProjectClick}
          onTaskMove={handleTaskMove}
          className="w-full h-full"
        />
      </div>

      {/* Performance Stats */}
      <div className="absolute bottom-4 left-4 z-20 bg-black/20 backdrop-blur-sm rounded-lg p-3">
        <div className="text-xs text-slate-300 space-y-1">
          <div>Tasks: {tasks.length}</div>
          <div>Projects: {projects.length}</div>
          <div>Active: {tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length}</div>
        </div>
      </div>
    </div>
  );
};

export { Workspace3DPage };
export default Workspace3DPage;