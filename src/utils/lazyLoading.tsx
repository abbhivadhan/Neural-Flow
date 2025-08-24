/**
 * Lazy Loading Utilities
 * Provides utilities for lazy loading components and resources
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react';

// Lazy loading with error boundary and loading states
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const module = await importFn();
      return module;
    } catch (error) {
      console.error('Failed to load component:', error);
      
      // Return fallback component or error component
      if (fallback) {
        return { default: fallback as T };
      }
      
      // Return error component
      const ErrorComponent: ComponentType = () => (
        <div className="p-4 text-center text-red-600">
          <h3 className="text-lg font-semibold mb-2">Failed to load component</h3>
          <p className="text-sm">Please refresh the page to try again.</p>
        </div>
      );
      
      return { default: ErrorComponent as T };
    }
  });
}

// Preload component for better UX
export function preloadComponent(importFn: () => Promise<any>): void {
  // Use requestIdleCallback if available, otherwise setTimeout
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      importFn().catch(error => {
        console.warn('Failed to preload component:', error);
      });
    });
  } else {
    setTimeout(() => {
      importFn().catch(error => {
        console.warn('Failed to preload component:', error);
      });
    }, 100);
  }
}

// Resource lazy loading
export class ResourceLoader {
  private loadedResources = new Set<string>();
  private loadingPromises = new Map<string, Promise<any>>();

  async loadScript(src: string): Promise<void> {
    if (this.loadedResources.has(src)) {
      return;
    }

    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src);
    }

    const promise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      
      script.onload = () => {
        this.loadedResources.add(src);
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error(`Failed to load script: ${src}`));
      };
      
      document.head.appendChild(script);
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  async loadCSS(href: string): Promise<void> {
    if (this.loadedResources.has(href)) {
      return;
    }

    if (this.loadingPromises.has(href)) {
      return this.loadingPromises.get(href);
    }

    const promise = new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      
      link.onload = () => {
        this.loadedResources.add(href);
        resolve();
      };
      
      link.onerror = () => {
        reject(new Error(`Failed to load CSS: ${href}`));
      };
      
      document.head.appendChild(link);
    });

    this.loadingPromises.set(href, promise);
    return promise;
  }

  async loadImage(src: string): Promise<HTMLImageElement> {
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src);
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.loadedResources.add(src);
        resolve(img);
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  isLoaded(resource: string): boolean {
    return this.loadedResources.has(resource);
  }

  preloadResources(resources: string[]): void {
    resources.forEach(resource => {
      if (resource.endsWith('.js')) {
        this.loadScript(resource).catch(console.warn);
      } else if (resource.endsWith('.css')) {
        this.loadCSS(resource).catch(console.warn);
      } else if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(resource)) {
        this.loadImage(resource).catch(console.warn);
      }
    });
  }
}

// Intersection Observer for lazy loading
export class LazyLoadObserver {
  private observer: IntersectionObserver;
  private callbacks = new Map<Element, () => void>();

  constructor(options: IntersectionObserverInit = {}) {
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        rootMargin: '50px',
        threshold: 0.1,
        ...options
      }
    );
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const callback = this.callbacks.get(entry.target);
        if (callback) {
          callback();
          this.unobserve(entry.target);
        }
      }
    });
  }

  observe(element: Element, callback: () => void): void {
    this.callbacks.set(element, callback);
    this.observer.observe(element);
  }

  unobserve(element: Element): void {
    this.callbacks.delete(element);
    this.observer.unobserve(element);
  }

  disconnect(): void {
    this.observer.disconnect();
    this.callbacks.clear();
  }
}

// Singleton instances
export const resourceLoader = new ResourceLoader();
export const lazyLoadObserver = new LazyLoadObserver();