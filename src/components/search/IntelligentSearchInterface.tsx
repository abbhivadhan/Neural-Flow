// Intelligent search interface component for Neural Flow
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Filter, Sparkles, Clock, TrendingUp, BookOpen, Zap, X } from 'lucide-react';
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
          threshold: filters.minRelevance || 0.5, // Lower threshold for demo
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
      // Set empty results on error
      setSearchResults({
        hits: [],
        query: {
          text: searchQuery,
          embedding: [],
          similarityThreshold: filters.minRelevance || 0.5,
          maxResults: 20,
          filters: [],
          rerank: true,
          explainSimilarity: true,
        },
        executionTime: 0,
        modelUsed: 'all-MiniLM-L6-v2',
      });
    } finally {
      setIsSearching(false);
    }
  }, [query, filters, context, searchHistory]);



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

  const getRelevanceBadgeVariant = (score: number): 'success' | 'default' | 'warning' | 'secondary' => {
    if (score >= 0.9) return 'success';
    if (score >= 0.7) return 'default';
    if (score >= 0.5) return 'warning';
    return 'secondary';
  };

  return (
    <div className={`intelligent-search-interface ${className}`}>
      {/* Search Input */}
      <div className="relative mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              } else if (e.key === 'Escape') {
                setShowSuggestions(false);
              }
            }}
            onFocus={() => query.length > 2 && setShowSuggestions(true)}
            placeholder="Search with natural language... (e.g., 'show me recent AI productivity tools')"
            className="w-full pl-12 pr-32 py-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm hover:shadow-md transition-all duration-200 placeholder:text-slate-500 dark:placeholder:text-slate-400"
            disabled={isSearching}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              <Filter className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </Button>
            {query && (
              <Button
                onClick={clearSearch}
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </Button>
            )}
            <Button
              onClick={() => handleSearch()}
              disabled={isSearching || !query.trim()}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl dark:shadow-slate-900/30 z-50 overflow-hidden">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors duration-150 border-b border-slate-100 dark:border-slate-700 last:border-b-0"
              >
                <Search className="inline w-4 h-4 mr-3 text-slate-400 dark:text-slate-500" />
                <span className="text-sm">{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Filters */}
      {showFilters && (
        <Card className="mb-6 p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Category</label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange({ category: e.target.value || '' })}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
              >
                <option value="">All Categories</option>
                <option value="technology">Technology</option>
                <option value="business">Business</option>
                <option value="research">Research</option>
                <option value="documentation">Documentation</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Date Range</label>
              <select
                value={filters.dateRange || 'all'}
                onChange={(e) => handleFilterChange({ dateRange: e.target.value as any })}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Content Type</label>
              <select
                value={filters.contentType || ''}
                onChange={(e) => handleFilterChange({ contentType: e.target.value || '' })}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
              >
                <option value="">All Types</option>
                <option value="document">Documents</option>
                <option value="code">Code</option>
                <option value="presentation">Presentations</option>
                <option value="note">Notes</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Min Relevance</label>
              <select
                value={filters.minRelevance || 0.7}
                onChange={(e) => handleFilterChange({ minRelevance: parseFloat(e.target.value) })}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
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
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                  Search Results ({searchResults.hits.length})
                </h2>
                <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                  {searchResults.executionTime}ms
                </div>
              </div>
              
              {searchResults.hits.length === 0 ? (
                <Card className="p-12 text-center bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                  <BookOpen className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">No results found</h3>
                  <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    Try adjusting your search terms or filters to find what you're looking for.
                  </p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {searchResults.hits.map((hit, index) => (
                    <Card
                      key={hit.document.id}
                      className="p-6 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-600 transition-all duration-200 cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 group"
                      onClick={() => onResultSelect?.(hit)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                          {hit.document.content.title}
                        </h3>
                        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                          <Badge
                            variant={getRelevanceBadgeVariant(hit.similarity)}
                            className="font-semibold"
                          >
                            {formatRelevanceScore(hit.similarity)}
                          </Badge>
                          <Badge variant="outline" className="bg-slate-50 dark:bg-slate-700">
                            {hit.document.metadata.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-3 leading-relaxed">
                        {hit.document.content.summary || hit.document.content.body.substring(0, 200) + '...'}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <span className="text-slate-500 dark:text-slate-400">
                            {new Date(hit.document.metadata.modifiedAt).toLocaleDateString()}
                          </span>
                          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium">
                            {hit.document.content.contentType}
                          </span>
                        </div>
                        
                        {hit.document.content.keywords.length > 0 && (
                          <div className="flex items-center space-x-2">
                            {hit.document.content.keywords.slice(0, 3).map((keyword, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
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
              <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <div className="flex items-center mb-4">
                  <Clock className="w-5 h-5 text-slate-500 dark:text-slate-400 mr-2" />
                  <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Recent Searches</h3>
                </div>
                <div className="space-y-2">
                  {searchHistory.map((historyQuery, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(historyQuery);
                        handleSearch(historyQuery);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors duration-150"
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
          <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center mb-6">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Recommended for You</h3>
            </div>
            
            {recommendations.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Start searching to get personalized recommendations based on your interests
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-blue-200 dark:border-blue-600 pl-4 cursor-pointer hover:border-blue-400 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-r-lg transition-all duration-200 py-3 group"
                    onClick={() => onRecommendationSelect?.(rec)}
                  >
                    <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 mb-2 line-clamp-2">
                      {rec.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-3 leading-relaxed">
                      {rec.snippet}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant={getRelevanceBadgeVariant(rec.relevanceScore)} className="text-xs">
                        {formatRelevanceScore(rec.relevanceScore)}
                      </Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
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