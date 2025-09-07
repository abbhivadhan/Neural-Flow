import React, { useState, useEffect } from 'react';
import { TutorialFlow, TutorialState } from '../../types/tutorial';
import { tutorialEngine } from '../../services/tutorial/TutorialEngine';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

interface TutorialLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTutorial: (flowId: string) => void;
}

export const TutorialLauncher: React.FC<TutorialLauncherProps> = ({
  isOpen,
  onClose,
  onStartTutorial,
}) => {
  const [tutorialState, setTutorialState] = useState<TutorialState | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'onboarding' | 'feature' | 'advanced'>('all');

  useEffect(() => {
    if (isOpen) {
      setTutorialState(tutorialEngine.getCurrentState());
    }
  }, [isOpen]);

  const availableFlows = tutorialEngine.getAvailableTutorials();
  
  const filteredFlows = selectedCategory === 'all' 
    ? availableFlows 
    : availableFlows.filter(flow => flow.category === selectedCategory);

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryIcon = (category: string): React.ReactNode => {
    switch (category) {
      case 'onboarding': 
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>;
      case 'feature': 
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>;
      case 'advanced': 
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>;
      default: 
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>;
    }
  };

  const handleStartTutorial = (flowId: string) => {
    onStartTutorial(flowId);
    onClose();
  };

  if (!tutorialState) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose a Tutorial">
      <div className="max-w-4xl mx-auto">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'onboarding', 'feature', 'advanced'] as const).map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              <div className="flex items-center space-x-1">
                {category === 'all' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>All</span>
                  </>
                ) : (
                  <>
                    {getCategoryIcon(category)}
                    <span>{category}</span>
                  </>
                )}
              </div>
            </Button>
          ))}
        </div>

        {/* Tutorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {filteredFlows.map(flow => {
            const progress = tutorialState.progress[flow.id];
            const isInProgress = progress && !progress.completedAt;
            const isCompleted = tutorialState.completedFlows.includes(flow.id);

            return (
              <Card key={flow.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="text-gray-600 dark:text-gray-400">{getCategoryIcon(flow.category)}</div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {flow.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="secondary"
                      size="sm"
                      className={getDifficultyColor(flow.difficulty)}
                    >
                      {flow.difficulty}
                    </Badge>
                    {isCompleted && (
                      <Badge variant="success" size="sm">
                        <div className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Done</span>
                        </div>
                      </Badge>
                    )}
                    {isInProgress && (
                      <Badge variant="warning" size="sm">
                        In Progress
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {flow.description}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span>{flow.steps.length} steps</span>
                  <span>~{flow.estimatedDuration} min</span>
                </div>

                {/* Progress bar for in-progress tutorials */}
                {isInProgress && progress && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{progress.completedSteps.length}/{flow.steps.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(progress.completedSteps.length / flow.steps.length) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Prerequisites */}
                {flow.prerequisites && flow.prerequisites.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Prerequisites:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {flow.prerequisites.map(prereq => {
                        const isPrereqMet = tutorialState.completedFlows.includes(prereq);
                        return (
                          <Badge
                            key={prereq}
                            variant={isPrereqMet ? 'success' : 'secondary'}
                            size="sm"
                            className="text-xs"
                          >
                            {prereq.replace(/-/g, ' ')}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Rewards */}
                {flow.rewards && flow.rewards.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Rewards:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {flow.rewards.map((reward, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          size="sm"
                          className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        >
                          {reward.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  variant={isInProgress ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => handleStartTutorial(flow.id)}
                  disabled={isCompleted}
                  className="w-full"
                >
                  {isCompleted ? 'Completed' : isInProgress ? 'Resume' : 'Start Tutorial'}
                </Button>
              </Card>
            );
          })}
        </div>

        {filteredFlows.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No tutorials available
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {selectedCategory === 'all' 
                ? 'All tutorials have been completed!'
                : `No ${selectedCategory} tutorials are currently available.`
              }
            </p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {tutorialState.completedFlows.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Completed
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {Object.keys(tutorialState.progress).length - tutorialState.completedFlows.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                In Progress
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {tutorialState.unlockedRewards.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Rewards
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};