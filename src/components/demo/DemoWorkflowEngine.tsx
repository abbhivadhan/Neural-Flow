import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface DemoStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  props?: any;
  duration?: number;
  autoAdvance?: boolean;
  requirements?: string[];
}

export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  category: 'ai-capabilities' | 'workspace-adaptation' | 'collaboration' | 'productivity';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  steps: DemoStep[];
  tags: string[];
}

interface DemoWorkflowEngineProps {
  scenario: DemoScenario;
  onComplete?: () => void;
  onReset?: () => void;
  autoPlay?: boolean;
}

export const DemoWorkflowEngine: React.FC<DemoWorkflowEngineProps> = ({
  scenario,
  onComplete,
  onReset,
  autoPlay = false,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [stepProgress, setStepProgress] = useState<Record<string, boolean>>({});
  const [startTime, setStartTime] = useState<Date | null>(null);

  const currentStep = scenario.steps[currentStepIndex];
  const isLastStep = currentStepIndex === scenario.steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  useEffect(() => {
    if (!startTime) {
      setStartTime(new Date());
    }
  }, [startTime]);

  useEffect(() => {
    if (isPlaying && currentStep?.autoAdvance && currentStep.duration) {
      const timer = setTimeout(() => {
        handleNextStep();
      }, currentStep.duration * 1000);

      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, isPlaying, currentStep]);

  const handleNextStep = useCallback(() => {
    if (isLastStep) {
      setStepProgress(prev => ({ ...prev, [currentStep.id]: true }));
      onComplete?.();
      return;
    }

    setStepProgress(prev => ({ ...prev, [currentStep.id]: true }));
    setCurrentStepIndex(prev => prev + 1);
  }, [currentStepIndex, isLastStep, currentStep, onComplete]);

  const handlePreviousStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [isFirstStep]);

  const handleStepSelect = useCallback((stepIndex: number) => {
    setCurrentStepIndex(stepIndex);
  }, []);

  const handleReset = useCallback(() => {
    setCurrentStepIndex(0);
    setStepProgress({});
    setIsPlaying(false);
    setStartTime(new Date());
    onReset?.();
  }, [onReset]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const getElapsedTime = () => {
    if (!startTime) return '0:00';
    const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return Math.round(((currentStepIndex + 1) / scenario.steps.length) * 100);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Demo Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {scenario.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              {scenario.description}
            </p>
            <div className="flex items-center gap-3">
              <Badge variant="outline">{scenario.category}</Badge>
              <Badge variant="outline">{scenario.difficulty}</Badge>
              <Badge variant="outline">{scenario.estimatedTime}min</Badge>
              {scenario.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-2">
              Elapsed: {getElapsedTime()}
            </div>
            <div className="text-sm text-gray-500">
              Progress: {getProgressPercentage()}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePreviousStep}
              disabled={isFirstStep}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <Button
              onClick={togglePlayPause}
              variant={isPlaying ? "outline" : "default"}
              size="sm"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button
              onClick={handleNextStep}
              disabled={isLastStep}
              size="sm"
            >
              {isLastStep ? 'Complete' : 'Next'}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
            >
              Reset Demo
            </Button>
          </div>
        </div>
      </Card>

      {/* Step Navigation */}
      <Card className="p-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {scenario.steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => handleStepSelect(index)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                index === currentStepIndex
                  ? 'bg-blue-600 text-white'
                  : stepProgress[step.id]
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-current opacity-20 flex items-center justify-center text-xs">
                  {index + 1}
                </span>
                <span>{step.title}</span>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Current Step Content */}
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Step {currentStepIndex + 1}: {currentStep.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {currentStep.description}
          </p>
          
          {currentStep.requirements && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Requirements:
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                {currentStep.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Step Component */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          {React.createElement(currentStep.component, {
            ...currentStep.props,
            onStepComplete: handleNextStep,
            isActive: true,
          })}
        </div>

        {/* Step Actions */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {currentStep.duration && (
              <span>Estimated time: {currentStep.duration}s</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isLastStep && (
              <Button
                onClick={handleNextStep}
                className="ml-auto"
              >
                Continue to Next Step
              </Button>
            )}
            {isLastStep && (
              <Button
                onClick={handleNextStep}
                className="ml-auto bg-green-600 hover:bg-green-700"
              >
                Complete Demo
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};