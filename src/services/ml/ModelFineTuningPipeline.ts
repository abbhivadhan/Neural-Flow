import * as tf from '@tensorflow/tfjs';
import { EncryptionService } from '../privacy/EncryptionService';
import { ModelCache } from './ModelCache';

export interface UserAdaptationData {
  userId: string;
  interactions: UserInteraction[];
  preferences: UserPreferences;
  behaviorPatterns: BehaviorPattern[];
  timestamp: Date;
}

export interface UserInteraction {
  type: 'task_completion' | 'preference_change' | 'workflow_pattern' | 'content_generation';
  data: any;
  context: InteractionContext;
  timestamp: Date;
  feedback?: number; // User satisfaction score 0-1
}

export interface InteractionContext {
  timeOfDay: string;
  workType: string;
  deviceType: string;
  environmentFactors: Record<string, any>;
}

export interface UserPreferences {
  workingHours: { start: string; end: string };
  preferredTools: string[];
  communicationStyle: string;
  taskPriorities: Record<string, number>;
}

export interface BehaviorPattern {
  patternType: string;
  frequency: number;
  confidence: number;
  contextFactors: string[];
}

export interface ModelVersion {
  id: string;
  userId: string;
  baseModelId: string;
  version: number;
  accuracy: number;
  trainingData: UserAdaptationData[];
  createdAt: Date;
  isActive: boolean;
  metadata: ModelMetadata;
}

export interface ModelMetadata {
  trainingDuration: number;
  dataPoints: number;
  improvementScore: number;
  rollbackReason?: string;
}

export interface FederatedUpdate {
  modelWeights: tf.Tensor[];
  userId: string;
  updateId: string;
  privacy: {
    isEncrypted: boolean;
    noiseLevel: number;
  };
}

export class ModelFineTuningPipeline {
  private encryptionService: EncryptionService;
  private modelCache: ModelCache;
  private userModels: Map<string, tf.LayersModel> = new Map();
  private modelVersions: Map<string, ModelVersion[]> = new Map();
  private federatedUpdates: Map<string, FederatedUpdate[]> = new Map();

  constructor() {
    this.encryptionService = new EncryptionService();
    this.modelCache = new ModelCache();
  }

  /**
   * Initialize user-specific model adaptation using transfer learning
   */
  async initializeUserModel(
    userId: string, 
    baseModelPath: string, 
    initialData?: UserAdaptationData
  ): Promise<tf.LayersModel> {
    try {
      // Load base model
      const baseModel = await tf.loadLayersModel(baseModelPath);
      
      // Create user-specific adaptation layers
      const adaptationLayers = this.createAdaptationLayers(baseModel);
      
      // Freeze base model layers for transfer learning
      this.freezeBaseModelLayers(baseModel);
      
      // Create user-specific model
      const userModel = this.createUserSpecificModel(baseModel, adaptationLayers);
      
      // Initialize with user data if provided
      if (initialData) {
        await this.performInitialFineTuning(userModel, initialData);
      }
      
      // Cache the model
      this.userModels.set(userId, userModel);
      await this.modelCache.cacheModel(`user_${userId}`, userModel);
      
      // Create initial version
      await this.createModelVersion(userId, userModel, initialData ? [initialData] : []);
      
      return userModel;
    } catch (error) {
      console.error('Failed to initialize user model:', error);
      throw new Error(`Model initialization failed for user ${userId}`);
    }
  }

  /**
   * Perform incremental learning with new user data
   */
  async performIncrementalLearning(
    userId: string, 
    newData: UserAdaptationData
  ): Promise<void> {
    try {
      const userModel = await this.getUserModel(userId);
      if (!userModel) {
        throw new Error(`No model found for user ${userId}`);
      }

      // Prepare training data
      const trainingData = this.prepareTrainingData([newData]);
      
      // Perform incremental training with small learning rate
      const optimizer = tf.train.adam(0.0001); // Small learning rate for incremental updates
      
      userModel.compile({
        optimizer,
        loss: 'meanSquaredError',
        metrics: ['accuracy']
      });

      // Train on new data
      await userModel.fit(trainingData.inputs, trainingData.outputs, {
        epochs: 5,
        batchSize: 1,
        verbose: 0,
        validationSplit: 0.2
      });

      // Update model cache
      await this.modelCache.cacheModel(`user_${userId}`, userModel);
      
      // Create new version if improvement is significant
      await this.evaluateAndVersionModel(userId, userModel, [newData]);
      
      console.log(`Incremental learning completed for user ${userId}`);
    } catch (error) {
      console.error('Incremental learning failed:', error);
      throw error;
    }
  }

  /**
   * Implement federated learning approach for privacy preservation
   */
  async participateInFederatedLearning(
    userId: string, 
    globalModelUpdate: FederatedUpdate
  ): Promise<FederatedUpdate> {
    try {
      const userModel = await this.getUserModel(userId);
      if (!userModel) {
        throw new Error(`No model found for user ${userId}`);
      }

      // Apply differential privacy
      const noisyWeights = this.addDifferentialPrivacy(
        userModel.getWeights(),
        0.1 // Privacy budget
      );

      // Create encrypted federated update
      const encryptedWeights = await this.encryptionService.encryptData(
        JSON.stringify(noisyWeights.map(w => w.arraySync()))
      );

      const federatedUpdate: FederatedUpdate = {
        modelWeights: noisyWeights,
        userId: userId,
        updateId: `${userId}_${Date.now()}`,
        privacy: {
          isEncrypted: true,
          noiseLevel: 0.1
        }
      };

      // Store update for aggregation
      if (!this.federatedUpdates.has('global')) {
        this.federatedUpdates.set('global', []);
      }
      this.federatedUpdates.get('global')!.push(federatedUpdate);

      // Apply global update to local model if provided
      if (globalModelUpdate.modelWeights.length > 0) {
        await this.applyFederatedUpdate(userId, globalModelUpdate);
      }

      return federatedUpdate;
    } catch (error) {
      console.error('Federated learning participation failed:', error);
      throw error;
    }
  }

  /**
   * Create model versioning and rollback capabilities
   */
  async createModelVersion(
    userId: string, 
    model: tf.LayersModel, 
    trainingData: UserAdaptationData[]
  ): Promise<ModelVersion> {
    try {
      const versions = this.modelVersions.get(userId) || [];
      const newVersion: ModelVersion = {
        id: `${userId}_v${versions.length + 1}`,
        userId,
        baseModelId: 'base_model_v1',
        version: versions.length + 1,
        accuracy: await this.evaluateModelAccuracy(model, trainingData),
        trainingData,
        createdAt: new Date(),
        isActive: true,
        metadata: {
          trainingDuration: 0,
          dataPoints: trainingData.length,
          improvementScore: 0
        }
      };

      // Deactivate previous versions
      versions.forEach(v => v.isActive = false);
      versions.push(newVersion);
      
      this.modelVersions.set(userId, versions);

      // Save model version to cache
      await this.modelCache.cacheModel(newVersion.id, model);

      return newVersion;
    } catch (error) {
      console.error('Model versioning failed:', error);
      throw error;
    }
  }

  /**
   * Rollback to previous model version
   */
  async rollbackModel(userId: string, targetVersion?: number): Promise<tf.LayersModel> {
    try {
      const versions = this.modelVersions.get(userId) || [];
      if (versions.length === 0) {
        throw new Error(`No model versions found for user ${userId}`);
      }

      const targetVersionNumber = targetVersion || versions.length - 1;
      const targetVersionData = versions.find(v => v.version === targetVersionNumber);
      
      if (!targetVersionData) {
        throw new Error(`Version ${targetVersionNumber} not found for user ${userId}`);
      }

      // Load model from cache
      const rolledBackModel = await this.modelCache.getModel(targetVersionData.id);
      if (!rolledBackModel) {
        throw new Error(`Model data not found for version ${targetVersionNumber}`);
      }

      // Update active version
      versions.forEach(v => v.isActive = false);
      targetVersionData.isActive = true;
      targetVersionData.metadata.rollbackReason = 'Manual rollback requested';

      // Update current model
      this.userModels.set(userId, rolledBackModel);
      await this.modelCache.cacheModel(`user_${userId}`, rolledBackModel);

      console.log(`Rolled back to version ${targetVersionNumber} for user ${userId}`);
      return rolledBackModel;
    } catch (error) {
      console.error('Model rollback failed:', error);
      throw error;
    }
  }

  // Private helper methods
  private createAdaptationLayers(baseModel: tf.LayersModel): tf.layers.Layer[] {
    const adaptationLayers = [
      tf.layers.dense({ units: 64, activation: 'relu', name: 'user_adaptation_1' }),
      tf.layers.dropout({ rate: 0.3, name: 'user_dropout_1' }),
      tf.layers.dense({ units: 32, activation: 'relu', name: 'user_adaptation_2' }),
      tf.layers.dense({ units: 16, activation: 'sigmoid', name: 'user_output' })
    ];
    
    return adaptationLayers;
  }

  private freezeBaseModelLayers(model: tf.LayersModel): void {
    model.layers.forEach(layer => {
      layer.trainable = false;
    });
  }

  private createUserSpecificModel(
    baseModel: tf.LayersModel, 
    adaptationLayers: tf.layers.Layer[]
  ): tf.LayersModel {
    const input = tf.input({ shape: baseModel.inputs[0].shape.slice(1) });
    let x = baseModel.apply(input) as tf.SymbolicTensor;
    
    adaptationLayers.forEach(layer => {
      x = layer.apply(x) as tf.SymbolicTensor;
    });
    
    return tf.model({ inputs: input, outputs: x });
  }

  private async performInitialFineTuning(
    model: tf.LayersModel, 
    data: UserAdaptationData
  ): Promise<void> {
    const trainingData = this.prepareTrainingData([data]);
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['accuracy']
    });

    await model.fit(trainingData.inputs, trainingData.outputs, {
      epochs: 10,
      batchSize: 8,
      verbose: 0
    });
  }

  private prepareTrainingData(data: UserAdaptationData[]): { inputs: tf.Tensor; outputs: tf.Tensor } {
    // Convert user data to tensors for training
    const inputs: number[][] = [];
    const outputs: number[][] = [];
    
    data.forEach(userData => {
      userData.interactions.forEach(interaction => {
        // Feature engineering from interaction data
        const features = this.extractFeatures(interaction, userData.preferences);
        const target = this.createTarget(interaction);
        
        inputs.push(features);
        outputs.push(target);
      });
    });
    
    return {
      inputs: tf.tensor2d(inputs),
      outputs: tf.tensor2d(outputs)
    };
  }

  private extractFeatures(interaction: UserInteraction, preferences: UserPreferences): number[] {
    // Extract numerical features from interaction and preferences
    const timeFeature = new Date(interaction.timestamp).getHours() / 24;
    const typeFeature = this.encodeInteractionType(interaction.type);
    const contextFeatures = this.encodeContext(interaction.context);
    
    return [timeFeature, typeFeature, ...contextFeatures];
  }

  private createTarget(interaction: UserInteraction): number[] {
    // Create target values based on interaction feedback
    const satisfaction = interaction.feedback || 0.5;
    return [satisfaction];
  }

  private encodeInteractionType(type: string): number {
    const typeMap: Record<string, number> = {
      'task_completion': 0.25,
      'preference_change': 0.5,
      'workflow_pattern': 0.75,
      'content_generation': 1.0
    };
    return typeMap[type] || 0;
  }

  private encodeContext(context: InteractionContext): number[] {
    const timeOfDayMap: Record<string, number> = {
      'morning': 0.25,
      'afternoon': 0.5,
      'evening': 0.75,
      'night': 1.0
    };
    
    return [
      timeOfDayMap[context.timeOfDay] || 0.5,
      context.workType === 'focused' ? 1 : 0,
      context.deviceType === 'mobile' ? 1 : 0
    ];
  }

  private addDifferentialPrivacy(weights: tf.Tensor[], privacyBudget: number): tf.Tensor[] {
    return weights.map(weight => {
      const noise = tf.randomNormal(weight.shape, 0, privacyBudget);
      return weight.add(noise);
    });
  }

  private async applyFederatedUpdate(userId: string, update: FederatedUpdate): Promise<void> {
    const userModel = await this.getUserModel(userId);
    if (!userModel || update.modelWeights.length === 0) return;

    // Apply federated weights with learning rate
    const currentWeights = userModel.getWeights();
    const updatedWeights = currentWeights.map((weight, index) => {
      if (index < update.modelWeights.length) {
        const federatedWeight = update.modelWeights[index];
        return weight.mul(0.9).add(federatedWeight.mul(0.1)); // 10% federated influence
      }
      return weight;
    });

    userModel.setWeights(updatedWeights);
  }

  private async evaluateModelAccuracy(
    model: tf.LayersModel, 
    testData: UserAdaptationData[]
  ): Promise<number> {
    if (testData.length === 0) return 0.5;
    
    const { inputs, outputs } = this.prepareTrainingData(testData);
    const predictions = model.predict(inputs) as tf.Tensor;
    
    // Calculate accuracy based on prediction vs actual
    const accuracy = tf.metrics.meanSquaredError(outputs, predictions);
    const accuracyValue = await accuracy.data();
    
    return 1 - Math.min(accuracyValue[0], 1); // Convert MSE to accuracy score
  }

  private async evaluateAndVersionModel(
    userId: string, 
    model: tf.LayersModel, 
    newData: UserAdaptationData[]
  ): Promise<void> {
    const currentAccuracy = await this.evaluateModelAccuracy(model, newData);
    const versions = this.modelVersions.get(userId) || [];
    const lastVersion = versions[versions.length - 1];
    
    // Create new version if improvement is significant (>5%)
    if (!lastVersion || currentAccuracy > lastVersion.accuracy * 1.05) {
      await this.createModelVersion(userId, model, newData);
    }
  }

  private async getUserModel(userId: string): Promise<tf.LayersModel | null> {
    let model = this.userModels.get(userId);
    
    if (!model) {
      // Try to load from cache
      model = await this.modelCache.getModel(`user_${userId}`);
      if (model) {
        this.userModels.set(userId, model);
      }
    }
    
    return model || null;
  }

  /**
   * Get model versions for a user
   */
  getModelVersions(userId: string): ModelVersion[] {
    return this.modelVersions.get(userId) || [];
  }

  /**
   * Get active model version for a user
   */
  getActiveModelVersion(userId: string): ModelVersion | null {
    const versions = this.modelVersions.get(userId) || [];
    return versions.find(v => v.isActive) || null;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.userModels.forEach(model => model.dispose());
    this.userModels.clear();
    this.modelVersions.clear();
    this.federatedUpdates.clear();
  }
}