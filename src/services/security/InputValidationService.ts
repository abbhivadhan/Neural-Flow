/**
 * Comprehensive input validation and sanitization service
 * Implements XSS prevention, injection attack protection, and secure input handling
 */

import DOMPurify from 'dompurify';

export interface ValidationRule {
  type: 'string' | 'number' | 'email' | 'url' | 'html' | 'json' | 'ai-prompt';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  allowedTags?: string[];
  sanitize?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  sanitizedValue?: any;
  errors: string[];
  warnings: string[];
}

export class InputValidationService {
  private static instance: InputValidationService;
  private readonly maxInputLength = 10000;
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedFileTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'text/plain', 'text/csv', 'application/json',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  public static getInstance(): InputValidationService {
    if (!InputValidationService.instance) {
      InputValidationService.instance = new InputValidationService();
    }
    return InputValidationService.instance;
  }

  /**
   * Validate and sanitize user input based on rules
   */
  public validateInput(input: any, rules: ValidationRule): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Check if required field is present
      if (rules.required && (input === null || input === undefined || input === '')) {
        result.isValid = false;
        result.errors.push('Field is required');
        return result;
      }

      // Skip validation for empty optional fields
      if (!rules.required && (input === null || input === undefined || input === '')) {
        result.sanitizedValue = input;
        return result;
      }

      // Type-specific validation and sanitization
      switch (rules.type) {
        case 'string':
          result.sanitizedValue = this.validateString(input, rules, result);
          break;
        case 'number':
          result.sanitizedValue = this.validateNumber(input, result);
          break;
        case 'email':
          result.sanitizedValue = this.validateEmail(input, result);
          break;
        case 'url':
          result.sanitizedValue = this.validateUrl(input, result);
          break;
        case 'html':
          result.sanitizedValue = this.validateHtml(input, rules, result);
          break;
        case 'json':
          result.sanitizedValue = this.validateJson(input, result);
          break;
        case 'ai-prompt':
          result.sanitizedValue = this.validateAiPrompt(input, rules, result);
          break;
        default:
          result.sanitizedValue = this.sanitizeGeneric(input);
      }

      if (result.errors.length > 0) {
        result.isValid = false;
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Validate string input with XSS protection
   */
  private validateString(input: any, rules: ValidationRule, result: ValidationResult): string {
    if (typeof input !== 'string') {
      result.errors.push('Input must be a string');
      return '';
    }

    let sanitized = input;

    // Length validation
    if (rules.minLength && sanitized.length < rules.minLength) {
      result.errors.push(`Minimum length is ${rules.minLength} characters`);
    }

    if (rules.maxLength && sanitized.length > rules.maxLength) {
      result.errors.push(`Maximum length is ${rules.maxLength} characters`);
      sanitized = sanitized.substring(0, rules.maxLength);
      result.warnings.push('Input was truncated to maximum length');
    }

    // Global length limit
    if (sanitized.length > this.maxInputLength) {
      sanitized = sanitized.substring(0, this.maxInputLength);
      result.warnings.push('Input was truncated to system maximum length');
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(sanitized)) {
      result.errors.push('Input does not match required pattern');
    }

    // XSS protection - remove potentially dangerous content
    if (rules.sanitize !== false) {
      sanitized = this.sanitizeXSS(sanitized);
    }

    return sanitized;
  }

  /**
   * Validate number input
   */
  private validateNumber(input: any, result: ValidationResult): number {
    const num = Number(input);
    if (isNaN(num) || !isFinite(num)) {
      result.errors.push('Input must be a valid number');
      return 0;
    }
    return num;
  }

  /**
   * Validate email input
   */
  private validateEmail(input: any, result: ValidationResult): string {
    if (typeof input !== 'string') {
      result.errors.push('Email must be a string');
      return '';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = this.sanitizeXSS(input.toLowerCase().trim());

    if (!emailRegex.test(sanitized)) {
      result.errors.push('Invalid email format');
    }

    return sanitized;
  }

  /**
   * Validate URL input
   */
  private validateUrl(input: any, result: ValidationResult): string {
    if (typeof input !== 'string') {
      result.errors.push('URL must be a string');
      return '';
    }

    try {
      const url = new URL(input);
      
      // Only allow HTTP and HTTPS protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        result.errors.push('Only HTTP and HTTPS URLs are allowed');
        return '';
      }

      return url.toString();
    } catch {
      result.errors.push('Invalid URL format');
      return '';
    }
  }

  /**
   * Validate and sanitize HTML input
   */
  private validateHtml(input: any, rules: ValidationRule, result: ValidationResult): string {
    if (typeof input !== 'string') {
      result.errors.push('HTML input must be a string');
      return '';
    }

    const allowedTags = rules.allowedTags || ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'];
    
    const sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: ['class', 'id'],
      FORBID_SCRIPT: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
      FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover']
    });

    return sanitized;
  }

  /**
   * Validate JSON input
   */
  private validateJson(input: any, result: ValidationResult): any {
    if (typeof input === 'object') {
      return input; // Already parsed
    }

    if (typeof input !== 'string') {
      result.errors.push('JSON input must be a string or object');
      return null;
    }

    try {
      return JSON.parse(input);
    } catch {
      result.errors.push('Invalid JSON format');
      return null;
    }
  }

  /**
   * Validate AI prompt input with additional security measures
   */
  private validateAiPrompt(input: any, rules: ValidationRule, result: ValidationResult): string {
    if (typeof input !== 'string') {
      result.errors.push('AI prompt must be a string');
      return '';
    }

    let sanitized = input;

    // Check for potential prompt injection patterns
    const dangerousPatterns = [
      /ignore\s+previous\s+instructions/i,
      /forget\s+everything/i,
      /system\s*:/i,
      /assistant\s*:/i,
      /<\s*script/i,
      /javascript\s*:/i,
      /data\s*:/i,
      /vbscript\s*:/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitized)) {
        result.warnings.push('Potentially unsafe content detected and removed');
        sanitized = sanitized.replace(pattern, '[FILTERED]');
      }
    }

    // Length limits for AI prompts
    const maxPromptLength = rules.maxLength || 2000;
    if (sanitized.length > maxPromptLength) {
      sanitized = sanitized.substring(0, maxPromptLength);
      result.warnings.push('Prompt was truncated to maximum length');
    }

    // Basic XSS protection
    sanitized = this.sanitizeXSS(sanitized);

    return sanitized;
  }

  /**
   * Generic sanitization for unknown input types
   */
  private sanitizeGeneric(input: any): any {
    if (typeof input === 'string') {
      return this.sanitizeXSS(input);
    }
    return input;
  }

  /**
   * XSS sanitization
   */
  private sanitizeXSS(input: string): string {
    return DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }

  /**
   * Validate file upload
   */
  public validateFile(file: File): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check file size
    if (file.size > this.maxFileSize) {
      result.isValid = false;
      result.errors.push(`File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check file type
    if (!this.allowedFileTypes.includes(file.type)) {
      result.isValid = false;
      result.errors.push(`File type ${file.type} is not allowed`);
    }

    // Check filename for dangerous patterns
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.js', '.vbs'];
    const filename = file.name.toLowerCase();
    
    for (const ext of dangerousExtensions) {
      if (filename.endsWith(ext)) {
        result.isValid = false;
        result.errors.push(`File extension ${ext} is not allowed`);
        break;
      }
    }

    return result;
  }

  /**
   * Validate batch input (array of inputs)
   */
  public validateBatch(inputs: any[], rules: ValidationRule): ValidationResult[] {
    if (!Array.isArray(inputs)) {
      return [{
        isValid: false,
        errors: ['Input must be an array'],
        warnings: []
      }];
    }

    if (inputs.length > 100) {
      return [{
        isValid: false,
        errors: ['Batch size exceeds maximum limit of 100 items'],
        warnings: []
      }];
    }

    return inputs.map(input => this.validateInput(input, rules));
  }
}

export default InputValidationService;