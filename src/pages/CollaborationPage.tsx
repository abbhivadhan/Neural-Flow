import React from 'react';
import { CollaborationDemo } from '../components/collaboration/CollaborationDemo';
import { TeamMember } from '../types/collaboration';

const mockTeamMembers: TeamMember[] = [
  {
    id: 'user1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    avatar: '',
    expertise: ['React', 'TypeScript', 'UI/UX Design'],
    availability: 'available',
    skills: [
      { name: 'React', level: 9, category: 'Frontend', verified: true },
      { name: 'TypeScript', level: 8, category: 'Programming', verified: true },
      { name: 'UI/UX Design', level: 7, category: 'Design', verified: false }
    ],
    communicationStyle: {
      responseTime: 15,
      preferredChannels: ['chat', 'video'],
      workingHours: { start: '09:00', end: '17:00' },
      timezone: 'UTC-8'
    }
  },
  {
    id: 'user2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    avatar: '',
    expertise: ['Node.js', 'Python', 'Machine Learning'],
    availability: 'busy',
    skills: [
      { name: 'Node.js', level: 8, category: 'Backend', verified: true },
      { name: 'Python', level: 9, category: 'Programming', verified: true },
      { name: 'Machine Learning', level: 7, category: 'AI/ML', verified: true }
    ],
    communicationStyle: {
      responseTime: 30,
      preferredChannels: ['email', 'chat'],
      workingHours: { start: '10:00', end: '18:00' },
      timezone: 'UTC-5'
    }
  },
  {
    id: 'user3',
    name: 'Carol Davis',
    email: 'carol@example.com',
    avatar: '',
    expertise: ['DevOps', 'AWS', 'Docker'],
    availability: 'available',
    skills: [
      { name: 'DevOps', level: 8, category: 'Infrastructure', verified: true },
      { name: 'AWS', level: 7, category: 'Cloud', verified: true },
      { name: 'Docker', level: 8, category: 'Containerization', verified: false }
    ],
    communicationStyle: {
      responseTime: 20,
      preferredChannels: ['chat', 'phone'],
      workingHours: { start: '08:00', end: '16:00' },
      timezone: 'UTC+1'
    }
  },
  {
    id: 'user4',
    name: 'David Wilson',
    email: 'david@example.com',
    avatar: '',
    expertise: ['Data Science', 'Analytics', 'Visualization'],
    availability: 'away',
    skills: [
      { name: 'Data Science', level: 9, category: 'Analytics', verified: true },
      { name: 'Python', level: 8, category: 'Programming', verified: true },
      { name: 'Visualization', level: 7, category: 'Design', verified: false }
    ],
    communicationStyle: {
      responseTime: 45,
      preferredChannels: ['email'],
      workingHours: { start: '11:00', end: '19:00' },
      timezone: 'UTC+9'
    }
  }
];

export const CollaborationPage: React.FC = () => {
  const currentUserId = 'current-user';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Real-Time Collaboration Engine
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Experience the power of AI-driven collaboration with real-time document editing, 
            intelligent expertise matching, operational transformation for conflict resolution, 
            and advanced communication analysis.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                WebSocket Client
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time communication with automatic reconnection and message queuing
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Conflict Resolution
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Operational transformation for seamless concurrent editing
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Expertise Matching
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-powered skill matching using vector similarity
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Communication Analysis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                NLP-powered sentiment analysis and team insights
              </p>
            </div>
          </div>
        </div>

        <CollaborationDemo 
          teamMembers={mockTeamMembers}
          currentUserId={currentUserId}
        />

        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Technical Implementation Highlights
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Real-Time Features
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  WebSocket client with automatic reconnection and message queuing
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Real-time cursor tracking and presence indicators
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Operational transformation for conflict-free collaborative editing
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Live chat with sentiment analysis and intent detection
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                AI-Powered Intelligence
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Vector-based expertise matching with skill similarity scoring
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  NLP-powered communication analysis and team insights
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Automatic action item extraction from conversations
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Team collaboration efficiency scoring and recommendations
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};