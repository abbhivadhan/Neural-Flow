import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

// Demo data generation utilities
export class DemoDataGenerator {
  private static taskTitles = [
    'Implement user authentication system',
    'Design responsive dashboard layout',
    'Optimize database query performance',
    'Create API documentation',
    'Set up automated testing pipeline',
    'Develop mobile app prototype',
    'Conduct user research interviews',
    'Write technical blog post',
    'Review code for security vulnerabilities',
    'Plan sprint retrospective meeting',
    'Update project dependencies',
    'Create wireframes for new feature',
    'Analyze user behavior metrics',
    'Implement real-time notifications',
    'Design email templates',
    'Configure CI/CD deployment',
    'Research competitor features',
    'Optimize application performance',
    'Create user onboarding flow',
    'Develop data visualization charts',
  ];

  private static projectNames = [
    'Neural Flow MVP',
    'AI-Powered Analytics Dashboard',
    'Smart Collaboration Platform',
    'Predictive Task Manager',
    'Intelligent Content Generator',
    'Real-time Workspace Optimizer',
    'Advanced Search Engine',
    'Multi-modal Interface System',
    'Privacy-First AI Architecture',
    'Adaptive Learning Platform',
  ];

  private static domains = [
    'Frontend Development',
    'Backend Development',
    'UI/UX Design',
    'Data Science',
    'DevOps',
    'Quality Assurance',
    'Product Management',
    'Marketing',
    'Research',
    'Documentation',
  ];

  private static skills = [
    'React', 'TypeScript', 'Node.js', 'Python', 'Figma', 'Docker',
    'AWS', 'GraphQL', 'TensorFlow', 'PostgreSQL', 'Redis', 'Kubernetes',
    'Jest', 'Cypress', 'D3.js', 'Three.js', 'WebGL', 'WebAssembly',
  ];

  static generateRealisticTasks(count: number = 10) {
    const tasks = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const createdDaysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date(now.getTime() - createdDaysAgo * 24 * 60 * 60 * 1000);
      const dueDaysFromNow = Math.floor(Math.random() * 14) + 1;
      const dueDate = new Date(now.getTime() + dueDaysFromNow * 24 * 60 * 60 * 1000);

      const task = {
        id: `demo-task-${i + 1}`,
        title: this.taskTitles[Math.floor(Math.random() * this.taskTitles.length)],
        description: this.generateTaskDescription(),
        priority: this.getRandomPriority(),
        status: this.getRandomStatus(),
        estimatedDuration: Math.floor(Math.random() * 16) + 1, // 1-16 hours
        dueDate,
        createdAt,
        updatedAt: new Date(createdAt.getTime() + Math.random() * (now.getTime() - createdAt.getTime())),
        context: {
          workType: this.getRandomWorkType(),
          domain: this.domains[Math.floor(Math.random() * this.domains.length)],
          complexity: this.getRandomComplexity(),
          skillsRequired: this.getRandomSkills(),
          environment: this.getRandomEnvironment(),
          collaborationLevel: this.getRandomCollaborationLevel(),
        },
        tags: this.generateTags(),
        aiGenerated: Math.random() > 0.6,
        aiConfidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
        dependencies: [],
        subtasks: [],
        attachments: [],
        comments: [],
        metadata: {},
      };

      tasks.push(task);
    }

    return tasks;
  }

  static generateRealisticProjects(count: number = 3) {
    const projects = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const startDaysAgo = Math.floor(Math.random() * 60);
      const startDate = new Date(now.getTime() - startDaysAgo * 24 * 60 * 60 * 1000);
      const durationDays = Math.floor(Math.random() * 90) + 30; // 30-120 days
      const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

      const project = {
        id: `demo-project-${i + 1}`,
        name: this.projectNames[Math.floor(Math.random() * this.projectNames.length)],
        description: this.generateProjectDescription(),
        status: this.getRandomProjectStatus(),
        priority: this.getRandomPriority(),
        startDate,
        endDate,
        owner: `user-${Math.floor(Math.random() * 5) + 1}`,
        collaborators: this.generateCollaborators(),
        tasks: [],
        resources: [],
        timeline: {
          phases: [],
          dependencies: [],
          criticalPath: [],
          estimatedDuration: durationDays,
          actualDuration: startDaysAgo > 0 ? Math.floor(startDaysAgo * 0.8) : undefined,
        },
        milestones: this.generateMilestones(),
        tags: this.generateProjectTags(),
        visibility: 'team' as const,
        aiInsights: {
          healthScore: Math.floor(Math.random() * 40) + 60, // 60-100
          riskFactors: this.generateRiskFactors(),
          predictions: [],
          recommendations: this.generateRecommendations(),
          trends: [],
          benchmarks: [],
          lastAnalyzed: new Date(),
        },
        settings: {
          autoAssignment: Math.random() > 0.5,
          notificationRules: [],
          workflowRules: [],
          integrations: [],
          customFields: [],
          templates: [],
        },
        createdAt: startDate,
        updatedAt: new Date(),
        metadata: {},
      };

      projects.push(project);
    }

    return projects;
  }

  static generateUserBehaviorData() {
    const now = new Date();
    const behaviorData = [];

    // Generate 30 days of behavior data
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      
      behaviorData.push({
        date,
        tasksCompleted: Math.floor(Math.random() * 8) + 2,
        timeSpent: Math.floor(Math.random() * 6) + 2, // 2-8 hours
        focusScore: Math.random() * 0.4 + 0.6, // 0.6-1.0
        productivityScore: Math.random() * 0.3 + 0.7, // 0.7-1.0
        collaborationEvents: Math.floor(Math.random() * 5),
        contextSwitches: Math.floor(Math.random() * 15) + 5,
        aiInteractions: Math.floor(Math.random() * 10) + 2,
        workTypes: this.generateDailyWorkTypes(),
      });
    }

    return behaviorData.reverse(); // Chronological order
  }

  static generateAIPredictions() {
    return [
      {
        type: 'next_task',
        confidence: 0.92,
        prediction: 'User likely to work on frontend development next',
        reasoning: 'Based on recent pattern of alternating between backend and frontend work',
        suggestedActions: ['Prepare React development environment', 'Load recent component files'],
      },
      {
        type: 'productivity_forecast',
        confidence: 0.87,
        prediction: 'Peak productivity expected between 10-11 AM',
        reasoning: 'Historical data shows highest focus scores during this time',
        suggestedActions: ['Schedule complex tasks for morning', 'Block calendar for deep work'],
      },
      {
        type: 'collaboration_opportunity',
        confidence: 0.78,
        prediction: 'Sarah Johnson would be ideal collaborator for current task',
        reasoning: 'Complementary skills in UI/UX design and previous successful collaborations',
        suggestedActions: ['Send collaboration request', 'Share current progress'],
      },
    ];
  }

  private static generateTaskDescription(): string {
    const descriptions = [
      'Implement secure authentication flow with JWT tokens and refresh mechanism',
      'Create responsive dashboard with real-time data updates and interactive charts',
      'Optimize database queries to reduce response time by 50%',
      'Write comprehensive API documentation with examples and error codes',
      'Set up automated testing pipeline with unit, integration, and e2e tests',
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private static generateProjectDescription(): string {
    const descriptions = [
      'Revolutionary AI-powered productivity platform that adapts to user behavior',
      'Next-generation analytics dashboard with predictive insights and recommendations',
      'Intelligent collaboration platform with real-time synchronization and conflict resolution',
      'Advanced task management system with ML-driven priority optimization',
      'Smart content generation tool with context-aware suggestions and style learning',
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private static getRandomPriority() {
    const priorities = ['low', 'medium', 'high', 'urgent'];
    return priorities[Math.floor(Math.random() * priorities.length)] as any;
  }

  private static getRandomStatus() {
    const statuses = ['todo', 'in_progress', 'review', 'done', 'blocked'];
    return statuses[Math.floor(Math.random() * statuses.length)] as any;
  }

  private static getRandomProjectStatus() {
    const statuses = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
    return statuses[Math.floor(Math.random() * statuses.length)] as any;
  }

  private static getRandomWorkType() {
    const types = ['coding', 'design', 'writing', 'research', 'meeting', 'planning'];
    return types[Math.floor(Math.random() * types.length)] as any;
  }

  private static getRandomComplexity() {
    const complexities = ['simple', 'moderate', 'complex'];
    return complexities[Math.floor(Math.random() * complexities.length)] as any;
  }

  private static getRandomEnvironment() {
    const environments = ['focused', 'collaborative', 'creative', 'analytical'];
    return environments[Math.floor(Math.random() * environments.length)] as any;
  }

  private static getRandomCollaborationLevel() {
    const levels = ['solo', 'pair', 'small_team', 'large_team'];
    return levels[Math.floor(Math.random() * levels.length)] as any;
  }

  private static getRandomSkills() {
    const count = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...this.skills].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private static generateTags() {
    const allTags = ['frontend', 'backend', 'ui', 'api', 'testing', 'documentation', 'performance', 'security'];
    const count = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...allTags].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private static generateProjectTags() {
    const allTags = ['ai', 'productivity', 'mvp', 'research', 'prototype', 'enterprise', 'mobile', 'web'];
    const count = Math.floor(Math.random() * 4) + 2;
    const shuffled = [...allTags].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private static generateCollaborators() {
    const count = Math.floor(Math.random() * 4) + 1;
    const collaborators = [];
    
    for (let i = 0; i < count; i++) {
      collaborators.push({
        userId: `user-${i + 1}`,
        role: i === 0 ? 'owner' : 'member' as const,
        permissions: ['read', 'write'] as const,
        joinedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        contribution: Math.random() * 0.8 + 0.1,
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
    }
    
    return collaborators;
  }

  private static generateMilestones() {
    const milestones = [
      { name: 'Alpha Release', description: 'First working version with core features' },
      { name: 'Beta Testing', description: 'Feature-complete version for user testing' },
      { name: 'Production Launch', description: 'Public release with full functionality' },
    ];

    return milestones.slice(0, Math.floor(Math.random() * 3) + 1).map((milestone, index) => ({
      id: `milestone-${index + 1}`,
      ...milestone,
      dueDate: new Date(Date.now() + (index + 1) * 30 * 24 * 60 * 60 * 1000),
      status: 'upcoming' as const,
      criteria: [`Feature ${index + 1} complete`, `Testing phase ${index + 1} passed`],
      dependencies: [],
      importance: 'high' as const,
    }));
  }

  private static generateRiskFactors() {
    const risks = [
      { type: 'timeline', severity: 'medium', description: 'Potential delay due to dependency issues' },
      { type: 'resource', severity: 'low', description: 'Team member availability concerns' },
      { type: 'technical', severity: 'high', description: 'Complex integration requirements' },
    ];
    
    return risks.slice(0, Math.floor(Math.random() * 2) + 1);
  }

  private static generateRecommendations() {
    const recommendations = [
      { type: 'optimization', priority: 'high', description: 'Consider parallel development tracks' },
      { type: 'resource', priority: 'medium', description: 'Add senior developer to team' },
      { type: 'process', priority: 'low', description: 'Implement daily standups' },
    ];
    
    return recommendations.slice(0, Math.floor(Math.random() * 2) + 1);
  }

  private static generateDailyWorkTypes() {
    const types = ['coding', 'design', 'writing', 'research', 'meeting'];
    const count = Math.floor(Math.random() * 3) + 1;
    return types.slice(0, count);
  }
}

interface DemoDataGeneratorProps {
  onDataGenerated?: (data: any) => void;
  isActive?: boolean;
}

export const DemoDataGeneratorComponent: React.FC<DemoDataGeneratorProps> = ({
  onDataGenerated,
  isActive = false,
}) => {
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDemoData = async () => {
    setIsGenerating(true);
    
    // Simulate realistic data generation time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const data = {
      tasks: DemoDataGenerator.generateRealisticTasks(15),
      projects: DemoDataGenerator.generateRealisticProjects(3),
      behaviorData: DemoDataGenerator.generateUserBehaviorData(),
      aiPredictions: DemoDataGenerator.generateAIPredictions(),
      timestamp: new Date(),
    };
    
    setGeneratedData(data);
    setIsGenerating(false);
    onDataGenerated?.(data);
  };

  useEffect(() => {
    if (isActive && !generatedData) {
      generateDemoData();
    }
  }, [isActive]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Demo Data Generator</h3>
        <Button
          onClick={generateDemoData}
          disabled={isGenerating}
          variant="outline"
        >
          {isGenerating ? 'Generating...' : 'Regenerate Data'}
        </Button>
      </div>

      {isGenerating && (
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Generating realistic demo data...</span>
          </div>
        </Card>
      )}

      {generatedData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <h4 className="font-medium mb-2">Tasks Generated</h4>
            <div className="text-2xl font-bold text-blue-600">
              {generatedData.tasks.length}
            </div>
            <div className="text-sm text-gray-500">
              Across {new Set(generatedData.tasks.map((t: any) => t.context.domain)).size} domains
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-2">Projects Created</h4>
            <div className="text-2xl font-bold text-green-600">
              {generatedData.projects.length}
            </div>
            <div className="text-sm text-gray-500">
              With realistic timelines
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-2">Behavior Data Points</h4>
            <div className="text-2xl font-bold text-purple-600">
              {generatedData.behaviorData.length}
            </div>
            <div className="text-sm text-gray-500">
              30 days of activity
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-2">AI Predictions</h4>
            <div className="text-2xl font-bold text-orange-600">
              {generatedData.aiPredictions.length}
            </div>
            <div className="text-sm text-gray-500">
              High confidence insights
            </div>
          </Card>
        </div>
      )}

      {generatedData && (
        <Card className="p-4">
          <h4 className="font-medium mb-3">Generated Data Preview</h4>
          <div className="space-y-3">
            <div>
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Sample Tasks:</h5>
              <div className="flex flex-wrap gap-1 mt-1">
                {generatedData.tasks.slice(0, 3).map((task: any) => (
                  <Badge key={task.id} variant="outline" className="text-xs">
                    {task.title.substring(0, 30)}...
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Predictions:</h5>
              <div className="space-y-1 mt-1">
                {generatedData.aiPredictions.map((prediction: any, index: number) => (
                  <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                    • {prediction.prediction} ({Math.round(prediction.confidence * 100)}% confidence)
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};