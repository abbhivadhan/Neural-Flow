import React from 'react';
import { Project } from '../../types/project';
import { Priority } from '../../types/common';
import { Calendar, Users, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
  className?: string;
}

const statusConfig = {
  planning: {
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    icon: Target,
  },
  active: {
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: TrendingUp,
  },
  on_hold: {
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    icon: AlertTriangle,
  },
  completed: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: Target,
  },
  cancelled: {
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    icon: AlertTriangle,
  },
  archived: {
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    icon: Target,
  },
};

const priorityColors = {
  [Priority.LOW]: 'border-l-green-500',
  [Priority.MEDIUM]: 'border-l-yellow-500',
  [Priority.HIGH]: 'border-l-orange-500',
  [Priority.URGENT]: 'border-l-red-500',
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onClick,
  className = '',
}) => {
  const config = statusConfig[project.status];
  const StatusIcon = config.icon;
  
  // Calculate project progress based on completed tasks
  const totalTasks = project.tasks.length;
  const progress = project.aiInsights?.healthScore || 0;
  
  // Get upcoming milestone
  const upcomingMilestone = project.milestones
    .filter(m => m.status === 'upcoming')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  return (
    <div
      className={`
        neural-card p-6 cursor-pointer hover:shadow-lg transition-all duration-200
        border-l-4 ${priorityColors[project.priority]}
        ${className}
      `}
      onClick={() => onClick?.(project)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-2">
            {project.name}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
            {project.description}
          </p>
        </div>
        
        <div className="ml-4 flex flex-col items-end space-y-2">
          <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${config.color}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {project.status.replace('_', ' ')}
          </span>
          
          {project.aiInsights && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              <span className="text-xs text-slate-500 dark:text-slate-400">AI Insights</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Progress
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Team Size */}
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {project.collaborators.length} members
          </span>
        </div>

        {/* Tasks */}
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {totalTasks} tasks
          </span>
        </div>

        {/* Start Date */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {format(new Date(project.startDate), 'MMM dd, yyyy')}
          </span>
        </div>

        {/* End Date */}
        {project.endDate && (
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Due {format(new Date(project.endDate), 'MMM dd')}
            </span>
          </div>
        )}
      </div>

      {/* Tags */}
      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {project.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full"
            >
              {tag}
            </span>
          ))}
          {project.tags.length > 3 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              +{project.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Upcoming Milestone */}
      {upcomingMilestone && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Next Milestone
              </p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {upcomingMilestone.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {format(new Date(upcomingMilestone.dueDate), 'MMM dd')}
              </p>
              <span className={`text-xs px-2 py-1 rounded-full ${
                upcomingMilestone.importance === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                upcomingMilestone.importance === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}>
                {upcomingMilestone.importance}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Preview */}
      {project.aiInsights && project.aiInsights.riskFactors.length > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {project.aiInsights.riskFactors.length} risk factor{project.aiInsights.riskFactors.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Health: {Math.round(project.aiInsights.healthScore)}/100
            </div>
          </div>
        </div>
      )}
    </div>
  );
};