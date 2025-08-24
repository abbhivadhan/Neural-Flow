import { StateCreator } from 'zustand';
import { Task, Project, UserPreferences } from '../../types';

export interface WorkspaceState {
  currentProject: Project | null;
  projects: Project[];
  tasks: Task[];
  recentProjects: Project[];
  userPreferences: UserPreferences;
  isLoading: boolean;
  error: string | null;
}

export interface WorkspaceActions {
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addRecentProject: (project: Project) => void;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface WorkspaceSlice {
  workspace: WorkspaceState;
  setCurrentProject: WorkspaceActions['setCurrentProject'];
  addProject: WorkspaceActions['addProject'];
  updateProject: WorkspaceActions['updateProject'];
  deleteProject: WorkspaceActions['deleteProject'];
  createTask: WorkspaceActions['createTask'];
  updateTask: WorkspaceActions['updateTask'];
  deleteTask: WorkspaceActions['deleteTask'];
  addRecentProject: WorkspaceActions['addRecentProject'];
  updateUserPreferences: WorkspaceActions['updateUserPreferences'];
  setLoading: WorkspaceActions['setLoading'];
  setError: WorkspaceActions['setError'];
}

export const workspaceSlice: StateCreator<
  WorkspaceSlice,
  [['zustand/immer', never]],
  [],
  WorkspaceSlice
> = (set) => ({
  workspace: {
    currentProject: null,
    projects: [],
    tasks: [],
    recentProjects: [],
    userPreferences: {
      theme: 'system',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      workingHours: { start: '09:00', end: '17:00' },
      notifications: {
        email: true,
        push: true,
        desktop: true,
      },
      privacy: {
        analytics: true,
        personalization: true,
        dataSharing: false,
      },
    },
    isLoading: false,
    error: null,
  },

  setCurrentProject: (project) =>
    set((state) => {
      state.workspace.currentProject = project;
      if (project) {
        state.addRecentProject(project);
      }
    }),

  addProject: (project) =>
    set((state) => {
      state.workspace.projects.push({
        ...project,
        id: project.id || crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }),

  updateProject: (id, updates) =>
    set((state) => {
      const projectIndex = state.workspace.projects.findIndex(p => p.id === id);
      if (projectIndex !== -1) {
        state.workspace.projects[projectIndex] = {
          ...state.workspace.projects[projectIndex],
          ...updates,
          updatedAt: new Date(),
        };
        
        // Update current project if it's the one being updated
        if (state.workspace.currentProject?.id === id) {
          state.workspace.currentProject = state.workspace.projects[projectIndex];
        }
      }
    }),

  deleteProject: (id) =>
    set((state) => {
      state.workspace.projects = state.workspace.projects.filter(p => p.id !== id);
      state.workspace.recentProjects = state.workspace.recentProjects.filter(p => p.id !== id);
      
      if (state.workspace.currentProject?.id === id) {
        state.workspace.currentProject = null;
      }
      
      // Remove tasks associated with the project
      state.workspace.tasks = state.workspace.tasks.filter(t => t.projectId !== id);
    }),

  createTask: (taskData) =>
    set((state) => {
      const newTask: Task = {
        ...taskData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
      };
      state.workspace.tasks.push(newTask);
    }),

  updateTask: (id, updates) =>
    set((state) => {
      const taskIndex = state.workspace.tasks.findIndex(t => t.id === id);
      if (taskIndex !== -1) {
        state.workspace.tasks[taskIndex] = {
          ...state.workspace.tasks[taskIndex],
          ...updates,
          updatedAt: new Date(),
        };
      }
    }),

  deleteTask: (id) =>
    set((state) => {
      state.workspace.tasks = state.workspace.tasks.filter(t => t.id !== id);
    }),

  addRecentProject: (project) =>
    set((state) => {
      // Remove if already exists
      state.workspace.recentProjects = state.workspace.recentProjects.filter(
        p => p.id !== project.id
      );
      
      // Add to beginning
      state.workspace.recentProjects.unshift(project);
      
      // Keep only last 10
      if (state.workspace.recentProjects.length > 10) {
        state.workspace.recentProjects = state.workspace.recentProjects.slice(0, 10);
      }
    }),

  updateUserPreferences: (preferences) =>
    set((state) => {
      state.workspace.userPreferences = {
        ...state.workspace.userPreferences,
        ...preferences,
      };
    }),

  setLoading: (loading) =>
    set((state) => {
      state.workspace.isLoading = loading;
    }),

  setError: (error) =>
    set((state) => {
      state.workspace.error = error;
    }),
});