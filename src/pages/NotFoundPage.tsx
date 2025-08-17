import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neural-gradient">
      <div className="neural-card p-8 max-w-md mx-4 text-center">
        <div className="text-6xl mb-4">🤖</div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          404 - Neural Path Not Found
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          The neural network couldn't locate this path. Let's get you back on track.
        </p>
        <Link to="/" className="neural-button-primary">
          Return to Neural Flow
        </Link>
      </div>
    </div>
  );
}