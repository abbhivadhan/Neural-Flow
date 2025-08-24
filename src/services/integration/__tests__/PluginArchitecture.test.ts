import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginArchitecture } from '../PluginArchitecture';
import { Plugin } from '../../../types/integration';

describe('PluginArchitecture', () => {
  let pluginArchitecture: PluginArchitecture;
  let mockPlugin: Plugin;

  beforeEach(() => {
    pluginArchitecture = new PluginArchitecture();
    
    mockPlugin = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      provider: {
        id: 'test-provider',
        name: 'Test Provider',
        type: 'productivity',
        icon: '🧪',
        description: 'Test provider',
        authType: 'api-key',
        scopes: [],
        endpoints: [],
        capabilities: [],
        status: 'connected',
      },
      config: {
        settings: {},
      },
      hooks: [
        {
          event: 'test-event',
          handler: 'testHandler',
          priority: 1,
        },
      ],
      manifest: {
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        permissions: [],
        dependencies: [],
        entryPoint: 'index.js',
      },
      isActive: false,
    };
  });

  describe('registerPlugin', () => {
    it('should register a valid plugin', async () => {
      await pluginArchitecture.registerPlugin(mockPlugin);
      
      const plugins = pluginArchitecture.getPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].id).toBe('test-plugin');
    });

    it('should throw error for invalid manifest', async () => {
      const invalidPlugin = {
        ...mockPlugin,
        manifest: {
          ...mockPlugin.manifest,
          name: '', // Invalid: empty name
        },
      };

      await expect(pluginArchitecture.registerPlugin(invalidPlugin))
        .rejects.toThrow('Invalid plugin manifest');
    });

    it('should throw error for invalid version format', async () => {
      const invalidPlugin = {
        ...mockPlugin,
        manifest: {
          ...mockPlugin.manifest,
          version: '1.0', // Invalid: not semver
        },
      };

      await expect(pluginArchitecture.registerPlugin(invalidPlugin))
        .rejects.toThrow('Invalid version format');
    });
  });

  describe('unregisterPlugin', () => {
    it('should unregister an existing plugin', async () => {
      await pluginArchitecture.registerPlugin(mockPlugin);
      await pluginArchitecture.unregisterPlugin('test-plugin');
      
      const plugins = pluginArchitecture.getPlugins();
      expect(plugins).toHaveLength(0);
    });

    it('should throw error for non-existent plugin', async () => {
      await expect(pluginArchitecture.unregisterPlugin('non-existent'))
        .rejects.toThrow('Plugin non-existent not found');
    });
  });

  describe('executeHooks', () => {
    it('should execute hooks for an event', async () => {
      await pluginArchitecture.registerPlugin(mockPlugin);
      await pluginArchitecture.activatePlugin('test-plugin');
      
      const result = await pluginArchitecture.executeHooks('test-event', { data: 'test' });
      expect(result).toEqual({ data: 'test' });
    });

    it('should handle hooks with priority order', async () => {
      const plugin1 = {
        ...mockPlugin,
        id: 'plugin1',
        hooks: [
          {
            event: 'test-event',
            handler: 'handler1',
            priority: 1,
          },
        ],
      };

      const plugin2 = {
        ...mockPlugin,
        id: 'plugin2',
        hooks: [
          {
            event: 'test-event',
            handler: 'handler2',
            priority: 2, // Higher priority
          },
        ],
      };

      await pluginArchitecture.registerPlugin(plugin1);
      await pluginArchitecture.registerPlugin(plugin2);
      await pluginArchitecture.activatePlugin('plugin1');
      await pluginArchitecture.activatePlugin('plugin2');

      const result = await pluginArchitecture.executeHooks('test-event', { data: 'test' });
      expect(result).toEqual({ data: 'test' });
    });
  });

  describe('plugin activation', () => {
    it('should activate a plugin', async () => {
      await pluginArchitecture.registerPlugin(mockPlugin);
      await pluginArchitecture.activatePlugin('test-plugin');
      
      const plugin = pluginArchitecture.getPlugin('test-plugin');
      expect(plugin?.isActive).toBe(true);
    });

    it('should deactivate a plugin', async () => {
      await pluginArchitecture.registerPlugin(mockPlugin);
      await pluginArchitecture.activatePlugin('test-plugin');
      
      const plugin = pluginArchitecture.getPlugin('test-plugin');
      if (plugin) {
        await pluginArchitecture.deactivatePlugin(plugin);
        expect(plugin.isActive).toBe(false);
      }
    });

    it('should get only active plugins', async () => {
      await pluginArchitecture.registerPlugin(mockPlugin);
      
      let activePlugins = pluginArchitecture.getActivePlugins();
      expect(activePlugins).toHaveLength(0);
      
      await pluginArchitecture.activatePlugin('test-plugin');
      activePlugins = pluginArchitecture.getActivePlugins();
      expect(activePlugins).toHaveLength(1);
    });
  });

  describe('event system', () => {
    it('should emit and listen to events', () => {
      const mockListener = vi.fn();
      
      pluginArchitecture.on('test-event', mockListener);
      pluginArchitecture.emit('test-event', { data: 'test' });
      
      expect(mockListener).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should remove event listeners', () => {
      const mockListener = vi.fn();
      
      pluginArchitecture.on('test-event', mockListener);
      pluginArchitecture.off('test-event', mockListener);
      pluginArchitecture.emit('test-event', { data: 'test' });
      
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('plugin configuration', () => {
    it('should update plugin configuration', async () => {
      await pluginArchitecture.registerPlugin(mockPlugin);
      
      const newConfig = {
        apiKey: 'new-api-key',
        settings: { theme: 'dark' },
      };
      
      await pluginArchitecture.updatePluginConfig('test-plugin', newConfig);
      
      const plugin = pluginArchitecture.getPlugin('test-plugin');
      expect(plugin?.config.apiKey).toBe('new-api-key');
      expect(plugin?.config.settings.theme).toBe('dark');
    });
  });
});