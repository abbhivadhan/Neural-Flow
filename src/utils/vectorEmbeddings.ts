// Vector embedding utilities for semantic search in Neural Flow
import { VectorEmbedding, EmbeddingMetadata, DocumentChunk } from '../types/search';
import { storage } from './storage';

// Embedding configuration
export const EMBEDDING_CONFIG = {
  DEFAULT_MODEL: 'all-MiniLM-L6-v2',
  DIMENSIONS: 384,
  CHUNK_SIZE: 512,
  CHUNK_OVERLAP: 50,
  SIMILARITY_THRESHOLD: 0.7,
  MAX_RESULTS: 20,
  CACHE_TTL: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Similarity calculation methods
export enum SimilarityMethod {
  COSINE = 'cosine',
  EUCLIDEAN = 'euclidean',
  DOT_PRODUCT = 'dot_product',
  MANHATTAN = 'manhattan',
}

// Vector embedding result interface
interface EmbeddingResult {
  success: boolean;
  embedding?: number[];
  error?: string;
  metadata?: EmbeddingMetadata;
}

// Similarity search result interface
export interface SimilaritySearchResult {
  documentId: string;
  similarity: number;
  distance: number;
  chunks?: DocumentChunk[];
  metadata?: any;
}

// Vector database interface for client-side storage
class VectorDatabase {
  private embeddings: Map<string, VectorEmbedding> = new Map();
  // private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the vector database by loading embeddings from storage
   */
  private async initialize(): Promise<void> {
    try {
      const result = await storage.get('vector_embeddings');
      if (result.success && result.data) {
        const embeddingsArray = result.data as VectorEmbedding[];
        embeddingsArray.forEach(embedding => {
          this.embeddings.set(embedding.id, embedding);
        });
      }
      // this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize vector database:', error);
      // this.initialized = true; // Continue with empty database
    }
  }

  /**
   * Add or update a vector embedding
   */
  async addEmbedding(embedding: VectorEmbedding): Promise<boolean> {
    try {
      this.embeddings.set(embedding.id, embedding);
      await this.persistEmbeddings();
      return true;
    } catch (error) {
      console.error('Failed to add embedding:', error);
      return false;
    }
  }

  /**
   * Add multiple embeddings in batch
   */
  async addEmbeddings(embeddings: VectorEmbedding[]): Promise<number> {
    let addedCount = 0;
    for (const embedding of embeddings) {
      if (await this.addEmbedding(embedding)) {
        addedCount++;
      }
    }
    return addedCount;
  }

  /**
   * Get embedding by ID
   */
  getEmbedding(id: string): VectorEmbedding | undefined {
    return this.embeddings.get(id);
  }

  /**
   * Get embeddings by document ID
   */
  getEmbeddingsByDocument(documentId: string): VectorEmbedding[] {
    return Array.from(this.embeddings.values()).filter(
      embedding => embedding.documentId === documentId
    );
  }

  /**
   * Remove embedding by ID
   */
  async removeEmbedding(id: string): Promise<boolean> {
    try {
      const deleted = this.embeddings.delete(id);
      if (deleted) {
        await this.persistEmbeddings();
      }
      return deleted;
    } catch (error) {
      console.error('Failed to remove embedding:', error);
      return false;
    }
  }

  /**
   * Remove all embeddings for a document
   */
  async removeEmbeddingsByDocument(documentId: string): Promise<number> {
    const toRemove = Array.from(this.embeddings.values())
      .filter(embedding => embedding.documentId === documentId)
      .map(embedding => embedding.id);
    
    let removedCount = 0;
    for (const id of toRemove) {
      if (await this.removeEmbedding(id)) {
        removedCount++;
      }
    }
    
    return removedCount;
  }

  /**
   * Perform similarity search
   */
  async similaritySearch(
    queryVector: number[],
    options: {
      method?: SimilarityMethod;
      threshold?: number;
      maxResults?: number;
      documentIds?: string[];
    } = {}
  ): Promise<SimilaritySearchResult[]> {
    const {
      method = SimilarityMethod.COSINE,
      threshold = EMBEDDING_CONFIG.SIMILARITY_THRESHOLD,
      maxResults = EMBEDDING_CONFIG.MAX_RESULTS,
      documentIds,
    } = options;

    const results: SimilaritySearchResult[] = [];
    
    for (const embedding of Array.from(this.embeddings.values())) {
      // Filter by document IDs if specified
      if (documentIds && !documentIds.includes(embedding.documentId)) {
        continue;
      }

      const similarity = this.calculateSimilarity(
        queryVector,
        embedding.vector,
        method
      );

      if (similarity >= threshold) {
        results.push({
          documentId: embedding.documentId,
          similarity,
          distance: 1 - similarity,
          metadata: embedding.metadata,
        });
      }
    }

    // Sort by similarity (descending) and limit results
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);
  }

  /**
   * Get all embeddings
   */
  getAllEmbeddings(): VectorEmbedding[] {
    return Array.from(this.embeddings.values());
  }

  /**
   * Get database statistics
   */
  getStats(): {
    totalEmbeddings: number;
    totalDocuments: number;
    averageDimensions: number;
    models: { [model: string]: number };
  } {
    const embeddings = this.getAllEmbeddings();
    const documentIds = new Set(embeddings.map(e => e.documentId));
    const models: { [model: string]: number } = {};
    let totalDimensions = 0;

    embeddings.forEach(embedding => {
      models[embedding.model] = (models[embedding.model] || 0) + 1;
      totalDimensions += embedding.dimensions;
    });

    return {
      totalEmbeddings: embeddings.length,
      totalDocuments: documentIds.size,
      averageDimensions: embeddings.length > 0 ? totalDimensions / embeddings.length : 0,
      models,
    };
  }

  /**
   * Clear all embeddings
   */
  async clear(): Promise<boolean> {
    try {
      this.embeddings.clear();
      await this.persistEmbeddings();
      return true;
    } catch (error) {
      console.error('Failed to clear embeddings:', error);
      return false;
    }
  }

  /**
   * Persist embeddings to storage
   */
  private async persistEmbeddings(): Promise<void> {
    const embeddingsArray = Array.from(this.embeddings.values());
    await storage.set('vector_embeddings', embeddingsArray);
  }

  /**
   * Calculate similarity between two vectors
   */
  private calculateSimilarity(
    vector1: number[],
    vector2: number[],
    method: SimilarityMethod
  ): number {
    if (vector1.length !== vector2.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    switch (method) {
      case SimilarityMethod.COSINE:
        return this.cosineSimilarity(vector1, vector2);
      case SimilarityMethod.EUCLIDEAN:
        return 1 / (1 + this.euclideanDistance(vector1, vector2));
      case SimilarityMethod.DOT_PRODUCT:
        return this.dotProduct(vector1, vector2);
      case SimilarityMethod.MANHATTAN:
        return 1 / (1 + this.manhattanDistance(vector1, vector2));
      default:
        return this.cosineSimilarity(vector1, vector2);
    }
  }

  private cosineSimilarity(vector1: number[], vector2: number[]): number {
    const dotProduct = this.dotProduct(vector1, vector2);
    const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (magnitude1 * magnitude2);
  }

  private dotProduct(vector1: number[], vector2: number[]): number {
    return vector1.reduce((sum, val, i) => sum + val * (vector2[i] || 0), 0);
  }

  private euclideanDistance(vector1: number[], vector2: number[]): number {
    return Math.sqrt(
      vector1.reduce((sum, val, i) => sum + Math.pow(val - (vector2[i] || 0), 2), 0)
    );
  }

  private manhattanDistance(vector1: number[], vector2: number[]): number {
    return vector1.reduce((sum, val, i) => sum + Math.abs(val - (vector2[i] || 0)), 0);
  }
}

// Text processing utilities for embeddings
export class TextProcessor {
  /**
   * Split text into chunks for embedding
   */
  static chunkText(
    text: string,
    chunkSize: number = EMBEDDING_CONFIG.CHUNK_SIZE,
    overlap: number = EMBEDDING_CONFIG.CHUNK_OVERLAP
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const words = text.split(/\s+/);
    
    let startIndex = 0;
    let chunkIndex = 0;
    
    while (startIndex < words.length) {
      const endIndex = Math.min(startIndex + chunkSize, words.length);
      const chunkWords = words.slice(startIndex, endIndex);
      const chunkText = chunkWords.join(' ');
      
      const startOffset = words.slice(0, startIndex).join(' ').length;
      const endOffset = startOffset + chunkText.length;
      
      chunks.push({
        id: `chunk_${chunkIndex}`,
        content: chunkText,
        startOffset,
        endOffset,
        embedding: [], // Will be populated later
        similarity: 0,
        relevance: 0,
      });
      
      startIndex = endIndex - overlap;
      chunkIndex++;
      
      if (endIndex >= words.length) break;
    }
    
    return chunks;
  }

  /**
   * Preprocess text for embedding
   */
  static preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Extract keywords from text
   */
  static extractKeywords(text: string, maxKeywords: number = 10): string[] {
    const words = this.preprocessText(text).split(' ');
    const wordFreq: { [word: string]: number } = {};
    
    // Count word frequencies
    words.forEach(word => {
      if (word.length > 3) { // Filter short words
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    // Sort by frequency and return top keywords
    return Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }
}

// Mock embedding generator (replace with actual model in production)
export class EmbeddingGenerator {
  // private model: string;
  private dimensions: number;

  constructor(_model: string = EMBEDDING_CONFIG.DEFAULT_MODEL) {
    // this.model = model;
    this.dimensions = EMBEDDING_CONFIG.DIMENSIONS;
  }

  /**
   * Generate embedding for text (mock implementation)
   * In production, this would use a real embedding model like TensorFlow.js
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      // Mock embedding generation - replace with actual model
      const processedText = TextProcessor.preprocessText(text);
      const embedding = this.mockEmbedding(processedText);
      
      const metadata: EmbeddingMetadata = {
        preprocessingSteps: ['lowercase', 'remove_punctuation', 'normalize_whitespace'],
        quality: {
          magnitude: this.calculateMagnitude(embedding),
          sparsity: this.calculateSparsity(embedding),
          coherence: 0.8, // Mock value
          distinctiveness: 0.7, // Mock value
        },
      };

      return {
        success: true,
        embedding,
        metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown embedding error',
      };
    }
  }

  /**
   * Generate embeddings for multiple texts
   */
  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];
    
    for (const text of texts) {
      const result = await this.generateEmbedding(text);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Mock embedding generation (replace with real model)
   */
  private mockEmbedding(text: string): number[] {
    const embedding = new Array(this.dimensions);
    
    // Create more realistic embeddings based on text content
    const words = text.toLowerCase().split(/\s+/);
    const wordHashes = words.map(word => this.hashString(word));
    
    // Generate embedding based on word content
    for (let i = 0; i < this.dimensions; i++) {
      let value = 0;
      
      // Combine word influences
      wordHashes.forEach((hash, wordIndex) => {
        const random = this.seededRandom(hash + i);
        const influence = 1 / (wordIndex + 1); // Diminishing influence for later words
        value += (random() - 0.5) * 2 * influence;
      });
      
      // Add some dimension-specific variation
      const dimRandom = this.seededRandom(i * 1000 + this.hashString(text));
      value += (dimRandom() - 0.5) * 0.1;
      
      embedding[i] = value;
    }
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }

  private calculateMagnitude(embedding: number[]): number {
    return Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  }

  private calculateSparsity(embedding: number[]): number {
    const zeroCount = embedding.filter(val => Math.abs(val) < 1e-6).length;
    return zeroCount / embedding.length;
  }
}

// Create singleton instances
export const vectorDB = new VectorDatabase();
export const embeddingGenerator = new EmbeddingGenerator();

// Utility functions for semantic search
export const semanticSearchUtils = {
  /**
   * Index a document for semantic search
   */
  async indexDocument(
    documentId: string,
    content: string,
    _metadata: any = {}
  ): Promise<boolean> {
    try {
      const chunks = TextProcessor.chunkText(content);
      const embeddings: VectorEmbedding[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const result = await embeddingGenerator.generateEmbedding(chunk?.content || '');
        
        if (result.success && result.embedding) {
          const embedding: VectorEmbedding = {
            id: `${documentId}_chunk_${i}`,
            documentId,
            vector: result.embedding,
            model: EMBEDDING_CONFIG.DEFAULT_MODEL,
            dimensions: EMBEDDING_CONFIG.DIMENSIONS,
            createdAt: new Date(),
            metadata: {
              chunkIndex: i,
              chunkSize: chunk?.content.length || 0,
              overlap: EMBEDDING_CONFIG.CHUNK_OVERLAP,
              preprocessingSteps: [],
              quality: 'standard' as any,
              ...result.metadata,
            },
          };
          
          embeddings.push(embedding);
        }
      }
      
      const addedCount = await vectorDB.addEmbeddings(embeddings);
      return addedCount === embeddings.length;
    } catch (error) {
      console.error('Failed to index document:', error);
      return false;
    }
  },

  /**
   * Search for similar documents
   */
  async searchSimilar(
    query: string,
    options: {
      threshold?: number;
      maxResults?: number;
      documentIds?: string[];
    } = {}
  ): Promise<SimilaritySearchResult[]> {
    try {
      const result = await embeddingGenerator.generateEmbedding(query);
      
      if (!result.success || !result.embedding) {
        return [];
      }
      
      return vectorDB.similaritySearch(result.embedding, options);
    } catch (error) {
      console.error('Failed to search similar documents:', error);
      return [];
    }
  },

  /**
   * Remove document from search index
   */
  async removeDocument(documentId: string): Promise<boolean> {
    try {
      const removedCount = await vectorDB.removeEmbeddingsByDocument(documentId);
      return removedCount > 0;
    } catch (error) {
      console.error('Failed to remove document from index:', error);
      return false;
    }
  },

  /**
   * Get search index statistics
   */
  getIndexStats() {
    return vectorDB.getStats();
  },

  /**
   * Clear search index
   */
  async clearIndex(): Promise<boolean> {
    return vectorDB.clear();
  },
};

export default {
  vectorDB,
  embeddingGenerator,
  TextProcessor,
  EmbeddingGenerator,
  semanticSearchUtils,
};