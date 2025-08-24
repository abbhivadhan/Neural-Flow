import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Navigation, BottomNavigation } from '../ui/Navigation';
import { ResponsiveLayout, ResponsiveGrid, Container } from '../layout/ResponsiveLayout';
import { useResponsiveDesign } from '../../hooks/useResponsiveDesign';
import { useAccessibility, useAnnouncements } from '../../hooks/useAccessibility';

export function AccessibilityDemo() {
  const { isMobile, isTablet, breakpoint, touchDevice, prefersReducedMotion } = useResponsiveDesign();
  const { announce } = useAccessibility();
  const { announceAction, announceError, announceSuccess } = useAnnouncements();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [activeNavItem, setActiveNavItem] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      badge: 3,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      children: [
        { id: 'reports', label: 'Reports' },
        { id: 'insights', label: 'Insights' },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Validate input
    if (value.length > 0 && value.length < 3) {
      setInputError('Input must be at least 3 characters long');
    } else {
      setInputError('');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inputValue.length < 3) {
      setInputError('Input must be at least 3 characters long');
      announceError('Form validation failed');
      return;
    }

    setLoading(true);
    announceAction('Submitting form');
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      announceSuccess('Form submitted successfully');
      setInputValue('');
    }, 2000);
  };

  const sidebar = (
    <div className="p-4">
      <Navigation
        items={navigationItems}
        orientation="vertical"
        variant="default"
        activeItem={activeNavItem}
        onItemSelect={(item) => setActiveNavItem(item.id)}
        aria-label="Main navigation"
      />
    </div>
  );

  const header = (
    <div className="flex items-center justify-between w-full">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Accessibility Demo
      </h1>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {breakpoint.toUpperCase()} • {touchDevice ? 'Touch' : 'Mouse'}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setModalOpen(true)}
          aria-label="Open demo modal"
        >
          Open Modal
        </Button>
      </div>
    </div>
  );

  return (
    <ResponsiveLayout
      sidebar={sidebar}
      header={header}
      className="min-h-screen"
    >
      <Container className="py-8">
        <div className="space-y-8">
          {/* Device Information */}
          <section aria-labelledby="device-info-heading">
            <h2 id="device-info-heading" className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Device Information
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
              <ResponsiveGrid columns={{ xs: 1, sm: 2, lg: 4 }} gap="md">
                <div>
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300">Breakpoint</h3>
                  <p className="text-slate-600 dark:text-slate-400">{breakpoint.toUpperCase()}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300">Device Type</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300">Input Method</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {touchDevice ? 'Touch' : 'Mouse/Keyboard'}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300">Motion</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {prefersReducedMotion ? 'Reduced' : 'Normal'}
                  </p>
                </div>
              </ResponsiveGrid>
            </div>
          </section>

          {/* Form Demo */}
          <section aria-labelledby="form-demo-heading">
            <h2 id="form-demo-heading" className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Accessible Form Demo
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <Input
                  label="Sample Input"
                  placeholder="Enter at least 3 characters"
                  value={inputValue}
                  onChange={handleInputChange}
                  error={inputError}
                  helperText="This input demonstrates validation and screen reader support"
                  showCharacterCount
                  maxLength={50}
                  required
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />
                
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    disabled={!!inputError || inputValue.length === 0}
                    aria-describedby="submit-help"
                  >
                    Submit Form
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setInputValue('');
                      setInputError('');
                      announce('Form cleared');
                    }}
                  >
                    Clear
                  </Button>
                </div>
                
                <p id="submit-help" className="text-sm text-slate-500 dark:text-slate-400">
                  Form will be submitted after validation passes
                </p>
              </form>
            </div>
          </section>

          {/* Button Variants Demo */}
          <section aria-labelledby="button-demo-heading">
            <h2 id="button-demo-heading" className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Button Variants
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
              <ResponsiveGrid columns={{ xs: 1, sm: 2, md: 3, lg: 6 }} gap="md">
                <Button variant="default" fullWidth>Default</Button>
                <Button variant="primary" fullWidth>Primary</Button>
                <Button variant="secondary" fullWidth>Secondary</Button>
                <Button variant="outline" fullWidth>Outline</Button>
                <Button variant="destructive" fullWidth>Destructive</Button>
                <Button variant="ghost" fullWidth>Ghost</Button>
              </ResponsiveGrid>
              
              <div className="mt-6">
                <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">Button Sizes</h3>
                <div className="flex flex-wrap gap-3">
                  <Button size="xs" variant="primary">Extra Small</Button>
                  <Button size="sm" variant="primary">Small</Button>
                  <Button size="md" variant="primary">Medium</Button>
                  <Button size="lg" variant="primary">Large</Button>
                  <Button size="xl" variant="primary">Extra Large</Button>
                </div>
              </div>
            </div>
          </section>

          {/* Keyboard Navigation Demo */}
          <section aria-labelledby="keyboard-demo-heading">
            <h2 id="keyboard-demo-heading" className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Keyboard Navigation
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Use Tab, Arrow keys, Enter, and Space to navigate. Try the navigation menu in the sidebar.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Horizontal Navigation
                  </h3>
                  <Navigation
                    items={navigationItems.slice(0, 3)}
                    orientation="horizontal"
                    variant="pills"
                    activeItem={activeNavItem}
                    onItemSelect={(item) => setActiveNavItem(item.id)}
                  />
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Underline Navigation
                  </h3>
                  <Navigation
                    items={navigationItems.slice(0, 3)}
                    orientation="horizontal"
                    variant="underline"
                    activeItem={activeNavItem}
                    onItemSelect={(item) => setActiveNavItem(item.id)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Screen Reader Announcements */}
          <section aria-labelledby="announcements-heading">
            <h2 id="announcements-heading" className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Screen Reader Announcements
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                These buttons demonstrate different types of screen reader announcements:
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => announce('This is a polite announcement', 'polite')}
                >
                  Polite Announcement
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => announce('This is an assertive announcement', 'assertive')}
                >
                  Assertive Announcement
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => announceSuccess('Operation completed successfully')}
                >
                  Success Message
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={() => announceError('An error occurred')}
                >
                  Error Message
                </Button>
              </div>
            </div>
          </section>
        </div>
      </Container>

      {/* Modal Demo */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Accessible Modal Demo"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            This modal demonstrates proper focus management, keyboard navigation, and screen reader support.
          </p>
          
          <div className="space-y-3">
            <Input
              label="Modal Input"
              placeholder="Try tabbing through the modal"
              helperText="Focus is trapped within the modal"
            />
            
            <div className="flex gap-3">
              <Button variant="primary" onClick={() => setModalOpen(false)}>
                Close Modal
              </Button>
              <Button variant="outline">
                Another Action
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <BottomNavigation
          items={navigationItems}
          activeItem={activeNavItem}
          onItemSelect={(item) => setActiveNavItem(item.id)}
        />
      )}
    </ResponsiveLayout>
  );
}