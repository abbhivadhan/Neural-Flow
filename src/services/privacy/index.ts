/**
 * Privacy Services Export
 * Centralized exports for all privacy-related services and utilities
 */

// Main privacy service
export { PrivacyService, privacyService } from './PrivacyService';

// Individual privacy components
export { LocalModelInference, localModelInference } from './LocalModelInference';
export { EncryptionService, encryptionService } from './EncryptionService';
export { PrivacyControlsService, privacyControlsService } from './PrivacyControlsService';
export { DataPortabilityService, dataPortabilityService } from './DataPortabilityService';

// Types and interfaces
export type {
  ModelConfig,
  InferenceResult,
  LocalInferenceOptions
} from './LocalModelInference';

export type {
  EncryptionKey,
  EncryptedData,
  KeyDerivationParams
} from './EncryptionService';

export type {
  PrivacyPreference,
  ConsentRecord,
  DataProcessingActivity,
  PrivacyCategory,
  DataType,
  ProcessingPurpose,
  LegalBasis,
  PrivacyDashboardData,
  DataExportRequest,
  DataDeletionRequest
} from './PrivacyControlsService';

export type {
  DataExportOptions,
  ExportedDataPackage,
  DataDeletionReport,
  DataInventory
} from './DataPortabilityService';