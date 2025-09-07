import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Priority } from '../../types/common';
import { 
  CheckSquare, 
  FolderPlus, 
  FileText, 
  Calendar, 
  Lightbulb,
  Code,
  Palette
} from 'lucide-react';

interface QuickAddOption {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  context: string[];
}

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContext: 'coding' | 'writing' | 'research' | 'design' | 'meeting';
  onAddTask: (taskData: { title: string; description: string; priority: Priority }) => void;
  onAddProject: () => void;
  onAddDocument?: () => void;
  onAddMeeting?: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  currentContext,
  onAddTask,
  onAddProject,
  onAddDocument,
  onAddMeeting,
}) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);

  const quickAddOptions: QuickAddOption[] = [
    {
      id: 'task',
      label: 'Task',
      description: 'Create a new task or todo item',
      icon: CheckSquare,
      context: ['coding', 'writing', 'research', 'design', 'meeting']
    },
    {
      id: 'project',
      label: 'Project',
      description: 'Start a new project',
      icon: FolderPlus,
      context: ['coding', 'design', 'research']
    },
    {
      id: 'document',
      label: 'Document',
      description: 'Create a new document or note',
      icon: FileText,
      context: ['writing', 'research', 'meeting']
    },
    {
      id: 'meeting',
      label: 'Meeting',
      description: 'Schedule a new meeting',
      icon: Calendar,
      context: ['meeting', 'coding', 'design']
    },
    {
      id: 'idea',
      label: 'Idea',
      description: 'Capture a quick idea or insight',
      icon: Lightbulb,
      context: ['coding', 'writing', 'research', 'design', 'meeting']
    },
    {
      id: 'code',
      label: 'Code File',
      description: 'Create a new code file or component',
      icon: Code,
      context: ['coding']
    },
    {
      id: 'design',
      label: 'Design Asset',
      description: 'Create a new design or asset',
      icon: Palette,
      context: ['design']
    }
  ];

  const contextualOptions = quickAddOptions.filter(option => 
    option.context.includes(currentContext)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType || !title.trim()) return;

    switch (selectedType) {
      case 'task':
      case 'idea':
        onAddTask({
          title: title.trim(),
          description: description.trim(),
          priority
        });
        break;
      case 'project':
        onAddProject();
        break;
      case 'document':
        onAddDocument?.();
        break;
      case 'meeting':
        onAddMeeting?.();
        break;
      case 'code':
        onAddTask({
          title: `Code: ${title.trim()}`,
          description: description.trim(),
          priority
        });
        break;
      case 'design':
        onAddTask({
          title: `Design: ${title.trim()}`,
          description: description.trim(),
          priority
        });
        break;
    }

    handleClose();
  };

  const handleClose = () => {
    setSelectedType(null);
    setTitle('');
    setDescription('');
    setPriority(Priority.MEDIUM);
    onClose();
  };

  const handleOptionSelect = (optionId: string) => {
    setSelectedType(optionId);
    
    // Auto-focus title input after selection
    setTimeout(() => {
      const titleInput = document.getElementById('quick-add-title');
      titleInput?.focus();
    }, 100);
  };

  const getContextualTitle = () => {
    const contextTitles = {
      coding: 'Quick Add - Coding',
      writing: 'Quick Add - Writing',
      research: 'Quick Add - Research',
      design: 'Quick Add - Design',
      meeting: 'Quick Add - Meeting'
    };
    return contextTitles[currentContext] || 'Quick Add';
  };

  const getContextualDescription = () => {
    const contextDescriptions = {
      coding: 'What would you like to create for your coding session?',
      writing: 'What would you like to add to your writing workflow?',
      research: 'What research item would you like to create?',
      design: 'What design element would you like to add?',
      meeting: 'What would you like to prepare for your meeting?'
    };
    return contextDescriptions[currentContext] || 'What would you like to create?';
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={getContextualTitle()}>
      <div className="space-y-6">
        {!selectedType ? (
          // Option Selection View
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {getContextualDescription()}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {contextualOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionSelect(option.id)}
                    className="p-4 text-left border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-800/50 transition-colors">
                        <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                          {option.label}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          // Form View
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              {(() => {
                const selectedOption = quickAddOptions.find(opt => opt.id === selectedType);
                const Icon = selectedOption?.icon || CheckSquare;
                return (
                  <>
                    <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">
                        {selectedOption?.label}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedOption?.description}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>

            <div>
              <label htmlFor="quick-add-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {selectedType === 'code' ? 'File Name *' : 'Title *'}
              </label>
              <Input
                id="quick-add-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={selectedType === 'code' ? 'Enter file name (e.g., component.tsx)...' : `Enter ${quickAddOptions.find(opt => opt.id === selectedType)?.label.toLowerCase()} title...`}
                required
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="quick-add-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description
              </label>
              <textarea
                id="quick-add-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description (optional)..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-100 resize-none"
              />
            </div>

            {(selectedType === 'task' || selectedType === 'idea' || selectedType === 'code' || selectedType === 'design') && (
              <div>
                <label htmlFor="quick-add-priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Priority
                </label>
                <select
                  id="quick-add-priority"
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
            )}

            <div className="flex items-center justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedType(null)}
              >
                Back
              </Button>
              <div className="flex space-x-3">
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
                  Create {quickAddOptions.find(opt => opt.id === selectedType)?.label}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default QuickAddModal;