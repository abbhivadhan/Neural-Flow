import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';

interface WorkspaceAdaptationDemoProps {
  onStepComplete?: () => void;
  isActive?: boolean;
}

export const WorkspaceAdaptationDemo: React.FC<WorkspaceAdaptationDemoProps> = ({
  onStepComplete,
  isActive = false,
}) => {
  const [currentContext, setCurrentContext] = useState<'coding' | 'design' | 'meeting' | 'research'>('coding');
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptationComplete, setAdaptationComplete] = useState(false);
  const [workspaceConfig, setWorkspaceConfig] = useState<any>(null);

  const contextConfigs = {
    coding: {
      name: 'Development Mode',
      description: 'Optimized for focused coding sessions',
      layout: {
        sidebar: 'collapsed',
        panels: ['file-explorer', 'terminal', 'git'],
        theme: 'dark',
        fontSize: 14,
        lineNumbers: true,
      },
      tools: ['VS Code', 'Terminal', 'Git', 'Docker'],
      aiFeatures: ['Code completion', 'Bug detection', 'Refactoring suggestions'],
      notifications: 'minimal',
      breakReminders: 'every 90 minutes',
      focusMode: true,
    },
    design: {
      name: 'Creative Mode',
      description: 'Optimized for design and creative work',
      layout: {
        sidebar: 'expanded',
        panels: ['color-palette', 'assets', 'layers'],
        theme: 'light',
        fontSize: 16,
        gridLines: true,
      },
      tools: ['Figma', 'Adobe Creative Suite', 'Sketch', 'Canva'],
      aiFeatures: ['Design suggestions', 'Color harmony', 'Layout optimization'],
      notifications: 'creative-friendly',
      breakReminders: 'every 60 minutes',
      focusMode: false,
    },
    meeting: {
      name: 'Collaboration Mode',
      description: 'Optimized for meetings and team collaboration',
      layout: {
        sidebar: 'minimal',
        panels: ['participants', 'chat', 'shared-notes'],
        theme: 'auto',
        fontSize: 18,
        screenShare: true,
      },
      tools: ['Zoom', 'Slack', 'Notion', 'Miro'],
      aiFeatures: ['Meeting transcription', 'Action item extraction', 'Follow-up suggestions'],
      notifications: 'meeting-mode',
      breakReminders: 'disabled',
      focusMode: false,
    },
    research: {
      name: 'Research Mode',
      description: 'Optimized for information gathering and analysis',
      layout: {
        sidebar: 'expanded',
        panels: ['bookmarks', 'notes', 'references'],
        theme: 'light',
        fontSize: 15,
        readingMode: true,
      },
      tools: ['Browser', 'Notion', 'Zotero', 'Obsidian'],
      aiFeatures: ['Content summarization', 'Source verification', 'Insight extraction'],
      notifications: 'research-friendly',
      breakReminders: 'every 45 minutes',
      focusMode: true,
    },
  };

  const adaptWorkspace = async (context: keyof typeof contextConfigs) => {
    setIsAdapting(true);
    setAdaptationComplete(false);

    // Simulate workspace adaptation process
    await new Promise(resolve => setTimeout(resolve, 1500));

    const config = contextConfigs[context];
    setWorkspaceConfig(config);
    setAdaptationComplete(true);
    setIsAdapting(false);
  };

  useEffect(() => {
    if (isActive) {
      adaptWorkspace(currentContext);
    }
  }, [isActive, currentContext]);

  const handleContextChange = (context: keyof typeof contextConfigs) => {
    setCurrentContext(context);
    adaptWorkspace(context);
  };

  const renderLayoutPreview = () => {
    if (!workspaceConfig) return null;

    return (
      <Card className="p-4">
        <h5 className="font-medium mb-3">Adaptive Layout Preview</h5>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {/* Mock workspace layout */}
          <div className={`h-48 ${workspaceConfig.layout.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="flex h-full">
              {/* Sidebar */}
              <div className={`${
                workspaceConfig.layout.sidebar === 'expanded' ? 'w-16' : 
                workspaceConfig.layout.sidebar === 'collapsed' ? 'w-8' : 'w-4'
              } ${workspaceConfig.layout.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} border-r`}>
                <div className="p-2 space-y-1">
                  {workspaceConfig.layout.panels.slice(0, 3).map((panel: string, index: number) => (
                    <div
                      key={index}
                      className={`h-6 rounded ${
                        workspaceConfig.layout.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                      }`}
                      title={panel}
                    />
                  ))}
                </div>
              </div>

              {/* Main content area */}
              <div className="flex-1 p-4">
                <div className={`h-full rounded ${
                  workspaceConfig.layout.theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
                } border-2 border-dashed flex items-center justify-center`}>
                  <div className="text-center">
                    <div className={`text-lg font-medium ${
                      workspaceConfig.layout.theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {workspaceConfig.name}
                    </div>
                    <div className={`text-sm ${
                      workspaceConfig.layout.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {workspaceConfig.description}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right panel (if applicable) */}
              {workspaceConfig.layout.panels.length > 3 && (
                <div className={`w-12 ${
                  workspaceConfig.layout.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                } border-l`}>
                  <div className="p-2 space-y-1">
                    {workspaceConfig.layout.panels.slice(3).map((panel: string, index: number) => (
                      <div
                        key={index}
                        className={`h-4 rounded ${
                          workspaceConfig.layout.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                        }`}
                        title={panel}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const renderAdaptationDetails = () => {
    if (!workspaceConfig) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h5 className="font-medium mb-3">Layout Configuration</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Sidebar:</span>
              <Badge variant="outline">{workspaceConfig.layout.sidebar}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Theme:</span>
              <Badge variant="outline">{workspaceConfig.layout.theme}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Font Size:</span>
              <Badge variant="outline">{workspaceConfig.layout.fontSize}px</Badge>
            </div>
            <div className="flex justify-between">
              <span>Focus Mode:</span>
              <Badge variant={workspaceConfig.focusMode ? "default" : "outline"}>
                {workspaceConfig.focusMode ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h5 className="font-medium mb-3">Active Panels</h5>
          <div className="flex flex-wrap gap-1">
            {workspaceConfig.layout.panels.map((panel: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {panel.replace('-', ' ')}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h5 className="font-medium mb-3">Integrated Tools</h5>
          <div className="flex flex-wrap gap-1">
            {workspaceConfig.tools.map((tool: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tool}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h5 className="font-medium mb-3">AI Features</h5>
          <ul className="space-y-1 text-sm">
            {workspaceConfig.aiFeatures.map((feature: string, index: number) => (
              <li key={index} className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <h5 className="font-medium mb-3">Smart Settings</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Notifications:</span>
              <span className="text-blue-600">{workspaceConfig.notifications}</span>
            </div>
            <div className="flex justify-between">
              <span>Break Reminders:</span>
              <span className="text-green-600">{workspaceConfig.breakReminders}</span>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Intelligent Workspace Adaptation</h3>
        <div className="flex gap-2">
          <Button
            onClick={() => handleContextChange('coding')}
            variant={currentContext === 'coding' ? 'default' : 'outline'}
            size="sm"
          >
            Coding
          </Button>
          <Button
            onClick={() => handleContextChange('design')}
            variant={currentContext === 'design' ? 'default' : 'outline'}
            size="sm"
          >
            Design
          </Button>
          <Button
            onClick={() => handleContextChange('meeting')}
            variant={currentContext === 'meeting' ? 'default' : 'outline'}
            size="sm"
          >
            Meeting
          </Button>
          <Button
            onClick={() => handleContextChange('research')}
            variant={currentContext === 'research' ? 'default' : 'outline'}
            size="sm"
          >
            Research
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Context-Aware Adaptation</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Neural Flow automatically adapts the workspace layout, tools, and AI features based on your current work context.
            Switch between different work modes to see how the interface intelligently reconfigures itself.
          </p>
        </div>

        {isAdapting && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Adapting workspace for {contextConfigs[currentContext].name}...
              </p>
            </div>
          </div>
        )}

        {adaptationComplete && workspaceConfig && (
          <div className="space-y-6">
            <div className="text-center">
              <Badge variant="default" className="bg-green-600">
                ✓ Workspace Adapted for {workspaceConfig.name}
              </Badge>
            </div>

            {renderLayoutPreview()}
            {renderAdaptationDetails()}

            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <h5 className="font-medium mb-2 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>AI Adaptation Insights</span>
              </h5>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <p>• Layout optimized based on {currentContext} work patterns</p>
                <p>• Tools and panels prioritized for maximum efficiency</p>
                <p>• AI features tailored to support {currentContext} workflows</p>
                <p>• Notification settings adjusted to minimize distractions</p>
                <p>• Break reminders scheduled for optimal productivity</p>
              </div>
            </Card>
          </div>
        )}
      </Card>

      {adaptationComplete && (
        <div className="flex justify-end">
          <Button onClick={onStepComplete}>
            Continue to Next Step
          </Button>
        </div>
      )}
    </div>
  );
};