import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { TutorialButton } from '../components/tutorial/TutorialButton';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Logo, AnimatedLogo } from '../components/ui/Logo';

import { ParticleSystem } from '../components/effects/ParticleSystem';

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showCodeEditorModal, setShowCodeEditorModal] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleEnterNeuralFlow = () => {
    navigate('/workspace');
  };

  const handleCodeEditorClick = () => {
    setShowCodeEditorModal(true);
  };

  const features = [
    {
      title: "AI-Powered Intelligence",
      description: "Advanced machine learning algorithms that understand your work patterns and adapt to your needs",
      icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
      gradient: "from-blue-500 to-indigo-500",
      link: "/analytics"
    },
    {
      title: "3D Workspace",
      description: "Immersive three-dimensional environment for visualizing and managing complex projects",
      icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z",
      gradient: "from-purple-500 to-pink-500",
      link: "/workspace-3d"
    },
    {
      title: "Real-Time Collaboration",
      description: "Seamless team collaboration with live editing, communication analysis, and expertise matching",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      gradient: "from-green-500 to-emerald-500",
      link: "/collaboration"
    },
    {
      title: "Intelligent Search",
      description: "Semantic search with document indexing and AI-powered content discovery",
      icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
      gradient: "from-amber-500 to-orange-500",
      link: "/search"
    },
    {
      title: "Advanced Visualization",
      description: "Data storytelling with interactive charts, reports, and predictive analytics",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      gradient: "from-slate-500 to-gray-500",
      link: "/visualization"
    },
    {
      title: "Privacy-First Security",
      description: "Local AI processing, end-to-end encryption, and comprehensive privacy controls",
      icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
      gradient: "from-red-500 to-pink-500",
      link: "/privacy"
    },
    {
      title: "Multi-Modal Interface",
      description: "Voice, gesture, and touch interactions with adaptive UI that learns your preferences",
      icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z",
      gradient: "from-violet-500 to-purple-500",
      link: "/interaction-demo"
    },
    {
      title: "Performance Monitoring",
      description: "Real-time system monitoring, error tracking, and performance optimization",
      icon: "M13 10V3L4 14h7v7l9-11h-7z",
      gradient: "from-cyan-500 to-blue-500",
      link: "/performance"
    }
  ];

  const demoLinks = [
    { title: "3D Workspace", path: "/workspace-3d", gradient: "from-purple-500 to-pink-500", featured: true },
    { title: "Content AI Demo", path: "/content-demo", gradient: "from-blue-500 to-cyan-500", featured: false },
    { title: "Multi-Modal Interface", path: "/interaction-demo", gradient: "from-violet-500 to-purple-500", featured: false },
    { title: "Real-Time Collaboration", path: "/collaboration", gradient: "from-green-500 to-emerald-500", featured: false },
    { title: "Intelligent Search", path: "/search", gradient: "from-amber-500 to-orange-500", featured: false },
    { title: "Advanced Visualization", path: "/visualization", gradient: "from-slate-500 to-gray-500", featured: false },
    { title: "Live Demo Dashboard", path: "/simple-live-demo", gradient: "from-red-500 to-orange-500", featured: true },
    { title: "Enhanced Dashboard", path: "/enhanced-dashboard", gradient: "from-indigo-500 to-purple-500", featured: true },
    { title: "Tutorial System Demo", path: "/tutorial-demo", gradient: "from-indigo-500 to-purple-500", featured: false },
    { title: "Visual Effects Demo", path: "/visual-effects", gradient: "from-pink-500 to-rose-500", featured: true }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <ParticleSystem 
          width={window.innerWidth} 
          height={window.innerHeight}
          particleCount={60}
          colors={['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']}
          className="absolute inset-0"
        />
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Mouse-following gradient */}
        <div 
          className="absolute w-96 h-96 bg-gradient-radial from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-2xl pointer-events-none transition-all duration-1000 ease-out"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 md:p-6 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Logo size="md" variant="full" />
          <div className="flex items-center space-x-2 md:space-x-4" data-tutorial="main-nav">
            <TutorialButton />
            <button
              onClick={toggleTheme}
              className="group relative px-4 py-2 bg-white/10 dark:bg-black/10 backdrop-blur-md rounded-xl border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300"
            >
              <div className="flex items-center space-x-2">
                {theme === 'light' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
                <span className="text-sm font-medium">{theme === 'light' ? 'Dark' : 'Light'}</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 px-4 md:px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Content */}
          <div ref={heroRef} className="text-center mb-16">
            <div className="mb-8">
              <AnimatedLogo size="xl" className="mb-8" />
              <p className="text-lg md:text-xl lg:text-2xl text-slate-600 dark:text-slate-300 mb-8 max-w-4xl mx-auto leading-relaxed">
                Revolutionary AI-powered productivity workspace that learns from your behavior 
                and autonomously optimizes your workflow through intelligent automation
              </p>
            </div>

            {/* Primary Actions */}
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center mb-12">
              <button
                onClick={() => navigate('/workspace?tutorial=true')}
                className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white font-semibold text-lg rounded-2xl shadow-2xl hover:shadow-blue-500/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden border border-white/10"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
                
                <div className="relative flex items-center justify-center space-x-3">
                  <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-4 h-4 transform group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="font-bold tracking-wide">Quick Start</span>
                </div>
              </button>

              <button
                onClick={handleEnterNeuralFlow}
                className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-semibold text-lg rounded-2xl shadow-2xl hover:shadow-emerald-500/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden border border-white/10"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
                
                <div className="relative flex items-center justify-center space-x-3">
                  <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <span className="font-bold tracking-wide">Enter Neural Flow</span>
                </div>
              </button>
            </div>
          </div>



          {/* Features Grid */}
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Link
                  key={feature.title}
                  to={feature.link}
                  className="group relative p-6 bg-white/60 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-black/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Hover effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
                </Link>
              ))}
            </div>
          </div>

          {/* Demo Links */}
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Interactive Demos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto">
              {demoLinks.map((demo, index) => (
                <Link
                  key={demo.title}
                  to={demo.path}
                  className={`group relative px-4 md:px-6 py-3 bg-gradient-to-r ${demo.gradient} text-white font-semibold text-sm md:text-base rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 overflow-hidden ${demo.featured ? 'neural-glow' : ''}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <div className="relative flex items-center justify-center space-x-2">
                    <span>{demo.title}</span>
                    {demo.featured && (
                      <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
            
            {/* AI Code Editor Button */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleCodeEditorClick}
                className="group relative px-6 py-4 pr-16 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <div className="relative flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span>AI Code Editor</span>
                </div>
                <div className="absolute top-1 right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-semibold">
                  Soon
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-4 md:p-6 text-center text-slate-500 dark:text-slate-400 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <p>&copy; 2025 Neural Flow. Built with cutting-edge AI technology.</p>
        </div>
      </footer>

      {/* Code Editor Modal */}
      <Modal
        isOpen={showCodeEditorModal}
        onClose={() => setShowCodeEditorModal(false)}
        title="AI Code Editor"
        size="md"
      >
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Coming Soon!
          </h3>
          
          <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            Our revolutionary AI-powered code editor is currently in development. It will feature:
          </p>
          
          <div className="text-left space-y-3 mb-8">
            {[
              "Intelligent code completion and suggestions",
              "Real-time error detection and fixes", 
              "Automated refactoring and optimization",
              "Multi-language support with AI assistance",
              "Collaborative coding with team insights"
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-slate-700 dark:text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
          
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
              Expected Release: Q1 2026
            </p>
          </div>
          
          <Button
            onClick={() => setShowCodeEditorModal(false)}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            Got it, thanks!
          </Button>
        </div>
      </Modal>
    </div>
  );
}