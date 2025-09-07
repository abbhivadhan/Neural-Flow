import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';

interface CollaborationDemoProps {
  onStepComplete?: () => void;
  isActive?: boolean;
}

export const CollaborationDemo: React.FC<CollaborationDemoProps> = ({
  onStepComplete,
  isActive = false,
}) => {
  const [currentDemo, setCurrentDemo] = useState<'realtime' | 'expertise' | 'conflict'>('realtime');
  const [isProcessing, setIsProcessing] = useState(false);
  const [demoResults, setDemoResults] = useState<any>(null);

  const teamMembers = [
    {
      id: 'user-1',
      name: 'Alex Chen',
      role: 'Frontend Developer',
      avatar: 'AC',
      skills: ['React', 'TypeScript', 'CSS', 'UI/UX'],
      currentTask: 'Implementing responsive dashboard',
      status: 'online',
      lastActive: 'now',
    },
    {
      id: 'user-2',
      name: 'Sarah Johnson',
      role: 'UX Designer',
      avatar: 'SJ',
      skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
      currentTask: 'Creating user flow diagrams',
      status: 'online',
      lastActive: '2 min ago',
    },
    {
      id: 'user-3',
      name: 'Mike Rodriguez',
      role: 'Backend Developer',
      avatar: 'MR',
      skills: ['Node.js', 'PostgreSQL', 'API Design', 'DevOps'],
      currentTask: 'Optimizing database queries',
      status: 'away',
      lastActive: '15 min ago',
    },
    {
      id: 'user-4',
      name: 'Emma Wilson',
      role: 'Product Manager',
      avatar: '👩‍💼',
      skills: ['Product Strategy', 'Analytics', 'User Research', 'Agile'],
      currentTask: 'Reviewing user feedback',
      status: 'online',
      lastActive: '5 min ago',
    },
  ];

  const runRealtimeDemo = async () => {
    setIsProcessing(true);
    setDemoResults(null);

    // Simulate real-time collaboration events
    const events = [
      { time: '14:32:15', user: 'Alex Chen', action: 'Started editing TaskCard.tsx', type: 'edit' },
      { time: '14:32:18', user: 'Sarah Johnson', action: 'Added comment on line 45', type: 'comment' },
      { time: '14:32:22', user: 'Alex Chen', action: 'Applied Sarah\'s design suggestion', type: 'merge' },
      { time: '14:32:25', user: 'Mike Rodriguez', action: 'Updated API endpoint documentation', type: 'edit' },
      { time: '14:32:30', user: 'Emma Wilson', action: 'Approved feature requirements', type: 'approval' },
    ];

    for (let i = 0; i < events.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setDemoResults({ type: 'realtime', events: events.slice(0, i + 1) });
    }

    // Add final collaboration insights
    await new Promise(resolve => setTimeout(resolve, 1000));
    setDemoResults({
      type: 'realtime',
      events,
      insights: {
        activeCollaborators: 4,
        simultaneousEdits: 2,
        conflictsResolved: 1,
        productivityBoost: '34%',
        communicationEfficiency: '87%',
      },
    });

    setIsProcessing(false);
  };

  const runExpertiseDemo = async () => {
    setIsProcessing(true);
    setDemoResults(null);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const expertiseMatching = {
      query: 'Need help with React performance optimization',
      matches: [
        {
          user: teamMembers[0],
          matchScore: 0.94,
          relevantSkills: ['React', 'TypeScript'],
          pastCollaborations: 12,
          availability: 'Available now',
          estimatedResponseTime: '5 minutes',
          reasoning: 'Expert in React optimization with recent performance improvements',
        },
        {
          user: teamMembers[1],
          matchScore: 0.67,
          relevantSkills: ['UI/UX', 'User Research'],
          pastCollaborations: 8,
          availability: 'Available in 30 min',
          estimatedResponseTime: '45 minutes',
          reasoning: 'Can provide UX perspective on performance impact',
        },
        {
          user: teamMembers[2],
          matchScore: 0.45,
          relevantSkills: ['API Design'],
          pastCollaborations: 3,
          availability: 'Away',
          estimatedResponseTime: '2 hours',
          reasoning: 'Backend optimization expertise may be relevant',
        },
      ],
      recommendations: [
        'Start with Alex Chen for immediate React-specific help',
        'Include Sarah Johnson for user experience considerations',
        'Consider async consultation with Mike for backend implications',
      ],
    };

    setDemoResults({ type: 'expertise', data: expertiseMatching });
    setIsProcessing(false);
  };

  const runConflictDemo = async () => {
    setIsProcessing(true);
    setDemoResults(null);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const conflictResolution = {
      conflict: {
        file: 'components/TaskCard.tsx',
        line: 42,
        description: 'Simultaneous edits to task priority display logic',
        participants: ['Alex Chen', 'Sarah Johnson'],
        timestamp: new Date(),
      },
      changes: {
        alex: {
          code: 'const priorityColor = priority === "high" ? "red" : "blue";',
          reasoning: 'Using semantic colors for better accessibility',
        },
        sarah: {
          code: 'const priorityColor = getPriorityColor(priority, theme);',
          reasoning: 'Using design system function for consistency',
        },
      },
      aiResolution: {
        suggestedMerge: 'const priorityColor = getPriorityColor(priority, theme, { accessible: true });',
        confidence: 0.89,
        reasoning: 'Combines design system consistency with accessibility requirements',
        benefits: [
          'Maintains design system consistency',
          'Preserves accessibility improvements',
          'Adds theme support for future flexibility',
        ],
      },
      outcome: 'Auto-merged with AI suggestion',
      participantApproval: ['Alex Chen: ✓ Approved', 'Sarah Johnson: ✓ Approved'],
    };

    setDemoResults({ type: 'conflict', data: conflictResolution });
    setIsProcessing(false);
  };

  useEffect(() => {
    if (isActive && currentDemo === 'realtime') {
      runRealtimeDemo();
    }
  }, [isActive, currentDemo]);

  const renderRealtimeResults = () => {
    if (!demoResults || demoResults.type !== 'realtime') return null;

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">Real-time Collaboration Stream</h4>
        
        <Card className="p-4">
          <h5 className="font-medium mb-3">Live Activity Feed</h5>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {demoResults.events.map((event: any, index: number) => (
              <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="text-xs text-gray-500 w-16">{event.time}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{event.user}</span>
                    <Badge variant="outline" className="text-xs">
                      {event.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{event.action}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {demoResults.insights && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{demoResults.insights.activeCollaborators}</div>
              <div className="text-xs text-gray-500">Active Users</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{demoResults.insights.simultaneousEdits}</div>
              <div className="text-xs text-gray-500">Simultaneous Edits</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{demoResults.insights.conflictsResolved}</div>
              <div className="text-xs text-gray-500">Conflicts Resolved</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">{demoResults.insights.productivityBoost}</div>
              <div className="text-xs text-gray-500">Productivity Boost</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-2xl font-bold text-indigo-600">{demoResults.insights.communicationEfficiency}</div>
              <div className="text-xs text-gray-500">Communication Efficiency</div>
            </Card>
          </div>
        )}
      </div>
    );
  };

  const renderExpertiseResults = () => {
    if (!demoResults || demoResults.type !== 'expertise') return null;

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">AI-Powered Expertise Matching</h4>
        
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
          <h5 className="font-medium mb-2">Query</h5>
          <p className="text-sm italic">"{demoResults.data.query}"</p>
        </Card>

        <div className="space-y-3">
          <h5 className="font-medium">Recommended Collaborators</h5>
          {demoResults.data.matches.map((match: any, index: number) => (
            <Card key={index} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{match.user.avatar}</span>
                  <div>
                    <h6 className="font-medium">{match.user.name}</h6>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{match.user.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="mb-1">
                    {Math.round(match.matchScore * 100)}% match
                  </Badge>
                  <div className="text-xs text-gray-500">{match.availability}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <h6 className="text-sm font-medium mb-1">Relevant Skills</h6>
                  <div className="flex flex-wrap gap-1">
                    {match.relevantSkills.map((skill: string, skillIndex: number) => (
                      <Badge key={skillIndex} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h6 className="text-sm font-medium mb-1">Collaboration History</h6>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {match.pastCollaborations} successful projects
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>AI Reasoning:</strong> {match.reasoning}
              </div>
              
              <div className="text-sm">
                <strong>Est. Response Time:</strong> {match.estimatedResponseTime}
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-4 bg-green-50 dark:bg-green-900/20">
          <h5 className="font-medium mb-2">AI Recommendations</h5>
          <ul className="space-y-1 text-sm">
            {demoResults.data.recommendations.map((rec: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    );
  };

  const renderConflictResults = () => {
    if (!demoResults || demoResults.type !== 'conflict') return null;

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">Intelligent Conflict Resolution</h4>
        
        <Card className="p-4 border-l-4 border-l-yellow-500">
          <h5 className="font-medium mb-2 text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Merge Conflict Detected</span>
          </h5>
          <div className="text-sm space-y-1">
            <p><strong>File:</strong> {demoResults.data.conflict.file}</p>
            <p><strong>Line:</strong> {demoResults.data.conflict.line}</p>
            <p><strong>Description:</strong> {demoResults.data.conflict.description}</p>
            <p><strong>Participants:</strong> {demoResults.data.conflict.participants.join(', ')}</p>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h5 className="font-medium mb-2">Alex's Changes</h5>
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded border-l-4 border-l-red-500">
              <code className="text-sm">{demoResults.data.changes.alex.code}</code>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              <strong>Reasoning:</strong> {demoResults.data.changes.alex.reasoning}
            </p>
          </Card>

          <Card className="p-4">
            <h5 className="font-medium mb-2">Sarah's Changes</h5>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border-l-4 border-l-blue-500">
              <code className="text-sm">{demoResults.data.changes.sarah.code}</code>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              <strong>Reasoning:</strong> {demoResults.data.changes.sarah.reasoning}
            </p>
          </Card>
        </div>

        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <h5 className="font-medium mb-2 text-green-800 dark:text-green-200">
            🤖 AI-Suggested Resolution
          </h5>
          <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded mb-3">
            <code className="text-sm">{demoResults.data.aiResolution.suggestedMerge}</code>
          </div>
          
          <div className="space-y-2 text-sm">
            <div>
              <strong>Confidence:</strong> {Math.round(demoResults.data.aiResolution.confidence * 100)}%
            </div>
            <div>
              <strong>AI Reasoning:</strong> {demoResults.data.aiResolution.reasoning}
            </div>
            <div>
              <strong>Benefits:</strong>
              <ul className="mt-1 ml-4 space-y-1">
                {demoResults.data.aiResolution.benefits.map((benefit: string, index: number) => (
                  <li key={index} className="text-xs">• {benefit}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h5 className="font-medium mb-2">Resolution Outcome</h5>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="default" className="bg-green-600">
              ✓ {demoResults.data.outcome}
            </Badge>
          </div>
          <div className="text-sm space-y-1">
            {demoResults.data.participantApproval.map((approval: string, index: number) => (
              <div key={index} className="text-green-600">{approval}</div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Intelligent Collaboration Engine</h3>
        <div className="flex gap-2">
          <Button
            onClick={() => setCurrentDemo('realtime')}
            variant={currentDemo === 'realtime' ? 'default' : 'outline'}
            size="sm"
          >
            Real-time Sync
          </Button>
          <Button
            onClick={() => setCurrentDemo('expertise')}
            variant={currentDemo === 'expertise' ? 'default' : 'outline'}
            size="sm"
          >
            Expertise Matching
          </Button>
          <Button
            onClick={() => setCurrentDemo('conflict')}
            variant={currentDemo === 'conflict' ? 'default' : 'outline'}
            size="sm"
          >
            Conflict Resolution
          </Button>
        </div>
      </div>

      {/* Team Overview */}
      <Card className="p-4">
        <h4 className="font-medium mb-3">Active Team Members</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <span className="text-2xl">{member.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h5 className="font-medium text-sm truncate">{member.name}</h5>
                  <div className={`w-2 h-2 rounded-full ${
                    member.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{member.role}</p>
                <p className="text-xs text-gray-500 truncate">{member.currentTask}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-semibold">
              {currentDemo === 'realtime' && 'Real-time Collaboration'}
              {currentDemo === 'expertise' && 'AI Expertise Matching'}
              {currentDemo === 'conflict' && 'Intelligent Conflict Resolution'}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {currentDemo === 'realtime' && 'See live collaboration events and team productivity metrics'}
              {currentDemo === 'expertise' && 'AI finds the best team members to help with specific challenges'}
              {currentDemo === 'conflict' && 'AI automatically resolves merge conflicts with intelligent suggestions'}
            </p>
          </div>
          <Button
            onClick={() => {
              if (currentDemo === 'realtime') runRealtimeDemo();
              if (currentDemo === 'expertise') runExpertiseDemo();
              if (currentDemo === 'conflict') runConflictDemo();
            }}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Run Demo'}
          </Button>
        </div>

        {isProcessing && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentDemo === 'realtime' && 'Simulating real-time collaboration events...'}
                {currentDemo === 'expertise' && 'Analyzing team expertise and availability...'}
                {currentDemo === 'conflict' && 'Resolving merge conflicts with AI...'}
              </p>
            </div>
          </div>
        )}

        {!isProcessing && demoResults && (
          <div>
            {renderRealtimeResults()}
            {renderExpertiseResults()}
            {renderConflictResults()}
          </div>
        )}

        {!isProcessing && !demoResults && (
          <div className="text-center py-12 text-gray-500">
            Click "Run Demo" to see intelligent collaboration in action
          </div>
        )}
      </Card>

      {demoResults && (
        <div className="flex justify-end">
          <Button onClick={onStepComplete}>
            Continue to Next Step
          </Button>
        </div>
      )}
    </div>
  );
};