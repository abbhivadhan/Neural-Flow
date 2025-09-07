import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Sparkles, 
  FileText, 
  PenTool, 
  Zap, 
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Target,
  Lightbulb,
  BookOpen,
  Edit3,
  Download,
  Share2,
  Settings,
  RefreshCw,
  Play,
  Pause,
  BarChart3,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Wand2
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface ContentSuggestion {
  id: string;
  type: 'improvement' | 'generation' | 'optimization' | 'insight';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  category: string;
  preview?: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  timestamp: Date;
}

interface ContentMetrics {
  readabilityScore: number;
  engagementPrediction: number;
  seoScore: number;
  sentimentScore: number;
  wordCount: number;
  readingTime: number;
}

interface ContentAIPanelProps {
  className?: string;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  currentContent?: string;
  onContentUpdate?: (content: string) => void;
}

export const ContentAIPanel: React.FC<ContentAIPanelProps> = ({
  className = '',
  isExpanded = false,
  onToggleExpanded,
  currentContent = '',
  onContentUpdate
}) => {
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [metrics, setMetrics] = useState<ContentMetrics>({
    readabilityScore: 0,
    engagementPrediction: 0,
    seoScore: 0,
    sentimentScore: 0,
    wordCount: 0,
    readingTime: 0
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'metrics' | 'generate'>('suggestions');
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState('article');
  const [selectedTone, setSelectedTone] = useState('professional');
  
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize with sample suggestions
  useEffect(() => {
    const initialSuggestions: ContentSuggestion[] = [
      {
        id: '1',
        type: 'improvement',
        title: 'Enhance Readability',
        description: 'Consider breaking down long sentences for better readability',
        confidence: 0.85,
        impact: 'medium',
        category: 'Writing Quality',
        preview: 'Split complex sentences into shorter, more digestible parts',
        status: 'pending',
        timestamp: new Date(Date.now() - 300000)
      },
      {
        id: '2',
        type: 'optimization',
        title: 'SEO Optimization',
        description: 'Add relevant keywords to improve search visibility',
        confidence: 0.92,
        impact: 'high',
        category: 'SEO',
        preview: 'Include target keywords: "productivity", "collaboration", "AI"',
        status: 'pending',
        timestamp: new Date(Date.now() - 240000)
      },
      {
        id: '3',
        type: 'generation',
        title: 'Content Expansion',
        description: 'Generate additional sections to provide more comprehensive coverage',
        confidence: 0.78,
        impact: 'medium',
        category: 'Content Structure',
        preview: 'Add sections on implementation strategies and best practices',
        status: 'pending',
        timestamp: new Date(Date.now() - 180000)
      },
      {
        id: '4',
        type: 'insight',
        title: 'Engagement Boost',
        description: 'Add interactive elements to increase user engagement',
        confidence: 0.88,
        impact: 'high',
        category: 'User Experience',
        preview: 'Include call-to-action buttons and interactive examples',
        status: 'pending',
        timestamp: new Date(Date.now() - 120000)
      }
    ];
    
    setSuggestions(initialSuggestions);
  }, []);

  // Analyze content when it changes
  useEffect(() => {
    if (currentContent) {
      analyzeContent(currentContent);
    }
  }, [currentContent]);

  // Real-time analysis
  useEffect(() => {
    if (currentContent && currentContent.length > 0) {
      if (analysisIntervalRef.current) {
        clearTimeout(analysisIntervalRef.current);
      }
      
      analysisIntervalRef.current = setTimeout(() => {
        performRealTimeAnalysis(currentContent);
      }, 1000);
    }

    return () => {
      if (analysisIntervalRef.current) {
        clearTimeout(analysisIntervalRef.current);
      }
    };
  }, [currentContent]);

  const analyzeContent = async (content: string) => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    const newMetrics: ContentMetrics = {
      readabilityScore: Math.min(100, Math.max(0, 100 - (words.length / sentences.length) * 2)),
      engagementPrediction: Math.random() * 40 + 60, // 60-100%
      seoScore: Math.random() * 30 + 70, // 70-100%
      sentimentScore: Math.random() * 0.4 + 0.3, // 0.3-0.7 (neutral to positive)
      wordCount: words.length,
      readingTime: Math.ceil(words.length / 200) // Average reading speed
    };
    
    setMetrics(newMetrics);
    setIsAnalyzing(false);
  };

  const performRealTimeAnalysis = (content: string) => {
    // Generate dynamic suggestions based on content
    const newSuggestions: ContentSuggestion[] = [];
    
    if (content.length > 500) {
      newSuggestions.push({
        id: `dynamic-${Date.now()}-1`,
        type: 'improvement',
        title: 'Structure Enhancement',
        description: 'Consider adding subheadings to improve content structure',
        confidence: 0.82,
        impact: 'medium',
        category: 'Content Structure',
        status: 'pending',
        timestamp: new Date()
      });
    }
    
    if (content.split(/[.!?]+/).some(sentence => sentence.split(/\s+/).length > 25)) {
      newSuggestions.push({
        id: `dynamic-${Date.now()}-2`,
        type: 'improvement',
        title: 'Sentence Simplification',
        description: 'Some sentences are quite long and could be simplified',
        confidence: 0.89,
        impact: 'high',
        category: 'Readability',
        status: 'pending',
        timestamp: new Date()
      });
    }
    
    // Update suggestions with new dynamic ones
    setSuggestions(prev => [
      ...prev.filter(s => !s.id.startsWith('dynamic-')),
      ...newSuggestions
    ]);
  };

  const handleApplySuggestion = async (suggestionId: string) => {
    setSuggestions(prev => prev.map(s => 
      s.id === suggestionId 
        ? { ...s, status: 'processing' }
        : s
    ));

    // Simulate applying suggestion
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSuggestions(prev => prev.map(s => 
      s.id === suggestionId 
        ? { ...s, status: 'completed' }
        : s
    ));
  };

  const handleRejectSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.map(s => 
      s.id === suggestionId 
        ? { ...s, status: 'rejected' }
        : s
    ));
  };

  const handleGenerateContent = async () => {
    if (!generationPrompt.trim()) return;

    setIsGenerating(true);
    
    // Simulate AI content generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const sampleContent = `# ${generationPrompt}

This is AI-generated content based on your prompt: "${generationPrompt}". The content has been optimized for ${selectedTone} tone and ${selectedContentType} format.

## Key Points

• Comprehensive analysis of the topic
• Evidence-based recommendations
• Practical implementation strategies
• Real-world examples and case studies

## Detailed Analysis

The AI has analyzed current trends and best practices to provide you with relevant, engaging content that meets your specified requirements. This content is designed to be both informative and actionable.

## Conclusion

This generated content provides a solid foundation that you can further customize and expand based on your specific needs and audience requirements.`;

    setGeneratedContent(sampleContent);
    setIsGenerating(false);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'improvement': return PenTool;
      case 'generation': return Sparkles;
      case 'optimization': return Target;
      case 'insight': return Lightbulb;
      default: return FileText;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'low': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'processing': return RefreshCw;
      case 'rejected': return AlertCircle;
      default: return Clock;
    }
  };

  if (!isExpanded) {
    return (
      <motion.div
        className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 ${className}`}
        whileHover={{ scale: 1.02 }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Brain className="w-6 h-6 text-purple-500" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Content AI
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {suggestions.filter(s => s.status === 'pending').length} suggestions
                </p>
              </div>
            </div>
            <Button
              onClick={onToggleExpanded}
              variant="outline"
              size="sm"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Mini metrics */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {Math.round(metrics.readabilityScore)}
              </div>
              <div className="text-xs text-slate-500">Readability</div>
            </div>
            <div className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {Math.round(metrics.engagementPrediction)}%
              </div>
              <div className="text-xs text-slate-500">Engagement</div>
            </div>
            <div className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {Math.round(metrics.seoScore)}
              </div>
              <div className="text-xs text-slate-500">SEO</div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Brain className="w-6 h-6 text-purple-500" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                AI Content Assistant
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Intelligent writing assistance and optimization
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isAnalyzing && (
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
                <span className="text-sm text-slate-500">Analyzing...</span>
              </div>
            )}
            <Button
              onClick={onToggleExpanded}
              variant="outline"
              size="sm"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-4 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'suggestions'
                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Suggestions
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'metrics'
                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Metrics
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'generate'
                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Generate
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="h-96 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'suggestions' && (
            <motion.div
              key="suggestions"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-4 space-y-4"
            >
              {suggestions.map(suggestion => {
                const Icon = getSuggestionIcon(suggestion.type);
                const StatusIcon = getStatusIcon(suggestion.status);
                
                return (
                  <div
                    key={suggestion.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <Icon className="w-5 h-5 text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {suggestion.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <Badge className={`text-xs ${getImpactColor(suggestion.impact)}`}>
                              {suggestion.impact}
                            </Badge>
                            <StatusIcon className={`w-4 h-4 ${
                              suggestion.status === 'completed' ? 'text-green-500' :
                              suggestion.status === 'processing' ? 'text-blue-500 animate-spin' :
                              suggestion.status === 'rejected' ? 'text-red-500' :
                              'text-slate-400'
                            }`} />
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {suggestion.description}
                        </p>
                        {suggestion.preview && (
                          <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-400">
                            {suggestion.preview}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-slate-500">
                              {Math.round(suggestion.confidence * 100)}% confidence
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">
                              {suggestion.category}
                            </span>
                          </div>
                          {suggestion.status === 'pending' && (
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => handleRejectSuggestion(suggestion.id)}
                                variant="outline"
                                size="sm"
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </Button>
                              <Button
                                onClick={() => handleApplySuggestion(suggestion.id)}
                                size="sm"
                              >
                                <ThumbsUp className="w-3 h-3 mr-1" />
                                Apply
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'metrics' && (
            <motion.div
              key="metrics"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-4 space-y-4"
            >
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(metrics.readabilityScore)}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Readability Score</div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${metrics.readabilityScore}%` }}
                    />
                  </div>
                </div>

                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Math.round(metrics.engagementPrediction)}%
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Engagement</div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${metrics.engagementPrediction}%` }}
                    />
                  </div>
                </div>

                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.round(metrics.seoScore)}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">SEO Score</div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${metrics.seoScore}%` }}
                    />
                  </div>
                </div>

                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {(metrics.sentimentScore * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Sentiment</div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-orange-600 dark:bg-orange-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${metrics.sentimentScore * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {metrics.wordCount}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Words</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {metrics.readingTime} min
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Reading Time</div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'generate' && (
            <motion.div
              key="generate"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-4 space-y-4"
            >
              {/* Generation Controls */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Content Type
                    </label>
                    <select
                      value={selectedContentType}
                      onChange={(e) => setSelectedContentType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="article">Article</option>
                      <option value="blog">Blog Post</option>
                      <option value="email">Email</option>
                      <option value="social">Social Media</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Tone
                    </label>
                    <select
                      value={selectedTone}
                      onChange={(e) => setSelectedTone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="friendly">Friendly</option>
                      <option value="formal">Formal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Content Prompt
                  </label>
                  <textarea
                    value={generationPrompt}
                    onChange={(e) => setGenerationPrompt(e.target.value)}
                    placeholder="Describe what you want to generate..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleGenerateContent}
                  disabled={isGenerating || !generationPrompt.trim()}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </div>

              {/* Generated Content */}
              {generatedContent && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">
                      Generated Content
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-3 h-3 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-sans">
                      {generatedContent}
                    </pre>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};