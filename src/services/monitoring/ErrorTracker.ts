/**
 * Error Tracking and Logging System
 * Comprehensive error handling, tracking, and reporting
 */

interface ErrorInfo {
  id: string;
  message: string;
  stack?: string;
  timestamp: number;
  level: 'error' | 'warning' | 'info' | 'debug';
  context?: Record<string, any>;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId: string;
  component?: string;
  action?: string;
  tags?: string[];
}

interface ErrorStats {
  totalErrors: number;
  errorsByLevel: Record<string, number>;
  errorsByType: Record<string, number>;
  errorsByComponent: Record<string, number>;
  recentErrors: ErrorInfo[];
  errorRate: number;
}

export class ErrorTracker {
  private errors: ErrorInfo[] = [];
  private sessionId: string;
  private maxErrors = 1000;
  private errorListeners: ((error: ErrorInfo) => void)[] = [];
  private isInitialized = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  private initialize(): void {
    if (this.isInitialized) return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        type: 'javascript',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        {
          type: 'promise',
          reason: event.reason
        }
      );
    });

    // React error boundary integration
    this.setupReactErrorBoundary();

    this.isInitialized = true;
  }

  private setupReactErrorBoundary(): void {
    // This will be used by React Error Boundaries
    (window as any).__errorTracker = this;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public captureError(
    error: Error | string,
    context?: Record<string, any>,
    level: ErrorInfo['level'] = 'error'
  ): string {
    const errorInfo: ErrorInfo = {
      id: this.generateErrorId(),
      message: typeof error === 'string' ? error : error.message,
      stack: (typeof error === 'object' && error.stack ? error.stack : undefined) as string,
      timestamp: Date.now(),
      level,
      context: context || undefined,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
      component: context?.['component'],
      action: context?.['action'],
      tags: context?.['tags']
    };

    this.errors.push(errorInfo);

    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Notify listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(errorInfo);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });

    // Log to console in development
    if (process.env['NODE_ENV'] === 'development') {
      console.group(`🚨 ${level.toUpperCase()}: ${errorInfo.message}`);
      console.error('Error:', error);
      console.log('Context:', context);
      console.log('Stack:', errorInfo.stack);
      console.groupEnd();
    }

    return errorInfo.id;
  }

  public captureException(error: Error, context?: Record<string, any>): string {
    return this.captureError(error, context, 'error');
  }

  public captureWarning(message: string, context?: Record<string, any>): string {
    return this.captureError(message, context, 'warning');
  }

  public captureInfo(message: string, context?: Record<string, any>): string {
    return this.captureError(message, context, 'info');
  }

  public captureDebug(message: string, context?: Record<string, any>): string {
    return this.captureError(message, context, 'debug');
  }

  // Specialized error capture methods
  public captureAIError(
    error: Error,
    modelName: string,
    operation: string,
    inputData?: any
  ): string {
    return this.captureError(error, {
      component: 'AI',
      modelName,
      operation,
      inputData: inputData ? JSON.stringify(inputData).slice(0, 1000) : undefined,
      tags: ['ai', 'ml', modelName]
    });
  }

  public captureNetworkError(
    error: Error,
    url: string,
    method: string,
    statusCode?: number
  ): string {
    return this.captureError(error, {
      component: 'Network',
      url,
      method,
      statusCode,
      tags: ['network', 'api']
    });
  }

  public captureComponentError(
    error: Error,
    componentName: string,
    props?: any,
    state?: any
  ): string {
    return this.captureError(error, {
      component: componentName,
      props: props ? JSON.stringify(props).slice(0, 500) : undefined,
      state: state ? JSON.stringify(state).slice(0, 500) : undefined,
      tags: ['react', 'component']
    });
  }

  public capturePerformanceError(
    message: string,
    metric: string,
    value: number,
    threshold: number
  ): string {
    return this.captureError(message, {
      component: 'Performance',
      metric,
      value,
      threshold,
      tags: ['performance', 'monitoring']
    }, 'warning');
  }

  // Error retrieval and analysis
  public getErrors(filter?: {
    level?: ErrorInfo['level'];
    component?: string;
    timeRange?: { start: number; end: number };
    tags?: string[];
  }): ErrorInfo[] {
    let filteredErrors = [...this.errors];

    if (filter) {
      if (filter.level) {
        filteredErrors = filteredErrors.filter(error => error.level === filter.level);
      }

      if (filter.component) {
        filteredErrors = filteredErrors.filter(error => error.component === filter.component);
      }

      if (filter.timeRange) {
        filteredErrors = filteredErrors.filter(error => 
          error.timestamp >= filter.timeRange!.start && 
          error.timestamp <= filter.timeRange!.end
        );
      }

      if (filter.tags && filter.tags.length > 0) {
        filteredErrors = filteredErrors.filter(error => 
          error.tags && filter.tags!.some(tag => error.tags!.includes(tag))
        );
      }
    }

    return filteredErrors.sort((a, b) => b.timestamp - a.timestamp);
  }

  public getErrorStats(timeRange?: { start: number; end: number }): ErrorStats {
    const errors = timeRange ? this.getErrors({ timeRange }) : this.errors;
    
    const stats: ErrorStats = {
      totalErrors: errors.length,
      errorsByLevel: {},
      errorsByType: {},
      errorsByComponent: {},
      recentErrors: errors.slice(0, 10),
      errorRate: 0
    };

    errors.forEach(error => {
      // Count by level
      stats.errorsByLevel[error.level] = (stats.errorsByLevel[error.level] || 0) + 1;

      // Count by type (extracted from error message)
      const errorType = this.extractErrorType(error.message);
      stats.errorsByType[errorType] = (stats.errorsByType[errorType] || 0) + 1;

      // Count by component
      if (error.component) {
        stats.errorsByComponent[error.component] = (stats.errorsByComponent[error.component] || 0) + 1;
      }
    });

    // Calculate error rate (errors per hour)
    if (timeRange) {
      const hours = (timeRange.end - timeRange.start) / (1000 * 60 * 60);
      stats.errorRate = hours > 0 ? errors.length / hours : 0;
    } else {
      // Default to last 24 hours
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      const recentErrors = errors.filter(error => error.timestamp >= oneDayAgo);
      stats.errorRate = recentErrors.length / 24;
    }

    return stats;
  }

  private extractErrorType(message: string): string {
    // Extract error type from message
    const typeMatch = message.match(/^(\w+Error):/);
    if (typeMatch && typeMatch[1]) {
      return typeMatch[1];
    }

    // Common error patterns
    if (message.includes('Network')) return 'NetworkError';
    if (message.includes('Permission')) return 'PermissionError';
    if (message.includes('Timeout')) return 'TimeoutError';
    if (message.includes('Not found')) return 'NotFoundError';
    if (message.includes('Unauthorized')) return 'AuthError';

    return 'UnknownError';
  }

  // Error reporting and export
  public exportErrors(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportErrorsAsCSV();
    }

    return JSON.stringify({
      sessionId: this.sessionId,
      exportTime: Date.now(),
      stats: this.getErrorStats(),
      errors: this.errors
    }, null, 2);
  }

  private exportErrorsAsCSV(): string {
    const headers = [
      'ID', 'Timestamp', 'Level', 'Message', 'Component', 
      'URL', 'UserAgent', 'Tags'
    ];

    const rows = this.errors.map(error => [
      error.id,
      new Date(error.timestamp).toISOString(),
      error.level,
      `"${error.message.replace(/"/g, '""')}"`,
      error.component || '',
      error.url || '',
      error.userAgent || '',
      error.tags ? error.tags.join(';') : ''
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  // Event listeners
  public onError(listener: (error: ErrorInfo) => void): () => void {
    this.errorListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  // Utility methods
  public clearErrors(): void {
    this.errors = [];
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public setUserId(userId: string): void {
    // Update all existing errors with user ID
    this.errors.forEach(error => {
      if (!error.userId) {
        (error as any).userId = userId;
      }
    });
  }

  // Health check
  public isHealthy(): boolean {
    const recentErrors = this.getErrors({
      timeRange: {
        start: Date.now() - (5 * 60 * 1000), // Last 5 minutes
        end: Date.now()
      },
      level: 'error'
    });

    // Consider unhealthy if more than 10 errors in 5 minutes
    return recentErrors.length <= 10;
  }

  public getHealthStatus(): {
    healthy: boolean;
    errorRate: number;
    recentErrorCount: number;
    criticalErrors: ErrorInfo[];
  } {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const recentErrors = this.getErrors({
      timeRange: { start: fiveMinutesAgo, end: Date.now() }
    });

    const criticalErrors = recentErrors.filter(error => 
      error.level === 'error' && 
      (error.tags?.includes('critical') || error.component === 'AI')
    );

    return {
      healthy: this.isHealthy(),
      errorRate: recentErrors.length / 5, // Errors per minute
      recentErrorCount: recentErrors.length,
      criticalErrors
    };
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();