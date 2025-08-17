import React, { useState, useMemo } from 'react';
import { Project, ProjectStatus } from '../../types/project';
import { ProjectCard } from './ProjectCard';
import { Search, Filter, Plus, Grid, List } from 'lucide-react';

interface ProjectGridProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onAddProject: () => void;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type FilterStatus = ProjectStatus | 'all';

export const ProjectGrid: React.FC<ProjectGridProps> = ({
  projects,
  onProjectClick,
  onAddProject,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
  }, [projects, searchTerm, filterStatus]);

  // Group projects by status for statistics
  const projectStats = useMemo(() => {
    const stats = {
      all: projects.length,
      active: 0,
      planning: 0,
      completed: 0,
      on_hold: 0,
      cancelled: 0,
      archived: 0,
    };

    projects.forEach((project) => {
      stats[project.status]++;
    });

    return stats;
  }, [projects]);

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Projects
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {filteredProjects.length} of {projects.length} projects
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Add Project Button */}
          <button
            onClick={onAddProject}
            className="neural-button-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center space-x-4 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="pl-10 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
          >
            <option value="all">All Projects ({projectStats.all})</option>
            <option value="active">Active ({projectStats.active})</option>
            <option value="planning">Planning ({projectStats.planning})</option>
            <option value="completed">Completed ({projectStats.completed})</option>
            <option value="on_hold">On Hold ({projectStats.on_hold})</option>
            <option value="cancelled">Cancelled ({projectStats.cancelled})</option>
            <option value="archived">Archived ({projectStats.archived})</option>
          </select>
        </div>
      </div>

      {/* Projects Container */}
      <div className="flex-1 overflow-y-auto">
        {filteredProjects.length > 0 ? (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={onProjectClick}
                className={viewMode === 'list' ? 'w-full' : ''}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Grid className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-sm">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first project to get started with Neural Flow'
              }
            </p>
            {(!searchTerm && filterStatus === 'all') && (
              <button
                onClick={onAddProject}
                className="neural-button-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Project</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};