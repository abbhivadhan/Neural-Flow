/**
 * Demo component for AI-powered content generation system
 */

import React, { useState } from 'react';
import { FileText, Sparkles, BarChart3, PenTool, Zap, CheckCircle } from 'lucide-react';

// Simple enums for demo
enum ContentType {
  ARTICLE = 'article',
  EMAIL = 'email',
  BLOG_POST = 'blog_post',
  SOCIAL_MEDIA = 'social_media'
}

enum WritingTone {
  PROFESSIONAL = 'professional',
  CASUAL = 'casual',
  FRIENDLY = 'friendly',
  FORMAL = 'formal'
}

const ContentGenerationDemo: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState<ContentType>(ContentType.ARTICLE);
  const [tone, setTone] = useState<WritingTone>(WritingTone.PROFESSIONAL);
  const [generatedContent, setGeneratedContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [enhancedContent, setEnhancedContent] = useState('');
  const [activeDemo, setActiveDemo] = useState('generate');

  const handleGenerateContent = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const sampleContent = {
      [ContentType.ARTICLE]: `# ${prompt}\n\nThis is a professionally generated article about ${prompt}. The AI has analyzed your requirements and created comprehensive content that addresses the key points while maintaining a ${tone} tone.\n\nKey highlights:\n• Comprehensive coverage of the topic\n• Well-structured and engaging content\n• Optimized for readability and SEO\n• Tailored to your specified tone and style`,
      [ContentType.EMAIL]: `Subject: ${prompt}\n\nDear [Recipient],\n\nI hope this email finds you well. I'm writing to discuss ${prompt} and provide you with the information you requested.\n\n[Content body with ${tone} tone]\n\nBest regards,\n[Your Name]`,
      [ContentType.BLOG_POST]: `# ${prompt}: A Complete Guide\n\nWelcome to our comprehensive guide on ${prompt}. In this post, we'll explore everything you need to know about this topic.\n\n## Introduction\n\nThis ${tone} blog post covers the essential aspects of ${prompt}, providing valuable insights and practical tips.\n\n## Key Points\n\n• Expert analysis and recommendations\n• Real-world examples and case studies\n• Actionable takeaways for immediate implementation`,
      [ContentType.SOCIAL_MEDIA]: `🚀 ${prompt}\n\nExciting insights about ${prompt}! Here's what you need to know:\n\n✨ Key benefits and features\n💡 Expert tips and tricks\n🎯 Actionable strategies\n\n#AI #ContentGeneration #Innovation`
    };

    setGeneratedContent(sampleContent[contentType] || sampleContent[ContentType.ARTICLE]);
    setLoading(false);
  };

  const handleEnhanceContent = async () => {
    if (!originalContent.trim()) return;

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const enhanced = originalContent
      .replace(/\b(good|nice|great)\b/gi, 'excellent')
      .replace(/\b(big|large)\b/gi, 'substantial')
      .replace(/\b(small|little)\b/gi, 'minimal')
      .replace(/\s+/g, ' ')
      .trim();
    
    setEnhancedContent(`${enhanced}\n\n[Enhanced with AI improvements: Better vocabulary, improved clarity, and ${tone} tone adjustment]`);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-12 h-12 text-purple-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              AI-Powered Content Generation
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Experience advanced AI content generation with intelligent writing assistance, 
            style enhancement, and automated optimization.
          </p>
        </div>

        {/* Demo Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-lg">
            <button
              onClick={() => setActiveDemo('generate')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeDemo === 'generate'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-600 hover:text-purple-500'
              }`}
            >
              Generate Content
            </button>
            <button
              onClick={() => setActiveDemo('enhance')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeDemo === 'enhance'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-600 hover:text-purple-500'
              }`}
            >
              Enhance Content
            </button>
          </div>
        </div>

        {/* Content Generation */}
        {activeDemo === 'generate' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <FileText className="w-6 h-6 mr-2" />
                Content Generation
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content Type
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as ContentType)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    {Object.values(ContentType).map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Writing Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as WritingTone)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    {Object.values(WritingTone).map(t => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your content prompt here... (e.g., 'Benefits of AI in modern workplace')"
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>

              <button
                onClick={handleGenerateContent}
                disabled={loading || !prompt.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating Content...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Generate Content
                  </>
                )}
              </button>

              {generatedContent && (
                <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Generated Content:
                  </h3>
                  <div className="prose dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-sans">
                      {generatedContent}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Enhancement */}
        {activeDemo === 'enhance' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <PenTool className="w-6 h-6 mr-2" />
                Content Enhancement
              </h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Original Content
                </label>
                <textarea
                  value={originalContent}
                  onChange={(e) => setOriginalContent(e.target.value)}
                  placeholder="Enter content to enhance... The AI will improve grammar, style, clarity, and tone."
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows={6}
                />
              </div>

              <button
                onClick={handleEnhanceContent}
                disabled={loading || !originalContent.trim()}
                className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Enhancing Content...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Enhance Content
                  </>
                )}
              </button>

              {enhancedContent && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Enhanced Content:
                  </h3>
                  <div className="prose dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-sans">
                      {enhancedContent}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Features Overview */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Intelligent Generation
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              AI-powered content creation with context awareness and style adaptation.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <PenTool className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Smart Enhancement
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Automatic improvement of grammar, style, clarity, and readability.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Performance Analytics
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Real-time analysis of content quality, readability, and engagement metrics.
            </p>
          </div>
        </div>

        {/* Demo Note */}
        <div className="mt-8 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 text-center max-w-4xl mx-auto">
          <p className="text-purple-800 dark:text-purple-200">
            This is a demonstration of AI-powered content generation capabilities. 
            In a production environment, this would connect to advanced language models 
            for real content generation and enhancement.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContentGenerationDemo;