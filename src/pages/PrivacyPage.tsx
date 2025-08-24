/**
 * Privacy Page
 * Main page for privacy controls and data management
 */

import React, { useState, useEffect } from 'react';
import { PrivacyDashboard } from '../components/privacy/PrivacyDashboard';
import { privacyService } from '../services/privacy';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const PrivacyPage: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock user ID - in real app this would come from authentication
  const userId = 'demo-user-123';

  useEffect(() => {
    checkInitializationStatus();
  }, []);

  const checkInitializationStatus = () => {
    const stats = privacyService.getStats();
    setIsInitialized(stats.isInitialized);
  };

  const handleInitialize = async () => {
    if (!masterPassword.trim()) {
      setError('Please enter a master password');
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      await privacyService.initialize(masterPassword);
      setIsInitialized(true);
      setShowPasswordInput(false);
      setMasterPassword('');
    } catch (error) {
      console.error('Privacy service initialization failed:', error);
      setError('Failed to initialize privacy service. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all privacy settings? This will delete all encryption keys and privacy data.')) {
      return;
    }

    try {
      await privacyService.clearAllPrivacyData();
      setIsInitialized(false);
      setShowPasswordInput(false);
      setMasterPassword('');
      setError(null);
    } catch (error) {
      console.error('Failed to reset privacy data:', error);
      setError('Failed to reset privacy data. Please try again.');
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Privacy-First AI Setup
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Initialize your privacy-first AI workspace with end-to-end encryption
            </p>
          </div>

          <Card className="p-8">
            <div className="space-y-6">
              <Alert>
                <div className="space-y-2">
                  <p className="font-semibold">🔒 Your Privacy is Protected</p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• All AI processing happens locally in your browser</li>
                    <li>• Your data is encrypted with keys only you control</li>
                    <li>• No data is sent to external servers without your consent</li>
                    <li>• You have complete control over data retention and deletion</li>
                  </ul>
                </div>
              </Alert>

              {!showPasswordInput ? (
                <div className="text-center">
                  <Button 
                    onClick={() => setShowPasswordInput(true)}
                    className="w-full"
                  >
                    Set Up Privacy Protection
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Master Password
                    </label>
                    <input
                      type="password"
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      placeholder="Enter a strong master password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      onKeyPress={(e) => e.key === 'Enter' && handleInitialize()}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This password will be used to encrypt your data. Make sure it's strong and memorable.
                    </p>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      {error}
                    </Alert>
                  )}

                  <div className="flex space-x-3">
                    <Button 
                      onClick={handleInitialize}
                      disabled={isInitializing}
                      className="flex-1"
                    >
                      {isInitializing ? 'Initializing...' : 'Initialize Privacy Protection'}
                    </Button>
                    <Button 
                      onClick={() => setShowPasswordInput(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-3">Privacy Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Local AI Model Inference</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>End-to-End Encryption</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Granular Privacy Controls</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Data Export & Deletion</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Audit Logging</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>GDPR Compliance</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Privacy & Security
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage your privacy settings and data
              </p>
            </div>
            <Button onClick={handleReset} variant="outline" className="text-red-600">
              Reset Privacy Settings
            </Button>
          </div>
        </div>
      </div>

      <div className="py-8">
        <PrivacyDashboard userId={userId} />
      </div>
    </div>
  );
};