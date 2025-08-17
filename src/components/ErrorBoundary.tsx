import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Neural Flow Error Boundary caught an error:', error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neural-gradient">
          <div className="neural-card p-8 max-w-md mx-4 text-center">
            <div className="text-6xl mb-4">🧠</div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Neural Flow Encountered an Error
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Something went wrong in the neural network. Don't worry, we're learning from this.
            </p>
            <button
              className="neural-button-primary"
              onClick={() => window.location.reload()}
            >
              Restart Neural Flow
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}