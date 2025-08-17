import { TaskPrediction, WorkContext } from '../../types/ai';
import { CalendarEvent, ResourceRequirement, EventPreparation, ResourceEfficiencyMetrics } from './types';

/**
 * Resource Preparation System
 * Proactively loads and prepares resources for predicted tasks
 */
export class ResourcePreparationSystem {
  private resourceCache: Map<string, CachedResource> = new Map();
  private preparationQueue: PreparationTask[] = [];
  private isProcessing = false;
  private metrics: ResourceMetrics = {
    totalPreparations: 0,
    successfulPreparations: 0,
    averagePreparationTime: 0,
    cacheHitRate: 0,
    resourceUsageStats: new Map()
  };

  /**
   * Initialize the resource preparation system
   */
  async initialize(): Promise<void> {
    console.log('Initializing Resource Preparation System...');
    
    // Load cached resources from storage
    await this.loadCachedResources();
    
    // Start background processing
    this.startBackgroundProcessing();
    
    console.log('Resource Preparation System initialized');
  }

  /**
   * Prepare resources for predicted tasks proactively
   */
  async prepareResourcesForTasks(
    predictions: TaskPrediction[],
    context: WorkContext
  ): Promise<void> {
    for (const prediction of predictions) {
      const requirements = await this.analyzeResourceRequirements(prediction, context);
      
      for (const requirement of requirements) {
        if (!requirement.available) {
          this.queueResourcePreparation(requirement, prediction.taskId, prediction.confidence);
        }
      }
    }
  }

  /**
   * Analyze what resources a task will need
   */
  async analyzeResourceRequirements(
    prediction: TaskPrediction,
    context: WorkContext
  ): Promise<ResourceRequirement[]> {
    const requirements: ResourceRequirement[] = [];
    
    // Analyze based on task type and context
    const taskType = this.inferTaskType(prediction);
    
    switch (taskType) {
      case 'coding':
        requirements.push(
          ...this.getCodingResourceRequirements(prediction, context)
        );
        break;
      case 'meeting':
        requirements.push(
          ...this.getMeetingResourceRequirements(prediction, context)
        );
        break;
      case 'writing':
        requirements.push(
          ...this.getWritingResourceRequirements(prediction, context)
        );
        break;
      case 'research':
        requirements.push(
          ...this.getResearchResourceRequirements(prediction, context)
        );
        break;
      default:
        requirements.push(
          ...this.getGenericResourceRequirements(prediction, context)
        );
    }

    // Check availability of each requirement
    for (const requirement of requirements) {
      requirement.available = await this.checkResourceAvailability(requirement);
      requirement.preparationTime = this.estimatePreparationTime(requirement);
    }

    return requirements;
  }

  /**
   * Prepare resources for an upcoming event
   */
  async prepareForEvent(
    event: CalendarEvent,
    context: WorkContext
  ): Promise<EventPreparation> {
    const startTime = Date.now();
    const preparation: EventPreparation = {
      eventId: event.id,
      resourcesPrepared: [],
      documentsReady: [],
      toolsActivated: [],
      preparationTime: 0,
      status: 'success'
    };

    try {
      // Prepare meeting-specific resources
      if (event.type === 'meeting') {
        await this.prepareMeetingResources(event, preparation);
      }

      // Prepare documents mentioned in event
      await this.prepareEventDocuments(event, preparation);

      // Activate necessary tools
      await this.activateEventTools(event, preparation);

      preparation.preparationTime = Date.now() - startTime;
      this.updateMetrics('event_preparation', preparation.preparationTime, true);

    } catch (error) {
      console.error('Failed to prepare for event:', error);
      preparation.status = 'failed';
      this.updateMetrics('event_preparation', Date.now() - startTime, false);
    }

    return preparation;
  }

  /**
   * Update resource usage data based on completed tasks
   */
  async updateResourceUsageData(
    completedTask: any,
    resourcesUsed: string[]
  ): Promise<void> {
    // Update usage statistics
    for (const resource of resourcesUsed) {
      const currentCount = this.metrics.resourceUsageStats.get(resource) || 0;
      this.metrics.resourceUsageStats.set(resource, currentCount + 1);
    }

    // Update cache priorities based on usage
    await this.updateCachePriorities(resourcesUsed);
  }

  /**
   * Get efficiency metrics for the resource preparation system
   */
  getEfficiencyMetrics(): ResourceEfficiencyMetrics {
    const mostUsedResources = Array.from(this.metrics.resourceUsageStats.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([resource]) => resource);

    return {
      averagePreparationTime: this.metrics.averagePreparationTime,
      successRate: this.metrics.successfulPreparations / Math.max(this.metrics.totalPreparations, 1),
      mostUsedResources,
      bottlenecks: this.identifyBottlenecks()
    };
  }

  // Private methods

  private async loadCachedResources(): Promise<void> {
    try {
      const cached = localStorage.getItem('resource-cache');
      if (cached) {
        const data = JSON.parse(cached);
        for (const [key, value] of Object.entries(data)) {
          this.resourceCache.set(key, value as CachedResource);
        }
      }
    } catch (error) {
      console.warn('Failed to load cached resources:', error);
    }
  }

  private startBackgroundProcessing(): void {
    setInterval(() => {
      if (!this.isProcessing && this.preparationQueue.length > 0) {
        this.processPreparationQueue();
      }
    }, 5000); // Process every 5 seconds
  }

  private async processPreparationQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      // Sort queue by priority and confidence
      this.preparationQueue.sort((a, b) => 
        (b.priority * b.confidence) - (a.priority * a.confidence)
      );

      // Process top items
      const itemsToProcess = this.preparationQueue.splice(0, 3);
      
      for (const item of itemsToProcess) {
        await this.prepareResource(item);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private queueResourcePreparation(
    requirement: ResourceRequirement,
    taskId: string,
    confidence: number
  ): void {
    const preparationTask: PreparationTask = {
      id: `${taskId}-${requirement.name}`,
      requirement,
      taskId,
      confidence,
      priority: requirement.priority,
      queuedAt: Date.now()
    };

    // Avoid duplicates
    const existingIndex = this.preparationQueue.findIndex(
      task => task.id === preparationTask.id
    );
    
    if (existingIndex === -1) {
      this.preparationQueue.push(preparationTask);
    } else {
      // Update existing task with higher confidence if applicable
      if (confidence > this.preparationQueue[existingIndex].confidence) {
        this.preparationQueue[existingIndex] = preparationTask;
      }
    }
  }

  private async prepareResource(task: PreparationTask): Promise<void> {
    const startTime = Date.now();
    
    try {
      switch (task.requirement.type) {
        case 'file':
          await this.prepareFile(task.requirement);
          break;
        case 'tool':
          await this.prepareTool(task.requirement);
          break;
        case 'data':
          await this.prepareData(task.requirement);
          break;
        case 'connection':
          await this.prepareConnection(task.requirement);
          break;
      }

      const preparationTime = Date.now() - startTime;
      this.updateMetrics('resource_preparation', preparationTime, true);
      
      // Cache the prepared resource
      this.cacheResource(task.requirement, preparationTime);
      
    } catch (error) {
      console.error(`Failed to prepare resource ${task.requirement.name}:`, error);
      this.updateMetrics('resource_preparation', Date.now() - startTime, false);
    }
  }

  private async prepareFile(requirement: ResourceRequirement): Promise<void> {
    // Simulate file preparation (preloading, indexing, etc.)
    const fileName = requirement.name;
    
    // Check if file exists in cache
    if (this.resourceCache.has(fileName)) {
      const cached = this.resourceCache.get(fileName)!;
      if (Date.now() - cached.cachedAt < 3600000) { // 1 hour cache
        return; // Already prepared and fresh
      }
    }

    // Simulate file operations
    await this.simulateAsyncOperation(100 + Math.random() * 200);
    
    console.log(`Prepared file: ${fileName}`);
  }

  private async prepareTool(requirement: ResourceRequirement): Promise<void> {
    // Simulate tool activation/preparation
    const toolName = requirement.name;
    
    // Simulate tool startup time
    await this.simulateAsyncOperation(200 + Math.random() * 300);
    
    console.log(`Prepared tool: ${toolName}`);
  }

  private async prepareData(requirement: ResourceRequirement): Promise<void> {
    // Simulate data fetching/caching
    const dataSource = requirement.name;
    
    // Simulate network/database operations
    await this.simulateAsyncOperation(300 + Math.random() * 500);
    
    console.log(`Prepared data: ${dataSource}`);
  }

  private async prepareConnection(requirement: ResourceRequirement): Promise<void> {
    // Simulate connection establishment
    const connectionName = requirement.name;
    
    // Simulate connection time
    await this.simulateAsyncOperation(150 + Math.random() * 250);
    
    console.log(`Prepared connection: ${connectionName}`);
  }

  private async simulateAsyncOperation(delay: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  private cacheResource(requirement: ResourceRequirement, preparationTime: number): void {
    const cached: CachedResource = {
      name: requirement.name,
      type: requirement.type,
      cachedAt: Date.now(),
      preparationTime,
      accessCount: 0,
      lastAccessed: Date.now()
    };

    this.resourceCache.set(requirement.name, cached);
    
    // Persist to localStorage
    this.persistCache();
  }

  private persistCache(): void {
    try {
      const cacheData = Object.fromEntries(this.resourceCache.entries());
      localStorage.setItem('resource-cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to persist resource cache:', error);
    }
  }

  private inferTaskType(prediction: TaskPrediction): string {
    const reasoning = prediction.reasoning.toLowerCase();
    
    if (reasoning.includes('code') || reasoning.includes('develop') || reasoning.includes('debug')) {
      return 'coding';
    }
    if (reasoning.includes('meeting') || reasoning.includes('call') || reasoning.includes('discuss')) {
      return 'meeting';
    }
    if (reasoning.includes('write') || reasoning.includes('document') || reasoning.includes('report')) {
      return 'writing';
    }
    if (reasoning.includes('research') || reasoning.includes('analyze') || reasoning.includes('study')) {
      return 'research';
    }
    
    return 'generic';
  }

  private getCodingResourceRequirements(
    prediction: TaskPrediction,
    context: WorkContext
  ): ResourceRequirement[] {
    return [
      {
        type: 'tool',
        name: 'IDE',
        available: false,
        preparationTime: 0,
        priority: 5
      },
      {
        type: 'connection',
        name: 'Git Repository',
        available: false,
        preparationTime: 0,
        priority: 4
      },
      {
        type: 'data',
        name: 'Project Dependencies',
        available: false,
        preparationTime: 0,
        priority: 3
      }
    ];
  }

  private getMeetingResourceRequirements(
    prediction: TaskPrediction,
    context: WorkContext
  ): ResourceRequirement[] {
    return [
      {
        type: 'tool',
        name: 'Video Conferencing',
        available: false,
        preparationTime: 0,
        priority: 5
      },
      {
        type: 'file',
        name: 'Meeting Agenda',
        available: false,
        preparationTime: 0,
        priority: 4
      },
      {
        type: 'file',
        name: 'Previous Meeting Notes',
        available: false,
        preparationTime: 0,
        priority: 3
      }
    ];
  }

  private getWritingResourceRequirements(
    prediction: TaskPrediction,
    context: WorkContext
  ): ResourceRequirement[] {
    return [
      {
        type: 'tool',
        name: 'Text Editor',
        available: false,
        preparationTime: 0,
        priority: 5
      },
      {
        type: 'data',
        name: 'Reference Materials',
        available: false,
        preparationTime: 0,
        priority: 4
      },
      {
        type: 'file',
        name: 'Templates',
        available: false,
        preparationTime: 0,
        priority: 3
      }
    ];
  }

  private getResearchResourceRequirements(
    prediction: TaskPrediction,
    context: WorkContext
  ): ResourceRequirement[] {
    return [
      {
        type: 'connection',
        name: 'Research Databases',
        available: false,
        preparationTime: 0,
        priority: 5
      },
      {
        type: 'tool',
        name: 'Note Taking App',
        available: false,
        preparationTime: 0,
        priority: 4
      },
      {
        type: 'data',
        name: 'Bookmarks',
        available: false,
        preparationTime: 0,
        priority: 3
      }
    ];
  }

  private getGenericResourceRequirements(
    prediction: TaskPrediction,
    context: WorkContext
  ): ResourceRequirement[] {
    return [
      {
        type: 'tool',
        name: 'Default Workspace',
        available: false,
        preparationTime: 0,
        priority: 3
      }
    ];
  }

  private async checkResourceAvailability(requirement: ResourceRequirement): Promise<boolean> {
    // Check cache first
    if (this.resourceCache.has(requirement.name)) {
      const cached = this.resourceCache.get(requirement.name)!;
      // Consider cached resource available if less than 1 hour old
      return Date.now() - cached.cachedAt < 3600000;
    }
    
    // Simulate availability check
    return Math.random() > 0.3; // 70% chance of being available
  }

  private estimatePreparationTime(requirement: ResourceRequirement): number {
    const baseTime = {
      'file': 100,
      'tool': 200,
      'data': 300,
      'connection': 150
    };
    
    return baseTime[requirement.type] + Math.random() * 100;
  }

  private async prepareMeetingResources(
    event: CalendarEvent,
    preparation: EventPreparation
  ): Promise<void> {
    // Simulate preparing meeting-specific resources
    preparation.toolsActivated.push('Video Conferencing');
    preparation.resourcesPrepared.push('Meeting Room');
    
    await this.simulateAsyncOperation(100);
  }

  private async prepareEventDocuments(
    event: CalendarEvent,
    preparation: EventPreparation
  ): Promise<void> {
    // Extract document references from event description
    const documents = this.extractDocumentReferences(event.description || '');
    
    for (const doc of documents) {
      preparation.documentsReady.push(doc);
      await this.simulateAsyncOperation(50);
    }
  }

  private async activateEventTools(
    event: CalendarEvent,
    preparation: EventPreparation
  ): Promise<void> {
    // Activate tools based on event type
    const tools = this.getRequiredToolsForEvent(event);
    
    for (const tool of tools) {
      preparation.toolsActivated.push(tool);
      await this.simulateAsyncOperation(30);
    }
  }

  private extractDocumentReferences(description: string): string[] {
    // Simple regex to find document references
    const docPattern = /\b\w+\.(doc|pdf|ppt|xls)\b/gi;
    return description.match(docPattern) || [];
  }

  private getRequiredToolsForEvent(event: CalendarEvent): string[] {
    const tools: string[] = [];
    
    if (event.type === 'meeting') {
      tools.push('Calendar', 'Notes App');
    }
    
    if (event.attendees.length > 2) {
      tools.push('Screen Sharing');
    }
    
    return tools;
  }

  private async updateCachePriorities(resourcesUsed: string[]): Promise<void> {
    for (const resource of resourcesUsed) {
      if (this.resourceCache.has(resource)) {
        const cached = this.resourceCache.get(resource)!;
        cached.accessCount++;
        cached.lastAccessed = Date.now();
      }
    }
  }

  private updateMetrics(operation: string, duration: number, success: boolean): void {
    this.metrics.totalPreparations++;
    
    if (success) {
      this.metrics.successfulPreparations++;
    }
    
    // Update average preparation time
    const totalTime = this.metrics.averagePreparationTime * (this.metrics.totalPreparations - 1) + duration;
    this.metrics.averagePreparationTime = totalTime / this.metrics.totalPreparations;
  }

  private identifyBottlenecks(): string[] {
    const bottlenecks: string[] = [];
    
    // Identify resources that take too long to prepare
    for (const [name, resource] of this.resourceCache.entries()) {
      if (resource.preparationTime > 500) { // 500ms threshold
        bottlenecks.push(name);
      }
    }
    
    return bottlenecks;
  }

  /**
   * Dispose of resources and clean up
   */
  dispose(): void {
    this.resourceCache.clear();
    this.preparationQueue = [];
    this.isProcessing = false;
  }
}

// Supporting interfaces
interface CachedResource {
  name: string;
  type: string;
  cachedAt: number;
  preparationTime: number;
  accessCount: number;
  lastAccessed: number;
}

interface PreparationTask {
  id: string;
  requirement: ResourceRequirement;
  taskId: string;
  confidence: number;
  priority: number;
  queuedAt: number;
}

interface ResourceMetrics {
  totalPreparations: number;
  successfulPreparations: number;
  averagePreparationTime: number;
  cacheHitRate: number;
  resourceUsageStats: Map<string, number>;
}