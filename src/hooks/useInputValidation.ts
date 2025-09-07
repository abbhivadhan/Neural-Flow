/**
 * React hook for input validation and sanitization
 * Provides easy integration with forms and user inputs
 */

import { useState, useCallback, useMemo } from 'react';
import { InputValidationService, ValidationRule, ValidationResult } from '../services/security/InputValidationService';

export interface UseInputValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

export interface ValidationState {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isValidating: boolean;
  hasBeenValidated: boolean;
}

export interface UseInputValidationReturn {
  value: any;
  validationState: ValidationState;
  setValue: (value: any) => void;
  validate: () => Promise<ValidationResult>;
  reset: () => void;
  sanitizedValue: any;
}

export function useInputValidation(
  initialValue: any = '',
  rules: ValidationRule,
  options: UseInputValidationOptions = {}
): UseInputValidationReturn {
  const {
    validateOnChange = false,
    validateOnBlur = true,
    debounceMs = 300
  } = options;

  const [value, setValue] = useState(initialValue);
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: true,
    errors: [],
    warnings: [],
    isValidating: false,
    hasBeenValidated: false
  });
  const [sanitizedValue, setSanitizedValue] = useState(initialValue);

  const validationService = useMemo(() => InputValidationService.getInstance(), []);

  const validate = useCallback(async (): Promise<ValidationResult> => {
    setValidationState(prev => ({ ...prev, isValidating: true }));

    try {
      const result = validationService.validateInput(value, rules);
      
      setValidationState({
        isValid: result.isValid,
        errors: result.errors,
        warnings: result.warnings,
        isValidating: false,
        hasBeenValidated: true
      });

      if (result.sanitizedValue !== undefined) {
        setSanitizedValue(result.sanitizedValue);
      }

      return result;
    } catch (error) {
      const errorResult: ValidationResult = {
        isValid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };

      setValidationState({
        isValid: false,
        errors: errorResult.errors,
        warnings: [],
        isValidating: false,
        hasBeenValidated: true
      });

      return errorResult;
    }
  }, [value, rules, validationService]);

  const debouncedValidate = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(validate, debounceMs);
    };
  }, [validate, debounceMs]);

  const handleSetValue = useCallback((newValue: any) => {
    setValue(newValue);
    
    if (validateOnChange) {
      debouncedValidate();
    } else if (validationState.hasBeenValidated) {
      // Clear previous validation state when value changes
      setValidationState(prev => ({
        ...prev,
        isValid: true,
        errors: [],
        warnings: []
      }));
    }
  }, [validateOnChange, debouncedValidate, validationState.hasBeenValidated]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setSanitizedValue(initialValue);
    setValidationState({
      isValid: true,
      errors: [],
      warnings: [],
      isValidating: false,
      hasBeenValidated: false
    });
  }, [initialValue]);

  return {
    value,
    validationState,
    setValue: handleSetValue,
    validate,
    reset,
    sanitizedValue
  };
}

/**
 * Hook for validating multiple form fields
 */
export interface FormField {
  name: string;
  value: any;
  rules: ValidationRule;
  options?: UseInputValidationOptions;
}

export interface UseFormValidationReturn {
  fields: Record<string, UseInputValidationReturn>;
  isFormValid: boolean;
  validateAll: () => Promise<boolean>;
  resetAll: () => void;
  getFormData: () => Record<string, any>;
  getSanitizedFormData: () => Record<string, any>;
}

export function useFormValidation(formFields: FormField[]): UseFormValidationReturn {
  const fields = useMemo(() => {
    const fieldMap: Record<string, UseInputValidationReturn> = {};
    
    formFields.forEach(field => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      fieldMap[field.name] = useInputValidation(field.value, field.rules, field.options);
    });
    
    return fieldMap;
  }, [formFields]);

  const isFormValid = useMemo(() => {
    return Object.values(fields).every(field => 
      field.validationState.isValid && field.validationState.hasBeenValidated
    );
  }, [fields]);

  const validateAll = useCallback(async (): Promise<boolean> => {
    const validationPromises = Object.values(fields).map(field => field.validate());
    const results = await Promise.all(validationPromises);
    
    return results.every(result => result.isValid);
  }, [fields]);

  const resetAll = useCallback(() => {
    Object.values(fields).forEach(field => field.reset());
  }, [fields]);

  const getFormData = useCallback(() => {
    const data: Record<string, any> = {};
    Object.entries(fields).forEach(([name, field]) => {
      data[name] = field.value;
    });
    return data;
  }, [fields]);

  const getSanitizedFormData = useCallback(() => {
    const data: Record<string, any> = {};
    Object.entries(fields).forEach(([name, field]) => {
      data[name] = field.sanitizedValue;
    });
    return data;
  }, [fields]);

  return {
    fields,
    isFormValid,
    validateAll,
    resetAll,
    getFormData,
    getSanitizedFormData
  };
}

/**
 * Hook for file upload validation
 */
export interface UseFileValidationReturn {
  files: File[];
  validationResults: any[];
  isValidating: boolean;
  addFiles: (newFiles: FileList | File[]) => Promise<void>;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  isAllValid: boolean;
}

export function useFileValidation(config?: any): UseFileValidationReturn {
  const [files, setFiles] = useState<File[]>([]);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const fileService = useMemo(() => {
    const { SecureFileUploadService } = require('../services/security/SecureFileUpload');
    return SecureFileUploadService.getInstance();
  }, []);

  const addFiles = useCallback(async (newFiles: FileList | File[]) => {
    setIsValidating(true);
    
    try {
      const fileArray = Array.from(newFiles);
      const results = await fileService.validateFiles(fileArray, config);
      
      const validFiles = fileArray.filter((_, index) => results[index].isValid);
      
      setFiles(prev => [...prev, ...validFiles]);
      setValidationResults(prev => [...prev, ...results]);
    } catch (error) {
      console.error('File validation error:', error);
    } finally {
      setIsValidating(false);
    }
  }, [fileService, config]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setValidationResults(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setValidationResults([]);
  }, []);

  const isAllValid = useMemo(() => {
    return validationResults.length > 0 && validationResults.every(result => result.isValid);
  }, [validationResults]);

  return {
    files,
    validationResults,
    isValidating,
    addFiles,
    removeFile,
    clearFiles,
    isAllValid
  };
}