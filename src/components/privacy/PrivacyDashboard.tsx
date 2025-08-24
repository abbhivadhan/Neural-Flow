/**
 * Privacy Dashboard Component
 * Provides a comprehensive interface for managing privacy settings and viewing data usage
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { 
  privacyService, 
  privacyControlsService,
  dataPortabilityService,
  type PrivacyPreference,
  type DataInventory 
} from '../../services/privacy';
import { 
  PrivacyDashboardMetrics, 
  UserConsentPreferences,
  SecurityAuditLog 
} from '../../types/privacy';

interface PrivacyDashboardProps {
  userId: string;
}

export const PrivacyDashboard: React.FC<PrivacyDashboardProps> = ({ userId }) => {
  const [preferences, setPreferences] = useState<PrivacyPreference[]>([]);
  const [metrics, setMetrics] = useState<PrivacyDashboardMetrics | null>(null);
  const [dataInventory, setDataInventory] = useState<DataInventory[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'preferences' | 'data' | 'audit'>('overview');

  useEffect(() => {
    loadPrivacyData();
  }, [userId]);

  const loadPrivacyData = async () => {
    try {
      setIsLoading(true);
      
      // Load privacy preferences
      const prefs = privacyControlsService.getPrivacyPreferences();
      setPreferences(prefs);

      // Load privacy metrics
      const dashboardMetrics = await privacyService.getPrivacyDashboard(userId);
      setMetrics(dashboardMetrics);

      // Load data inventory
      const inventory = await dataPortabilityService.getDataInventory(userId);
      setDataInventory(inventory);

      // Load audit logs
      const logs = privacyService.getAuditLogs(50);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Failed to load privacy data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceToggle = async (preferenceId: string, enabled: boolean) => {
    try {
      await privacyControlsService.updatePrivacyPreference(preferenceId, enabled, userId);
      await loadPrivacyData(); // Refresh data
    } catch (error) {
      console.error('Failed to update preference:', error);
    }
  };

  const handleDataExport = async () => {
    try {
      const allDataTypes = dataInventory.map(item => item.dataType);
      const exportResult = await privacyService.exportUserData(userId, allDataTypes, 'json');
      
      // Create download link
      const blob = new Blob([JSON.stringify(exportResult, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neural-flow-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Data export failed:', error);
    }
  };

  const handleDataDeletion = async () => {
    if (!confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      return;
    }

    try {
      const allDataTypes = dataInventory.map(item => item.dataType);
      await privacyService.deleteUserData(userId, allDataTypes, 'User requested deletion');
      await loadPrivacyData(); // Refresh data
    } catch (error) {
      console.error('Data deletion failed:', error);
    }
  };

  const getPrivacyScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Privacy Dashboard
        </h1>
        <div className="flex space-x-2">
          <Button onClick={handleDataExport} variant="outline">
            Export Data
          </Button>
          <Button onClick={handleDataDeletion} variant="outline" className="text-red-600">
            Delete All Data
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'preferences', label: 'Privacy Preferences' },
            { id: 'data', label: 'Data Inventory' },
            { id: 'audit', label: 'Audit Log' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Privacy Score</h3>
            <div className={`text-3xl font-bold ${getPrivacyScoreColor(metrics.privacyScore)}`}>
              {metrics.privacyScore}/100
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Higher scores indicate better privacy protection
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Data Encryption</h3>
            <div className="text-3xl font-bold text-green-600">
              {metrics.encryptedDataPercentage.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Of your data is encrypted
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Local Processing</h3>
            <div className="text-3xl font-bold text-blue-600">
              {metrics.localProcessingPercentage}%
            </div>
            <p className="text-sm text-gray-600 mt-2">
              AI processing done locally
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Total Data Points</h3>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {metrics.totalDataPoints.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Records stored in your account
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Consent Coverage</h3>
            <div className="text-3xl font-bold text-green-600">
              {metrics.consentCoverage}%
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Required consents obtained
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Retention Compliance</h3>
            <div className="text-3xl font-bold text-green-600">
              {metrics.dataRetentionCompliance}%
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Data within retention periods
            </p>
          </Card>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-4">
          <Alert>
            <p>
              Control how your data is processed and used. Essential functionality cannot be disabled
              as it's required for the application to work properly.
            </p>
          </Alert>

          {preferences.map((preference) => (
            <Card key={preference.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold">{preference.name}</h3>
                    <Badge variant={preference.category === 'essential' ? 'default' : 'secondary'}>
                      {preference.category}
                    </Badge>
                    {preference.required && (
                      <Badge variant="outline">Required</Badge>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3">{preference.description}</p>
                  <div className="text-sm text-gray-500">
                    <p>Data types: {preference.dataTypes.join(', ')}</p>
                    <p>Purposes: {preference.processingPurposes.join(', ')}</p>
                    <p>Retention: {preference.retentionPeriod} days</p>
                  </div>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preference.enabled}
                      disabled={preference.required}
                      onChange={(e) => handlePreferenceToggle(preference.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Data Inventory Tab */}
      {activeTab === 'data' && (
        <div className="space-y-4">
          <Alert>
            <p>
              This shows all data stored in your account, including storage location, 
              size, and retention information.
            </p>
          </Alert>

          {dataInventory.map((item) => (
            <Card key={item.dataType} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold capitalize">
                      {item.dataType.replace('_', ' ')}
                    </h3>
                    {item.encrypted && (
                      <Badge variant="default">Encrypted</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Records</p>
                      <p className="font-semibold">{item.recordCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Size</p>
                      <p className="font-semibold">{formatBytes(item.sizeBytes)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Retention</p>
                      <p className="font-semibold">{item.retentionPeriod} days</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Legal Basis</p>
                      <p className="font-semibold capitalize">{item.legalBasis.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-gray-500">
                    <p>Oldest: {item.oldestRecord.toLocaleDateString()}</p>
                    <p>Newest: {item.newestRecord.toLocaleDateString()}</p>
                    <p>Location: {item.storageLocation}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <Alert>
            <p>
              Security audit log showing all privacy-related activities in your account.
            </p>
          </Alert>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <Card key={log.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge 
                        variant={
                          log.severity === 'critical' ? 'destructive' :
                          log.severity === 'high' ? 'default' :
                          log.severity === 'medium' ? 'secondary' : 'outline'
                        }
                      >
                        {log.severity}
                      </Badge>
                      <span className="text-sm font-medium capitalize">
                        {log.event.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {log.details?.description || 'No description available'}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {log.timestamp.toLocaleString()}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};