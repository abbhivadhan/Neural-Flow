// Integration test for search functionality
import { describe, it, expect, beforeEach } from 'vitest';
import { semanticSearchService } from '../SemanticSearchService';
import { documentIndexingService } from '../DocumentIndexingService';
import { DocumentContent } from '../../../types/search';

describe('Search Integration', () => {
  beforeEach(async () => {
    // Clear any existing data
    await semanticSearchService.clearSearchData();
    await documentIndexingService.rebuildIndex();
  });

  it('should index and search documents end-to-end', async () => {
    // Arrange - Create test documents
    const testDocuments = [
      {
        id: 'doc1',
        content: {
          title: 'AI Productivity Tools',
          body: 'Artificial intelligence is transforming productivity with automated workflows and intelligent task management.',
          keywords: ['AI', 'productivity', 'automation'],
          entities: [],
          topics: [],
          language: 'en',
          contentType: 'article',
        } as DocumentContent,
      },
      {
        id: 'doc2',
        content: {
          title: 'Remote Work Best Practices',
          body: 'Remote work requires effective communication, proper tools, and structured processes for team collaboration.',
          keywords: ['remote', 'work', 'collaboration'],
          entities: [],
          topics: [],
          language: 'en',
          contentType: 'guide',
        } as DocumentContent,
      },
    ];

    // Act - Index documents
    for (const doc of testDocuments) {
      const indexResult = await documentIndexingService.indexDocument(
        doc.id,
        doc.content
      );
      expect(indexResult.success).toBe(true);
    }

    // Wait a bit for indexing to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Act - Search for documents
    const searchResult = await semanticSearchService.search(
      'artificial intelligence productivity',
      {
        userId: 'test-user',
        workContext: 'research',
        timeOfDay: 'afternoon',
        recentQueries: [],
      }
    );

    // Assert - Verify search results
    expect(searchResult).toBeDefined();
    expect(searchResult.hits).toBeDefined();
    expect(searchResult.executionTime).toBeGreaterThan(0);
    expect(searchResult.modelUsed).toBe('all-MiniLM-L6-v2');
  });

  it('should generate content recommendations', async () => {
    // Act - Get recommendations
    const recommendations = await semanticSearchService.getContentRecommendations(
      {
        userId: 'test-user',
        workContext: 'research',
        timeOfDay: 'afternoon',
        recentQueries: ['AI tools', 'productivity'],
      },
      5
    );

    // Assert - Verify recommendations structure
    expect(Array.isArray(recommendations)).toBe(true);
    
    if (recommendations.length > 0) {
      const rec = recommendations[0];
      expect(rec).toHaveProperty('documentId');
      expect(rec).toHaveProperty('title');
      expect(rec).toHaveProperty('snippet');
      expect(rec).toHaveProperty('relevanceScore');
      expect(rec).toHaveProperty('reason');
      expect(rec).toHaveProperty('category');
      expect(rec).toHaveProperty('tags');
    }
  });

  it('should provide search analytics', () => {
    // Act - Get analytics
    const analytics = semanticSearchService.getSearchAnalytics();

    // Assert - Verify analytics structure
    expect(analytics).toBeDefined();
    expect(analytics).toHaveProperty('totalSearches');
    expect(analytics).toHaveProperty('averageResultsPerSearch');
    expect(analytics).toHaveProperty('topQueries');
    expect(analytics).toHaveProperty('searchTrends');
    expect(typeof analytics.totalSearches).toBe('number');
    expect(Array.isArray(analytics.topQueries)).toBe(true);
    expect(typeof analytics.searchTrends).toBe('object');
  });

  it('should provide indexing statistics', () => {
    // Act - Get indexing stats
    const stats = documentIndexingService.getIndexingStats();

    // Assert - Verify stats structure
    expect(stats).toBeDefined();
    expect(stats).toHaveProperty('totalDocuments');
    expect(stats).toHaveProperty('totalChunks');
    expect(stats).toHaveProperty('totalEmbeddings');
    expect(stats).toHaveProperty('averageProcessingTime');
    expect(stats).toHaveProperty('indexSize');
    expect(stats).toHaveProperty('lastUpdated');
    expect(typeof stats.totalDocuments).toBe('number');
    expect(stats.lastUpdated).toBeInstanceOf(Date);
  });
});