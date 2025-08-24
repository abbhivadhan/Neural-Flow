import { 
  IntegrationProvider, 
  Plugin, 
  DataSyncConfig,
  APIGatewayRequest,
  APIGatewayResponse
} from '../../types/integration';
import { pluginArchitecture } from './PluginArchitecture';
import { oauth2Service } from './OAuth2Service';
import { dataSyncEngine } from './DataSyncEngine';
import { apiGateway } from './APIGateway';

export interface IntegrationStatus {
  providerId: string;
  connected: boolean;
  lastSync?: Date;
  syncStatus: 'idle' | 'syncing' | 'error';
  errorMessage?: string;
  dataCount: number;
}

export class IntegrationService {
  private integrationStatuses: Map<string, IntegrationStatus> = new Map();
  private webhookEndpoints: Map<string, string> = new Map();

  constructor() {
    this.initializeServices();
    this.setupEventListeners();
  }

  /**
   * Initialize all integration services
   */
  private initializeServices(): void {
    // Initialize OAuth2 service with popular providers
    oauth2Service.initializePopularProviders();
    
    // Initialize API Gateway with providers
    apiGateway.initializePopularProviders();
    
    console.log('Integration services initialized');
  }

  /**
   * Setup event listeners for integration events
   */
  private setupEventListeners(): void {
    // Listen for plugin events
    pluginArchitecture.on('plugin:initialized', (data) => {
      console.log(`Plugin initialized: ${data.plugin.name}`);
    });

    pluginArchitecture.on('plugin:cleanup', (data) => {
      console.log(`Plugin cleaned up: ${data.plugin.name}`);
    });
  }

  /**
   * Connect to an external service
   */
  async connectProvider(providerId: string, _config?: any): Promise<void> {
    try {
      // Start OAuth2 flow
      const authUrl = oauth2Service.generateAuthUrl(providerId);
      
      // In a real app, this would open a popup or redirect
      console.log(`Please visit: ${authUrl}`);
      
      // Update status
      this.updateIntegrationStatus(providerId, {
        providerId,
        connected: false,
        syncStatus: 'idle',
        dataCount: 0,
      });

      // For demo purposes, simulate successful connection
      setTimeout(() => {
        this.updateIntegrationStatus(providerId, {
          providerId,
          connected: true,
          syncStatus: 'idle',
          dataCount: 0,
        });
      }, 2000);

    } catch (error) {
      console.error(`Failed to connect to ${providerId}:`, error);
      this.updateIntegrationStatus(providerId, {
        providerId,
        connected: false,
        syncStatus: 'error',
        errorMessage: error instanceof Error ? error.message : 'Connection failed',
        dataCount: 0,
      });
      throw error;
    }
  }

  /**
   * Disconnect from an external service
   */
  async disconnectProvider(providerId: string): Promise<void> {
    try {
      // Revoke OAuth2 token
      await oauth2Service.revokeToken(providerId);
      
      // Stop any active syncs
      if (dataSyncEngine.isSyncActive(providerId)) {
        dataSyncEngine.stopAllSyncs();
      }
      
      // Update status
      this.updateIntegrationStatus(providerId, {
        providerId,
        connected: false,
        syncStatus: 'idle',
        dataCount: 0,
      });

      console.log(`Disconnected from ${providerId}`);
    } catch (error) {
      console.error(`Failed to disconnect from ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Setup data synchronization for a provider
   */
  async setupSync(providerId: string, config: Partial<DataSyncConfig>): Promise<void> {
    const syncConfig: DataSyncConfig = {
      providerId,
      syncInterval: 300, // 5 minutes default
      conflictResolution: 'latest-wins',
      dataMapping: [],
      filters: [],
      ...config,
    };

    dataSyncEngine.registerSyncConfig(providerId, syncConfig);
    console.log(`Sync configured for ${providerId}`);
  }

  /**
   * Start data synchronization
   */
  async startSync(providerId: string): Promise<void> {
    const status = this.integrationStatuses.get(providerId);
    if (!status?.connected) {
      throw new Error(`Provider ${providerId} is not connected`);
    }

    try {
      this.updateIntegrationStatus(providerId, {
        ...status,
        syncStatus: 'syncing',
      });

      const result = await dataSyncEngine.startSync(providerId);
      
      this.updateIntegrationStatus(providerId, {
        ...status,
        syncStatus: 'idle',
        lastSync: new Date(),
        dataCount: result.recordsProcessed,
      });

      console.log(`Sync completed for ${providerId}:`, result);
    } catch (error) {
      this.updateIntegrationStatus(providerId, {
        ...status,
        syncStatus: 'error',
        errorMessage: error instanceof Error ? error.message : 'Sync failed',
      });
      throw error;
    }
  }

  /**
   * Make an API request through the gateway
   */
  async makeAPIRequest(request: APIGatewayRequest): Promise<APIGatewayResponse> {
    const status = this.integrationStatuses.get(request.providerId);
    if (!status?.connected) {
      throw new Error(`Provider ${request.providerId} is not connected`);
    }

    return await apiGateway.makeRequest(request);
  }

  /**
   * Install a plugin
   */
  async installPlugin(plugin: Plugin): Promise<void> {
    try {
      await pluginArchitecture.registerPlugin(plugin);
      console.log(`Plugin ${plugin.name} installed successfully`);
    } catch (error) {
      console.error(`Failed to install plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId: string): Promise<void> {
    try {
      await pluginArchitecture.unregisterPlugin(pluginId);
      console.log(`Plugin ${pluginId} uninstalled successfully`);
    } catch (error) {
      console.error(`Failed to uninstall plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Get all available providers
   */
  getAvailableProviders(): IntegrationProvider[] {
    // This would typically come from a registry or configuration
    return [
      {
        id: 'google',
        name: 'Google Workspace',
        type: 'productivity',
        icon: '🔍',
        description: 'Google Drive, Calendar, Gmail integration',
        authType: 'oauth2',
        scopes: ['drive', 'calendar', 'gmail'],
        endpoints: [],
        capabilities: [],
        status: 'disconnected',
      },
      {
        id: 'microsoft',
        name: 'Microsoft 365',
        type: 'productivity',
        icon: '📊',
        description: 'OneDrive, Outlook, Teams integration',
        authType: 'oauth2',
        scopes: ['files', 'calendar', 'mail'],
        endpoints: [],
        capabilities: [],
        status: 'disconnected',
      },
      {
        id: 'slack',
        name: 'Slack',
        type: 'communication',
        icon: '💬',
        description: 'Team communication and file sharing',
        authType: 'oauth2',
        scopes: ['channels:read', 'chat:write', 'files:read'],
        endpoints: [],
        capabilities: [],
        status: 'disconnected',
      },
      {
        id: 'notion',
        name: 'Notion',
        type: 'productivity',
        icon: '📝',
        description: 'Knowledge management and documentation',
        authType: 'oauth2',
        scopes: ['read', 'update', 'insert'],
        endpoints: [],
        capabilities: [],
        status: 'disconnected',
      },
      {
        id: 'trello',
        name: 'Trello',
        type: 'project-management',
        icon: '📋',
        description: 'Project and task management',
        authType: 'oauth2',
        scopes: ['read', 'write'],
        endpoints: [],
        capabilities: [],
        status: 'disconnected',
      },
    ];
  }

  /**
   * Get integration status for all providers
   */
  getIntegrationStatuses(): IntegrationStatus[] {
    return Array.from(this.integrationStatuses.values());
  }

  /**
   * Get integration status for a specific provider
   */
  getIntegrationStatus(providerId: string): IntegrationStatus | undefined {
    return this.integrationStatuses.get(providerId);
  }

  /**
   * Get installed plugins
   */
  getInstalledPlugins(): Plugin[] {
    return pluginArchitecture.getPlugins();
  }

  /**
   * Get active plugins
   */
  getActivePlugins(): Plugin[] {
    return pluginArchitecture.getActivePlugins();
  }

  /**
   * Execute plugin hooks for an event
   */
  async executeHooks(event: string, data: any): Promise<any> {
    return await pluginArchitecture.executeHooks(event, data);
  }

  /**
   * Setup webhook endpoint for a provider
   */
  setupWebhook(providerId: string, endpoint: string): void {
    this.webhookEndpoints.set(providerId, endpoint);
    console.log(`Webhook endpoint set for ${providerId}: ${endpoint}`);
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(providerId: string, payload: any): Promise<void> {
    console.log(`Received webhook from ${providerId}:`, payload);
    
    // Execute webhook hooks
    await this.executeHooks('webhook:received', {
      providerId,
      payload,
    });

    // Trigger sync if needed
    const status = this.integrationStatuses.get(providerId);
    if (status?.connected && status.syncStatus === 'idle') {
      try {
        await this.startSync(providerId);
      } catch (error) {
        console.error(`Failed to sync after webhook from ${providerId}:`, error);
      }
    }
  }

  /**
   * Get sync history for a provider
   */
  getSyncHistory(providerId: string) {
    return dataSyncEngine.getSyncHistory(providerId);
  }

  /**
   * Get API gateway statistics
   */
  getAPIGatewayStats() {
    return apiGateway.getCacheStats();
  }

  /**
   * Clear cache for a provider
   */
  clearCache(providerId?: string): void {
    apiGateway.clearCache(providerId);
  }

  /**
   * Update integration status
   */
  private updateIntegrationStatus(providerId: string, status: IntegrationStatus): void {
    this.integrationStatuses.set(providerId, status);
    
    // Emit status change event
    pluginArchitecture.emit('integration:status-changed', {
      providerId,
      status,
    });
  }

  /**
   * Initialize demo data and connections
   */
  async initializeDemoData(): Promise<void> {
    console.log('Initializing demo integration data...');
    
    // Simulate some connected providers
    const demoProviders = ['google', 'slack', 'notion'];
    
    for (const providerId of demoProviders) {
      this.updateIntegrationStatus(providerId, {
        providerId,
        connected: true,
        syncStatus: 'idle',
        lastSync: new Date(Date.now() - Math.random() * 3600000), // Random time in last hour
        dataCount: Math.floor(Math.random() * 100) + 10,
      });
    }

    // Setup some demo sync configurations
    await this.setupSync('google', {
      syncInterval: 300,
      conflictResolution: 'latest-wins',
      dataMapping: [
        {
          sourceField: 'name',
          targetField: 'title',
        },
        {
          sourceField: 'modifiedTime',
          targetField: 'updatedAt',
        },
      ],
      filters: [
        {
          field: 'mimeType',
          operator: 'contains',
          value: 'document',
        },
      ],
    });

    console.log('Demo integration data initialized');
  }
}

export const integrationService = new IntegrationService();