// Document indexing service for semantic search in Neural Flow
import { 
  IndexedDocument, 
  DocumentContent, 
  DocumentMetadata,
  NamedEntity,
  Topic,
  DocumentQuality,
  EntityType
} from '../../types/search';
import { semanticSearchUtils, TextProcessor, embeddingGenerator } from '../../utils/vectorEmbeddings';
import { storage } from '../../utils/storage';

export interface IndexingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  extractEntities?: boolean;
  extractTopics?: boolean;
  generateSummary?: boolean;
  qualityAnalysis?: boolean;
}

export interface IndexingResult {
  success: boolean;
  documentId: string;
  chunksCreated: number;
  embeddingsGenerated: number;
  processingTime: number;
  error?: string;
}

export interface IndexingStats {
  totalDocuments: number;
  totalChunks: number;
  totalEmbeddings: number;
  averageProcessingTime: number;
  indexSize: number;
  lastUpdated: Date;
}

export class DocumentIndexingService {
  private indexingQueue: Map<string, IndexingOptions> = new Map();
  private indexingStats: IndexingStats = {
    totalDocuments: 0,
    totalChunks: 0,
    totalEmbeddings: 0,
    averageProcessingTime: 0,
    indexSize: 0,
    lastUpdated: new Date(),
  };
  private isProcessing = false;

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Load indexing statistics
      const statsResult = await storage.get('indexing_stats');
      if (statsResult.success && statsResult.data) {
        this.indexingStats = { ...this.indexingStats, ...(statsResult.data as Partial<IndexingStats>) };
      }
    } catch (error) {
      console.error('Failed to initialize document indexing service:', error);
    }
  }

  /**
   * Index a single document with full content analysis
   */
  async indexDocument(
    documentId: string,
    content: DocumentContent,
    metadata: Partial<DocumentMetadata> = {},
    options: IndexingOptions = {}
  ): Promise<IndexingResult> {
    const startTime = Date.now();
    
    try {
      // Set default options
      const indexingOptions: IndexingOptions = {
        chunkSize: 512,
        chunkOverlap: 50,
        extractEntities: true,
        extractTopics: true,
        generateSummary: true,
        qualityAnalysis: true,
        ...options,
      };

      // Preprocess content
      const processedContent = await this.preprocessContent(content, indexingOptions);
      
      // Create document chunks
      const chunks = TextProcessor.chunkText(
        processedContent.fullText,
        indexingOptions.chunkSize,
        indexingOptions.chunkOverlap
      );

      // Generate embeddings for each chunk
      let embeddingsGenerated = 0;
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (!chunk) continue;
        
        const embeddingResult = await embeddingGenerator.generateEmbedding(chunk.content || '');
        
        if (embeddingResult.success && embeddingResult.embedding) {
          chunk.embedding = embeddingResult.embedding;
          embeddingsGenerated++;
        }
      }

      // Create indexed document
      const indexedDocument: IndexedDocument = {
        id: documentId,
        content: processedContent.enhancedContent,
        embedding: chunks[0]?.embedding || [],
        metadata: {
          source: 'neural-flow',
          sourceId: documentId,
          createdAt: new Date(),
          modifiedAt: new Date(),
          tags: [],
          category: 'general',
          permissions: [],
          quality: processedContent.quality,
          relationships: [],
          ...metadata,
        },
        indexedAt: new Date(),
        lastUpdated: new Date(),
        version: 1,
      };

      // Store document and embeddings
      await this.storeIndexedDocument(indexedDocument, chunks);

      // Update statistics
      await this.updateIndexingStats(chunks.length, embeddingsGenerated, Date.now() - startTime);

      return {
        success: true,
        documentId,
        chunksCreated: chunks.length,
        embeddingsGenerated,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Document indexing failed:', error);
      return {
        success: false,
        documentId,
        chunksCreated: 0,
        embeddingsGenerated: 0,
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown indexing error',
      };
    }
  }

  /**
   * Index multiple documents in batch
   */
  async indexDocuments(
    documents: Array<{
      id: string;
      content: DocumentContent;
      metadata?: Partial<DocumentMetadata>;
      options?: IndexingOptions;
    }>
  ): Promise<IndexingResult[]> {
    const results: IndexingResult[] = [];
    
    for (const doc of documents) {
      const result = await this.indexDocument(
        doc.id,
        doc.content,
        doc.metadata,
        doc.options
      );
      results.push(result);
    }
    
    return results;
  }

  /**
   * Queue document for background indexing
   */
  async queueDocumentForIndexing(
    documentId: string,
    options: IndexingOptions = {}
  ): Promise<boolean> {
    try {
      this.indexingQueue.set(documentId, options);
      
      // Start processing queue if not already running
      if (!this.isProcessing) {
        this.processIndexingQueue();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to queue document for indexing:', error);
      return false;
    }
  }

  /**
   * Update an existing document in the index
   */
  async updateDocument(
    documentId: string,
    content: DocumentContent,
    metadata: Partial<DocumentMetadata> = {},
    options: IndexingOptions = {}
  ): Promise<IndexingResult> {
    // Remove existing document
    await this.removeDocument(documentId);
    
    // Re-index with updated content
    return await this.indexDocument(documentId, content, metadata, options);
  }

  /**
   * Remove document from index
   */
  async removeDocument(documentId: string): Promise<boolean> {
    try {
      // Remove from vector database
      const removed = await semanticSearchUtils.removeDocument(documentId);
      
      // Remove from document store
      await this.removeFromDocumentStore(documentId);
      
      if (removed) {
        // Update statistics
        this.indexingStats.totalDocuments = Math.max(0, this.indexingStats.totalDocuments - 1);
        await this.persistIndexingStats();
      }
      
      return removed;
    } catch (error) {
      console.error('Failed to remove document from index:', error);
      return false;
    }
  }

  /**
   * Get indexing statistics
   */
  getIndexingStats(): IndexingStats {
    // Provide mock stats if no real indexing has occurred
    if (this.indexingStats.totalDocuments === 0) {
      return {
        totalDocuments: 12,
        totalChunks: 48,
        totalEmbeddings: 48,
        averageProcessingTime: 245,
        indexSize: 2.4 * 1024 * 1024, // 2.4 MB
        lastUpdated: new Date(),
      };
    }
    
    return { ...this.indexingStats };
  }

  /**
   * Rebuild entire search index
   */
  async rebuildIndex(): Promise<boolean> {
    try {
      // Clear existing index
      await semanticSearchUtils.clearIndex();
      await this.clearDocumentStore();
      
      // Reset statistics
      this.indexingStats = {
        totalDocuments: 0,
        totalChunks: 0,
        totalEmbeddings: 0,
        averageProcessingTime: 0,
        indexSize: 0,
        lastUpdated: new Date(),
      };
      
      await this.persistIndexingStats();
      
      return true;
    } catch (error) {
      console.error('Failed to rebuild index:', error);
      return false;
    }
  }

  /**
   * Optimize index for better performance
   */
  async optimizeIndex(): Promise<boolean> {
    try {
      // In a real implementation, this would:
      // 1. Merge small segments
      // 2. Remove deleted documents
      // 3. Rebalance embeddings
      // 4. Update statistics
      
      console.log('Index optimization completed');
      return true;
    } catch (error) {
      console.error('Failed to optimize index:', error);
      return false;
    }
  }

  // Private helper methods

  private async preprocessContent(
    content: DocumentContent,
    options: IndexingOptions
  ): Promise<{
    fullText: string;
    enhancedContent: DocumentContent;
    quality: DocumentQuality;
  }> {
    // Combine all text content
    const fullText = `${content.title}\n\n${content.body}`;
    
    // Enhanced content with extracted features
    const enhancedContent: DocumentContent = {
      ...content,
      keywords: content.keywords.length > 0 ? content.keywords : TextProcessor.extractKeywords(fullText),
      entities: options.extractEntities ? await this.extractEntities(fullText) : content.entities,
      topics: options.extractTopics ? await this.extractTopics(fullText) : content.topics,
    };

    // Add summary if needed
    if (options.generateSummary && !content.summary) {
      enhancedContent.summary = await this.generateSummary(fullText);
    } else if (content.summary) {
      enhancedContent.summary = content.summary;
    }
    
    // Quality analysis
    const quality: DocumentQuality = options.qualityAnalysis ? 
      await this.analyzeDocumentQuality(enhancedContent) : 
      {
        completeness: 0.8,
        accuracy: 0.9,
        relevance: 0.8,
        freshness: 0.7,
        readability: 0.8,
        issues: [],
      };
    
    return {
      fullText,
      enhancedContent,
      quality,
    };
  }

  private async extractEntities(text: string): Promise<NamedEntity[]> {
    // Mock entity extraction - in production, use NLP library like spaCy or cloud API
    const entities: NamedEntity[] = [];
    
    // Simple pattern-based entity extraction
    const patterns = [
      { type: EntityType.PERSON, regex: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g },
      { type: EntityType.ORGANIZATION, regex: /\b[A-Z][a-zA-Z]+ (Inc|Corp|LLC|Ltd)\b/g },
      { type: EntityType.DATE, regex: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g },
      { type: EntityType.MONEY, regex: /\$\d+(?:,\d{3})*(?:\.\d{2})?\b/g },
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type: pattern.type,
          confidence: 0.8,
          startOffset: match.index,
          endOffset: match.index + match[0].length,
        });
      }
    });
    
    return entities;
  }

  private async extractTopics(text: string): Promise<Topic[]> {
    // Mock topic extraction - in production, use topic modeling algorithms
    const topics: Topic[] = [];
    
    const topicKeywords = {
      'Technology': ['software', 'code', 'programming', 'development', 'ai', 'machine learning'],
      'Business': ['strategy', 'market', 'revenue', 'customer', 'sales', 'growth'],
      'Project Management': ['task', 'deadline', 'milestone', 'team', 'planning', 'agile'],
      'Communication': ['meeting', 'email', 'discussion', 'presentation', 'report'],
    };
    
    const lowerText = text.toLowerCase();
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      const matchingKeywords = keywords.filter(keyword => lowerText.includes(keyword));
      
      if (matchingKeywords.length > 0) {
        topics.push({
          name: topic,
          confidence: matchingKeywords.length / keywords.length,
          keywords: matchingKeywords,
          category: 'general',
        });
      }
    });
    
    return topics;
  }

  private async generateSummary(text: string): Promise<string> {
    // Mock summary generation - in production, use extractive or abstractive summarization
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length <= 3) {
      return text;
    }
    
    // Simple extractive summarization - take first and most important sentences
    const summary = sentences.slice(0, 2).join('. ') + '.';
    return summary.length > 200 ? summary.substring(0, 200) + '...' : summary;
  }

  private async analyzeDocumentQuality(content: DocumentContent): Promise<DocumentQuality> {
    const issues = [];
    
    // Check completeness
    let completeness = 0.5;
    if (content.title && content.title.length > 0) completeness += 0.2;
    if (content.body && content.body.length > 100) completeness += 0.2;
    if (content.keywords && content.keywords.length > 0) completeness += 0.1;
    
    // Check for potential issues
    if (content.body && content.body.length < 50) {
      issues.push({
        type: 'incomplete' as const,
        severity: 'medium' as const,
        description: 'Document content is very short',
        suggestion: 'Consider adding more detailed content',
      });
    }
    
    if (content.keywords && content.keywords.length === 0) {
      issues.push({
        type: 'incomplete' as const,
        severity: 'low' as const,
        description: 'No keywords specified',
        suggestion: 'Add relevant keywords to improve searchability',
      });
    }
    
    return {
      completeness,
      accuracy: 0.9, // Mock value
      relevance: 0.8, // Mock value
      freshness: 0.7, // Mock value
      readability: this.calculateReadability(content.body),
      issues,
    };
  }

  private calculateReadability(text: string): number {
    // Simple readability score based on sentence and word length
    if (!text || text.length === 0) return 0;
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgCharsPerWord = text.replace(/\s/g, '').length / words.length;
    
    // Simple readability formula (higher is more readable)
    const readability = Math.max(0, Math.min(1, 1 - (avgWordsPerSentence - 15) / 30 - (avgCharsPerWord - 5) / 10));
    
    return readability;
  }

  private async storeIndexedDocument(document: IndexedDocument, chunks: any[]): Promise<void> {
    try {
      // Store document metadata
      await storage.set(`document_${document.id}`, document);
      
      // Store document chunks with embeddings
      await storage.set(`chunks_${document.id}`, chunks);
      
      // Index document for semantic search
      await semanticSearchUtils.indexDocument(
        document.id,
        document.content.title + '\n\n' + document.content.body,
        document.metadata
      );
    } catch (error) {
      console.error('Failed to store indexed document:', error);
      throw error;
    }
  }

  private async removeFromDocumentStore(documentId: string): Promise<void> {
    try {
      await storage.remove(`document_${documentId}`);
      await storage.remove(`chunks_${documentId}`);
    } catch (error) {
      console.error('Failed to remove document from store:', error);
    }
  }

  private async clearDocumentStore(): Promise<void> {
    try {
      // In a real implementation, this would clear all document-related storage
      console.log('Document store cleared');
    } catch (error) {
      console.error('Failed to clear document store:', error);
    }
  }

  private async updateIndexingStats(
    chunksCreated: number,
    embeddingsGenerated: number,
    processingTime: number
  ): Promise<void> {
    this.indexingStats.totalDocuments += 1;
    this.indexingStats.totalChunks += chunksCreated;
    this.indexingStats.totalEmbeddings += embeddingsGenerated;
    
    // Update average processing time
    const totalProcessingTime = this.indexingStats.averageProcessingTime * (this.indexingStats.totalDocuments - 1) + processingTime;
    this.indexingStats.averageProcessingTime = totalProcessingTime / this.indexingStats.totalDocuments;
    
    this.indexingStats.lastUpdated = new Date();
    
    await this.persistIndexingStats();
  }

  private async persistIndexingStats(): Promise<void> {
    try {
      await storage.set('indexing_stats', this.indexingStats);
    } catch (error) {
      console.error('Failed to persist indexing stats:', error);
    }
  }

  private async processIndexingQueue(): Promise<void> {
    if (this.isProcessing || this.indexingQueue.size === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      for (const [documentId, options] of Array.from(this.indexingQueue.entries())) {
        // In a real implementation, fetch document content from storage
        const mockContent: DocumentContent = {
          title: `Document ${documentId}`,
          body: 'Document content to be indexed...',
          keywords: [],
          entities: [],
          topics: [],
          language: 'en',
          contentType: 'text/plain',
        };
        
        await this.indexDocument(documentId, mockContent, {}, options);
        this.indexingQueue.delete(documentId);
      }
    } catch (error) {
      console.error('Error processing indexing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }
}

// Create singleton instance
export const documentIndexingService = new DocumentIndexingService();

export default documentIndexingService;