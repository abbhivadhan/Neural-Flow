/**
 * Content Security Policy (CSP) management service
 * Implements comprehensive CSP headers and security policies
 */

export interface CSPDirective {
  name: string;
  values: string[];
}

export interface CSPConfig {
  directives: CSPDirective[];
  reportOnly?: boolean;
  reportUri?: string;
}

export class ContentSecurityPolicyService {
  private static instance: ContentSecurityPolicyService;
  private currentPolicy: CSPConfig;

  public static getInstance(): ContentSecurityPolicyService {
    if (!ContentSecurityPolicyService.instance) {
      ContentSecurityPolicyService.instance = new ContentSecurityPolicyService();
    }
    return ContentSecurityPolicyService.instance;
  }

  constructor() {
    this.currentPolicy = this.getDefaultPolicy();
    this.applyPolicy();
  }

  /**
   * Get default secure CSP configuration
   */
  private getDefaultPolicy(): CSPConfig {
    return {
      directives: [
        {
          name: 'default-src',
          values: ["'self'"]
        },
        {
          name: 'script-src',
          values: [
            "'self'",
            "'unsafe-inline'", // Required for React development
            "'unsafe-eval'", // Required for TensorFlow.js and AI models
            'https://cdn.jsdelivr.net', // For external libraries
            'https://unpkg.com', // For external libraries
            'blob:' // For Web Workers and AI models
          ]
        },
        {
          name: 'style-src',
          values: [
            "'self'",
            "'unsafe-inline'", // Required for styled-components and Tailwind
            'https://fonts.googleapis.com'
          ]
        },
        {
          name: 'font-src',
          values: [
            "'self'",
            'https://fonts.gstatic.com',
            'data:' // For base64 encoded fonts
          ]
        },
        {
          name: 'img-src',
          values: [
            "'self'",
            'data:', // For base64 images
            'blob:', // For generated images
            'https:' // For external images (with HTTPS only)
          ]
        },
        {
          name: 'media-src',
          values: [
            "'self'",
            'blob:', // For recorded audio/video
            'data:' // For base64 media
          ]
        },
        {
          name: 'connect-src',
          values: [
            "'self'",
            'wss:', // For WebSocket connections
            'ws:', // For development WebSocket
            'https:', // For HTTPS API calls
            'blob:' // For Web Workers
          ]
        },
        {
          name: 'worker-src',
          values: [
            "'self'",
            'blob:' // For Web Workers
          ]
        },
        {
          name: 'child-src',
          values: [
            "'self'",
            'blob:' // For iframes with blob URLs
          ]
        },
        {
          name: 'frame-src',
          values: [
            "'self'",
            'blob:' // For iframe content
          ]
        },
        {
          name: 'object-src',
          values: ["'none'"] // Disable plugins
        },
        {
          name: 'base-uri',
          values: ["'self'"] // Prevent base tag injection
        },
        {
          name: 'form-action',
          values: ["'self'"] // Restrict form submissions
        },
        {
          name: 'frame-ancestors',
          values: ["'none'"] // Prevent clickjacking
        },
        {
          name: 'upgrade-insecure-requests',
          values: [] // Upgrade HTTP to HTTPS
        }
      ],
      reportOnly: false
    };
  }

  /**
   * Apply CSP policy to the document
   */
  public applyPolicy(): void {
    const policyString = this.buildPolicyString(this.currentPolicy);
    
    // Remove existing CSP meta tags
    const existingMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingMeta) {
      existingMeta.remove();
    }

    // Create new CSP meta tag
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = policyString;
    document.head.appendChild(meta);

    console.log('CSP Policy Applied:', policyString);
  }

  /**
   * Build CSP policy string from configuration
   */
  private buildPolicyString(config: CSPConfig): string {
    const directives = config.directives.map(directive => {
      if (directive.values.length === 0) {
        return directive.name;
      }
      return `${directive.name} ${directive.values.join(' ')}`;
    });

    return directives.join('; ');
  }

  /**
   * Add allowed source to a directive
   */
  public addAllowedSource(directiveName: string, source: string): void {
    const directive = this.currentPolicy.directives.find(d => d.name === directiveName);
    if (directive && !directive.values.includes(source)) {
      directive.values.push(source);
      this.applyPolicy();
    }
  }

  /**
   * Remove allowed source from a directive
   */
  public removeAllowedSource(directiveName: string, source: string): void {
    const directive = this.currentPolicy.directives.find(d => d.name === directiveName);
    if (directive) {
      directive.values = directive.values.filter(v => v !== source);
      this.applyPolicy();
    }
  }

  /**
   * Enable report-only mode for testing
   */
  public enableReportOnly(reportUri?: string): void {
    this.currentPolicy.reportOnly = true;
    if (reportUri) {
      this.currentPolicy.reportUri = reportUri;
      
      // Add report-uri directive
      const reportDirective = this.currentPolicy.directives.find(d => d.name === 'report-uri');
      if (reportDirective) {
        reportDirective.values = [reportUri];
      } else {
        this.currentPolicy.directives.push({
          name: 'report-uri',
          values: [reportUri]
        });
      }
    }
    this.applyPolicy();
  }

  /**
   * Disable report-only mode
   */
  public disableReportOnly(): void {
    this.currentPolicy.reportOnly = false;
    this.currentPolicy.directives = this.currentPolicy.directives.filter(d => d.name !== 'report-uri');
    this.applyPolicy();
  }

  /**
   * Get current policy configuration
   */
  public getCurrentPolicy(): CSPConfig {
    return { ...this.currentPolicy };
  }

  /**
   * Validate if a source would be allowed by current policy
   */
  public validateSource(directiveName: string, source: string): boolean {
    const directive = this.currentPolicy.directives.find(d => d.name === directiveName);
    if (!directive) {
      // Check default-src if specific directive not found
      const defaultDirective = this.currentPolicy.directives.find(d => d.name === 'default-src');
      return defaultDirective ? this.isSourceAllowed(defaultDirective.values, source) : false;
    }

    return this.isSourceAllowed(directive.values, source);
  }

  /**
   * Check if source is allowed by directive values
   */
  private isSourceAllowed(allowedValues: string[], source: string): boolean {
    // Check for exact matches
    if (allowedValues.includes(source)) {
      return true;
    }

    // Check for wildcard matches
    if (allowedValues.includes("'self'") && this.isSelfSource(source)) {
      return true;
    }

    if (allowedValues.includes('*')) {
      return true;
    }

    // Check for protocol matches
    for (const value of allowedValues) {
      if (value.endsWith(':') && source.startsWith(value)) {
        return true;
      }
    }

    // Check for domain matches
    for (const value of allowedValues) {
      if (value.startsWith('*.') && source.includes(value.substring(2))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if source is considered 'self'
   */
  private isSelfSource(source: string): boolean {
    try {
      const sourceUrl = new URL(source);
      const currentUrl = new URL(window.location.href);
      
      return sourceUrl.origin === currentUrl.origin;
    } catch {
      return false;
    }
  }

  /**
   * Handle CSP violation reports
   */
  public handleViolationReport(report: any): void {
    console.warn('CSP Violation Report:', report);
    
    // Log violation details
    const violation = {
      blockedUri: report['blocked-uri'],
      documentUri: report['document-uri'],
      violatedDirective: report['violated-directive'],
      originalPolicy: report['original-policy'],
      timestamp: new Date().toISOString()
    };

    // Store violation for analysis
    this.storeViolation(violation);
  }

  /**
   * Store CSP violation for analysis
   */
  private storeViolation(violation: any): void {
    const violations = JSON.parse(localStorage.getItem('csp-violations') || '[]');
    violations.push(violation);
    
    // Keep only last 100 violations
    if (violations.length > 100) {
      violations.splice(0, violations.length - 100);
    }
    
    localStorage.setItem('csp-violations', JSON.stringify(violations));
  }

  /**
   * Get stored CSP violations
   */
  public getViolations(): any[] {
    return JSON.parse(localStorage.getItem('csp-violations') || '[]');
  }

  /**
   * Clear stored violations
   */
  public clearViolations(): void {
    localStorage.removeItem('csp-violations');
  }
}

export default ContentSecurityPolicyService;