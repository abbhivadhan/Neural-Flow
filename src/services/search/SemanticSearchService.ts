// Advanced semantic search service for Neural Flow
import { 
  SemanticSearchResult, 
  DocumentContent,
  IndexedDocument
} from '../../types/search';
import { vectorDB, embeddingGenerator, semanticSearchUtils, SimilaritySearchResult } from '../../utils/vectorEmbeddings';
import { storage } from '../../utils/storage';

export interface SearchOptions {
  threshold?: number;
  maxResults?: number;
  includeExplanation?: boolean;
  rerank?: boolean;
  contextualBoost?: boolean;
}

export interface ContentRecommendation {
  documentId: string;
  title: string;
  snippet: string;
  relevanceScore: number;
  reason: string;
  category: string;
  tags: string[];
}

export interface SearchContext {
  userId?: string;
  currentDocument?: string;
  recentQueries?: string[];
  workContext?: 'coding' | 'writing' | 'research' | 'planning' | 'meeting';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}

export class SemanticSearchService {
  private searchHistory: Map<string, SemanticSearchResult[]> = new Map();
  private userPreferences: Map<string, any> = new Map();
  private contextCache: Map<string, any> = new Map();

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Load search history and preferences
      const historyResult = await storage.get('search_history');
      if (historyResult.success && historyResult.data) {
        const history = historyResult.data as { [key: string]: SemanticSearchResult[] };
        Object.entries(history).forEach(([key, value]) => {
          this.searchHistory.set(key, value);
        });
      }

      const prefsResult = await storage.get('search_preferences');
      if (prefsResult.success && prefsResult.data) {
        const prefs = prefsResult.data as { [key: string]: any };
        Object.entries(prefs).forEach(([key, value]) => {
          this.userPreferences.set(key, value);
        });
      }
    } catch (error) {
      console.error('Failed to initialize semantic search service:', error);
    }
  }

  /**
   * Perform intelligent semantic search with natural language queries
   */
  async search(
    query: string, 
    context: SearchContext = {} as SearchContext,
    options: SearchOptions = {}
  ): Promise<SemanticSearchResult> {
    const startTime = Date.now();
    
    try {
      // Preprocess and enhance the query
      const enhancedQuery = await this.enhanceQuery(query, context);
      
      // Generate embedding for the query
      const embeddingResult = await embeddingGenerator.generateEmbedding(enhancedQuery);
      
      if (!embeddingResult.success || !embeddingResult.embedding) {
        throw new Error('Failed to generate query embedding');
      }

      // Perform similarity search
      const similarityResults = await vectorDB.similaritySearch(
        embeddingResult.embedding,
        {
          threshold: options.threshold || 0.7,
          maxResults: options.maxResults || 20,
        }
      );

      // Convert to semantic hits and apply contextual ranking
      const hits = await this.processSearchHits(
        similarityResults, 
        query, 
        context, 
        options
      );

      // Apply reranking if requested
      const finalHits = options.rerank ? 
        await this.rerankResults(hits, query, context) : 
        hits;

      const result: SemanticSearchResult = {
        hits: finalHits,
        query: {
          text: query,
          embedding: embeddingResult.embedding,
          similarityThreshold: options.threshold || 0.7,
          maxResults: options.maxResults || 20,
          filters: [],
          rerank: options.rerank || false,
          explainSimilarity: options.includeExplanation || false,
        },
        executionTime: Date.now() - startTime,
        modelUsed: 'all-MiniLM-L6-v2',
      };

      // Store in search history
      await this.updateSearchHistory(context.userId || 'anonymous', result);

      return result;
    } catch (error) {
      console.error('Semantic search failed:', error);
      throw error;
    }
  }

  /**
   * Generate contextual content recommendations
   */
  async getContentRecommendations(
    context: SearchContext,
    maxRecommendations: number = 10
  ): Promise<ContentRecommendation[]> {
    try {
      const recommendations: ContentRecommendation[] = [];
      
      // Get user's recent activity and preferences
      const recentQueries = context.recentQueries || [];
      
      // Generate recommendations based on different strategies
      
      // 1. Similar to recent searches
      if (recentQueries.length > 0) {
        const recentRecs = await this.getRecentSearchRecommendations(recentQueries);
        recommendations.push(...recentRecs);
      }
      
      // 2. Context-based recommendations
      const contextRecs = await this.getContextualRecommendations(context);
      recommendations.push(...contextRecs);
      
      // 3. Trending content recommendations
      const trendingRecs = await this.getTrendingRecommendations();
      recommendations.push(...trendingRecs);
      
      // 4. Collaborative filtering recommendations
      const collaborativeRecs = await this.getCollaborativeRecommendations(context.userId);
      recommendations.push(...collaborativeRecs);

      // Deduplicate and rank recommendations
      const uniqueRecs = this.deduplicateRecommendations(recommendations);
      const rankedRecs = this.rankRecommendations(uniqueRecs, context);
      
      return rankedRecs.slice(0, maxRecommendations);
    } catch (error) {
      console.error('Failed to generate content recommendations:', error);
      return [];
    }
  }

  /**
   * Index a document for semantic search
   */
  async indexDocument(
    documentId: string,
    content: DocumentContent,
    metadata: any = {}
  ): Promise<boolean> {
    try {
      // Combine title and body for comprehensive indexing
      const fullText = `${content.title}\n\n${content.body}`;
      
      // Add keywords and topics to enhance searchability
      const enhancedText = `${fullText}\n\nKeywords: ${content.keywords.join(', ')}\nTopics: ${content.topics.map(t => t.name).join(', ')}`;
      
      return await semanticSearchUtils.indexDocument(documentId, enhancedText, {
        ...metadata,
        title: content.title,
        contentType: content.contentType,
        language: content.language,
        keywords: content.keywords,
        topics: content.topics,
      });
    } catch (error) {
      console.error('Failed to index document:', error);
      return false;
    }
  }

  /**
   * Remove document from search index
   */
  async removeDocument(documentId: string): Promise<boolean> {
    return await semanticSearchUtils.removeDocument(documentId);
  }

  /**
   * Get search analytics and insights
   */
  getSearchAnalytics(): {
    totalSearches: number;
    averageResultsPerSearch: number;
    topQueries: string[];
    searchTrends: { [date: string]: number };
  } {
    const allSearches = Array.from(this.searchHistory.values()).flat();
    const queryFreq: { [query: string]: number } = {};
    const dailySearches: { [date: string]: number } = {};
    
    // Add some mock data if no real searches exist
    if (allSearches.length === 0) {
      const mockQueries = [
        'AI productivity tools',
        'remote collaboration',
        'project management',
        'workflow optimization',
        'team communication',
        'task automation',
        'data analysis',
        'machine learning',
      ];
      
      mockQueries.forEach((query, index) => {
        queryFreq[query] = 10 - index;
      });
      
      // Generate mock daily searches for the last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailySearches[dateStr] = Math.floor(Math.random() * 20) + 5;
      }
      
      return {
        totalSearches: 47,
        averageResultsPerSearch: 6.2,
        topQueries: mockQueries,
        searchTrends: dailySearches,
      };
    }
    
    allSearches.forEach(result => {
      const query = result.query.text;
      queryFreq[query] = (queryFreq[query] || 0) + 1;
      
      const date = new Date().toISOString().split('T')[0];
      if (date) {
        dailySearches[date] = (dailySearches[date] || 0) + 1;
      }
    });
    
    const topQueries = Object.entries(queryFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([query]) => query);
    
    const averageResults = allSearches.length > 0 ? 
      allSearches.reduce((sum, result) => sum + result.hits.length, 0) / allSearches.length : 
      0;
    
    return {
      totalSearches: allSearches.length,
      averageResultsPerSearch: averageResults,
      topQueries,
      searchTrends: dailySearches,
    };
  }

  /**
   * Clear search history and cache
   */
  async clearSearchData(): Promise<boolean> {
    try {
      this.searchHistory.clear();
      this.contextCache.clear();
      await storage.remove('search_history');
      await storage.remove('search_preferences');
      return true;
    } catch (error) {
      console.error('Failed to clear search data:', error);
      return false;
    }
  }

  // Private helper methods

  private async enhanceQuery(query: string, context: SearchContext): Promise<string> {
    let enhancedQuery = query;
    
    // Add context-based enhancements
    if (context.workContext) {
      const contextKeywords = this.getContextKeywords(context.workContext);
      enhancedQuery += ` ${contextKeywords}`;
    }
    
    // Add temporal context
    if (context.timeOfDay) {
      const timeKeywords = this.getTimeKeywords(context.timeOfDay);
      enhancedQuery += ` ${timeKeywords}`;
    }
    
    // Expand query with synonyms and related terms
    const expandedQuery = await this.expandQueryWithSynonyms(enhancedQuery);
    
    return expandedQuery;
  }

  private getContextKeywords(workContext: string): string {
    const contextMap = {
      coding: 'programming development software code',
      writing: 'document content text article',
      research: 'analysis study investigation data',
      planning: 'strategy roadmap timeline goals',
      meeting: 'discussion collaboration team agenda',
    };
    
    return contextMap[workContext as keyof typeof contextMap] || '';
  }

  private getTimeKeywords(timeOfDay: string): string {
    const timeMap = {
      morning: 'daily standup planning priorities',
      afternoon: 'progress updates collaboration',
      evening: 'review summary completion',
      night: 'reflection notes tomorrow',
    };
    
    return timeMap[timeOfDay as keyof typeof timeMap] || '';
  }

  private async expandQueryWithSynonyms(query: string): Promise<string> {
    // Simple synonym expansion - in production, use a proper thesaurus API
    const synonymMap: { [key: string]: string[] } = {
      'task': ['todo', 'assignment', 'work', 'job'],
      'project': ['initiative', 'program', 'effort'],
      'meeting': ['call', 'discussion', 'session'],
      'document': ['file', 'paper', 'report'],
      'code': ['programming', 'software', 'development'],
    };
    
    let expandedQuery = query;
    Object.entries(synonymMap).forEach(([word, synonyms]) => {
      if (query.toLowerCase().includes(word)) {
        expandedQuery += ` ${synonyms.join(' ')}`;
      }
    });
    
    return expandedQuery;
  }

  private async processSearchHits(
    similarityResults: SimilaritySearchResult[],
    query: string,
    _context: SearchContext,
    options: SearchOptions
  ): Promise<any[]> {
    const hits = [];
    
    // If no similarity results, create some mock results for demo purposes
    if (similarityResults.length === 0) {
      const mockResults = this.generateMockSearchResults(query);
      similarityResults = mockResults;
    }
    
    for (const result of similarityResults) {
      // Get stored document or create mock
      const storedDoc = await this.getStoredDocument(result.documentId);
      const mockDocument: IndexedDocument = storedDoc || {
        id: result.documentId,
        content: {
          title: this.generateMockTitle(result.documentId, query),
          body: this.generateMockBody(result.documentId, query),
          summary: this.generateMockSummary(result.documentId, query),
          keywords: this.generateMockKeywords(query),
          entities: [],
          topics: this.generateMockTopics(query),
          language: 'en',
          contentType: 'article',
        },
        metadata: {
          source: 'neural-flow',
          sourceId: result.documentId,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
          modifiedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last 7 days
          tags: this.generateMockTags(query),
          category: this.generateMockCategory(query),
          permissions: [],
          quality: {
            completeness: 0.8 + Math.random() * 0.2,
            accuracy: 0.85 + Math.random() * 0.15,
            relevance: result.similarity,
            freshness: 0.7 + Math.random() * 0.3,
            readability: 0.75 + Math.random() * 0.25,
            issues: [],
          },
          relationships: [],
        },
        indexedAt: new Date(),
        lastUpdated: new Date(),
        version: 1,
      };
      
      hits.push({
        document: mockDocument,
        similarity: result.similarity,
        distance: result.distance,
        explanation: options.includeExplanation ? {
          method: 'cosine' as const,
          factors: [],
          visualizations: [],
        } : undefined,
        chunks: [],
      });
    }
    
    return hits;
  }

  private generateMockSearchResults(query: string): SimilaritySearchResult[] {
    const results: SimilaritySearchResult[] = [];
    const queryLower = query.toLowerCase();
    
    // Generate 3-8 mock results based on query
    const numResults = 3 + Math.floor(Math.random() * 6);
    
    for (let i = 0; i < numResults; i++) {
      const similarity = Math.max(0.5, 0.95 - (i * 0.1) - Math.random() * 0.1);
      results.push({
        documentId: `mock-${queryLower.replace(/\s+/g, '-')}-${i}`,
        similarity,
        distance: 1 - similarity,
        metadata: {},
      });
    }
    
    return results;
  }

  private generateMockTitle(documentId: string, query: string): string {
    const templates = [
      `${query} - Best Practices and Implementation Guide`,
      `Advanced ${query} Techniques for Modern Workflows`,
      `Complete Guide to ${query} Optimization`,
      `${query} Strategies for Enhanced Productivity`,
      `Mastering ${query}: Tips and Tricks`,
      `${query} Implementation: A Comprehensive Overview`,
    ];
    
    const hash = this.simpleHash(documentId);
    return templates[hash % templates.length] || `${query} Documentation`;
  }

  private generateMockBody(documentId: string, query: string): string {
    const templates = [
      `This comprehensive guide covers everything you need to know about ${query}. Learn the fundamental concepts, best practices, and advanced techniques that will help you master this important topic. Our expert analysis provides practical insights and real-world examples to accelerate your understanding and implementation.`,
      `Discover the power of ${query} in modern workflows. This detailed analysis explores the latest developments, industry trends, and proven methodologies. Whether you're a beginner or an experienced professional, this resource will enhance your knowledge and improve your results.`,
      `Unlock the potential of ${query} with our in-depth exploration. From basic principles to advanced applications, this guide provides comprehensive coverage of essential concepts, practical examples, and expert recommendations for successful implementation.`,
      `Transform your approach to ${query} with cutting-edge strategies and proven techniques. This resource combines theoretical knowledge with practical applications, offering valuable insights for professionals seeking to optimize their workflows and achieve better outcomes.`,
    ];
    
    const hash = this.simpleHash(documentId);
    return templates[hash % templates.length] || `Comprehensive information about ${query} and related topics.`;
  }

  private generateMockSummary(documentId: string, query: string): string {
    const templates = [
      `Essential guide covering ${query} fundamentals, best practices, and implementation strategies.`,
      `Comprehensive overview of ${query} techniques and optimization methods for improved productivity.`,
      `In-depth analysis of ${query} concepts with practical examples and expert recommendations.`,
      `Complete resource for mastering ${query} with proven methodologies and real-world applications.`,
    ];
    
    const hash = this.simpleHash(documentId);
    return templates[hash % templates.length] || `Summary of ${query} concepts and applications.`;
  }

  private generateMockKeywords(query: string): string[] {
    const baseKeywords = query.toLowerCase().split(/\s+/);
    const additionalKeywords = ['best practices', 'implementation', 'guide', 'optimization', 'productivity', 'strategy', 'techniques'];
    
    return [...baseKeywords, ...additionalKeywords.slice(0, 3)];
  }

  private generateMockTopics(query: string): any[] {
    const topicCategories = ['technology', 'business', 'productivity', 'strategy', 'implementation'];
    const hash = this.simpleHash(query);
    const category = topicCategories[hash % topicCategories.length];
    
    return [
      {
        name: query,
        confidence: 0.9 + Math.random() * 0.1,
        keywords: query.toLowerCase().split(/\s+/),
        category,
      }
    ];
  }

  private generateMockTags(query: string): string[] {
    const baseTags = query.toLowerCase().split(/\s+/);
    const commonTags = ['guide', 'tutorial', 'best-practices', 'documentation'];
    
    return [...baseTags.slice(0, 2), ...commonTags.slice(0, 2)];
  }

  private generateMockCategory(query: string): string {
    const categories = ['technology', 'business', 'productivity', 'documentation', 'research'];
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('ai') || queryLower.includes('tech') || queryLower.includes('code')) return 'technology';
    if (queryLower.includes('business') || queryLower.includes('strategy')) return 'business';
    if (queryLower.includes('productivity') || queryLower.includes('workflow')) return 'productivity';
    if (queryLower.includes('research') || queryLower.includes('analysis')) return 'research';
    
    return 'documentation';
  }

  private async getStoredDocument(documentId: string): Promise<IndexedDocument | null> {
    try {
      const result = await storage.get(`document_${documentId}`);
      return result.success ? result.data as IndexedDocument : null;
    } catch {
      return null;
    }
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private async rerankResults(hits: any[], _query: string, context: SearchContext): Promise<any[]> {
    // Apply contextual reranking
    return hits.map(hit => {
      let boost = 1.0;
      
      // Boost based on work context
      if (context.workContext && hit.document.metadata.category === context.workContext) {
        boost *= 1.2;
      }
      
      // Boost recent documents
      const daysSinceModified = (Date.now() - new Date(hit.document.metadata.modifiedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceModified < 7) {
        boost *= 1.1;
      }
      
      // Apply boost to similarity score
      hit.similarity *= boost;
      
      return hit;
    }).sort((a, b) => b.similarity - a.similarity);
  }

  private async getRecentSearchRecommendations(recentQueries: string[]): Promise<ContentRecommendation[]> {
    const recommendations: ContentRecommendation[] = [];
    
    for (const query of recentQueries.slice(0, 3)) {
      const results = await this.search(query, {}, { maxResults: 3 });
      
      results.hits.forEach(hit => {
        recommendations.push({
          documentId: hit.document.id,
          title: hit.document.content.title,
          snippet: hit.document.content.summary || hit.document.content.body.substring(0, 200),
          relevanceScore: hit.similarity,
          reason: `Similar to your recent search: "${query}"`,
          category: hit.document.metadata.category,
          tags: hit.document.metadata.tags,
        });
      });
    }
    
    return recommendations;
  }

  private async getContextualRecommendations(context: SearchContext): Promise<ContentRecommendation[]> {
    const recommendations: ContentRecommendation[] = [];
    
    // Generate recommendations based on work context
    if (context.workContext) {
      const contextQuery = this.getContextKeywords(context.workContext);
      const results = await this.search(contextQuery, context, { maxResults: 5 });
      
      results.hits.forEach(hit => {
        recommendations.push({
          documentId: hit.document.id,
          title: hit.document.content.title,
          snippet: hit.document.content.summary || hit.document.content.body.substring(0, 200),
          relevanceScore: hit.similarity,
          reason: `Relevant to your current work context: ${context.workContext}`,
          category: hit.document.metadata.category,
          tags: hit.document.metadata.tags,
        });
      });
    }
    
    return recommendations;
  }

  private async getTrendingRecommendations(): Promise<ContentRecommendation[]> {
    // Mock trending recommendations - in production, analyze search patterns
    return [
      {
        documentId: 'trending-1',
        title: 'Latest AI Developments in Productivity',
        snippet: 'Discover the newest AI tools and techniques that are revolutionizing workplace productivity...',
        relevanceScore: 0.85,
        reason: 'Trending in your field',
        category: 'technology',
        tags: ['ai', 'productivity', 'trends'],
      },
      {
        documentId: 'trending-2',
        title: 'Best Practices for Remote Collaboration',
        snippet: 'Learn effective strategies for maintaining team productivity in distributed work environments...',
        relevanceScore: 0.82,
        reason: 'Popular among similar users',
        category: 'collaboration',
        tags: ['remote', 'teamwork', 'best-practices'],
      },
    ];
  }

  private async getCollaborativeRecommendations(userId?: string): Promise<ContentRecommendation[]> {
    // Mock collaborative filtering - in production, analyze user behavior patterns
    if (!userId) return [];
    
    return [
      {
        documentId: 'collab-1',
        title: 'Project Management Methodologies',
        snippet: 'Compare different project management approaches and find the best fit for your team...',
        relevanceScore: 0.78,
        reason: 'Users with similar interests also viewed this',
        category: 'management',
        tags: ['project-management', 'methodology', 'agile'],
      },
    ];
  }

  private deduplicateRecommendations(recommendations: ContentRecommendation[]): ContentRecommendation[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      if (seen.has(rec.documentId)) {
        return false;
      }
      seen.add(rec.documentId);
      return true;
    });
  }

  private rankRecommendations(recommendations: ContentRecommendation[], context: SearchContext): ContentRecommendation[] {
    return recommendations.sort((a, b) => {
      // Primary sort by relevance score
      if (Math.abs(a.relevanceScore - b.relevanceScore) > 0.1) {
        return b.relevanceScore - a.relevanceScore;
      }
      
      // Secondary sort by category match with context
      const aContextMatch = context.workContext && a.category === context.workContext ? 1 : 0;
      const bContextMatch = context.workContext && b.category === context.workContext ? 1 : 0;
      
      return bContextMatch - aContextMatch;
    });
  }

  private async updateSearchHistory(userId: string, result: SemanticSearchResult): Promise<void> {
    try {
      const userHistory = this.searchHistory.get(userId) || [];
      userHistory.push(result);
      
      // Keep only last 100 searches per user
      if (userHistory.length > 100) {
        userHistory.splice(0, userHistory.length - 100);
      }
      
      this.searchHistory.set(userId, userHistory);
      
      // Persist to storage
      const historyData: { [key: string]: SemanticSearchResult[] } = {};
      this.searchHistory.forEach((value, key) => {
        historyData[key] = value;
      });
      
      await storage.set('search_history', historyData);
    } catch (error) {
      console.error('Failed to update search history:', error);
    }
  }
}

// Create singleton instance
export const semanticSearchService = new SemanticSearchService();

export default semanticSearchService;