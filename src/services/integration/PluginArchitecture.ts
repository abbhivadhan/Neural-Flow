import { 
  Plugin, 
  PluginConfig, 
  PluginHook, 
  PluginManifest
  // IntegrationProvider 
} from '../../types/integration';

export class PluginArchitecture {
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<string, PluginHook[]> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  /**
   * Register a new plugin in the system
   */
  async registerPlugin(plugin: Plugin): Promise<void> {
    try {
      // Validate plugin manifest
      this.validatePluginManifest(plugin.manifest);
      
      // Check dependencies
      await this.checkDependencies(plugin.manifest.dependencies);
      
      // Initialize plugin
      await this.initializePlugin(plugin);
      
      // Register hooks
      this.registerPluginHooks(plugin);
      
      // Store plugin
      this.plugins.set(plugin.id, plugin);
      
      console.log(`Plugin ${plugin.name} registered successfully`);
    } catch (error) {
      console.error(`Failed to register plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  /**
   * Unregister a plugin from the system
   */
  async unregisterPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    try {
      // Cleanup plugin hooks
      this.unregisterPluginHooks(plugin);
      
      // Deactivate plugin
      await this.deactivatePlugin(plugin);
      
      // Remove from registry
      this.plugins.delete(pluginId);
      
      console.log(`Plugin ${plugin.name} unregistered successfully`);
    } catch (error) {
      console.error(`Failed to unregister plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  /**
   * Execute hooks for a specific event
   */
  async executeHooks(event: string, data: any): Promise<any> {
    const hooks = this.hooks.get(event) || [];
    
    // Sort hooks by priority (higher priority first)
    const sortedHooks = hooks.sort((a, b) => b.priority - a.priority);
    
    let result = data;
    
    for (const hook of sortedHooks) {
      try {
        // Check conditions if any
        if (hook.conditions && !this.checkConditions(hook.conditions, result)) {
          continue;
        }
        
        // Execute hook handler
        const plugin = this.getPluginByHook(hook);
        if (plugin && plugin.isActive) {
          result = await this.executeHookHandler(plugin, hook, result);
        }
      } catch (error) {
        console.error(`Error executing hook ${hook.handler}:`, error);
        // Continue with other hooks even if one fails
      }
    }
    
    return result;
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get active plugins
   */
  getActivePlugins(): Plugin[] {
    return this.getPlugins().filter(plugin => plugin.isActive);
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Activate a plugin
   */
  async activatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    try {
      await this.initializePlugin(plugin);
      plugin.isActive = true;
      console.log(`Plugin ${plugin.name} activated`);
    } catch (error) {
      console.error(`Failed to activate plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivatePlugin(plugin: Plugin): Promise<void> {
    try {
      // Call plugin cleanup if available
      await this.cleanupPlugin(plugin);
      plugin.isActive = false;
      console.log(`Plugin ${plugin.name} deactivated`);
    } catch (error) {
      console.error(`Failed to deactivate plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  /**
   * Update plugin configuration
   */
  async updatePluginConfig(pluginId: string, config: Partial<PluginConfig>): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.config = { ...plugin.config, ...config };
    
    // Reinitialize plugin with new config if active
    if (plugin.isActive) {
      await this.initializePlugin(plugin);
    }
  }

  /**
   * Emit an event to all listeners
   */
  emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Add event listener
   */
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * Remove event listener
   */
  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private validatePluginManifest(manifest: PluginManifest): void {
    if (!manifest.name || !manifest.version || !manifest.entryPoint) {
      throw new Error('Invalid plugin manifest: missing required fields');
    }
    
    // Validate version format
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      throw new Error('Invalid version format. Expected semver (x.y.z)');
    }
  }

  private async checkDependencies(dependencies: string[]): Promise<void> {
    for (const dependency of dependencies) {
      if (!this.plugins.has(dependency)) {
        throw new Error(`Missing dependency: ${dependency}`);
      }
    }
  }

  private async initializePlugin(plugin: Plugin): Promise<void> {
    // In a real implementation, this would load and execute the plugin's entry point
    // For now, we'll simulate initialization
    console.log(`Initializing plugin ${plugin.name}...`);
    
    // Simulate async initialization
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Emit plugin initialized event
    this.emit('plugin:initialized', { plugin });
  }

  private async cleanupPlugin(plugin: Plugin): Promise<void> {
    // Cleanup plugin resources
    console.log(`Cleaning up plugin ${plugin.name}...`);
    
    // Emit plugin cleanup event
    this.emit('plugin:cleanup', { plugin });
  }

  private registerPluginHooks(plugin: Plugin): void {
    plugin.hooks.forEach(hook => {
      if (!this.hooks.has(hook.event)) {
        this.hooks.set(hook.event, []);
      }
      this.hooks.get(hook.event)!.push(hook);
    });
  }

  private unregisterPluginHooks(plugin: Plugin): void {
    plugin.hooks.forEach(hook => {
      const hooks = this.hooks.get(hook.event);
      if (hooks) {
        const index = hooks.indexOf(hook);
        if (index > -1) {
          hooks.splice(index, 1);
        }
      }
    });
  }

  private getPluginByHook(hook: PluginHook): Plugin | undefined {
    return Array.from(this.plugins.values()).find(plugin => 
      plugin.hooks.includes(hook)
    );
  }

  private async executeHookHandler(plugin: Plugin, hook: PluginHook, data: any): Promise<any> {
    // In a real implementation, this would execute the actual hook handler
    // For now, we'll simulate hook execution
    console.log(`Executing hook ${hook.handler} from plugin ${plugin.name}`);
    return data;
  }

  private checkConditions(conditions: Record<string, any>, data: any): boolean {
    // Simple condition checking - can be extended
    for (const [key, value] of Object.entries(conditions)) {
      if (data[key] !== value) {
        return false;
      }
    }
    return true;
  }
}

export const pluginArchitecture = new PluginArchitecture();