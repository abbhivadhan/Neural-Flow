import { useState } from 'react';
import { WorkspaceLayout } from '../components/workspace';
import { simpleTasks, simpleProjects } from '../data/simpleSampleData';
import { Task, TaskStatus, WorkType, ComplexityLevel, EnvironmentType, CollaborationLevel } from '../types/task';
import { Project } from '../types/project';
import { Priority } from '../types/common';

export default function WorkspacePage() {
  const [tasks, setTasks] = useState<Task[]>(simpleTasks as Task[]);
  const [projects] = useState<Project[]>(simpleProjects as any);

  const handleTaskMove = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus, updatedAt: new Date() }
          : task
      )
    );
  };

  const handleAddTask = (status: TaskStatus) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: 'New Task',
      description: 'Task description',
      priority: Priority.MEDIUM,
      status,
      estimatedDuration: 2,
      dependencies: [],
      context: {
        workType: WorkType.CODING,
        domain: 'General',
        complexity: ComplexityLevel.SIMPLE,
        skillsRequired: [],
        toolsRequired: [],
        environment: EnvironmentType.FOCUSED,
        collaborationLevel: CollaborationLevel.SOLO,
      },
      tags: [],
      creator: 'user-1',
      subtasks: [],
      attachments: [],
      comments: [],
      aiGenerated: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {},
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleEditTask = (task: Task) => {
    console.log('Edit task:', task);
    // This would open a task edit modal
  };

  const handleProjectClick = (project: Project) => {
    console.log('Project clicked:', project);
    // This would navigate to project details
  };

  const handleAddProject = () => {
    console.log('Add new project');
    // This would open a new project modal
  };

  return (
    <WorkspaceLayout
      initialView="dashboard"
      tasks={tasks}
      projects={projects}
      onTaskMove={handleTaskMove}
      onAddTask={handleAddTask}
      onEditTask={handleEditTask}
      onProjectClick={handleProjectClick}
      onAddProject={handleAddProject}
    />
  );
}