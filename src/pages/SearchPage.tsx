// Search page showcasing advanced semantic search capabilities
import React, { useState, useEffect } from 'react';
import { Search, Database, Zap, TrendingUp, BookOpen, Filter } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import IntelligentSearchInterface from '../components/search/IntelligentSearchInterface';
import { semanticSearchService, ContentRecommendation } from '../services/search/SemanticSearchService';
import { documentIndexingService } from '../services/search/DocumentIndexingService';
import { SemanticHit } from '../types/search';

const SearchPage: React.FC = () => {
  const [selectedResult, setSelectedResult] = useState<SemanticHit | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<ContentRecommendation | null>(null);
  const [searchAnalytics, setSearchAnalytics] = useState<any>(null);
  const [indexingStats, setIndexingStats] = useState<any>(null);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    loadAnalytics();
    loadIndexingStats();
    initializeDemoData();
  }, []);

  const loadAnalytics = async () => {
    try {
      const analytics = semanticSearchService.getSearchAnalytics();
      setSearchAnalytics(analytics);
    } catch (error) {
      console.error('Failed to load search analytics:', error);
    }
  };

  const loadIndexingStats = async () => {
    try {
      const stats = documentIndexingService.getIndexingStats();
      setIndexingStats(stats);
    } catch (error) {
      console.error('Failed to load indexing stats:', error);
    }
  };

  const initializeDemoData = async () => {
    try {
      // Index some demo documents for testing
      const demoDocuments = [
        {
          id: 'demo-ai-productivity',
          content: {
            title: 'AI-Powered Productivity Tools for Modern Workplaces',
            body: 'Artificial intelligence is revolutionizing how we work, offering unprecedented opportunities to enhance productivity and streamline workflows. From intelligent task management to automated content generation, AI tools are becoming essential for competitive advantage. This comprehensive guide explores the latest AI productivity solutions, including machine learning algorithms for priority optimization, natural language processing for document analysis, and predictive analytics for resource planning. Learn how to integrate these cutting-edge technologies into your daily workflow and achieve remarkable efficiency gains.',
            keywords: ['AI', 'productivity', 'automation', 'machine learning', 'workflow optimization'],
            entities: [],
            topics: [
              { name: 'Artificial Intelligence', confidence: 0.95, keywords: ['AI', 'machine learning'], category: 'technology' },
              { name: 'Productivity', confidence: 0.90, keywords: ['efficiency', 'workflow'], category: 'business' }
            ],
            language: 'en',
            contentType: 'article',
          },
          metadata: {
            category: 'technology',
            tags: ['ai', 'productivity', 'automation'],
          }
        },
        {
          id: 'demo-remote-collaboration',
          content: {
            title: 'Best Practices for Remote Team Collaboration',
            body: 'Remote work has become the new normal, requiring teams to adapt their collaboration strategies for distributed environments. Effective remote collaboration depends on clear communication protocols, robust project management systems, and the right technology stack. This guide covers essential tools and techniques for maintaining team cohesion, including video conferencing best practices, asynchronous communication strategies, and collaborative document editing workflows. Discover how to build trust, maintain accountability, and foster innovation in virtual team settings.',
            keywords: ['remote work', 'collaboration', 'team management', 'communication', 'virtual teams'],
            entities: [],
            topics: [
              { name: 'Remote Work', confidence: 0.92, keywords: ['remote', 'distributed'], category: 'work' },
              { name: 'Team Collaboration', confidence: 0.88, keywords: ['teamwork', 'communication'], category: 'management' }
            ],
            language: 'en',
            contentType: 'guide',
          },
          metadata: {
            category: 'collaboration',
            tags: ['remote', 'teamwork', 'communication'],
          }
        },
        {
          id: 'demo-project-management',
          content: {
            title: 'Agile Project Management Methodologies Comparison',
            body: 'Choosing the right project management methodology is crucial for project success. This comprehensive comparison examines popular agile frameworks including Scrum, Kanban, and Lean, analyzing their strengths, weaknesses, and ideal use cases. Learn about sprint planning, backlog management, daily standups, and retrospectives. Understand how to select the most appropriate methodology based on team size, project complexity, and organizational culture. Includes practical implementation tips and common pitfalls to avoid.',
            keywords: ['agile', 'scrum', 'kanban', 'project management', 'methodology'],
            entities: [],
            topics: [
              { name: 'Project Management', confidence: 0.94, keywords: ['agile', 'scrum'], category: 'management' },
              { name: 'Methodology', confidence: 0.87, keywords: ['framework', 'process'], category: 'process' }
            ],
            language: 'en',
            contentType: 'comparison',
          },
          metadata: {
            category: 'management',
            tags: ['agile', 'scrum', 'methodology'],
          }
        }
      ];

      // Index demo documents
      for (const doc of demoDocuments) {
        try {
          await documentIndexingService.indexDocument(
            doc.id,
            doc.content,
            doc.metadata
          );
        } catch (error) {
          console.warn(`Failed to index document ${doc.id}:`, error);
        }
      }

      // Refresh stats after indexing
      setTimeout(() => {
        loadIndexingStats();
      }, 1000);
    } catch (error) {
      console.error('Failed to initialize demo data:', error);
    }
  };

  const handleResultSelect = (result: SemanticHit) => {
    setSelectedResult(result);
    setSelectedRecommendation(null);
  };

  const handleRecommendationSelect = (recommendation: ContentRecommendation) => {
    setSelectedRecommendation(recommendation);
    setSelectedResult(null);
  };

  const runSearchDemo = async () => {
    setShowDemo(true);
    
    // Simulate a series of demo searches
    const demoQueries = [
      'AI productivity tools',
      'remote team collaboration',
      'agile project management',
      'machine learning workflow optimization'
    ];

    for (const query of demoQueries) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // The search interface will handle the actual searching
    }
    
    setTimeout(() => {
      loadAnalytics();
      setShowDemo(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Search className="w-8 h-8 text-blue-600 mr-3" />
                Intelligent Search & Discovery
              </h1>
              <p className="text-gray-600 mt-2">
                Advanced semantic search with AI-powered content recommendations
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={runSearchDemo}
                disabled={showDemo}
                className="flex items-center"
              >
                {showDemo ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                {showDemo ? 'Running Demo...' : 'Run Demo'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <Database className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Indexed Documents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {indexingStats?.totalDocuments || 0}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Search className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Searches</p>
                <p className="text-2xl font-bold text-gray-900">
                  {searchAnalytics?.totalSearches || 0}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Results</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(searchAnalytics?.averageResultsPerSearch || 0)}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Filter className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Vector Embeddings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {indexingStats?.totalEmbeddings || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Search Interface */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3">
            <Card className="p-6">
              <IntelligentSearchInterface
                onResultSelect={handleResultSelect}
                onRecommendationSelect={handleRecommendationSelect}
                context={{
                  userId: 'demo-user',
                  workContext: 'research',
                  timeOfDay: 'afternoon',
                }}
              />
            </Card>
          </div>

          {/* Selected Content Panel */}
          <div className="xl:col-span-1">
            {selectedResult && (
              <Card className="p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                  Selected Document
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-blue-600">
                      {selectedResult.document.content.title}
                    </h4>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="secondary">
                        {Math.round(selectedResult.similarity * 100)}% match
                      </Badge>
                      <Badge variant="outline">
                        {selectedResult.document.metadata.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    {selectedResult.document.content.summary || 
                     selectedResult.document.content.body.substring(0, 200) + '...'}
                  </p>
                  
                  {selectedResult.document.content.keywords.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Keywords:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedResult.document.content.keywords.map((keyword, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    <p>Modified: {new Date(selectedResult.document.metadata.modifiedAt).toLocaleDateString()}</p>
                    <p>Type: {selectedResult.document.content.contentType}</p>
                  </div>
                </div>
              </Card>
            )}

            {selectedRecommendation && (
              <Card className="p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Recommendation
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-green-600">
                      {selectedRecommendation.title}
                    </h4>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="secondary">
                        {Math.round(selectedRecommendation.relevanceScore * 100)}% relevant
                      </Badge>
                      <Badge variant="outline">
                        {selectedRecommendation.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    {selectedRecommendation.snippet}
                  </p>
                  
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Why recommended:</strong> {selectedRecommendation.reason}
                    </p>
                  </div>
                  
                  {selectedRecommendation.tags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedRecommendation.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Search Tips */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Search Tips</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>Use natural language queries like "show me AI productivity tools"</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>Search results are ranked by semantic similarity, not just keywords</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>Recommendations adapt to your search patterns and work context</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p>Use filters to narrow results by category, date, or relevance</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Popular Queries */}
        {searchAnalytics?.topQueries?.length > 0 && (
          <Card className="p-6 mt-8">
            <h3 className="text-lg font-semibold mb-4">Popular Search Queries</h3>
            <div className="flex flex-wrap gap-2">
              {searchAnalytics.topQueries.slice(0, 10).map((query: string, index: number) => (
                <Badge key={index} variant="outline" className="cursor-pointer hover:bg-gray-100">
                  {query}
                </Badge>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SearchPage;