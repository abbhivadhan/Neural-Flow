import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskStatus } from '../../types/task';
import { Priority } from '../../types/common';
import { Clock, User, Tag, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}

const priorityColors = {
  [Priority.LOW]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [Priority.MEDIUM]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [Priority.HIGH]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  [Priority.URGENT]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const statusColors = {
  [TaskStatus.TODO]: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [TaskStatus.BLOCKED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [TaskStatus.REVIEW]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  [TaskStatus.DONE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [TaskStatus.CANCELLED]: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        neural-card p-4 cursor-grab active:cursor-grabbing
        ${isDragging ? 'opacity-50 scale-105' : ''}
        ${isOverdue ? 'border-l-4 border-red-500' : ''}
        hover:shadow-lg transition-all duration-200
      `}
      onClick={() => onEdit?.(task)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
          {task.title}
        </h3>
        {task.aiGenerated && (
          <div className="ml-2 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full">
            AI
          </div>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full"
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              +{task.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-3">
          {/* Priority */}
          <span className={`px-2 py-1 rounded-full ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>

          {/* Status */}
          <span className={`px-2 py-1 rounded-full ${statusColors[task.status]}`}>
            {task.status.replace('_', ' ')}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Due date */}
          {task.dueDate && (
            <div className={`flex items-center ${isOverdue ? 'text-red-500' : ''}`}>
              <Calendar className="w-3 h-3 mr-1" />
              {format(new Date(task.dueDate), 'MMM dd')}
              {isOverdue && <AlertCircle className="w-3 h-3 ml-1" />}
            </div>
          )}

          {/* Duration */}
          {task.estimatedDuration && (
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {task.estimatedDuration}h
            </div>
          )}

          {/* Assignee */}
          {task.assignee && (
            <div className="flex items-center">
              <User className="w-3 h-3 mr-1" />
              <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full"></div>
            </div>
          )}
        </div>
      </div>

      {/* Progress indicator for subtasks */}
      {task.subtasks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Subtasks: {task.subtasks.length}
            </span>
            <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                style={{ width: '60%' }} // This would be calculated based on completed subtasks
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};