import React, { useState } from 'react';
import { Users, MessageSquare, Video, Share2, GitBranch, Clock } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  expertise: string[];
  availability: 'available' | 'busy' | 'away';
}

export default function CollaborationPage() {
  const [activeUsers] = useState(3);
  const [messages] = useState([
    { id: 1, user: 'Alice', message: 'Working on the new feature branch', time: '2 min ago' },
    { id: 2, user: 'Bob', message: 'Code review completed ✅', time: '5 min ago' },
    { id: 3, user: 'Carol', message: 'Deployment pipeline is ready', time: '8 min ago' }
  ]);

  const mockTeamMembers: TeamMember[] = [
    {
      id: 'user1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      avatar: '',
      expertise: ['React', 'TypeScript', 'UI/UX Design'],
      availability: 'available'
    },
    {
      id: 'user2',
      name: 'Bob Smith',
      email: 'bob@example.com',
      avatar: '',
      expertise: ['Node.js', 'Python', 'Machine Learning'],
      availability: 'busy'
    },
    {
      id: 'user3',
      name: 'Carol Davis',
      email: 'carol@example.com',
      avatar: '',
      expertise: ['DevOps', 'AWS', 'Docker'],
      availability: 'available'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Users className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Real-Time Collaboration
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Experience seamless team collaboration with real-time editing, intelligent expertise matching, 
            and AI-powered communication analysis.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg text-center">
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{activeUsers}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Active Users</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg text-center">
            <MessageSquare className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">24</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Messages Today</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg text-center">
            <GitBranch className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">7</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Active Branches</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg text-center">
            <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">2.3h</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Avg Response</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Team Members */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Members</h3>
            <div className="space-y-4">
              {mockTeamMembers.map((member) => (
                <div key={member.id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">{member.name}</h4>
                      <span className={`w-2 h-2 rounded-full ${
                        member.availability === 'available' ? 'bg-green-500' :
                        member.availability === 'busy' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{member.email}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {member.expertise.slice(0, 2).map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">{msg.user}</span>
                    <span className="text-xs text-gray-500">{msg.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{msg.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <Video className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Video Collaboration</h3>
            <p className="text-gray-600 dark:text-gray-300">
              High-quality video calls with screen sharing and real-time collaboration tools.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <Share2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Real-time Editing</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Collaborative document editing with live cursors and conflict resolution.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <MessageSquare className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Smart Communication</h3>
            <p className="text-gray-600 dark:text-gray-300">
              AI-powered message analysis and intelligent notification management.
            </p>
          </div>
        </div>

        {/* Demo Note */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
          <p className="text-blue-800 dark:text-blue-200">
            This is a demonstration of the collaboration features. In a real implementation, 
            this would connect to live collaboration services and show real-time updates.
          </p>
        </div>
      </div>
    </div>
  );
}