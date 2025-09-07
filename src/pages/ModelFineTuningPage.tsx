import React, { useState } from 'react';
import { ModelFineTuningDemo } from '../components/ml/ModelFineTuningDemo';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const ModelFineTuningPage: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState('demo_user_001');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const demoUsers = [
    { id: 'demo_user_001', name: 'Alex Chen', role: 'Software Engineer' },
    { id: 'demo_user_002', name: 'Sarah Johnson', role: 'Product Manager' },
    { id: 'demo_user_003', name: 'Michael Rodriguez', role: 'Data Scientist' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Model Fine-Tuning Pipeline
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience cutting-edge privacy-first AI adaptation with transfer learning, 
            incremental updates, and federated learning capabilities
          </p>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="text-2xl font-bold mb-2">🧠</div>
            <div className="font-semibold">Transfer Learning</div>
            <div className="text-sm opacity-90">Adapt pre-trained models</div>
          </Card>
          
          <Card className="p-4 text-center bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="text-2xl font-bold mb-2">🔄</div>
            <div className="font-semibold">Incremental Updates</div>
            <div className="text-sm opacity-90">Continuous learning</div>
          </Card>
          
          <Card className="p-4 text-center bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="text-2xl font-bold mb-2">🔒</div>
            <div className="font-semibold">Privacy First</div>
            <div className="text-sm opacity-90">Local processing</div>
          </Card>
          
          <Card className="p-4 text-center bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="text-2xl font-bold mb-2">🌐</div>
            <div className="font-semibold">Federated Learning</div>
            <div className="text-sm opacity-90">Collaborative AI</div>
          </Card>
        </div>

        {/* User Selection */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Select Demo User</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {demoUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedUserId === user.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">{user.name}</div>
                <div className="text-sm text-gray-600">{user.role}</div>
                <Badge className="mt-2 bg-gray-100 text-gray-800">
                  ID: {user.id}
                </Badge>
              </button>
            ))}
          </div>
        </Card>

        {/* Technical Details Toggle */}
        <div className="flex justify-center mb-6">
          <Button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="bg-gray-600 hover:bg-gray-700"
          >
            {showTechnicalDetails ? 'Hide' : 'Show'} Technical Details
          </Button>
        </div>

        {/* Technical Architecture */}
        {showTechnicalDetails && (
          <Card className="p-6 mb-8 bg-gray-50">
            <h2 className="text-xl font-semibold mb-4">Technical Architecture</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-blue-600">Transfer Learning Pipeline</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Base model loading with TensorFlow.js</li>
                  <li>• Layer freezing for feature preservation</li>
                  <li>• User-specific adaptation layers</li>
                  <li>• Fine-tuning with small learning rates</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 text-green-600">Incremental Learning</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Real-time data processing</li>
                  <li>• Batch processing for efficiency</li>
                  <li>• Catastrophic forgetting prevention</li>
                  <li>• Performance monitoring & rollback</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 text-purple-600">Privacy Protection</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Local model inference with WebAssembly</li>
                  <li>• Differential privacy noise injection</li>
                  <li>• End-to-end encryption for updates</li>
                  <li>• User-controlled data retention</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 text-orange-600">Federated Learning</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Secure aggregation protocols</li>
                  <li>• Model weight sharing (not data)</li>
                  <li>• Byzantine fault tolerance</li>
                  <li>• Adaptive aggregation strategies</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-100 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Key Technologies</h4>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-blue-200 text-blue-800">TensorFlow.js</Badge>
                <Badge className="bg-blue-200 text-blue-800">WebAssembly</Badge>
                <Badge className="bg-blue-200 text-blue-800">Differential Privacy</Badge>
                <Badge className="bg-blue-200 text-blue-800">Operational Transform</Badge>
                <Badge className="bg-blue-200 text-blue-800">Model Quantization</Badge>
                <Badge className="bg-blue-200 text-blue-800">Secure Aggregation</Badge>
              </div>
            </div>
          </Card>
        )}

        {/* Main Demo */}
        <ModelFineTuningDemo 
          userId={selectedUserId}
          className="mb-8"
        />

        {/* Benefits Section */}
        <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <h2 className="text-xl font-semibold mb-4 text-indigo-900">
            Why This Matters for Neural Flow
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-indigo-800">For Users</h3>
              <ul className="space-y-1 text-sm text-indigo-700">
                <li>• Personalized AI that learns your unique work patterns</li>
                <li>• Complete privacy and data control</li>
                <li>• Continuously improving productivity suggestions</li>
                <li>• No vendor lock-in - export your model anytime</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 text-indigo-800">For Organizations</h3>
              <ul className="space-y-1 text-sm text-indigo-700">
                <li>• Collective intelligence without data sharing</li>
                <li>• Compliance with privacy regulations</li>
                <li>• Reduced infrastructure costs (edge computing)</li>
                <li>• Faster model deployment and updates</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-white rounded-lg border border-indigo-200">
            <div className="text-sm text-indigo-800">
              <strong>Innovation Highlight:</strong> This implementation showcases state-of-the-art 
              privacy-preserving machine learning techniques that enable personalized AI without 
              compromising user privacy - a key differentiator in the productivity software market.
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p className="text-sm">
            This demo showcases advanced AI capabilities built with modern web technologies.
            All processing happens locally in your browser for maximum privacy.
          </p>
        </div>
      </div>
    </div>
  );
};