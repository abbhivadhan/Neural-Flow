// Search and semantic discovery related Zod validation schemas
import { z } from 'zod';
import { 
  BaseEntitySchema, 
  UUIDSchema, 
  TimestampSchema, 
  MetadataSchema
} from './common';

// Enums
export const IndexTypeSchema = z.enum(['full_text', 'semantic', 'hybrid', 'faceted', 'geospatial']);
export const IndexStatusSchema = z.enum(['building', 'ready', 'updating', 'error', 'maintenance']);
export const FieldTypeSchema = z.enum(['text', 'keyword', 'number', 'date', 'boolean', 'vector', 'object', 'array', 'geolocation']);
export const EntityTypeSchema = z.enum(['person', 'organization', 'location', 'date', 'time', 'money', 'percentage', 'product', 'event', 'skill', 'technology', 'concept']);
export const RelationshipTypeSchema = z.enum(['similar', 'references', 'referenced_by', 'supersedes', 'superseded_by', 'part_of', 'contains', 'related', 'duplicate']);
export const QueryTypeSchema = z.enum(['keyword', 'semantic', 'hybrid', 'fuzzy', 'phrase', 'boolean', 'wildcard', 'regex']);
export const FilterOperatorSchema = z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'range', 'in', 'not_in', 'exists', 'contains', 'starts_with', 'ends_with', 'regex', 'geo_distance', 'geo_bounding_box']);
export const SuggestionTypeSchema = z.enum(['term', 'phrase', 'completion', 'context', 'correction']);
export const IntentTypeSchema = z.enum(['informational', 'navigational', 'transactional', 'investigational', 'comparative']);

// Core schemas
export const SynonymGroupSchema = z.object({
  terms: z.array(z.string().min(1)),
  weight: z.number().min(0).max(1),
});

export const AnalyzerConfigSchema = z.object({
  tokenizer: z.string().min(1),
  filters: z.array(z.string()),
  charFilters: z.array(z.string()),
  stopWords: z.array(z.string()),
  synonyms: z.array(SynonymGroupSchema),
});

export const IndexFieldSchema = z.object({
  name: z.string().min(1).max(100),
  type: FieldTypeSchema,
  indexed: z.boolean(),
  stored: z.boolean(),
  vectorized: z.boolean(),
  faceted: z.boolean(),
  boost: z.number().min(0),
  analyzer: z.string().optional(),
});

export const IndexSchemaSchema = z.object({
  fields: z.array(IndexFieldSchema),
  vectorDimensions: z.number().min(1).optional(),
  embeddingModel: z.string().optional(),
  language: z.string().min(2).max(10),
  analyzer: AnalyzerConfigSchema,
});

export const NamedEntitySchema = z.object({
  text: z.string().min(1),
  type: EntityTypeSchema,
  confidence: z.number().min(0).max(1),
  startOffset: z.number().min(0),
  endOffset: z.number().min(0),
  metadata: MetadataSchema.optional(),
});

export const TopicSchema = z.object({
  name: z.string().min(1).max(100),
  confidence: z.number().min(0).max(1),
  keywords: z.array(z.string().min(1)),
  category: z.string().min(1).max(50),
});

export const DocumentContentSchema = z.object({
  title: z.string().min(1).max(500),
  body: z.string().min(1),
  summary: z.string().max(1000).optional(),
  keywords: z.array(z.string().min(1).max(100)),
  entities: z.array(NamedEntitySchema),
  topics: z.array(TopicSchema),
  language: z.string().min(2).max(10),
  contentType: z.string().min(1).max(50),
});

export const DocumentPermissionSchema = z.object({
  userId: UUIDSchema,
  permission: z.enum(['read', 'write', 'admin']),
  inherited: z.boolean(),
});

export const QualityIssueSchema = z.object({
  type: z.enum(['spelling', 'grammar', 'formatting', 'broken_link', 'outdated', 'incomplete']),
  severity: z.enum(['low', 'medium', 'high']),
  description: z.string().min(1).max(500),
  location: z.string().optional(),
  suggestion: z.string().optional(),
});

export const DocumentQualitySchema = z.object({
  completeness: z.number().min(0).max(1),
  accuracy: z.number().min(0).max(1),
  relevance: z.number().min(0).max(1),
  freshness: z.number().min(0).max(1),
  readability: z.number().min(0).max(1),
  issues: z.array(QualityIssueSchema),
});

export const DocumentRelationshipSchema = z.object({
  targetId: UUIDSchema,
  type: RelationshipTypeSchema,
  strength: z.number().min(0).max(1),
  bidirectional: z.boolean(),
  metadata: MetadataSchema.optional(),
});

export const DocumentMetadataSchema = z.object({
  source: z.string().min(1).max(100),
  sourceId: z.string().min(1),
  author: UUIDSchema.optional(),
  createdAt: TimestampSchema,
  modifiedAt: TimestampSchema,
  tags: z.array(z.string().min(1).max(50)),
  category: z.string().min(1).max(100),
  permissions: z.array(DocumentPermissionSchema),
  quality: DocumentQualitySchema,
  relationships: z.array(DocumentRelationshipSchema),
});

export const IndexedDocumentSchema = z.object({
  id: UUIDSchema,
  content: DocumentContentSchema,
  embedding: z.array(z.number()).optional(),
  metadata: DocumentMetadataSchema,
  indexedAt: TimestampSchema,
  lastUpdated: TimestampSchema,
  version: z.number().min(1),
});

export const PopularQuerySchema = z.object({
  query: z.string().min(1),
  count: z.number().min(1),
  averageLatency: z.number().min(0),
  successRate: z.number().min(0).max(1),
  lastExecuted: TimestampSchema,
});

export const QueryPerformanceStatsSchema = z.object({
  averageLatency: z.number().min(0),
  p95Latency: z.number().min(0),
  p99Latency: z.number().min(0),
  throughput: z.number().min(0),
  errorRate: z.number().min(0).max(1),
});

export const IndexStatisticsSchema = z.object({
  documentCount: z.number().min(0),
  totalSize: z.number().min(0),
  averageDocumentSize: z.number().min(0),
  indexSize: z.number().min(0),
  lastUpdated: TimestampSchema,
  buildTime: z.number().min(0),
  queryPerformance: QueryPerformanceStatsSchema,
  popularQueries: z.array(PopularQuerySchema),
});

export const CacheSettingsSchema = z.object({
  enabled: z.boolean(),
  size: z.number().min(0),
  ttl: z.number().min(0),
  strategy: z.enum(['lru', 'lfu', 'fifo']),
});

export const AnonymizationConfigSchema = z.object({
  enabled: z.boolean(),
  fields: z.array(z.string()),
  method: z.enum(['hash', 'mask', 'remove', 'tokenize']),
  preserveFormat: z.boolean(),
});

export const SecuritySettingsSchema = z.object({
  encryption: z.boolean(),
  accessControl: z.boolean(),
  auditLogging: z.boolean(),
  anonymization: AnonymizationConfigSchema,
});

export const IndexSettingsSchema = z.object({
  refreshInterval: z.number().min(1),
  maxDocuments: z.number().min(1),
  shardCount: z.number().min(1),
  replicaCount: z.number().min(0),
  compression: z.boolean(),
  caching: CacheSettingsSchema,
  security: SecuritySettingsSchema,
});

export const SearchIndexSchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(200),
  description: z.string().max(1000),
  type: IndexTypeSchema,
  schema: IndexSchemaSchema,
  documents: z.array(IndexedDocumentSchema),
  statistics: IndexStatisticsSchema,
  settings: IndexSettingsSchema,
  status: IndexStatusSchema,
});

export const SearchFilterSchema = z.object({
  field: z.string().min(1),
  operator: FilterOperatorSchema,
  value: z.any(),
  boost: z.number().min(0).optional(),
});

export const FacetRangeSchema = z.object({
  from: z.any().optional(),
  to: z.any().optional(),
  label: z.string().min(1),
});

export const FacetRequestSchema = z.object({
  field: z.string().min(1),
  size: z.number().min(1).max(1000),
  minCount: z.number().min(0),
  sort: z.enum(['count', 'value']),
  ranges: z.array(FacetRangeSchema).optional(),
});

export const SortOptionSchema = z.object({
  field: z.string().min(1),
  direction: z.enum(['asc', 'desc']),
  mode: z.enum(['min', 'max', 'avg', 'sum']).optional(),
  missing: z.enum(['first', 'last']).optional(),
});

export const PaginationConfigSchema = z.object({
  offset: z.number().min(0),
  limit: z.number().min(1).max(1000),
  maxLimit: z.number().min(1),
});

export const HighlightConfigSchema = z.object({
  enabled: z.boolean(),
  fields: z.array(z.string()),
  fragmentSize: z.number().min(1),
  maxFragments: z.number().min(1),
  preTag: z.string(),
  postTag: z.string(),
});

export const SearchQuerySchema = z.object({
  id: UUIDSchema,
  text: z.string().min(1).max(1000),
  type: QueryTypeSchema,
  filters: z.array(SearchFilterSchema),
  facets: z.array(FacetRequestSchema),
  sorting: z.array(SortOptionSchema),
  pagination: PaginationConfigSchema,
  highlighting: HighlightConfigSchema,
  suggestions: z.boolean(),
  explain: z.boolean(),
  userId: UUIDSchema.optional(),
  timestamp: TimestampSchema,
});

export const ScoreExplanationSchema: z.ZodType<any> = z.lazy(() => z.object({
  value: z.number(),
  description: z.string(),
  details: z.array(ScoreExplanationSchema),
}));

export const SearchHitSchema = z.object({
  id: UUIDSchema,
  score: z.number(),
  source: IndexedDocumentSchema,
  highlights: z.record(z.array(z.string())),
  explanation: ScoreExplanationSchema.optional(),
  sortValues: z.array(z.any()).optional(),
});

export const FacetBucketSchema: z.ZodType<any> = z.lazy(() => z.object({
  key: z.any(),
  count: z.number().min(0),
  selected: z.boolean(),
  subFacets: z.array(z.object({
    field: z.string(),
    buckets: z.array(FacetBucketSchema),
    otherCount: z.number(),
    errorUpperBound: z.number(),
  })).optional(),
}));

export const FacetResultSchema = z.object({
  field: z.string().min(1),
  buckets: z.array(FacetBucketSchema),
  otherCount: z.number().min(0),
  errorUpperBound: z.number().min(0),
});

export const SearchSuggestionSchema = z.object({
  type: SuggestionTypeSchema,
  text: z.string().min(1),
  score: z.number().min(0),
  frequency: z.number().min(0),
  highlighted: z.string().optional(),
});

export const AggregationBucketSchema: z.ZodType<any> = z.lazy(() => z.object({
  key: z.any(),
  count: z.number().min(0),
  aggregations: z.array(z.object({
    name: z.string(),
    type: z.string(),
    value: z.any(),
    buckets: z.array(AggregationBucketSchema).optional(),
  })).optional(),
}));

export const AggregationResultSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  value: z.any(),
  buckets: z.array(AggregationBucketSchema).optional(),
});

export const SearchResultSchema = z.object({
  query: SearchQuerySchema,
  hits: z.array(SearchHitSchema),
  totalHits: z.number().min(0),
  maxScore: z.number(),
  facets: z.array(FacetResultSchema),
  suggestions: z.array(SearchSuggestionSchema),
  executionTime: z.number().min(0),
  timedOut: z.boolean(),
  aggregations: z.array(AggregationResultSchema).optional(),
});

export const EmbeddingQualitySchema = z.object({
  magnitude: z.number().min(0),
  sparsity: z.number().min(0).max(1),
  coherence: z.number().min(0).max(1),
  distinctiveness: z.number().min(0).max(1),
});

export const EmbeddingMetadataSchema = z.object({
  chunkIndex: z.number().min(0).optional(),
  chunkSize: z.number().min(1).optional(),
  overlap: z.number().min(0).optional(),
  preprocessingSteps: z.array(z.string()),
  quality: EmbeddingQualitySchema,
});

export const VectorEmbeddingSchema = z.object({
  id: UUIDSchema,
  documentId: UUIDSchema,
  vector: z.array(z.number()),
  model: z.string().min(1),
  dimensions: z.number().min(1),
  createdAt: TimestampSchema,
  metadata: EmbeddingMetadataSchema,
});

export const SemanticSearchQuerySchema = z.object({
  text: z.string().min(1).max(1000),
  embedding: z.array(z.number()).optional(),
  similarityThreshold: z.number().min(0).max(1),
  maxResults: z.number().min(1).max(1000),
  filters: z.array(SearchFilterSchema),
  rerank: z.boolean(),
  explainSimilarity: z.boolean(),
});

export const DocumentChunkSchema = z.object({
  id: UUIDSchema,
  content: z.string().min(1),
  startOffset: z.number().min(0),
  endOffset: z.number().min(0),
  embedding: z.array(z.number()),
  similarity: z.number().min(0).max(1),
  relevance: z.number().min(0).max(1),
});

export const SimilarityFactorSchema = z.object({
  dimension: z.number().min(0),
  contribution: z.number(),
  concept: z.string().optional(),
});

export const SimilarityVisualizationSchema = z.object({
  type: z.enum(['heatmap', 'vector_plot', 'attention_map']),
  data: z.any(),
  description: z.string().min(1),
});

export const SimilarityExplanationSchema = z.object({
  method: z.enum(['cosine', 'euclidean', 'dot_product', 'manhattan']),
  factors: z.array(SimilarityFactorSchema),
  visualizations: z.array(SimilarityVisualizationSchema).optional(),
});

export const SemanticHitSchema = z.object({
  document: IndexedDocumentSchema,
  similarity: z.number().min(0).max(1),
  distance: z.number().min(0),
  explanation: SimilarityExplanationSchema.optional(),
  chunks: z.array(DocumentChunkSchema).optional(),
});

export const SemanticSearchResultSchema = z.object({
  hits: z.array(SemanticHitSchema),
  query: SemanticSearchQuerySchema,
  executionTime: z.number().min(0),
  modelUsed: z.string().min(1),
});

export const QueryRefinementSchema = z.object({
  type: z.enum(['filter_added', 'filter_removed', 'query_modified', 'sort_changed', 'facet_selected']),
  before: z.string(),
  after: z.string(),
  timestamp: TimestampSchema,
});

export const SearchIntentSchema = z.object({
  type: IntentTypeSchema,
  confidence: z.number().min(0).max(1),
  entities: z.array(z.string()),
  domain: z.string().min(1),
});

export const SearchContextSchema = z.object({
  source: z.enum(['search_bar', 'suggestion', 'related', 'auto_complete']),
  page: z.string().min(1),
  previousQuery: z.string().optional(),
  userIntent: SearchIntentSchema,
  deviceType: z.enum(['desktop', 'mobile', 'tablet']),
  location: z.string().optional(),
});

export const SearchAnalyticsSchema = z.object({
  queryId: UUIDSchema,
  userId: UUIDSchema.optional(),
  sessionId: UUIDSchema.optional(),
  query: z.string().min(1),
  results: z.number().min(0),
  clickedResults: z.array(UUIDSchema),
  clickPosition: z.array(z.number().min(0)),
  dwellTime: z.array(z.number().min(0)),
  satisfaction: z.number().min(1).max(5),
  abandoned: z.boolean(),
  refinements: z.array(QueryRefinementSchema),
  timestamp: TimestampSchema,
  context: SearchContextSchema,
});

// Validation functions
export const validateSearchIndex = (data: unknown) => SearchIndexSchema.safeParse(data);
export const validateSearchQuery = (data: unknown) => SearchQuerySchema.safeParse(data);
export const validateSearchResult = (data: unknown) => SearchResultSchema.safeParse(data);
export const validateVectorEmbedding = (data: unknown) => VectorEmbeddingSchema.safeParse(data);
export const validateSemanticSearchQuery = (data: unknown) => SemanticSearchQuerySchema.safeParse(data);
export const validateSemanticSearchResult = (data: unknown) => SemanticSearchResultSchema.safeParse(data);

// Partial schemas for updates
export const SearchIndexUpdateSchema = SearchIndexSchema.partial();
export const IndexedDocumentUpdateSchema = IndexedDocumentSchema.partial();