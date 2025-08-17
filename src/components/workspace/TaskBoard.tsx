import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core';
// import { arrayMove } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '../../types/task';
import { TaskColumn } from './TaskColumn';
import { TaskCard } from './TaskCard';

interface TaskBoardProps {
  tasks: Task[];
  onTaskMove?: (taskId: string, newStatus: TaskStatus, newIndex?: number) => void;
  onAddTask?: (status: TaskStatus) => void;
  onEditTask?: (task: Task) => void;
  className?: string;
}

const columnOrder: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW, TaskStatus.DONE];

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onTaskMove,
  onAddTask,
  onEditTask,
  className = '',
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      blocked: [],
      review: [],
      done: [],
      cancelled: [],
    };

    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    // Sort tasks within each column by priority and due date
    Object.keys(grouped).forEach((status) => {
      grouped[status as TaskStatus].sort((a, b) => {
        // First sort by priority
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then by due date
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;

        // Finally by creation date
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    });

    return grouped;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the containers
    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId) || overId;

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Move task between columns
    const activeTask = tasks.find(t => t.id === activeId);
    if (activeTask && overContainer !== activeContainer) {
      onTaskMove?.(activeId, overContainer as TaskStatus);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId) || overId;

    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer) {
      // Reordering within the same column
      const containerTasks = tasksByStatus[activeContainer as TaskStatus];
      const activeIndex = containerTasks.findIndex(t => t.id === activeId);
      const overIndex = containerTasks.findIndex(t => t.id === overId);

      if (activeIndex !== overIndex) {
        // const newTasks = arrayMove(containerTasks, activeIndex, overIndex);
        // Here you would update the task order in your state management
        // For now, we'll just trigger the move callback
        onTaskMove?.(activeId, activeContainer as TaskStatus, overIndex);
      }
    }
  };

  const findContainer = (id: string): string | null => {
    // Check if it's a column id
    if (columnOrder.includes(id as TaskStatus)) {
      return id;
    }

    // Find which column contains this task
    for (const [status, tasks] of Object.entries(tasksByStatus)) {
      if (tasks.some(task => task.id === id)) {
        return status;
      }
    }

    return null;
  };

  return (
    <div className={`h-full ${className}`}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 h-full overflow-x-auto pb-6">
          {columnOrder.map((status) => (
            <TaskColumn
              key={status}
              id={status}
              title={status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              status={status}
              tasks={tasksByStatus[status]}
              onAddTask={onAddTask || (() => {})}
              onEditTask={onEditTask || (() => {})}
              onStatusChange={(taskId, newStatus) => onTaskMove?.(taskId, newStatus) || (() => {})}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 scale-105">
              <TaskCard 
                task={activeTask} 
                onEdit={() => {}} 
                onStatusChange={() => {}} 
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};