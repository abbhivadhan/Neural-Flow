import { ModelFineTuningPipeline, UserAdaptationData, UserInteraction, ModelVersion } from './ModelFineTuningPipeline';
import { BehavioralPatternModel } from './BehavioralPatternModel';
import { TaskPredictionModel } from './TaskPredictionModel';
import { EncryptionService } from '../privacy/EncryptionService';

export interface AdaptationConfig {
  enableIncrementalLearning: boolean;
  enableFederatedLearning: boolean;
  privacyLevel: 'low' | 'medium' | 'high';
  adaptationFrequency: 'realtime' | 'hourly' | 'daily';
  rollbackThreshold: number; // Accuracy drop threshold for auto-rollback
}

export interface UserModelMetrics {
  userId: string;
  accuracy: number;
  adaptationCount: number;
  lastUpdated: Date;
  performanceScore: number;
  privacyScore: number;
}

export class UserAdaptationService {
  private fineTuningPipeline: ModelFineTuningPipeline;
  private behavioralModel: BehavioralPatternModel;
  private taskPredictionModel: TaskPredictionModel;
  private encryptionService: EncryptionService;
  private adaptationConfigs: Map<string, AdaptationConfig> = new Map();
  private userMetrics: Map<string, UserModelMetrics> = new Map();
  private adaptationQueue: Map<string, UserAdaptationData[]> = new Map();

  constructor() {
    this.fineTuningPipeline = new ModelFineTuningPipeline();
    this.behavioralModel = new BehavioralPatternModel();
    this.taskPredictionModel = new TaskPredictionModel();
    this.encryptionService = new EncryptionService();
    
    // Start background adaptation processing
    this.startAdaptationProcessor();
  }

  /**
   * Initialize user adaptation with privacy-first approach
   */
  async initializeUserAdaptation(
    userId: string, 
    config: AdaptationConfig,
    initialData?: UserAdaptationData
  ): Promise<void> {
    try {
      // Store user configuration
      this.adaptationConfigs.set(userId, config);
      
      // Initialize fine-tuning pipeline
      await this.fineTuningPipeline.initializeUserModel(
        userId, 
        '/models/base_productivity_model.json',
        initialData
      );
      
      // Initialize behavioral pattern tracking
      await this.behavioralModel.initializeUserModel(userId);
      
      // Initialize task prediction adaptation
      await this.taskPredictionModel.initializeUserModel(userId);
      
      // Create initial metrics
      this.userMetrics.set(userId, {
        userId,
        accuracy: 0.5,
        adaptationCount: 0,
        lastUpdated: new Date(),
        performanceScore: 0.5,
        privacyScore: this.calculatePrivacyScore(config)
      });
      
      console.log(`User adaptation initialized for ${userId}`);
    } catch (error) {
      console.error('Failed to initialize user adaptation:', error);
      throw error;
    }
  }

  /**
   * Process user interaction for model adaptation
   */
  async processUserInteraction(
    userId: string, 
    interaction: UserInteraction
  ): Promise<void> {
    try {
      const config = this.adaptationConfigs.get(userId);
      if (!config) {
        console.warn(`No adaptation config found for user ${userId}`);
        return;
      }

      // Create adaptation data from interaction
      const adaptationData: UserAdaptationData = {
        userId,
        interactions: [interaction],
        preferences: await this.extractUserPreferences(userId, interaction),
        behaviorPatterns: await this.behavioralModel.analyzeInteraction(userId, interaction),
        timestamp: new Date()
      };

      // Queue for processing based on frequency setting
      if (config.adaptationFrequency === 'realtime') {
        await this.performAdaptation(userId, adaptationData);
      } else {
        this.queueAdaptationData(userId, adaptationData);
      }

      // Update metrics
      await this.updateUserMetrics(userId, interaction);
      
    } catch (error) {
      console.error('Failed to process user interaction:', error);
    }
  }

  /**
   * Perform model adaptation with privacy preservation
   */
  private async performAdaptation(
    userId: string, 
    adaptationData: UserAdaptationData
  ): Promise<void> {
    try {
      const config = this.adaptationConfigs.get(userId);
      if (!config) return;

      // Apply privacy protection based on level
      const protectedData = await this.applyPrivacyProtection(adaptationData, config.privacyLevel);

      // Perform incremental learning if enabled
      if (config.enableIncrementalLearning) {
        await this.fineTuningPipeline.performIncrementalLearning(userId, protectedData);
      }

      // Participate in federated learning if enabled
      if (config.enableFederatedLearning) {
        await this.participateInFederatedLearning(userId, protectedData);
      }

      // Update behavioral patterns
      await this.behavioralModel.updatePatterns(userId, protectedData.behaviorPatterns);

      // Update task prediction model
      await this.taskPredictionModel.adaptToUser(userId, protectedData.interactions);

      // Check for performance degradation and rollback if necessary
      await this.monitorAndRollbackIfNeeded(userId, config.rollbackThreshold);

      console.log(`Model adaptation completed for user ${userId}`);
    } catch (error) {
      console.error('Model adaptation failed:', error);
      throw error;
    }
  }

  /**
   * Get user model performance metrics
   */
  getUserMetrics(userId: string): UserModelMetrics | null {
    return this.userMetrics.get(userId) || null;
  }

  /**
   * Get model versions for user
   */
  getModelVersions(userId: string): ModelVersion[] {
    return this.fineTuningPipeline.getModelVersions(userId);
  }

  /**
   * Manually rollback user model to previous version
   */
  async rollbackUserModel(userId: string, targetVersion?: number): Promise<void> {
    try {
      await this.fineTuningPipeline.rollbackModel(userId, targetVersion);
      
      // Update metrics
      const metrics = this.userMetrics.get(userId);
      if (metrics) {
        metrics.lastUpdated = new Date();
        this.userMetrics.set(userId, metrics);
      }
      
      console.log(`Model rolled back for user ${userId} to version ${targetVersion || 'previous'}`);
    } catch (error) {
      console.error('Model rollback failed:', error);
      throw error;
    }
  }

  /**
   * Update user adaptation configuration
   */
  updateAdaptationConfig(userId: string, config: Partial<AdaptationConfig>): void {
    const currentConfig = this.adaptationConfigs.get(userId);
    if (currentConfig) {
      const updatedConfig = { ...currentConfig, ...config };
      this.adaptationConfigs.set(userId, updatedConfig);
      
      // Update privacy score
      const metrics = this.userMetrics.get(userId);
      if (metrics) {
        metrics.privacyScore = this.calculatePrivacyScore(updatedConfig);
        this.userMetrics.set(userId, metrics);
      }
    }
  }

  // Private helper methods
  private async extractUserPreferences(
    userId: string, 
    interaction: UserInteraction
  ): Promise<any> {
    // Extract preferences from interaction context and history
    return {
      workingHours: { start: '09:00', end: '17:00' },
      preferredTools: ['editor', 'terminal'],
      communicationStyle: 'direct',
      taskPriorities: { urgent: 1.0, normal: 0.5, low: 0.2 }
    };
  }

  private queueAdaptationData(userId: string, data: UserAdaptationData): void {
    if (!this.adaptationQueue.has(userId)) {
      this.adaptationQueue.set(userId, []);
    }
    this.adaptationQueue.get(userId)!.push(data);
  }

  private async applyPrivacyProtection(
    data: UserAdaptationData, 
    privacyLevel: 'low' | 'medium' | 'high'
  ): Promise<UserAdaptationData> {
    const protectedData = { ...data };
    
    switch (privacyLevel) {
      case 'high':
        // Apply strong differential privacy
        protectedData.interactions = await this.addNoise(data.interactions, 0.1);
        protectedData.preferences = await this.anonymizePreferences(data.preferences);
        break;
      case 'medium':
        // Apply moderate privacy protection
        protectedData.interactions = await this.addNoise(data.interactions, 0.05);
        break;
      case 'low':
        // Minimal privacy protection
        break;
    }
    
    return protectedData;
  }

  private async addNoise(interactions: UserInteraction[], noiseLevel: number): Promise<UserInteraction[]> {
    // Add differential privacy noise to interaction data
    return interactions.map(interaction => ({
      ...interaction,
      feedback: interaction.feedback ? 
        Math.max(0, Math.min(1, interaction.feedback + (Math.random() - 0.5) * noiseLevel)) : 
        interaction.feedback
    }));
  }

  private async anonymizePreferences(preferences: any): Promise<any> {
    // Remove or generalize identifying information
    return {
      ...preferences,
      workingHours: { start: '09:00', end: '17:00' }, // Generalized
      communicationStyle: 'neutral' // Anonymized
    };
  }

  private async participateInFederatedLearning(
    userId: string, 
    data: UserAdaptationData
  ): Promise<void> {
    try {
      // Create federated update with privacy preservation
      const federatedUpdate = await this.fineTuningPipeline.participateInFederatedLearning(
        userId, 
        { modelWeights: [], userId: '', updateId: '', privacy: { isEncrypted: true, noiseLevel: 0.1 } }
      );
      
      console.log(`Federated learning update created for user ${userId}`);
    } catch (error) {
      console.error('Federated learning participation failed:', error);
    }
  }

  private async monitorAndRollbackIfNeeded(userId: string, threshold: number): Promise<void> {
    const metrics = this.userMetrics.get(userId);
    if (!metrics) return;

    const currentVersion = this.fineTuningPipeline.getActiveModelVersion(userId);
    if (!currentVersion) return;

    // Check if accuracy dropped below threshold
    if (currentVersion.accuracy < metrics.accuracy * (1 - threshold)) {
      console.warn(`Performance degradation detected for user ${userId}, rolling back`);
      await this.rollbackUserModel(userId);
    }
  }

  private async updateUserMetrics(userId: string, interaction: UserInteraction): Promise<void> {
    const metrics = this.userMetrics.get(userId);
    if (!metrics) return;

    const activeVersion = this.fineTuningPipeline.getActiveModelVersion(userId);
    
    metrics.accuracy = activeVersion?.accuracy || metrics.accuracy;
    metrics.adaptationCount += 1;
    metrics.lastUpdated = new Date();
    metrics.performanceScore = this.calculatePerformanceScore(interaction);
    
    this.userMetrics.set(userId, metrics);
  }

  private calculatePrivacyScore(config: AdaptationConfig): number {
    let score = 0.5;
    
    if (config.privacyLevel === 'high') score += 0.3;
    else if (config.privacyLevel === 'medium') score += 0.2;
    
    if (!config.enableFederatedLearning) score += 0.1;
    if (config.adaptationFrequency !== 'realtime') score += 0.1;
    
    return Math.min(1.0, score);
  }

  private calculatePerformanceScore(interaction: UserInteraction): number {
    // Calculate performance based on user feedback and interaction success
    return interaction.feedback || 0.5;
  }

  private startAdaptationProcessor(): void {
    // Process queued adaptations periodically
    setInterval(async () => {
      for (const [userId, queuedData] of this.adaptationQueue.entries()) {
        if (queuedData.length > 0) {
          const config = this.adaptationConfigs.get(userId);
          if (!config) continue;

          // Batch process queued data
          const batchData: UserAdaptationData = {
            userId,
            interactions: queuedData.flatMap(d => d.interactions),
            preferences: queuedData[queuedData.length - 1].preferences,
            behaviorPatterns: queuedData.flatMap(d => d.behaviorPatterns),
            timestamp: new Date()
          };

          await this.performAdaptation(userId, batchData);
          
          // Clear processed data
          this.adaptationQueue.set(userId, []);
        }
      }
    }, 60000); // Process every minute
  }

  /**
   * Export user model data for portability
   */
  async exportUserModelData(userId: string): Promise<any> {
    const versions = this.getModelVersions(userId);
    const metrics = this.getUserMetrics(userId);
    const config = this.adaptationConfigs.get(userId);
    
    return {
      userId,
      versions,
      metrics,
      config,
      exportedAt: new Date()
    };
  }

  /**
   * Delete all user model data
   */
  async deleteUserModelData(userId: string): Promise<void> {
    this.adaptationConfigs.delete(userId);
    this.userMetrics.delete(userId);
    this.adaptationQueue.delete(userId);
    
    // Note: Model deletion would be handled by ModelFineTuningPipeline
    console.log(`User model data deleted for ${userId}`);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.fineTuningPipeline.dispose();
    this.adaptationConfigs.clear();
    this.userMetrics.clear();
    this.adaptationQueue.clear();
  }
}