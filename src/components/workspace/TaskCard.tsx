import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskStatus } from '../../types/task';
import { Priority } from '../../types/common';
import { Tag, Calendar, AlertCircle } from 'lucide-react';
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

      {/* Tags - simplified */}
      {task.tags.length > 0 && (
        <div className="flex items-center gap-1 mb-3">
          <Tag className="w-3 h-3 text-slate-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {task.tags.slice(0, 2).join(', ')}
            {task.tags.length > 2 && ` +${task.tags.length - 2}`}
          </span>
        </div>
      )}

      {/* Essential metadata only */}
      <div className="flex items-center justify-between">
        {/* Priority indicator */}
        <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        
        {/* Due date - only show if exists and important */}
        {task.dueDate && (
          <div className={`flex items-center text-xs ${isOverdue ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
            {isOverdue && <AlertCircle className="w-3 h-3 mr-1" />}
            {format(new Date(task.dueDate), 'MMM dd')}
          </div>
        )}
      </div>

      {/* Subtasks indicator - simplified */}
      {task.subtasks.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
            <span>{task.subtasks.length} subtasks</span>
            <div className="ml-2 flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: '60%' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};