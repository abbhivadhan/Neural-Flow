import React, { useState } from 'react';
import { TutorialButton, QuickStartButton } from '../components/tutorial/TutorialButton';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { BookOpen, Play, CheckCircle, Users, Lightbulb, Target } from 'lucide-react';

export default function TutorialDemoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const tutorialSteps = [
    {
      id: 1,
      title: 'Welcome to Neural Flow',
      description: 'Learn the basics of our AI-powered workspace',
      icon: BookOpen,
      color: 'blue'
    },
    {
      id: 2,
      title: 'Navigate the Interface',
      description: 'Discover the adaptive sidebar and context-aware toolbar',
      icon: Target,
      color: 'green'
    },
    {
      id: 3,
      title: 'AI Assistant Features',
      description: 'Explore intelligent automation and suggestions',
      icon: Lightbulb,
      color: 'purple'
    },
    {
      id: 4,
      title: 'Collaboration Tools',
      description: 'Work together with real-time collaboration features',
      icon: Users,
      color: 'orange'
    }
  ];

  const handleStepComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const handleStartTutorial = () => {
    setCurrentStep(1);
    setCompletedSteps([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="w-12 h-12 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Interactive Tutorial System
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Experience our intelligent tutorial system with contextual help, adaptive learning paths, 
            and AI-powered guidance tailored to your learning style.
          </p>
        </div>

        {/* Tutorial Controls */}
        <div className="flex justify-center space-x-4 mb-8">
          <TutorialButton />
          <QuickStartButton />
          <Button
            onClick={handleStartTutorial}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Demo Tutorial
          </Button>
        </div>

        {/* Progress Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tutorial Progress</h3>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedSteps.length / tutorialSteps.length) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {completedSteps.length} / {tutorialSteps.length} completed
            </span>
          </div>
        </div>

        {/* Tutorial Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {tutorialSteps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;
            
            return (
              <Card key={step.id} className={`p-6 transition-all duration-200 ${
                isCurrent ? 'ring-2 ring-indigo-500 shadow-lg' : ''
              }`}>
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    isCompleted ? 'bg-green-100 text-green-600' :
                    isCurrent ? 'bg-indigo-100 text-indigo-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Step {index + 1}: {step.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {step.description}
                    </p>
                    <Button
                      size="sm"
                      variant={isCompleted ? "outline" : "default"}
                      onClick={() => handleStepComplete(step.id)}
                      disabled={isCompleted}
                    >
                      {isCompleted ? 'Completed' : 'Mark Complete'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Contextual Guidance
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Smart tooltips and help that appear exactly when and where you need them.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Adaptive Learning
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              AI-powered system that adapts to your learning pace and preferences.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Progress Tracking
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Comprehensive progress tracking with achievements and milestones.
            </p>
          </div>
        </div>

        {/* Demo Note */}
        <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6 text-center">
          <p className="text-indigo-800 dark:text-indigo-200">
            This is a demonstration of the tutorial system. The actual implementation includes 
            interactive overlays, step-by-step guidance, and intelligent help suggestions.
          </p>
        </div>
      </div>
    </div>
  );
}