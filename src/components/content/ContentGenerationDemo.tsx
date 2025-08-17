/**
 * Demo component for AI-powered content generation system
 */

import React, { useState, useEffect } from 'react';
import { ContentService } from '../../services/content';
import {
  ContentType,
  WritingTone,
  EnhancementType,
  ChartType,
  VisualTheme
} from '../../services/content/types';

const ContentGenerationDemo: React.FC = () => {
  const [contentService] = useState(() => new ContentService());
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Content Generation State
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState<ContentType>(ContentType.ARTICLE);
  const [tone, setTone] = useState<WritingTone>(WritingTone.PROFESSIONAL);
  const [generatedContent, setGeneratedContent] = useState('');
  const [contentMetadata, setContentMetadata] = useState<any>(null);

  // Content Enhancement State
  const [originalContent, setOriginalContent] = useState('');
  const [enhancedContent, setEnhancedContent] = useState('');
  const [improvements, setImprovements] = useState<any[]>([]);

  // Visual Generation State
  const [chartData, setChartData] = useState('');
  const [chartType, setChartType] = useState<ChartType>(ChartType.BAR);
  const [visualTheme, setVisualTheme] = useState<VisualTheme>(VisualTheme.PROFESSIONAL);
  const [generatedChart, setGeneratedChart] = useState('');

  // Style Analysis State
  const [styleText, setStyleText] = useState('');
  const [styleAnalysis, setStyleAnalysis] = useState<any>(null);

  useEffect(() => {
    initializeService();
  }, []);

  const initializeService = async () => {
    try {
      setLoading(true);
      await contentService.initialize();
      setIsInitialized(true);
    } catch (err) {
      setError('Failed to initialize content service');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!isInitialized || !prompt.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const response = await contentService.generateContent({
        prompt: prompt.trim(),
        type: contentType,
        style: {
          tone,
          formality: 'neutral' as any,
          vocabulary: 'intermediate' as any,
          structure: 'linear' as any,
          voice: 'third_person' as any
        },
        maxLength: 300,
        temperature: 0.7
      });

      setGeneratedContent(response.content);
      setContentMetadata(response.metadata);
    } catch (err) {
      setError('Failed to generate content');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnhanceContent = async () => {
    if (!isInitialized || !originalContent.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const response = await contentService.enhanceContent({
        originalContent: originalContent.trim(),
        enhancementType: [
          EnhancementType.GRAMMAR,
          EnhancementType.STYLE,
          EnhancementType.CLARITY,
          EnhancementType.CONCISENESS
        ],
        tone
      });

      setEnhancedContent(response.enhancedContent);
      setImprovements(response.improvements);
    } catch (err) {
      setError('Failed to enhance content');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVisual = async () => {
    if (!isInitialized || !chartData.trim()) return;

    try {
      setLoading(true);
      setError(null);

      // Parse chart data (expecting JSON format)
      const data = JSON.parse(chartData);

      const response = await contentService.generateVisual({
        data,
        chartType,
        theme: visualTheme,
        title: 'Generated Chart',
        description: 'AI-generated data visualization'
      });

      setGeneratedChart(response.svg);
    } catch (err) {
      setError('Failed to generate visual. Please check your data format.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeStyle = async () => {
    if (!styleText.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const analysis = contentService.analyzeWritingStyle([
        { content: styleText.trim() }
      ]);

      setStyleAnalysis(analysis);
    } catch (err) {
      setError('Failed to analyze writing style');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized && loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Initializing AI models...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI-Powered Content Generation System
        </h1>
        <p className="text-gray-600">
          Demonstrate advanced content generation, enhancement, and visualization capabilities
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Content Generation Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Content Generation</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Type
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.values(ContentType).map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Writing Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as WritingTone)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.values(WritingTone).map(t => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your content prompt here..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        <button
          onClick={handleGenerateContent}
          disabled={loading || !prompt.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate Content'}
        </button>

        {generatedContent && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-2">Generated Content:</h3>
            <p className="text-gray-800 whitespace-pre-wrap">{generatedContent}</p>
            
            {contentMetadata && (
              <div className="mt-3 text-sm text-gray-600">
                <p>Words: {contentMetadata.wordCount} | Readability: {contentMetadata.readabilityScore.toFixed(1)} | Processing: {contentMetadata.processingTime}ms</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Enhancement Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Content Enhancement</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Original Content
          </label>
          <textarea
            value={originalContent}
            onChange={(e) => setOriginalContent(e.target.value)}
            placeholder="Enter content to enhance..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
        </div>

        <button
          onClick={handleEnhanceContent}
          disabled={loading || !originalContent.trim()}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enhancing...' : 'Enhance Content'}
        </button>

        {enhancedContent && (
          <div className="mt-4 space-y-4">
            <div className="p-4 bg-green-50 rounded-md">
              <h3 className="font-medium mb-2">Enhanced Content:</h3>
              <p className="text-gray-800 whitespace-pre-wrap">{enhancedContent}</p>
            </div>

            {improvements.length > 0 && (
              <div className="p-4 bg-blue-50 rounded-md">
                <h3 className="font-medium mb-2">Improvements Made:</h3>
                <ul className="space-y-2">
                  {improvements.map((improvement, index) => (
                    <li key={index} className="text-sm">
                      <span className="font-medium">{improvement.type}:</span> {improvement.description}
                      {improvement.originalText !== improvement.improvedText && (
                        <div className="mt-1 text-xs text-gray-600">
                          <span className="line-through">{improvement.originalText}</span> → <span className="text-green-600">{improvement.improvedText}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Visual Generation Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Visual Generation</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chart Type
            </label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.values(ChartType).map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              value={visualTheme}
              onChange={(e) => setVisualTheme(e.target.value as VisualTheme)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.values(VisualTheme).map(theme => (
                <option key={theme} value={theme}>
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chart Data (JSON format)
          </label>
          <textarea
            value={chartData}
            onChange={(e) => setChartData(e.target.value)}
            placeholder='[{"label": "A", "value": 10}, {"label": "B", "value": 20}, {"label": "C", "value": 15}]'
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            rows={3}
          />
        </div>

        <button
          onClick={handleGenerateVisual}
          disabled={loading || !chartData.trim()}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate Visual'}
        </button>

        {generatedChart && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-2">Generated Chart:</h3>
            <div 
              className="border rounded-md bg-white p-4"
              dangerouslySetInnerHTML={{ __html: generatedChart }}
            />
          </div>
        )}
      </div>

      {/* Style Analysis Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Writing Style Analysis</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Text to Analyze
          </label>
          <textarea
            value={styleText}
            onChange={(e) => setStyleText(e.target.value)}
            placeholder="Enter text to analyze writing style..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
        </div>

        <button
          onClick={handleAnalyzeStyle}
          disabled={loading || !styleText.trim()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Analyzing...' : 'Analyze Style'}
        </button>

        {styleAnalysis && (
          <div className="mt-4 p-4 bg-indigo-50 rounded-md">
            <h3 className="font-medium mb-2">Style Analysis Results:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Detected Style:</h4>
                <ul className="text-sm space-y-1">
                  <li><span className="font-medium">Tone:</span> {styleAnalysis.detectedStyle.tone}</li>
                  <li><span className="font-medium">Formality:</span> {styleAnalysis.detectedStyle.formality}</li>
                  <li><span className="font-medium">Vocabulary:</span> {styleAnalysis.detectedStyle.vocabulary}</li>
                  <li><span className="font-medium">Structure:</span> {styleAnalysis.detectedStyle.structure}</li>
                  <li><span className="font-medium">Voice:</span> {styleAnalysis.detectedStyle.voice}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Characteristics:</h4>
                <ul className="text-sm space-y-1">
                  {styleAnalysis.characteristics.map((char: any, index: number) => (
                    <li key={index}>
                      <span className="font-medium">{char.feature}:</span> {char.value.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {styleAnalysis.recommendations.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Recommendations:</h4>
                <ul className="text-sm space-y-1">
                  {styleAnalysis.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-gray-600">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default ContentGenerationDemo;