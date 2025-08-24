// Intelligent search interface component for Neural Flow
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Filter, Sparkles, Clock, TrendingUp, BookOpen, Zap } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { semanticSearchService, SearchContext, ContentRecommendation } from '../../services/search/SemanticSearchService';
import { SemanticSearchResult, SemanticHit } from '../../types/search';

interface SearchFilters {
  category?: string;
  dateRange?: 'today' | 'week' | 'month' | 'year' | 'all';
  contentType?: string;
  minRelevance?: number;
}

interface IntelligentSearchProps {
  onResultSelect?: (result: SemanticHit) => void;
  onRecommendationSelect?: (recommendation: ContentRecommendation) => void;
  context?: Partial<SearchContext>;
  className?: string;
}

export const IntelligentSearchInterface: React.FC<IntelligentSearchProps> = ({
  onResultSelect,
  onRecommendationSelect,
  context = {},
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SemanticSearchResult | null>(null);
  const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Load search history and recommendations on mount
  useEffect(() => {
    loadSearchHistory();
    loadRecommendations();
  }, []);

  // Generate search suggestions as user types
  useEffect(() => {
    if (query.length > 2) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(() => {
        generateSearchSuggestions(query);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const loadSearchHistory = useCallback(async () => {
    try {
      const analytics = semanticSearchService.getSearchAnalytics();
      setSearchHistory(analytics.topQueries.slice(0, 5));
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  const loadRecommendations = useCallback(async () => {
    try {
      const searchContext: SearchContext = {
        userId: 'current-user',
        workContext: 'research',
        timeOfDay: 'afternoon',
        recentQueries: searchHistory,
        ...context,
      };
      
      const recs = await semanticSearchService.getContentRecommendations(searchContext, 6);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  }, [context, searchHistory]);

  const generateSearchSuggestions = useCallback(async (searchQuery: string) => {
    // Mock search suggestions - in production, use search analytics and NLP
    const mockSuggestions = [
      `${searchQuery} best practices`,
      `${searchQuery} tutorial`,
      `${searchQuery} examples`,
      `${searchQuery} documentation`,
      `how to ${searchQuery}`,
    ];
    
    setSuggestions(mockSuggestions);
    setShowSuggestions(true);
  }, []);

  const handleSearch = useCallback(async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setShowSuggestions(false);
    
    try {
      const searchContext: SearchContext = {
        userId: 'current-user',
        workContext: context.workContext || 'research',
        timeOfDay: context.timeOfDay || 'afternoon',
        recentQueries: searchHistory,
        ...context,
      };
      
      const results = await semanticSearchService.search(
        searchQuery,
        searchContext,
        {
          threshold: filters.minRelevance || 0.7,
          maxResults: 20,
          includeExplanation: true,
          rerank: true,
          contextualBoost: true,
        }
      );
      
      setSearchResults(results);
      
      // Update search history
      const updatedHistory = [searchQuery, ...searchHistory.filter(q => q !== searchQuery)].slice(0, 10);
      setSearchHistory(updatedHistory);
      
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [query, filters, context, searchHistory]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  };

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    if (query.trim()) {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResults(null);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const formatRelevanceScore = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  const getRelevanceColor = (score: number): string => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-blue-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className={`intelligent-search-interface ${className}`}>
      {/* Search Input */}
      <div className="relative mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => query.length > 2 && setShowSuggestions(true)}
            placeholder="Search with natural language... (e.g., 'show me recent AI productivity tools')"
            className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            disabled={isSearching}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <Filter className="w-4 h-4" />
            </Button>
            {query && (
              <Button
                onClick={clearSearch}
                variant="ghost"
                size="sm"
                className="p-2"
              >
                ×
              </Button>
            )}
            <Button
              onClick={() => handleSearch()}
              disabled={isSearching || !query.trim()}
              className="px-4 py-2"
            >
              {isSearching ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
              >
                <Search className="inline w-4 h-4 mr-2 text-gray-400" />
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Filters */}
      {showFilters && (
        <Card className="mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange({ category: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Categories</option>
                <option value="technology">Technology</option>
                <option value="business">Business</option>
                <option value="research">Research</option>
                <option value="documentation">Documentation</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={filters.dateRange || 'all'}
                onChange={(e) => handleFilterChange({ dateRange: e.target.value as any })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
              <select
                value={filters.contentType || ''}
                onChange={(e) => handleFilterChange({ contentType: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Types</option>
                <option value="document">Documents</option>
                <option value="code">Code</option>
                <option value="presentation">Presentations</option>
                <option value="note">Notes</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Relevance</label>
              <select
                value={filters.minRelevance || 0.7}
                onChange={(e) => handleFilterChange({ minRelevance: parseFloat(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value={0.5}>50%+</option>
                <option value={0.7}>70%+</option>
                <option value={0.8}>80%+</option>
                <option value={0.9}>90%+</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Results */}
        <div className="lg:col-span-2">
          {searchResults ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Search Results ({searchResults.hits.length})
                </h2>
                <div className="text-sm text-gray-500">
                  {searchResults.executionTime}ms
                </div>
              </div>
              
              {searchResults.hits.length === 0 ? (
                <Card className="p-8 text-center">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600">
                    Try adjusting your search terms or filters to find what you're looking for.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {searchResults.hits.map((hit, index) => (
                    <Card
                      key={hit.document.id}
                      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => onResultSelect?.(hit)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-medium text-blue-600 hover:text-blue-800">
                          {hit.document.content.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="secondary"
                            className={getRelevanceColor(hit.similarity)}
                          >
                            {formatRelevanceScore(hit.similarity)}
                          </Badge>
                          <Badge variant="outline">
                            {hit.document.metadata.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {hit.document.content.summary || hit.document.content.body.substring(0, 200) + '...'}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>
                            {new Date(hit.document.metadata.modifiedAt).toLocaleDateString()}
                          </span>
                          <span>
                            {hit.document.content.contentType}
                          </span>
                        </div>
                        
                        {hit.document.content.keywords.length > 0 && (
                          <div className="flex items-center space-x-1">
                            {hit.document.content.keywords.slice(0, 3).map((keyword, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Search History */
            searchHistory.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center mb-4">
                  <Clock className="w-5 h-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-medium">Recent Searches</h3>
                </div>
                <div className="space-y-2">
                  {searchHistory.map((historyQuery, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(historyQuery);
                        handleSearch(historyQuery);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 text-gray-700"
                    >
                      {historyQuery}
                    </button>
                  ))}
                </div>
              </Card>
            )
          )}
        </div>

        {/* Recommendations Sidebar */}
        <div>
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-5 h-5 text-blue-500 mr-2" />
              <h3 className="text-lg font-medium">Recommended for You</h3>
            </div>
            
            {recommendations.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">
                  Start searching to get personalized recommendations
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-blue-200 pl-4 cursor-pointer hover:border-blue-400 transition-colors"
                    onClick={() => onRecommendationSelect?.(rec)}
                  >
                    <h4 className="font-medium text-sm text-blue-600 hover:text-blue-800 mb-1">
                      {rec.title}
                    </h4>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {rec.snippet}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {formatRelevanceScore(rec.relevanceScore)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {rec.reason}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IntelligentSearchInterface;