export interface IntegrationProvider {
  id: string;
  name: string;
  type: IntegrationType;
  icon: string;
  description: string;
  authType: AuthenticationType;
  scopes: string[];
  endpoints: IntegrationEndpoint[];
  capabilities: IntegrationCapability[];
  status: IntegrationStatus;
}

export interface IntegrationEndpoint {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  rateLimit?: RateLimit;
}

export interface IntegrationCapability {
  type: CapabilityType;
  description: string;
  dataTypes: string[];
  syncDirection: SyncDirection;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  provider: IntegrationProvider;
  config: PluginConfig;
  hooks: PluginHook[];
  manifest: PluginManifest;
  isActive: boolean;
}

export interface PluginConfig {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  settings: Record<string, any>;
  webhookUrl?: string;
}

export interface PluginHook {
  event: string;
  handler: string;
  priority: number;
  conditions?: Record<string, any>;
}

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  permissions: string[];
  dependencies: string[];
  entryPoint: string;
}

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scopes: string[];
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';
}

export interface OAuth2Token {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  scope: string;
  issuedAt: Date;
}

export interface DataSyncConfig {
  providerId: string;
  syncInterval: number;
  conflictResolution: ConflictResolutionStrategy;
  dataMapping: DataMapping[];
  filters: SyncFilter[];
  lastSync?: Date;
}

export interface DataMapping {
  sourceField: string;
  targetField: string;
  transform?: TransformFunction;
  validation?: ValidationRule[];
}

export interface SyncConflict {
  id: string;
  sourceData: any;
  targetData: any;
  conflictType: ConflictType;
  timestamp: Date;
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  strategy: ConflictResolutionStrategy;
  resolvedData: any;
  timestamp: Date;
  resolvedBy: 'system' | 'user';
}

export interface APIGatewayRequest {
  providerId: string;
  endpoint: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  timeout?: number;
}

export interface APIGatewayResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
  timestamp: Date;
  cached: boolean;
  rateLimitRemaining?: number;
}

export interface RateLimit {
  requests: number;
  window: number; // in seconds
  burst?: number;
}

export interface SyncFilter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface ValidationRule {
  type: ValidationType;
  params?: any;
  message?: string;
}

export type IntegrationType = 
  | 'productivity' 
  | 'communication' 
  | 'storage' 
  | 'calendar' 
  | 'project-management' 
  | 'crm' 
  | 'analytics';

export type AuthenticationType = 
  | 'oauth2' 
  | 'api-key' 
  | 'basic' 
  | 'bearer' 
  | 'custom';

export type IntegrationStatus = 
  | 'connected' 
  | 'disconnected' 
  | 'error' 
  | 'pending' 
  | 'expired';

export type CapabilityType = 
  | 'read' 
  | 'write' 
  | 'sync' 
  | 'webhook' 
  | 'realtime';

export type SyncDirection = 
  | 'bidirectional' 
  | 'inbound' 
  | 'outbound';

export type ConflictResolutionStrategy = 
  | 'latest-wins' 
  | 'source-wins' 
  | 'target-wins' 
  | 'merge' 
  | 'manual';

export type ConflictType = 
  | 'data-mismatch' 
  | 'concurrent-edit' 
  | 'schema-change' 
  | 'deletion-conflict';

export type FilterOperator = 
  | 'equals' 
  | 'not-equals' 
  | 'contains' 
  | 'starts-with' 
  | 'ends-with' 
  | 'greater-than' 
  | 'less-than';

export type ValidationType = 
  | 'required' 
  | 'type' 
  | 'format' 
  | 'range' 
  | 'custom';

export type TransformFunction = (value: any) => any;