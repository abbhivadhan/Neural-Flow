// Search services index - exports all search-related services
export { 
  SemanticSearchService,
  semanticSearchService,
  type SearchOptions,
  type ContentRecommendation,
  type SearchContext
} from './SemanticSearchService';

export {
  DocumentIndexingService,
  documentIndexingService,
  type IndexingOptions,
  type IndexingResult,
  type IndexingStats
} from './DocumentIndexingService';

// Re-export utilities for convenience
export {
  vectorDB,
  embeddingGenerator,
  semanticSearchUtils,
  TextProcessor,
  EmbeddingGenerator,
  SimilarityMethod,
  EMBEDDING_CONFIG
} from '../../utils/vectorEmbeddings';

// Re-export types
export type {
  SemanticSearchQuery,
  SemanticSearchResult,
  SemanticHit,
  VectorEmbedding,
  DocumentContent,
  IndexedDocument
} from '../../types/search';

export type {
  SimilaritySearchResult
} from '../../utils/vectorEmbeddings';