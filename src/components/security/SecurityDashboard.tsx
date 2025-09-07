/**
 * Security Dashboard Component
 * Displays security events, anomalies, and compliance information
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SecurityAuditService, SecurityEvent, SecurityEventType, SecuritySeverity, AnomalyPattern, ComplianceReport } from '../../services/security/SecurityAuditService';

interface SecurityDashboardProps {
  className?: string;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ className = '' }) => {
  const [auditService] = useState(() => SecurityAuditService.getInstance());
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyPattern[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [selectedTab, setSelectedTab] = useState<'events' | 'anomalies' | 'compliance'>('events');
  const [eventFilter, setEventFilter] = useState<{
    type?: SecurityEventType;
    severity?: SecuritySeverity;
  }>({});

  useEffect(() => {
    loadData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setEvents(auditService.getEvents({ limit: 100, ...eventFilter }));
    setAnomalies(auditService.getAnomalies());
    setStatistics(auditService.getStatistics());
    
    // Generate compliance report for last 24 hours
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    setComplianceReport(auditService.generateComplianceReport(oneDayAgo, now));
  };

  const getSeverityColor = (severity: SecuritySeverity): string => {
    switch (severity) {
      case SecuritySeverity.CRITICAL: return 'text-red-600 bg-red-50';
      case SecuritySeverity.HIGH: return 'text-orange-600 bg-orange-50';
      case SecuritySeverity.MEDIUM: return 'text-yellow-600 bg-yellow-50';
      case SecuritySeverity.LOW: return 'text-blue-600 bg-blue-50';
      case SecuritySeverity.INFO: return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskScoreColor = (riskScore: number): string => {
    if (riskScore >= 0.8) return 'text-red-600';
    if (riskScore >= 0.6) return 'text-orange-600';
    if (riskScore >= 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const renderEventsList = () => (
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
        <select
          value={eventFilter.type || ''}
          onChange={(e) => setEventFilter(prev => ({ 
            ...prev, 
            type: e.target.value as SecurityEventType || undefined 
          }))}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Types</option>
          {Object.values(SecurityEventType).map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        
        <select
          value={eventFilter.severity || ''}
          onChange={(e) => setEventFilter(prev => ({ 
            ...prev, 
            severity: e.target.value as SecuritySeverity || undefined 
          }))}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Severities</option>
          {Object.values(SecuritySeverity).map(severity => (
            <option key={severity} value={severity}>{severity}</option>
          ))}
        </select>
        
        <Button onClick={loadData} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="space-y-2">
        {events.map(event => (
          <Card key={event.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                    {event.severity.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-600">{event.type}</span>
                  <span className="text-sm text-gray-500">from {event.source}</span>
                </div>
                
                <div className="text-sm text-gray-800 mb-2">
                  {JSON.stringify(event.details, null, 2)}
                </div>
                
                {event.metadata?.riskScore && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Risk Score:</span>
                    <span className={`text-xs font-medium ${getRiskScoreColor(event.metadata.riskScore)}`}>
                      {(event.metadata.riskScore * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-500">
                {formatTimestamp(event.timestamp)}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAnomaliesList = () => (
    <div className="space-y-4">
      {anomalies.map(anomaly => (
        <Card key={anomaly.id} className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium text-gray-900">{anomaly.type}</h4>
              <p className="text-sm text-gray-600">{anomaly.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                anomaly.status === 'active' ? 'bg-red-100 text-red-800' :
                anomaly.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {anomaly.status}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Confidence:</span>
              <span className="ml-2 font-medium">{(anomaly.confidence * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-500">Risk Score:</span>
              <span className={`ml-2 font-medium ${getRiskScoreColor(anomaly.riskScore)}`}>
                {(anomaly.riskScore * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Events:</span>
              <span className="ml-2 font-medium">{anomaly.events.length}</span>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            Detected: {formatTimestamp(anomaly.detectedAt)}
          </div>
        </Card>
      ))}
      
      {anomalies.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No anomalies detected</p>
        </Card>
      )}
    </div>
  );

  const renderComplianceReport = () => {
    if (!complianceReport) return null;

    return (
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Compliance Score</h3>
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-bold ${
              complianceReport.complianceScore >= 80 ? 'text-green-600' :
              complianceReport.complianceScore >= 60 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {complianceReport.complianceScore}
            </div>
            <div className="text-gray-600">
              <div>Report Period:</div>
              <div className="text-sm">
                {formatTimestamp(complianceReport.period.start)} - {formatTimestamp(complianceReport.period.end)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Events Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">By Type</h4>
              <div className="space-y-1 text-sm">
                {Object.entries(complianceReport.eventsSummary).map(([type, count]) => (
                  <div key={type} className="flex justify-between">
                    <span className="capitalize">{type.replace('_', ' ')}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">By Severity</h4>
              <div className="space-y-1 text-sm">
                {Object.entries(complianceReport.severitySummary).map(([severity, count]) => (
                  <div key={severity} className="flex justify-between">
                    <span className={`capitalize ${getSeverityColor(severity as SecuritySeverity).split(' ')[0]}`}>
                      {severity}
                    </span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Recommendations</h3>
          <div className="space-y-2">
            {complianceReport.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Security Dashboard</h2>
        <Button onClick={loadData} variant="outline">
          Refresh All
        </Button>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900">{statistics.totalEvents || 0}</div>
          <div className="text-sm text-gray-600">Total Events</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">{statistics.activeAnomalies || 0}</div>
          <div className="text-sm text-gray-600">Active Anomalies</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {complianceReport?.complianceScore || 0}
          </div>
          <div className="text-sm text-gray-600">Compliance Score</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {statistics.eventsBySeverity?.[SecuritySeverity.CRITICAL] || 0}
          </div>
          <div className="text-sm text-gray-600">Critical Events</div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'events', label: 'Security Events' },
            { key: 'anomalies', label: 'Anomalies' },
            { key: 'compliance', label: 'Compliance Report' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {selectedTab === 'events' && renderEventsList()}
        {selectedTab === 'anomalies' && renderAnomaliesList()}
        {selectedTab === 'compliance' && renderComplianceReport()}
      </div>
    </div>
  );
};

export default SecurityDashboard;