

export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neural-gradient">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-secondary-600 rounded-full animate-spin animate-reverse mx-auto"></div>
        </div>
        <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">
          Neural Flow is initializing...
        </p>
      </div>
    </div>
  );
}