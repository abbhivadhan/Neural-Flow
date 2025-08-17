// Search and semantic discovery related type definitions
import { BaseEntity, UUID, Timestamp, Metadata } from './common';

export interface SearchIndex extends BaseEntity {
  name: string;
  description: string;
  type: IndexType;
  schema: IndexSchema;
  documents: IndexedDocument[];
  statistics: IndexStatistics;
  settings: IndexSettings;
  status: IndexStatus;
}

export enum IndexType {
  FULL_TEXT = 'full_text',
  SEMANTIC = 'semantic',
  HYBRID = 'hybrid',
  FACETED = 'faceted',
  GEOSPATIAL = 'geospatial'
}

export enum IndexStatus {
  BUILDING = 'building',
  READY = 'ready',
  UPDATING = 'updating',
  ERROR = 'error',
  MAINTENANCE = 'maintenance'
}

export interface IndexSchema {
  fields: IndexField[];
  vectorDimensions?: number;
  embeddingModel?: string;
  language: string;
  analyzer: AnalyzerConfig;
}

export interface IndexField {
  name: string;
  type: FieldType;
  indexed: boolean;
  stored: boolean;
  vectorized: boolean;
  faceted: boolean;
  boost: number;
  analyzer?: string;
}

export enum FieldType {
  TEXT = 'text',
  KEYWORD = 'keyword',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  VECTOR = 'vector',
  OBJECT = 'object',
  ARRAY = 'array',
  GEOLOCATION = 'geolocation'
}

export interface AnalyzerConfig {
  tokenizer: string;
  filters: string[];
  charFilters: string[];
  stopWords: string[];
  synonyms: SynonymGroup[];
}

export interface SynonymGroup {
  terms: string[];
  weight: number;
}

export interface IndexedDocument {
  id: UUID;
  content: DocumentContent;
  embedding?: number[];
  metadata: DocumentMetadata;
  indexedAt: Timestamp;
  lastUpdated: Timestamp;
  version: number;
}

export interface DocumentContent {
  title: string;
  body: string;
  summary?: string;
  keywords: string[];
  entities: NamedEntity[];
  topics: Topic[];
  language: string;
  contentType: string;
}

export interface NamedEntity {
  text: string;
  type: EntityType;
  confidence: number;
  startOffset: number;
  endOffset: number;
  metadata?: Metadata;
}

export enum EntityType {
  PERSON = 'person',
  ORGANIZATION = 'organization',
  LOCATION = 'location',
  DATE = 'date',
  TIME = 'time',
  MONEY = 'money',
  PERCENTAGE = 'percentage',
  PRODUCT = 'product',
  EVENT = 'event',
  SKILL = 'skill',
  TECHNOLOGY = 'technology',
  CONCEPT = 'concept'
}

export interface Topic {
  name: string;
  confidence: number;
  keywords: string[];
  category: string;
}

export interface DocumentMetadata {
  source: string;
  sourceId: string;
  author?: UUID;
  createdAt: Timestamp;
  modifiedAt: Timestamp;
  tags: string[];
  category: string;
  permissions: DocumentPermission[];
  quality: DocumentQuality;
  relationships: DocumentRelationship[];
}

export interface DocumentPermission {
  userId: UUID;
  permission: 'read' | 'write' | 'admin';
  inherited: boolean;
}

export interface DocumentQuality {
  completeness: number; // 0-1
  accuracy: number; // 0-1
  relevance: number; // 0-1
  freshness: number; // 0-1
  readability: number; // 0-1
  issues: QualityIssue[];
}

export interface QualityIssue {
  type: 'spelling' | 'grammar' | 'formatting' | 'broken_link' | 'outdated' | 'incomplete';
  severity: 'low' | 'medium' | 'high';
  description: string;
  location?: string;
  suggestion?: string;
}

export interface DocumentRelationship {
  targetId: UUID;
  type: RelationshipType;
  strength: number; // 0-1
  bidirectional: boolean;
  metadata?: Metadata;
}

export enum RelationshipType {
  SIMILAR = 'similar',
  REFERENCES = 'references',
  REFERENCED_BY = 'referenced_by',
  SUPERSEDES = 'supersedes',
  SUPERSEDED_BY = 'superseded_by',
  PART_OF = 'part_of',
  CONTAINS = 'contains',
  RELATED = 'related',
  DUPLICATE = 'duplicate'
}

export interface IndexStatistics {
  documentCount: number;
  totalSize: number; // bytes
  averageDocumentSize: number;
  indexSize: number; // bytes
  lastUpdated: Timestamp;
  buildTime: number; // milliseconds
  queryPerformance: QueryPerformanceStats;
  popularQueries: PopularQuery[];
}

export interface QueryPerformanceStats {
  averageLatency: number; // milliseconds
  p95Latency: number;
  p99Latency: number;
  throughput: number; // queries per second
  errorRate: number; // 0-1
}

export interface PopularQuery {
  query: string;
  count: number;
  averageLatency: number;
  successRate: number;
  lastExecuted: Timestamp;
}

export interface IndexSettings {
  refreshInterval: number; // seconds
  maxDocuments: number;
  shardCount: number;
  replicaCount: number;
  compression: boolean;
  caching: CacheSettings;
  security: SecuritySettings;
}

export interface CacheSettings {
  enabled: boolean;
  size: number; // MB
  ttl: number; // seconds
  strategy: 'lru' | 'lfu' | 'fifo';
}

export interface SecuritySettings {
  encryption: boolean;
  accessControl: boolean;
  auditLogging: boolean;
  anonymization: AnonymizationConfig;
}

export interface AnonymizationConfig {
  enabled: boolean;
  fields: string[];
  method: 'hash' | 'mask' | 'remove' | 'tokenize';
  preserveFormat: boolean;
}

export interface SearchQuery {
  id: UUID;
  text: string;
  type: QueryType;
  filters: SearchFilter[];
  facets: FacetRequest[];
  sorting: SortOption[];
  pagination: PaginationConfig;
  highlighting: HighlightConfig;
  suggestions: boolean;
  explain: boolean;
  userId?: UUID;
  timestamp: Timestamp;
}

export enum QueryType {
  KEYWORD = 'keyword',
  SEMANTIC = 'semantic',
  HYBRID = 'hybrid',
  FUZZY = 'fuzzy',
  PHRASE = 'phrase',
  BOOLEAN = 'boolean',
  WILDCARD = 'wildcard',
  REGEX = 'regex'
}

export interface SearchFilter {
  field: string;
  operator: FilterOperator;
  value: any;
  boost?: number;
}

export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  RANGE = 'range',
  IN = 'in',
  NOT_IN = 'not_in',
  EXISTS = 'exists',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  REGEX = 'regex',
  GEO_DISTANCE = 'geo_distance',
  GEO_BOUNDING_BOX = 'geo_bounding_box'
}

export interface FacetRequest {
  field: string;
  size: number;
  minCount: number;
  sort: 'count' | 'value';
  ranges?: FacetRange[];
}

export interface FacetRange {
  from?: any;
  to?: any;
  label: string;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
  mode?: 'min' | 'max' | 'avg' | 'sum';
  missing?: 'first' | 'last';
}

export interface PaginationConfig {
  offset: number;
  limit: number;
  maxLimit: number;
}

export interface HighlightConfig {
  enabled: boolean;
  fields: string[];
  fragmentSize: number;
  maxFragments: number;
  preTag: string;
  postTag: string;
}

export interface SearchResult {
  query: SearchQuery;
  hits: SearchHit[];
  totalHits: number;
  maxScore: number;
  facets: FacetResult[];
  suggestions: SearchSuggestion[];
  executionTime: number; // milliseconds
  timedOut: boolean;
  aggregations?: AggregationResult[];
}

export interface SearchHit {
  id: UUID;
  score: number;
  source: IndexedDocument;
  highlights: { [field: string]: string[] };
  explanation?: ScoreExplanation;
  sortValues?: any[];
}

export interface ScoreExplanation {
  value: number;
  description: string;
  details: ScoreExplanation[];
}

export interface FacetResult {
  field: string;
  buckets: FacetBucket[];
  otherCount: number;
  errorUpperBound: number;
}

export interface FacetBucket {
  key: any;
  count: number;
  selected: boolean;
  subFacets?: FacetResult[];
}

export interface SearchSuggestion {
  type: SuggestionType;
  text: string;
  score: number;
  frequency: number;
  highlighted?: string;
}

export enum SuggestionType {
  TERM = 'term',
  PHRASE = 'phrase',
  COMPLETION = 'completion',
  CONTEXT = 'context',
  CORRECTION = 'correction'
}

export interface AggregationResult {
  name: string;
  type: string;
  value: any;
  buckets?: AggregationBucket[];
}

export interface AggregationBucket {
  key: any;
  count: number;
  aggregations?: AggregationResult[];
}

export interface VectorEmbedding {
  id: UUID;
  documentId: UUID;
  vector: number[];
  model: string;
  dimensions: number;
  createdAt: Timestamp;
  metadata: EmbeddingMetadata;
}

export interface EmbeddingMetadata {
  chunkIndex?: number;
  chunkSize?: number;
  overlap?: number;
  preprocessingSteps: string[];
  quality: EmbeddingQuality;
}

export interface EmbeddingQuality {
  magnitude: number;
  sparsity: number;
  coherence: number;
  distinctiveness: number;
}

export interface SemanticSearchQuery {
  text: string;
  embedding?: number[];
  similarityThreshold: number;
  maxResults: number;
  filters: SearchFilter[];
  rerank: boolean;
  explainSimilarity: boolean;
}

export interface SemanticSearchResult {
  hits: SemanticHit[];
  query: SemanticSearchQuery;
  executionTime: number;
  modelUsed: string;
}

export interface SemanticHit {
  document: IndexedDocument;
  similarity: number;
  distance: number;
  explanation?: SimilarityExplanation;
  chunks?: DocumentChunk[];
}

export interface SimilarityExplanation {
  method: 'cosine' | 'euclidean' | 'dot_product' | 'manhattan';
  factors: SimilarityFactor[];
  visualizations?: SimilarityVisualization[];
}

export interface SimilarityFactor {
  dimension: number;
  contribution: number;
  concept?: string;
}

export interface SimilarityVisualization {
  type: 'heatmap' | 'vector_plot' | 'attention_map';
  data: any;
  description: string;
}

export interface DocumentChunk {
  id: UUID;
  content: string;
  startOffset: number;
  endOffset: number;
  embedding: number[];
  similarity: number;
  relevance: number;
}

export interface SearchAnalytics {
  queryId: UUID;
  userId?: UUID;
  sessionId?: UUID;
  query: string;
  results: number;
  clickedResults: UUID[];
  clickPosition: number[];
  dwellTime: number[];
  satisfaction: number; // 1-5
  abandoned: boolean;
  refinements: QueryRefinement[];
  timestamp: Timestamp;
  context: SearchContext;
}

export interface QueryRefinement {
  type: 'filter_added' | 'filter_removed' | 'query_modified' | 'sort_changed' | 'facet_selected';
  before: string;
  after: string;
  timestamp: Timestamp;
}

export interface SearchContext {
  source: 'search_bar' | 'suggestion' | 'related' | 'auto_complete';
  page: string;
  previousQuery?: string;
  userIntent: SearchIntent;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  location?: string;
}

export interface SearchIntent {
  type: IntentType;
  confidence: number;
  entities: string[];
  domain: string;
}

export enum IntentType {
  INFORMATIONAL = 'informational',
  NAVIGATIONAL = 'navigational',
  TRANSACTIONAL = 'transactional',
  INVESTIGATIONAL = 'investigational',
  COMPARATIVE = 'comparative'
}