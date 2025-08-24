import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useResponsiveDesign } from '../../hooks/useResponsiveDesign';
import { useAccessibility, useFocusTrap } from '../../hooks/useAccessibility';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  overlayClassName?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  overlayClassName = '',
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}: ModalProps) {
  const { isMobile, prefersReducedMotion } = useResponsiveDesign();
  const { announce, generateId, saveFocus, restoreFocus } = useAccessibility();
  const focusTrapRef = useFocusTrap(isOpen);
  const titleId = title ? generateId('modal-title') : ariaLabelledBy;
  const descriptionId = generateId('modal-description');

  // Save focus when modal opens and restore when it closes
  useEffect(() => {
    if (isOpen) {
      saveFocus();
      announce(`Modal opened: ${title || 'Dialog'}`, 'polite');
    } else {
      restoreFocus();
    }
  }, [isOpen, title, saveFocus, restoreFocus, announce]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        announce('Modal closed', 'polite');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose, announce]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
      announce('Modal closed', 'polite');
    }
  };

  const sizeClasses = {
    sm: isMobile ? 'max-w-sm mx-4' : 'max-w-sm',
    md: isMobile ? 'max-w-md mx-4' : 'max-w-md',
    lg: isMobile ? 'max-w-2xl mx-4' : 'max-w-2xl',
    xl: isMobile ? 'max-w-4xl mx-4' : 'max-w-4xl',
    full: isMobile ? 'max-w-full mx-0' : 'max-w-6xl',
  };

  const modalClasses = [
    'relative bg-white dark:bg-slate-800 rounded-lg shadow-xl',
    'max-h-[90vh] overflow-hidden flex flex-col',
    sizeClasses[size],
    prefersReducedMotion ? '' : 'transform transition-all duration-300',
    className,
  ].filter(Boolean).join(' ');

  const overlayClasses = [
    'fixed inset-0 z-50 flex items-center justify-center',
    'bg-black bg-opacity-50 backdrop-blur-sm',
    prefersReducedMotion ? '' : 'transition-opacity duration-300',
    overlayClassName,
  ].filter(Boolean).join(' ');

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className={overlayClasses}
      onClick={handleOverlayClick}
      aria-hidden="true"
    >
      <div
        ref={focusTrapRef}
        className={modalClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={ariaDescribedBy || descriptionId}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            {title && (
              <h2 
                id={titleId}
                className="text-xl font-semibold text-slate-900 dark:text-slate-100"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={() => {
                  onClose();
                  announce('Modal closed', 'polite');
                }}
                className={[
                  'p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
                  'hover:bg-slate-100 dark:hover:bg-slate-700',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  'transition-colors duration-200',
                  // Enhanced touch target for mobile
                  isMobile ? 'min-w-[44px] min-h-[44px]' : '',
                ].filter(Boolean).join(' ')}
                aria-label="Close modal"
              >
                <svg 
                  className="w-6 h-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div 
          id={descriptionId}
          className="flex-1 overflow-y-auto p-6"
        >
          {children}
        </div>
      </div>
    </div>
  );

  // Render modal in portal
  return createPortal(modalContent, document.body);
}

// Compound components for better composition
Modal.Header = function ModalHeader({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`px-6 py-4 border-b border-slate-200 dark:border-slate-700 ${className}`}>
      {children}
    </div>
  );
};

Modal.Body = function ModalBody({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`flex-1 overflow-y-auto px-6 py-4 ${className}`}>
      {children}
    </div>
  );
};

Modal.Footer = function ModalFooter({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 ${className}`}>
      {children}
    </div>
  );
};