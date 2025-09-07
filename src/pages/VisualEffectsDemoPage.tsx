import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ParticleSystem } from '../components/effects/ParticleSystem';
import { NeuralNetworkVisualization } from '../components/effects/NeuralNetworkVisualization';
import { LoadingSpinner, SkeletonLoader } from '../components/effects/LoadingAnimations';
import { HoverEffect, FloatingElement, ParallaxElement, GlitchEffect } from '../components/effects/HoverEffects';
import { PageTransition, StaggeredEntrance } from '../components/effects/PageTransition';
import { useHapticFeedback } from '../utils/hapticFeedback';

export const VisualEffectsDemoPage: React.FC = () => {
  const [currentDemo, setCurrentDemo] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  
  const { 
    isSupported: isHapticSupported,
    setEnabled: setHapticGlobalEnabled,
    neural,
    processing,
    aiThinking
  } = useHapticFeedback();

  const demoSections = [
    { id: 'overview', title: 'Overview', icon: '' },
    { id: 'buttons', title: 'Enhanced Buttons', icon: '' },
    { id: 'particles', title: 'Particle Systems', icon: '' },
    { id: 'neural', title: 'Neural Networks', icon: '' },
    { id: 'loading', title: 'Loading Animations', icon: '' },
    { id: 'hover', title: 'Hover Effects', icon: '' },
    { id: 'transitions', title: 'Page Transitions', icon: '' },
    { id: 'haptic', title: 'Haptic Feedback', icon: '' },
  ];



  const handleHapticTest = (type: string) => {
    switch (type) {
      case 'neural':
        neural();
        break;
      case 'processing':
        processing();
        break;
      case 'thinking':
        aiThinking();
        break;
    }
  };

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  return (
    <PageTransition transitionKey={currentDemo} type="neural">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-900 dark:to-purple-900">
        {/* Background Particle System */}
        <div className="fixed inset-0 pointer-events-none opacity-30">
          <ParticleSystem
            width={window.innerWidth}
            height={window.innerHeight}
            particleCount={30}
            colors={['#3b82f6', '#8b5cf6', '#06b6d4']}
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <FloatingElement amplitude={5} frequency={3000}>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                Neural Flow Visual Effects
              </h1>
            </FloatingElement>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Experience the cutting-edge visual effects, micro-interactions, and haptic feedback that make Neural Flow extraordinary.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              {isHapticSupported && (
                <Button
                  variant={hapticEnabled ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setHapticEnabled(!hapticEnabled);
                    setHapticGlobalEnabled(!hapticEnabled);
                  }}
                  hoverEffect="pulse"
                >
                  Haptic {hapticEnabled ? 'On' : 'Off'}
                </Button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            <StaggeredEntrance staggerDelay={50}>
              {demoSections.map((section) => (
                <Button
                  key={section.id}
                  variant={currentDemo === section.id ? 'neural' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentDemo(section.id)}
                  hoverEffect="lift"
                  className="min-w-[120px]"
                >
                  {section.title}
                </Button>
              ))}
            </StaggeredEntrance>
          </div>

          {/* Demo Content */}
          <div className="max-w-6xl mx-auto">
            {currentDemo === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StaggeredEntrance staggerDelay={100}>
                  {[
                    {
                      title: 'Particle Systems',
                      description: 'Dynamic particle effects that respond to user interactions',
                      demo: <ParticleSystem width={300} height={200} particleCount={25} />
                    },
                    {
                      title: 'Neural Networks',
                      description: 'Animated neural network visualizations',
                      demo: <NeuralNetworkVisualization width={300} height={200} />
                    },
                    {
                      title: 'Hover Effects',
                      description: 'Interactive hover effects with glow, tilt, and magnetic properties',
                      demo: (
                        <div className="flex gap-4 justify-center">
                          <HoverEffect effect="glow">
                            <div className="w-16 h-16 bg-blue-500 rounded-lg" />
                          </HoverEffect>
                          <HoverEffect effect="tilt">
                            <div className="w-16 h-16 bg-purple-500 rounded-lg" />
                          </HoverEffect>
                        </div>
                      )
                    },
                    {
                      title: 'Loading Animations',
                      description: 'Neural-themed loading spinners and skeleton loaders',
                      demo: (
                        <div className="flex gap-4 justify-center items-center">
                          <LoadingSpinner variant="neural" size="lg" />
                          <LoadingSpinner variant="brain" size="lg" />
                        </div>
                      )
                    },
                    {
                      title: 'Enhanced Buttons',
                      description: 'Buttons with sound, haptic feedback, and visual effects',
                      demo: (
                        <div className="flex gap-2">
                          <Button variant="neural" hoverEffect="glow">Neural</Button>
                          <Button variant="primary" hoverEffect="lift">Primary</Button>
                        </div>
                      )
                    },
                    {
                      title: 'Micro-interactions',
                      description: 'Subtle animations that enhance user experience',
                      demo: (
                        <GlitchEffect trigger="hover">
                          <div className="text-2xl font-bold text-center py-4">
                            Hover for Glitch
                          </div>
                        </GlitchEffect>
                      )
                    }
                  ].map((item, index) => (
                    <Card key={index} className="p-6 text-center">
                      <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {item.description}
                      </p>
                      <div className="flex justify-center">
                        {item.demo}
                      </div>
                    </Card>
                  ))}
                </StaggeredEntrance>
              </div>
            )}

            {currentDemo === 'buttons' && (
              <div className="space-y-8">
                <Card className="p-8">
                  <h2 className="text-2xl font-bold mb-6">Enhanced Button Variants</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['default', 'primary', 'secondary', 'neural', 'outline', 'ghost', 'destructive'].map((variant) => (
                      <Button
                        key={variant}
                        variant={variant as any}
                        hoverEffect="glow"
                        className="capitalize"
                      >
                        {variant}
                      </Button>
                    ))}
                  </div>
                </Card>

                <Card className="p-8">
                  <h2 className="text-2xl font-bold mb-6">Hover Effects</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {['glow', 'lift', 'tilt', 'neural', 'pulse', 'magnetic'].map((effect) => (
                      <Button
                        key={effect}
                        variant="primary"
                        hoverEffect={effect as any}
                        className="capitalize"
                      >
                        {effect}
                      </Button>
                    ))}
                  </div>
                </Card>

                <Card className="p-8">
                  <h2 className="text-2xl font-bold mb-6">Loading States</h2>
                  <div className="flex gap-4">
                    <Button
                      variant="primary"
                      loading={isLoading}
                      onClick={simulateLoading}
                      hoverEffect="glow"
                    >
                      {isLoading ? 'Processing...' : 'Start Loading'}
                    </Button>
                    <Button
                      variant="neural"
                      loading={isLoading}
                      hoverEffect="neural"
                    >
                      Neural Processing
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {currentDemo === 'particles' && (
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6">Particle System Variations</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Standard Particles</h3>
                    <ParticleSystem
                      width={400}
                      height={300}
                      particleCount={40}
                      colors={['#3b82f6', '#8b5cf6']}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">High Energy</h3>
                    <ParticleSystem
                      width={400}
                      height={300}
                      particleCount={60}
                      particleSpeed={1.2}
                      colors={['#06b6d4', '#10b981', '#f59e0b']}
                    />
                  </div>
                </div>
              </Card>
            )}

            {currentDemo === 'neural' && (
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6">Neural Network Visualizations</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Animated Network</h3>
                    <NeuralNetworkVisualization
                      width={400}
                      height={300}
                      layers={[3, 5, 4, 2]}
                      animated={true}
                      theme="dark"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Static Network</h3>
                    <NeuralNetworkVisualization
                      width={400}
                      height={300}
                      layers={[4, 6, 6, 3]}
                      animated={false}
                      theme="light"
                    />
                  </div>
                </div>
              </Card>
            )}

            {currentDemo === 'loading' && (
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6">Loading Animations</h2>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Spinner Variants</h3>
                    <div className="flex flex-wrap gap-8 items-center justify-center">
                      {['neural', 'pulse', 'dots', 'wave', 'brain'].map((variant) => (
                        <div key={variant} className="text-center">
                          <LoadingSpinner variant={variant as any} size="lg" />
                          <p className="mt-2 text-sm capitalize">{variant}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Skeleton Loaders</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {['text', 'card', 'avatar', 'neural'].map((variant) => (
                        <div key={variant}>
                          <h4 className="text-sm font-medium mb-2 capitalize">{variant}</h4>
                          <SkeletonLoader variant={variant as any} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {currentDemo === 'hover' && (
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6">Hover Effects Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {[
                    { effect: 'glow', color: '#3b82f6', label: 'Glow' },
                    { effect: 'lift', color: '#8b5cf6', label: 'Lift' },
                    { effect: 'tilt', color: '#06b6d4', label: 'Tilt' },
                    { effect: 'neural', color: '#10b981', label: 'Neural' },
                    { effect: 'pulse', color: '#f59e0b', label: 'Pulse' },
                    { effect: 'magnetic', color: '#ef4444', label: 'Magnetic' },
                  ].map((item) => (
                    <HoverEffect
                      key={item.effect}
                      effect={item.effect as any}
                      color={item.color}
                      intensity="strong"
                    >
                      <div
                        className="w-24 h-24 rounded-lg flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.label}
                      </div>
                    </HoverEffect>
                  ))}
                </div>
              </Card>
            )}



            {currentDemo === 'haptic' && (
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6">Haptic Feedback</h2>
                {isHapticSupported ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { type: 'neural', label: 'Neural Pattern', color: 'neural' },
                      { type: 'processing', label: 'Processing', color: 'primary' },
                      { type: 'thinking', label: 'AI Thinking', color: 'secondary' },
                    ].map((haptic) => (
                      <Button
                        key={haptic.type}
                        variant={haptic.color as any}
                        onClick={() => handleHapticTest(haptic.type)}
                        hoverEffect="pulse"
                      >
                        {haptic.label}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">
                      Haptic feedback not supported on this device.
                    </p>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default VisualEffectsDemoPage;