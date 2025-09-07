import React, { useEffect, useState, useRef } from 'react';
import { TutorialStep, TutorialFlow, TutorialProgress } from '../../types/tutorial';
import { tutorialEngine } from '../../services/tutorial/TutorialEngine';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface TutorialOverlayProps {
  isActive: boolean;
  currentStep?: TutorialStep;
  currentFlow?: TutorialFlow;
  progress?: TutorialProgress;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onClose: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  isActive,
  currentStep,
  currentFlow,
  progress,
  onNext,
  onPrevious,
  onSkip,
  onClose,
}) => {
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !currentStep) {
      setHighlightedElement(null);
      return;
    }

    const targetElement = document.querySelector(currentStep.target);
    if (targetElement) {
      setHighlightedElement(targetElement);
      updateOverlayPosition(targetElement);
      
      // Add highlight class
      targetElement.classList.add('tutorial-highlight');
      
      // Scroll element into view
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }

    return () => {
      if (targetElement) {
        targetElement.classList.remove('tutorial-highlight');
      }
    };
  }, [isActive, currentStep]);

  const updateOverlayPosition = (targetElement: Element) => {
    const rect = targetElement.getBoundingClientRect();
    const overlayRect = overlayRef.current?.getBoundingClientRect();
    
    if (!overlayRect) return;

    let top = 0;
    let left = 0;

    switch (currentStep?.position) {
      case 'top':
        top = rect.top - overlayRect.height - 20;
        left = rect.left + (rect.width - overlayRect.width) / 2;
        break;
      case 'bottom':
        top = rect.bottom + 20;
        left = rect.left + (rect.width - overlayRect.width) / 2;
        break;
      case 'left':
        top = rect.top + (rect.height - overlayRect.height) / 2;
        left = rect.left - overlayRect.width - 20;
        break;
      case 'right':
        top = rect.top + (rect.height - overlayRect.height) / 2;
        left = rect.right + 20;
        break;
      case 'center':
      default:
        top = window.innerHeight / 2 - overlayRect.height / 2;
        left = window.innerWidth / 2 - overlayRect.width / 2;
        break;
    }

    // Ensure overlay stays within viewport
    top = Math.max(20, Math.min(top, window.innerHeight - overlayRect.height - 20));
    left = Math.max(20, Math.min(left, window.innerWidth - overlayRect.width - 20));

    setOverlayPosition({ top, left });
  };

  const handleAction = async () => {
    if (!currentStep || !currentStep.action) return;

    const startTime = Date.now();
    let success = false;

    try {
      switch (currentStep.action) {
        case 'click':
          const clickTarget = document.querySelector(currentStep.actionTarget || currentStep.target);
          if (clickTarget) {
            (clickTarget as HTMLElement).click();
            success = true;
          }
          break;
        case 'hover':
          const hoverTarget = document.querySelector(currentStep.actionTarget || currentStep.target);
          if (hoverTarget) {
            hoverTarget.dispatchEvent(new MouseEvent('mouseenter'));
            success = true;
          }
          break;
        case 'input':
          const inputTarget = document.querySelector(currentStep.actionTarget || currentStep.target) as HTMLInputElement;
          if (inputTarget) {
            inputTarget.focus();
            success = true;
          }
          break;
        case 'wait':
          await new Promise(resolve => setTimeout(resolve, currentStep.delay || 1000));
          success = true;
          break;
      }
    } catch (error) {
      console.warn('Tutorial action failed:', error);
    }

    const timeToComplete = Date.now() - startTime;
    tutorialEngine.recordInteraction(currentStep.id, currentStep.action, success, timeToComplete);

    if (success && currentStep.nextTrigger === 'auto') {
      setTimeout(onNext, currentStep.delay || 500);
    }
  };

  useEffect(() => {
    if (currentStep?.action && currentStep.nextTrigger === 'auto') {
      handleAction();
    }
  }, [currentStep]);

  if (!isActive || !currentStep || !currentFlow || !progress) {
    return null;
  }

  const stepNumber = progress.currentStepIndex + 1;
  const totalSteps = currentFlow.steps.length;
  const progressPercentage = (stepNumber / totalSteps) * 100;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 tutorial-backdrop" />
      
      {/* Tutorial Card */}
      <div
        ref={overlayRef}
        className="fixed z-50 tutorial-overlay"
        style={{
          top: overlayPosition.top,
          left: overlayPosition.left,
        }}
      >
        <Card className="max-w-md p-6 bg-white dark:bg-gray-800 shadow-2xl border-2 border-blue-500">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {stepNumber}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {currentStep.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Step {stepNumber} of {totalSteps} • {currentFlow.name}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {currentStep.content}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevious}
                disabled={stepNumber === 1}
              >
                Previous
              </Button>
              {currentStep.skippable && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                  className="text-gray-500"
                >
                  Skip
                </Button>
              )}
            </div>
            
            <div className="flex space-x-2">
              {currentStep.action && currentStep.nextTrigger === 'manual' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAction}
                >
                  Try It
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={onNext}
                disabled={currentStep.required && currentStep.nextTrigger === 'action'}
              >
                {stepNumber === totalSteps ? 'Complete' : 'Next'}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Spotlight effect for highlighted element */}
      {highlightedElement && (
        <style>
          {`
            .tutorial-highlight {
              position: relative;
              z-index: 45;
              box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5);
              border-radius: 8px;
            }
            
            .tutorial-backdrop {
              pointer-events: none;
            }
            
            .tutorial-highlight {
              pointer-events: auto;
            }
          `}
        </style>
      )}
    </>
  );
};