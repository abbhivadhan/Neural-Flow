import {
  DataSyncConfig,
  DataMapping,
  SyncConflict,
  ConflictResolution,
  ConflictResolutionStrategy,
  ConflictType,
  SyncFilter,
  FilterOperator,
  ValidationRule,

} from '../../types/integration';

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsUpdated: number;
  recordsCreated: number;
  recordsDeleted: number;
  conflicts: SyncConflict[];
  errors: string[];
  duration: number;
}

export class DataSyncEngine {
  private syncConfigs: Map<string, DataSyncConfig> = new Map();
  private activeSyncs: Set<string> = new Set();
  private syncHistory: Map<string, SyncResult[]> = new Map();

  /**
   * Register a data sync configuration
   */
  registerSyncConfig(configId: string, config: DataSyncConfig): void {
    this.syncConfigs.set(configId, config);
  }

  /**
   * Start synchronization for a specific configuration
   */
  async startSync(configId: string): Promise<SyncResult> {
    if (this.activeSyncs.has(configId)) {
      throw new Error(`Sync already in progress for config: ${configId}`);
    }

    const config = this.syncConfigs.get(configId);
    if (!config) {
      throw new Error(`Sync config not found: ${configId}`);
    }

    this.activeSyncs.add(configId);
    const startTime = Date.now();

    try {
      const result = await this.performSync(config);
      result.duration = Date.now() - startTime;

      // Update last sync time
      config.lastSync = new Date();

      // Store sync history
      this.addToSyncHistory(configId, result);

      return result;
    } finally {
      this.activeSyncs.delete(configId);
    }
  }

  /**
   * Perform the actual synchronization
   */
  private async performSync(config: DataSyncConfig): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      recordsProcessed: 0,
      recordsUpdated: 0,
      recordsCreated: 0,
      recordsDeleted: 0,
      conflicts: [],
      errors: [],
      duration: 0,
    };

    try {
      // Fetch data from source
      const sourceData = await this.fetchSourceData(config);
      
      // Apply filters
      const filteredData = this.applyFilters(sourceData, config.filters);
      
      // Transform data according to mappings
      const transformedData = await this.transformData(filteredData, config.dataMapping);
      
      // Fetch existing target data for comparison
      const targetData = await this.fetchTargetData(config);
      
      // Detect conflicts and changes
      const { changes, conflicts } = this.detectChangesAndConflicts(
        transformedData,
        targetData,
        config
      );
      
      result.conflicts = conflicts;
      result.recordsProcessed = transformedData.length;
      
      // Resolve conflicts
      const resolvedChanges = await this.resolveConflicts(changes, conflicts, config);
      
      // Apply changes to target
      const applyResult = await this.applyChanges(resolvedChanges, config);
      
      result.recordsCreated = applyResult.created;
      result.recordsUpdated = applyResult.updated;
      result.recordsDeleted = applyResult.deleted;
      
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : String(error));
    }

    return result;
  }

  /**
   * Fetch data from source system
   */
  private async fetchSourceData(config: DataSyncConfig): Promise<any[]> {
    // In a real implementation, this would fetch from the actual source
    // For now, we'll simulate fetching data
    console.log(`Fetching data from provider: ${config.providerId}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock data
    return [
      { id: '1', name: 'Task 1', status: 'completed', updatedAt: new Date() },
      { id: '2', name: 'Task 2', status: 'in-progress', updatedAt: new Date() },
    ];
  }

  /**
   * Fetch existing target data
   */
  private async fetchTargetData(config: DataSyncConfig): Promise<any[]> {
    // In a real implementation, this would fetch from local storage or database
    console.log(`Fetching target data for provider: ${config.providerId}`);
    
    // Return mock existing data
    return [
      { id: '1', name: 'Task 1', status: 'pending', updatedAt: new Date(Date.now() - 3600000) },
    ];
  }

  /**
   * Apply filters to data
   */
  private applyFilters(data: any[], filters: SyncFilter[]): any[] {
    if (!filters.length) return data;

    return data.filter(item => {
      return filters.every(filter => {
        const value = item[filter.field];
        return this.evaluateFilter(value, filter.operator, filter.value);
      });
    });
  }

  /**
   * Evaluate a single filter condition
   */
  private evaluateFilter(value: any, operator: FilterOperator, filterValue: any): boolean {
    switch (operator) {
      case 'equals':
        return value === filterValue;
      case 'not-equals':
        return value !== filterValue;
      case 'contains':
        return String(value).includes(String(filterValue));
      case 'starts-with':
        return String(value).startsWith(String(filterValue));
      case 'ends-with':
        return String(value).endsWith(String(filterValue));
      case 'greater-than':
        return value > filterValue;
      case 'less-than':
        return value < filterValue;
      default:
        return true;
    }
  }

  /**
   * Transform data according to mappings
   */
  private async transformData(data: any[], mappings: DataMapping[]): Promise<any[]> {
    return Promise.all(data.map(async item => {
      const transformed: any = {};
      
      for (const mapping of mappings) {
        let value = item[mapping.sourceField];
        
        // Apply transformation if specified
        if (mapping.transform) {
          value = mapping.transform(value);
        }
        
        // Validate value
        if (mapping.validation) {
          this.validateValue(value, mapping.validation);
        }
        
        transformed[mapping.targetField] = value;
      }
      
      return transformed;
    }));
  }

  /**
   * Validate a value against validation rules
   */
  private validateValue(value: any, rules: ValidationRule[]): void {
    for (const rule of rules) {
      switch (rule.type) {
        case 'required':
          if (value == null || value === '') {
            throw new Error(rule.message || 'Value is required');
          }
          break;
        case 'type':
          if (typeof value !== rule.params) {
            throw new Error(rule.message || `Expected type ${rule.params}`);
          }
          break;
        case 'format':
          if (rule.params instanceof RegExp && !rule.params.test(String(value))) {
            throw new Error(rule.message || 'Invalid format');
          }
          break;
        case 'range':
          if (rule.params && (value < rule.params.min || value > rule.params.max)) {
            throw new Error(rule.message || 'Value out of range');
          }
          break;
        case 'custom':
          if (rule.params && typeof rule.params === 'function' && !rule.params(value)) {
            throw new Error(rule.message || 'Custom validation failed');
          }
          break;
      }
    }
  }

  /**
   * Detect changes and conflicts between source and target data
   */
  private detectChangesAndConflicts(
    sourceData: any[],
    targetData: any[],
    _config: DataSyncConfig
  ): { changes: any[], conflicts: SyncConflict[] } {
    const changes: any[] = [];
    const conflicts: SyncConflict[] = [];
    const targetMap = new Map(targetData.map(item => [item.id, item]));

    for (const sourceItem of sourceData) {
      const targetItem = targetMap.get(sourceItem.id);
      
      if (!targetItem) {
        // New item - no conflict
        changes.push({ type: 'create', data: sourceItem });
      } else {
        // Check for conflicts
        const conflict = this.detectConflict(sourceItem, targetItem);
        
        if (conflict) {
          conflicts.push({
            id: `${sourceItem.id}-${Date.now()}`,
            sourceData: sourceItem,
            targetData: targetItem,
            conflictType: conflict,
            timestamp: new Date(),
          });
        } else {
          // No conflict - safe to update
          changes.push({ type: 'update', data: sourceItem, existing: targetItem });
        }
      }
    }

    return { changes, conflicts };
  }

  /**
   * Detect specific type of conflict
   */
  private detectConflict(sourceItem: any, targetItem: any): ConflictType | null {
    // Check for concurrent edits (both items updated recently)
    const sourceUpdated = new Date(sourceItem.updatedAt);
    const targetUpdated = new Date(targetItem.updatedAt);
    const timeDiff = Math.abs(sourceUpdated.getTime() - targetUpdated.getTime());
    
    if (timeDiff < 60000) { // Within 1 minute
      return 'concurrent-edit';
    }
    
    // Check for data mismatches
    const sourceKeys = Object.keys(sourceItem);
    const targetKeys = Object.keys(targetItem);
    
    if (sourceKeys.length !== targetKeys.length) {
      return 'schema-change';
    }
    
    for (const key of sourceKeys) {
      if (sourceItem[key] !== targetItem[key] && key !== 'updatedAt') {
        return 'data-mismatch';
      }
    }
    
    return null;
  }

  /**
   * Resolve conflicts based on strategy
   */
  private async resolveConflicts(
    changes: any[],
    conflicts: SyncConflict[],
    config: DataSyncConfig
  ): Promise<any[]> {
    const resolvedChanges = [...changes];
    
    for (const conflict of conflicts) {
      const resolution = await this.resolveConflict(conflict, config.conflictResolution);
      
      if (resolution) {
        conflict.resolution = resolution;
        resolvedChanges.push({
          type: 'update',
          data: resolution.resolvedData,
          existing: conflict.targetData,
        });
      }
    }
    
    return resolvedChanges;
  }

  /**
   * Resolve a single conflict
   */
  private async resolveConflict(
    conflict: SyncConflict,
    strategy: ConflictResolutionStrategy
  ): Promise<ConflictResolution | null> {
    let resolvedData: any;
    
    switch (strategy) {
      case 'latest-wins':
        const sourceTime = new Date(conflict.sourceData.updatedAt);
        const targetTime = new Date(conflict.targetData.updatedAt);
        resolvedData = sourceTime > targetTime ? conflict.sourceData : conflict.targetData;
        break;
        
      case 'source-wins':
        resolvedData = conflict.sourceData;
        break;
        
      case 'target-wins':
        resolvedData = conflict.targetData;
        break;
        
      case 'merge':
        resolvedData = this.mergeData(conflict.sourceData, conflict.targetData);
        break;
        
      case 'manual':
        // In a real implementation, this would prompt the user
        console.log('Manual conflict resolution required:', conflict);
        return null;
        
      default:
        resolvedData = conflict.sourceData;
    }
    
    return {
      strategy,
      resolvedData,
      timestamp: new Date(),
      resolvedBy: strategy === 'manual' ? 'user' : 'system',
    };
  }

  /**
   * Merge two data objects intelligently
   */
  private mergeData(sourceData: any, targetData: any): any {
    const merged = { ...targetData };
    
    // Merge non-conflicting fields from source
    for (const [key, value] of Object.entries(sourceData)) {
      if (key === 'updatedAt') {
        // Use the latest timestamp
        merged[key] = new Date(Math.max(
          new Date(sourceData.updatedAt).getTime(),
          new Date(targetData.updatedAt).getTime()
        ));
      } else if (targetData[key] === undefined) {
        // Field only exists in source
        merged[key] = value;
      } else if (Array.isArray(value) && Array.isArray(targetData[key])) {
        // Merge arrays
        merged[key] = [...new Set([...targetData[key], ...value])];
      }
      // For other conflicts, keep target value (can be customized)
    }
    
    return merged;
  }

  /**
   * Apply changes to target system
   */
  private async applyChanges(
    changes: any[],
    config: DataSyncConfig
  ): Promise<{ created: number; updated: number; deleted: number }> {
    let created = 0;
    let updated = 0;
    let deleted = 0;
    
    for (const change of changes) {
      try {
        switch (change.type) {
          case 'create':
            await this.createRecord(change.data, config);
            created++;
            break;
          case 'update':
            await this.updateRecord(change.data, config);
            updated++;
            break;
          case 'delete':
            await this.deleteRecord(change.data, config);
            deleted++;
            break;
        }
      } catch (error) {
        console.error(`Failed to apply change:`, error);
      }
    }
    
    return { created, updated, deleted };
  }

  /**
   * Create a new record in target system
   */
  private async createRecord(data: any, config: DataSyncConfig): Promise<void> {
    console.log(`Creating record for provider ${config.providerId}:`, data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Update an existing record in target system
   */
  private async updateRecord(data: any, config: DataSyncConfig): Promise<void> {
    console.log(`Updating record for provider ${config.providerId}:`, data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Delete a record from target system
   */
  private async deleteRecord(data: any, config: DataSyncConfig): Promise<void> {
    console.log(`Deleting record for provider ${config.providerId}:`, data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Add sync result to history
   */
  private addToSyncHistory(configId: string, result: SyncResult): void {
    if (!this.syncHistory.has(configId)) {
      this.syncHistory.set(configId, []);
    }
    
    const history = this.syncHistory.get(configId)!;
    history.push(result);
    
    // Keep only last 10 sync results
    if (history.length > 10) {
      history.shift();
    }
  }

  /**
   * Get sync history for a configuration
   */
  getSyncHistory(configId: string): SyncResult[] {
    return this.syncHistory.get(configId) || [];
  }

  /**
   * Get all sync configurations
   */
  getSyncConfigs(): Map<string, DataSyncConfig> {
    return new Map(this.syncConfigs);
  }

  /**
   * Check if sync is currently active
   */
  isSyncActive(configId: string): boolean {
    return this.activeSyncs.has(configId);
  }

  /**
   * Stop all active syncs
   */
  stopAllSyncs(): void {
    this.activeSyncs.clear();
  }
}

export const dataSyncEngine = new DataSyncEngine();