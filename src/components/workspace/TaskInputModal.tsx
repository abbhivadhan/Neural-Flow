import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TaskStatus } from '../../types/task';
import { Priority } from '../../types/common';

interface TaskInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: { title: string; description: string; priority: Priority }) => void;
  status: TaskStatus;
}

export const TaskInputModal: React.FC<TaskInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  status,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit({ title: title.trim(), description: description.trim(), priority });
      setTitle('');
      setDescription('');
      setPriority(Priority.MEDIUM);
      onClose();
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setPriority(Priority.MEDIUM);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div data-tutorial="task-input">
          <label htmlFor="task-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Task Title *
          </label>
          <Input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title..."
            required
            autoFocus
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="task-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Description
          </label>
          <textarea
            id="task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter task description..."
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-100 resize-none"
          />
        </div>

        <div>
          <label htmlFor="task-priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Priority
          </label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value={Priority.LOW}>Low</option>
            <option value={Priority.MEDIUM}>Medium</option>
            <option value={Priority.HIGH}>High</option>
            <option value={Priority.URGENT}>Urgent</option>
          </select>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!title.trim()}
          >
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};