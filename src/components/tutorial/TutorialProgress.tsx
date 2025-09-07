import React from 'react';
import { TutorialProgress as TutorialProgressType, TutorialReward } from '../../types/tutorial';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface TutorialProgressProps {
  progress: Record<string, TutorialProgressType>;
  completedFlows: string[];
  unlockedRewards: TutorialReward[];
  onResumeTutorial?: (flowId: string) => void;
}

export const TutorialProgressDashboard: React.FC<TutorialProgressProps> = ({
  progress,
  completedFlows,
  unlockedRewards,
  onResumeTutorial,
}) => {
  const calculateOverallProgress = () => {
    const totalFlows = Object.keys(progress).length;
    if (totalFlows === 0) return 0;
    
    const completedCount = completedFlows.length;
    return Math.round((completedCount / totalFlows) * 100);
  };

  const getProgressStats = () => {
    const totalSteps = Object.values(progress).reduce(
      (sum, p) => sum + p.completedSteps.length,
      0
    );
    
    const totalTime = Object.values(progress).reduce(
      (sum, p) => sum + p.timeSpent,
      0
    );
    
    return { totalSteps, totalTime };
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getRewardIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'badge': 
        return <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>;
      case 'feature_unlock': 
        return <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>;
      case 'customization': 
        return <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
        </svg>;
      case 'achievement': 
        return <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>;
      default: 
        return <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>;
    }
  };

  const stats = getProgressStats();
  const overallProgress = calculateOverallProgress();

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Learning Progress
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {overallProgress}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Overall Progress
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.totalSteps}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Steps Completed
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {formatTime(stats.totalTime)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Time Invested
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </Card>

      {/* Tutorial Flows */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Tutorial Progress
        </h3>
        
        <div className="space-y-4">
          {Object.entries(progress).map(([flowId, flowProgress]) => {
            const isCompleted = completedFlows.includes(flowId);
            const progressPercentage = isCompleted 
              ? 100 
              : (flowProgress.completedSteps.length / (flowProgress.completedSteps.length + 1)) * 100;

            return (
              <div
                key={flowId}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {flowId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    {isCompleted && (
                      <Badge variant="success" size="sm">
                        Completed
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      {flowProgress.completedSteps.length} steps completed
                    </span>
                    <span>
                      {formatTime(flowProgress.timeSpent)} spent
                    </span>
                    {flowProgress.skippedSteps.length > 0 && (
                      <span>
                        {flowProgress.skippedSteps.length} skipped
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-green-500' 
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
                
                {!isCompleted && onResumeTutorial && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onResumeTutorial(flowId)}
                    className="ml-4"
                  >
                    Resume
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Rewards */}
      {unlockedRewards.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Unlocked Rewards
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlockedRewards.map((reward, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700"
              >
                <div className="flex-shrink-0">
                  {getRewardIcon(reward.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {reward.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {reward.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

interface TutorialStatsProps {
  progress: TutorialProgressType;
  flowName: string;
}

export const TutorialStats: React.FC<TutorialStatsProps> = ({
  progress,
  flowName,
}) => {
  const completionRate = progress.completedAt 
    ? 100 
    : (progress.completedSteps.length / (progress.completedSteps.length + 1)) * 100;

  const averageStepTime = progress.interactions.length > 0
    ? progress.interactions.reduce((sum, interaction) => 
        sum + (interaction.timeToComplete || 0), 0
      ) / progress.interactions.length
    : 0;

  const successRate = progress.interactions.length > 0
    ? (progress.interactions.filter(i => i.success).length / progress.interactions.length) * 100
    : 0;

  return (
    <Card className="p-4">
      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
        {flowName} Statistics
      </h4>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Completion Rate
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {Math.round(completionRate)}%
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Time Spent
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {Math.round(progress.timeSpent / 60)}m
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Success Rate
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {Math.round(successRate)}%
          </span>
        </div>
        
        {averageStepTime > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Avg. Step Time
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {Math.round(averageStepTime / 1000)}s
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};