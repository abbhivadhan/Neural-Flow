import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '../../types/task';
import { TaskCard } from './TaskCard';
import { Plus, MoreHorizontal } from 'lucide-react';

interface TaskColumnProps {
  id: string;
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onAddTask?: (status: TaskStatus) => void;
  onEditTask?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  color?: string;
}

const statusConfig = {
  [TaskStatus.TODO]: {
    title: 'To Do',
    color: 'bg-slate-100 dark:bg-slate-800',
    headerColor: 'text-slate-700 dark:text-slate-300',
    count: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  },
  [TaskStatus.IN_PROGRESS]: {
    title: 'In Progress',
    color: 'bg-blue-50 dark:bg-blue-900/20',
    headerColor: 'text-blue-700 dark:text-blue-300',
    count: 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300',
  },
  [TaskStatus.REVIEW]: {
    title: 'Review',
    color: 'bg-purple-50 dark:bg-purple-900/20',
    headerColor: 'text-purple-700 dark:text-purple-300',
    count: 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300',
  },
  [TaskStatus.DONE]: {
    title: 'Done',
    color: 'bg-green-50 dark:bg-green-900/20',
    headerColor: 'text-green-700 dark:text-green-300',
    count: 'bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300',
  },
  [TaskStatus.BLOCKED]: {
    title: 'Blocked',
    color: 'bg-red-50 dark:bg-red-900/20',
    headerColor: 'text-red-700 dark:text-red-300',
    count: 'bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300',
  },
  [TaskStatus.CANCELLED]: {
    title: 'Cancelled',
    color: 'bg-gray-50 dark:bg-gray-900/20',
    headerColor: 'text-gray-700 dark:text-gray-300',
    count: 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  },
};

export const TaskColumn: React.FC<TaskColumnProps> = ({
  id,
  title,
  status,
  tasks,
  onAddTask,
  onEditTask,
  onStatusChange,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  const config = statusConfig[status] || statusConfig[TaskStatus.TODO];
  const taskIds = tasks.map(task => task.id);

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col h-full min-h-[600px] w-80 rounded-xl border border-slate-200 dark:border-slate-700
        ${config.color}
        ${isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
        transition-all duration-200
      `}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <h3 className={`font-semibold ${config.headerColor}`}>
            {title || config.title}
          </h3>
          <span className={`px-2 py-1 text-xs rounded-full ${config.count}`}>
            {tasks.length}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onAddTask?.(status)}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
            title="Add task"
          >
            <Plus className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
          <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors">
            <MoreHorizontal className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* Tasks Container */}
      <div className="flex-1 p-4 overflow-y-auto">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask || (() => {})}
                onStatusChange={onStatusChange || (() => {})}
              />
            ))}
          </div>
        </SortableContext>

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              No tasks in {config.title.toLowerCase()}
            </p>
            <button
              onClick={() => onAddTask?.(status)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Add your first task
            </button>
          </div>
        )}
      </div>
    </div>
  );
};