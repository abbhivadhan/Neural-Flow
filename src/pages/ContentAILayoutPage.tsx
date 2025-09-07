import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardModeProvider } from '../providers/DashboardModeProvider';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  Brain, 
  FileText, 
  Image, 
  Video, 
  Mic, 
  Code, 
  MessageSquare,
  Sparkles,
  Download,
  Copy,
  RefreshCw,
  Play,
  Pause,
  Settings,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';

interface ContentGenerationTask {
  id: string;
  type: 'text' | 'code' | 'image' | 'audio' | 'video';
  prompt: string;
  status: 'generating' | 'completed' | 'error';
  result?: string;
  progress: number;
  timestamp: string;
}

export default function ContentAILayoutPage() {
  const [activeTab, setActiveTab] = useState('text');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTasks, setGenerationTasks] = useState<ContentGenerationTask[]>([]);
  const [aiMetrics, setAiMetrics] = useState({
    totalGenerations: 1247,
    successRate: 94.2,
    averageTime: 2.3,
    tokensGenerated: 156789
  });

  const contentTypes = [
    { id: 'text', label: 'Text Content', icon: FileText, color: 'blue' },
    { id: 'code', label: 'Code Generation', icon: Code, color: 'green' },
    { id: 'image', label: 'Image Creation', icon: Image, color: 'purple' },
    { id: 'audio', label: 'Audio Synthesis', icon: Mic, color: 'orange' },
    { id: 'video', label: 'Video Generation', icon: Video, color: 'red' }
  ];

  const samplePrompts = {
    text: [
      "Write a professional email about project updates",
      "Create a blog post about AI productivity tools",
      "Generate a product description for a smart workspace",
      "Write documentation for a new API endpoint"
    ],
    code: [
      "Create a React component for user authentication",
      "Write a Python function for data analysis",
      "Generate SQL queries for user analytics",
      "Build a REST API endpoint for file uploads"
    ],
    image: [
      "Design a modern dashboard interface mockup",
      "Create an infographic about productivity metrics",
      "Generate a logo for a tech startup",
      "Design social media graphics for product launch"
    ],
    audio: [
      "Generate a podcast intro with background music",
      "Create voice narration for tutorial videos",
      "Synthesize ambient sounds for focus sessions",
      "Generate notification sounds for the app"
    ],
    video: [
      "Create an animated explainer video",
      "Generate product demo walkthrough",
      "Make a time-lapse of coding session",
      "Create animated charts and graphs"
    ]
  };

  // Simulate AI generation
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    const newTask: ContentGenerationTask = {
      id: Date.now().toString(),
      type: activeTab as any,
      prompt,
      status: 'generating',
      progress: 0,
      timestamp: new Date().toLocaleTimeString()
    };

    setGenerationTasks(prev => [newTask, ...prev]);
    setIsGenerating(true);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationTasks(prev => prev.map(task => 
        task.id === newTask.id 
          ? { ...task, progress: Math.min(100, task.progress + Math.random() * 20) }
          : task
      ));
    }, 500);

    // Complete after 3-5 seconds
    setTimeout(() => {
      clearInterval(progressInterval);
      
      const results = {
        text: "Here's a professionally crafted response based on your prompt. This AI-generated content demonstrates advanced natural language processing capabilities with contextual understanding and coherent structure.",
        code: `// AI-generated code based on your prompt
function generateContent(prompt) {
  const aiModel = new ContentGenerator();
  return aiModel.process(prompt, {
    temperature: 0.7,
    maxTokens: 1000,
    context: 'professional'
  });
}`,
        image: "🎨 AI-generated image would appear here with custom styling and composition based on your prompt",
        audio: "🎵 AI-synthesized audio content ready for download - high quality voice synthesis with natural intonation",
        video: "🎬 AI-generated video content with smooth animations and professional transitions"
      };

      setGenerationTasks(prev => prev.map(task => 
        task.id === newTask.id 
          ? { 
              ...task, 
              status: 'completed', 
              progress: 100,
              result: results[activeTab as keyof typeof results]
            }
          : task
      ));
      
      setIsGenerating(false);
      setPrompt('');
      
      // Update metrics
      setAiMetrics(prev => ({
        ...prev,
        totalGenerations: prev.totalGenerations + 1,
        tokensGenerated: prev.tokensGenerated + Math.floor(Math.random() * 500) + 100
      }));
    }, Math.random() * 2000 + 3000);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      text: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20',
      code: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20',
      image: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20',
      audio: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20',
      video: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20'
    };
    return colors[type as keyof typeof colors] || colors.text;
  };

  return (
    <DashboardModeProvider>
      <AppLayout currentContext="writing">
        <ErrorBoundary>
          <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Content AI Studio
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Advanced AI-powered content generation across multiple modalities
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  AI Settings
                </Button>
              </div>
            </div>

            {/* AI Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Generations</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{aiMetrics.totalGenerations.toLocaleString()}</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-500" />
                </div>
              </Card>

              <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Success Rate</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{aiMetrics.successRate}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </Card>

              <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg Time</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{aiMetrics.averageTime}s</p>
                  </div>
                  <Zap className="w-8 h-8 text-yellow-500" />
                </div>
              </Card>

              <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Tokens Generated</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{aiMetrics.tokensGenerated.toLocaleString()}</p>
                  </div>
                  <Brain className="w-8 h-8 text-purple-500" />
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Content Generation Interface */}
              <div className="lg:col-span-2 space-y-6">
                {/* Content Type Tabs */}
                <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-1 mb-6 overflow-x-auto">
                    {contentTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          onClick={() => setActiveTab(type.id)}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                            activeTab === type.id
                              ? `bg-${type.color}-100 dark:bg-${type.color}-900/20 text-${type.color}-700 dark:text-${type.color}-300`
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{type.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Prompt Input */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Describe what you want to create:
                      </label>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={`Enter your ${activeTab} generation prompt here...`}
                        className="w-full h-32 px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 resize-none"
                        disabled={isGenerating}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={handleGenerate}
                          disabled={isGenerating || !prompt.trim()}
                          className="px-6 py-2"
                        >
                          {isGenerating ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate Content
                            </>
                          )}
                        </Button>
                        
                        <Button variant="outline" size="sm">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Clear
                        </Button>
                      </div>
                      
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        {prompt.length}/2000 characters
                      </div>
                    </div>
                  </div>

                  {/* Sample Prompts */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Sample Prompts:</h4>
                    <div className="flex flex-wrap gap-2">
                      {samplePrompts[activeTab as keyof typeof samplePrompts]?.map((sample, index) => (
                        <button
                          key={index}
                          onClick={() => setPrompt(sample)}
                          className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          {sample}
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Generation Results */}
                <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      Generation Results
                    </h2>
                    <Badge variant="outline">
                      {generationTasks.length} generations
                    </Badge>
                  </div>

                  {generationTasks.length === 0 ? (
                    <div className="text-center py-12">
                      <Brain className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
                        Ready to Generate Content
                      </h3>
                      <p className="text-slate-500 dark:text-slate-500">
                        Enter a prompt above to start generating AI-powered content
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {generationTasks.map((task) => (
                        <div key={task.id} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(task.type)}`}>
                                {contentTypes.find(t => t.id === task.type)?.icon && 
                                  React.createElement(contentTypes.find(t => t.id === task.type)!.icon, { className: "w-4 h-4" })
                                }
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-900 dark:text-slate-100">
                                  {contentTypes.find(t => t.id === task.type)?.label}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-500">{task.timestamp}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {task.status === 'generating' && (
                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-1" />
                                  Generating
                                </Badge>
                              )}
                              {task.status === 'completed' && (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                  Completed
                                </Badge>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 italic">
                            "{task.prompt}"
                          </p>

                          {task.status === 'generating' && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500 mb-1">
                                <span>Progress</span>
                                <span>{Math.round(task.progress)}%</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${task.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {task.result && (
                            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-3">
                              <pre className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono">
                                {task.result}
                              </pre>
                            </div>
                          )}

                          {task.status === 'completed' && (
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm">
                                <Copy className="w-4 h-4 mr-2" />
                                Copy
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Export
                              </Button>
                              <Button variant="outline" size="sm">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Regenerate
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* AI Assistant Panel */}
              <div className="space-y-6">
                <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <div className="flex items-center mb-4">
                    <Brain className="w-5 h-5 mr-2 text-purple-500" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">AI Assistant</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-purple-800 dark:text-purple-200">
                            I can help you generate high-quality content across multiple formats. Try asking me to create anything from technical documentation to creative writing!
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Quick Actions:</h4>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Chat with AI
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <FileText className="w-4 h-4 mr-2" />
                          Generate Template
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Improve Content
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Recent Activity */}
                <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {generationTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-center space-x-3 p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${getTypeColor(task.type)}`}>
                          {contentTypes.find(t => t.id === task.type)?.icon && 
                            React.createElement(contentTypes.find(t => t.id === task.type)!.icon, { className: "w-3 h-3" })
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                            {task.prompt}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            {task.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </ErrorBoundary>
      </AppLayout>
    </DashboardModeProvider>
  );
}