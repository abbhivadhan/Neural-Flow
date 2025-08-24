import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { integrationService } from '../../services/integration';
import { 
  IntegrationProvider, 
  IntegrationStatus,
  Plugin 
} from '../../types/integration';

export const IntegrationDashboard: React.FC = () => {
  const [providers, setProviders] = useState<IntegrationProvider[]>([]);
  const [statuses, setStatuses] = useState<IntegrationStatus[]>([]);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
    initializeDemoData();
  }, []);

  const loadData = () => {
    setProviders(integrationService.getAvailableProviders());
    setStatuses(integrationService.getIntegrationStatuses());
    setPlugins(integrationService.getInstalledPlugins());
  };

  const initializeDemoData = async () => {
    try {
      await integrationService.initializeDemoData();
      loadData();
    } catch (error) {
      console.error('Failed to initialize demo data:', error);
    }
  };

  const handleConnect = async (providerId: string) => {
    setIsLoading(true);
    try {
      await integrationService.connectProvider(providerId);
      loadData();
    } catch (error) {
      console.error(`Failed to connect to ${providerId}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (providerId: string) => {
    setIsLoading(true);
    try {
      await integrationService.disconnectProvider(providerId);
      loadData();
    } catch (error) {
      console.error(`Failed to disconnect from ${providerId}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async (providerId: string) => {
    setIsLoading(true);
    try {
      await integrationService.startSync(providerId);
      loadData();
    } catch (error) {
      console.error(`Failed to sync ${providerId}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderStatus = (providerId: string): IntegrationStatus | undefined => {
    return statuses.find(status => status.providerId === providerId);
  };

  const getStatusBadge = (status?: IntegrationStatus) => {
    if (!status) {
      return <Badge variant="secondary">Not Connected</Badge>;
    }

    if (!status.connected) {
      return <Badge variant="destructive">Disconnected</Badge>;
    }

    switch (status.syncStatus) {
      case 'syncing':
        return <Badge variant="default">Syncing...</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="success">Connected</Badge>;
    }
  };

  const formatLastSync = (date?: Date) => {
    if (!date) return 'Never';
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.floor((date.getTime() - Date.now()) / (1000 * 60)),
      'minute'
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Integration Ecosystem
        </h2>
        <Button 
          onClick={loadData}
          variant="outline"
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>

      {/* Integration Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {statuses.filter(s => s.connected).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Connected Services
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {statuses.reduce((sum, s) => sum + s.dataCount, 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Synced Records
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {plugins.filter(p => p.isActive).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Active Plugins
            </div>
          </div>
        </Card>
      </div>

      {/* Available Providers */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Available Integrations
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((provider) => {
            const status = getProviderStatus(provider.id);
            
            return (
              <Card key={provider.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{provider.icon}</span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {provider.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {provider.type}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(status)}
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {provider.description}
                </p>
                
                {status && (
                  <div className="space-y-2 mb-4">
                    {status.lastSync && (
                      <div className="text-xs text-gray-500">
                        Last sync: {formatLastSync(status.lastSync)}
                      </div>
                    )}
                    {status.dataCount > 0 && (
                      <div className="text-xs text-gray-500">
                        {status.dataCount} records synced
                      </div>
                    )}
                    {status.errorMessage && (
                      <div className="text-xs text-red-500">
                        Error: {status.errorMessage}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex space-x-2">
                  {!status?.connected ? (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(provider.id)}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Connect
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSync(provider.id)}
                        disabled={isLoading || status.syncStatus === 'syncing'}
                        className="flex-1"
                      >
                        {status.syncStatus === 'syncing' ? 'Syncing...' : 'Sync'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDisconnect(provider.id)}
                        disabled={isLoading}
                      >
                        Disconnect
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Plugin Management */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Installed Plugins
        </h3>
        
        {plugins.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No plugins installed yet
          </div>
        ) : (
          <div className="space-y-3">
            {plugins.map((plugin) => (
              <div
                key={plugin.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    plugin.isActive ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {plugin.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      v{plugin.version} • {plugin.provider.name}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant={plugin.isActive ? 'success' : 'secondary'}>
                    {plugin.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Toggle plugin activation
                      console.log(`Toggle plugin: ${plugin.id}`);
                    }}
                  >
                    {plugin.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* API Gateway Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          API Gateway Statistics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {integrationService.getAPIGatewayStats().size}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Cached Responses
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {Math.round(integrationService.getAPIGatewayStats().hitRate * 100)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Cache Hit Rate
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {integrationService.getAPIGatewayStats().maxSize}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Max Cache Size
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => integrationService.clearCache()}
            size="sm"
          >
            Clear Cache
          </Button>
        </div>
      </Card>
    </div>
  );
};