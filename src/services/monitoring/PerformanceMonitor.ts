/**
 * Performance Monitoring System
 * Tracks and analyzes application performance metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface NavigationMetrics {
  dns: number;
  tcp: number;
  request: number;
  response: number;
  dom: number;
  load: number;
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
}

interface ResourceMetrics {
  name: string;
  type: string;
  size: number;
  duration: number;
  startTime: number;
}

// Removed unused CustomMetrics interface

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private customTimers: Map<string, number> = new Map();
  private errorCount = 0;
  private totalRequests = 0;

  constructor() {
    this.initializeObservers();
    this.startMemoryMonitoring();
  }

  private initializeObservers(): void {
    // Navigation timing observer
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'navigation') {
              this.recordNavigationMetrics(entry as PerformanceNavigationTiming);
            }
          });
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navObserver);
      } catch (error) {
        console.warn('Navigation observer not supported:', error);
      }

      // Resource timing observer
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'resource') {
              this.recordResourceMetrics(entry as PerformanceResourceTiming);
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
      } catch (error) {
        console.warn('Resource observer not supported:', error);
      }

      // Paint timing observer
      try {
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.recordMetric({
              name: entry.name,
              value: entry.startTime,
              timestamp: Date.now(),
              tags: { type: 'paint' }
            });
          });
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('paint', paintObserver);
      } catch (error) {
        console.warn('Paint observer not supported:', error);
      }

      // Layout shift observer
      try {
        const layoutObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              this.recordMetric({
                name: 'cumulative-layout-shift',
                value: (entry as any).value,
                timestamp: Date.now(),
                tags: { type: 'layout' }
              });
            }
          });
        });
        layoutObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('layout-shift', layoutObserver);
      } catch (error) {
        console.warn('Layout shift observer not supported:', error);
      }

      // Largest Contentful Paint observer
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            this.recordMetric({
              name: 'largest-contentful-paint',
              value: lastEntry.startTime,
              timestamp: Date.now(),
              tags: { type: 'paint' }
            });
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }

      // First Input Delay observer
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.recordMetric({
              name: 'first-input-delay',
              value: (entry as any).processingStart - entry.startTime,
              timestamp: Date.now(),
              tags: { type: 'interaction' }
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (error) {
        console.warn('FID observer not supported:', error);
      }
    }
  }

  private recordNavigationMetrics(entry: PerformanceNavigationTiming): void {
    const metrics: NavigationMetrics = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      request: entry.responseStart - entry.requestStart,
      response: entry.responseEnd - entry.responseStart,
      dom: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      load: entry.loadEventEnd - entry.loadEventStart,
      fcp: 0, // Will be set by paint observer
      lcp: 0, // Will be set by LCP observer
      fid: 0, // Will be set by FID observer
      cls: 0  // Will be set by layout shift observer
    };

    Object.entries(metrics).forEach(([name, value]) => {
      if (value > 0) {
        this.recordMetric({
          name: `navigation-${name}`,
          value,
          timestamp: Date.now(),
          tags: { type: 'navigation' }
        });
      }
    });
  }

  private recordResourceMetrics(entry: PerformanceResourceTiming): void {
    const resourceMetric: ResourceMetrics = {
      name: entry.name,
      type: this.getResourceType(entry.name),
      size: entry.transferSize || 0,
      duration: entry.responseEnd - entry.startTime,
      startTime: entry.startTime
    };

    this.recordMetric({
      name: 'resource-load-time',
      value: resourceMetric.duration,
      timestamp: Date.now(),
      tags: {
        type: 'resource',
        resourceType: resourceMetric.type,
        resourceName: resourceMetric.name
      }
    });

    if (resourceMetric.size > 0) {
      this.recordMetric({
        name: 'resource-size',
        value: resourceMetric.size,
        timestamp: Date.now(),
        tags: {
          type: 'resource',
          resourceType: resourceMetric.type
        }
      });
    }
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    return 'other';
  }

  private startMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordMetric({
          name: 'memory-used',
          value: memory.usedJSHeapSize,
          timestamp: Date.now(),
          tags: { type: 'memory' }
        });

        this.recordMetric({
          name: 'memory-total',
          value: memory.totalJSHeapSize,
          timestamp: Date.now(),
          tags: { type: 'memory' }
        });

        this.recordMetric({
          name: 'memory-limit',
          value: memory.jsHeapSizeLimit,
          timestamp: Date.now(),
          tags: { type: 'memory' }
        });
      }, 30000); // Every 30 seconds
    }
  }

  // Public API methods
  public recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  public startTimer(name: string): void {
    this.customTimers.set(name, performance.now());
  }

  public endTimer(name: string, tags?: Record<string, string>): number {
    const startTime = this.customTimers.get(name);
    if (!startTime) {
      console.warn(`Timer ${name} was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.customTimers.delete(name);

    this.recordMetric({
      name,
      value: duration,
      timestamp: Date.now(),
      tags: { type: 'custom', ...tags }
    });

    return duration;
  }

  public recordAIInference(modelName: string, duration: number): void {
    this.recordMetric({
      name: 'ai-inference-time',
      value: duration,
      timestamp: Date.now(),
      tags: { type: 'ai', model: modelName }
    });
  }

  public recordComponentRender(componentName: string, duration: number): void {
    this.recordMetric({
      name: 'component-render-time',
      value: duration,
      timestamp: Date.now(),
      tags: { type: 'render', component: componentName }
    });
  }

  public recordError(error: Error, context?: string): void {
    this.errorCount++;
    this.totalRequests++;

    this.recordMetric({
      name: 'error-rate',
      value: (this.errorCount / this.totalRequests) * 100,
      timestamp: Date.now(),
      tags: { 
        type: 'error', 
        context: context || 'unknown',
        errorType: error.name
      }
    });
  }

  public recordRequest(success: boolean): void {
    this.totalRequests++;
    if (!success) {
      this.errorCount++;
    }

    this.recordMetric({
      name: 'success-rate',
      value: ((this.totalRequests - this.errorCount) / this.totalRequests) * 100,
      timestamp: Date.now(),
      tags: { type: 'request' }
    });
  }

  public getMetrics(timeRange?: { start: number; end: number }): PerformanceMetric[] {
    if (!timeRange) {
      return [...this.metrics];
    }

    return this.metrics.filter(metric => 
      metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
    );
  }

  public getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  public getAverageMetric(name: string, timeRange?: { start: number; end: number }): number {
    const metrics = timeRange 
      ? this.getMetrics(timeRange).filter(m => m.name === name)
      : this.getMetricsByName(name);

    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }

  public getPerformanceScore(): number {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const recentMetrics = this.getMetrics({ start: oneHourAgo, end: now });
    
    // Calculate score based on various metrics
    const lcpScore = this.calculateLCPScore(recentMetrics);
    const fidScore = this.calculateFIDScore(recentMetrics);
    const clsScore = this.calculateCLSScore(recentMetrics);
    const errorScore = this.calculateErrorScore(recentMetrics);
    
    return Math.round((lcpScore + fidScore + clsScore + errorScore) / 4);
  }

  private calculateLCPScore(metrics: PerformanceMetric[]): number {
    const lcpMetrics = metrics.filter(m => m.name === 'largest-contentful-paint');
    if (lcpMetrics.length === 0) return 100;
    
    const avgLCP = lcpMetrics.reduce((sum, m) => sum + m.value, 0) / lcpMetrics.length;
    
    if (avgLCP <= 2500) return 100;
    if (avgLCP <= 4000) return 75;
    return 50;
  }

  private calculateFIDScore(metrics: PerformanceMetric[]): number {
    const fidMetrics = metrics.filter(m => m.name === 'first-input-delay');
    if (fidMetrics.length === 0) return 100;
    
    const avgFID = fidMetrics.reduce((sum, m) => sum + m.value, 0) / fidMetrics.length;
    
    if (avgFID <= 100) return 100;
    if (avgFID <= 300) return 75;
    return 50;
  }

  private calculateCLSScore(metrics: PerformanceMetric[]): number {
    const clsMetrics = metrics.filter(m => m.name === 'cumulative-layout-shift');
    if (clsMetrics.length === 0) return 100;
    
    const avgCLS = clsMetrics.reduce((sum, m) => sum + m.value, 0) / clsMetrics.length;
    
    if (avgCLS <= 0.1) return 100;
    if (avgCLS <= 0.25) return 75;
    return 50;
  }

  private calculateErrorScore(metrics: PerformanceMetric[]): number {
    const errorMetrics = metrics.filter(m => m.name === 'error-rate');
    if (errorMetrics.length === 0) return 100;
    
    const latestErrorRate = errorMetrics[errorMetrics.length - 1]?.value || 0;
    
    if (latestErrorRate <= 1) return 100;
    if (latestErrorRate <= 5) return 75;
    return 50;
  }

  public exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      summary: {
        totalMetrics: this.metrics.length,
        performanceScore: this.getPerformanceScore(),
        errorRate: (this.errorCount / this.totalRequests) * 100,
        exportTime: Date.now()
      }
    }, null, 2);
  }

  public clearMetrics(): void {
    this.metrics = [];
    this.errorCount = 0;
    this.totalRequests = 0;
  }

  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.customTimers.clear();
    this.clearMetrics();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();