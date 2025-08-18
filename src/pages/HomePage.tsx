import { Link } from 'react-router-dom';
import { useTheme } from '../providers/ThemeProvider';

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg"></div>
            <span className="text-xl font-bold text-gradient">Neural Flow</span>
          </div>
          <button
            onClick={toggleTheme}
            className="neural-button-secondary"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mx-auto mb-6 animate-pulse"></div>
            <h1 className="text-5xl md:text-7xl font-bold text-gradient mb-6">
              Neural Flow
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-8 max-w-3xl mx-auto">
              Revolutionary AI-powered productivity workspace that learns from your behavior 
              and autonomously optimizes your workflow through intelligent automation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/workspace"
              className="neural-button-primary text-lg px-8 py-3 neural-glow"
            >
              Enter Neural Flow
            </Link>
            <Link
              to="/content-demo"
              className="neural-button-secondary text-lg px-8 py-3"
            >
              Content AI Demo
            </Link>
            <Link
              to="/interaction-demo"
              className="neural-button-secondary text-lg px-8 py-3"
            >
              Multi-Modal Interface
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="neural-card p-6">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Intelligence</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Advanced machine learning algorithms that understand your work patterns
              </p>
            </div>
            <div className="neural-card p-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Predictive Automation</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Anticipates your needs and prepares resources before you need them
              </p>
            </div>
            <div className="neural-card p-6">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Privacy-First</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Local AI processing ensures your data stays private and secure
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-slate-500 dark:text-slate-400">
        <p>&copy; 2024 Neural Flow. Built with cutting-edge AI technology.</p>
      </footer>
    </div>
  );
}