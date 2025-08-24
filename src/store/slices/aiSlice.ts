import { StateCreator } from 'zustand';

export interface AIModelSettings {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  model: string;
  enableLocalInference: boolean;
}

export interface TaskPrediction {
  id: string;
  taskId: string;
  predictedDuration: number;
  confidence: number;
  suggestedPriority: 'low' | 'medium' | 'high' | 'urgent';
  optimalStartTime: Date;
  requiredResources: string[];
  createdAt: Date;
}

export interface UserPattern {
  id: string;
  type: 'productivity' | 'focus' | 'break' | 'collaboration';
  pattern: Record<string, any>;
  confidence: number;
  lastUpdated: Date;
}

export interface ContentGeneration {
  id: string;
  type: 'text' | 'code' | 'diagram' | 'summary';
  prompt: string;
  result: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface AIState {
  modelSettings: AIModelSettings;
  predictions: TaskPrediction[];
  userPatterns: UserPattern[];
  contentGenerations: ContentGeneration[];
  isProcessing: boolean;
  lastModelUpdate: Date | null;
  modelAccuracy: number;
}

export interface AIActions {
  updateModelSettings: (settings: Partial<AIModelSettings>) => void;
  addPrediction: (prediction: Omit<TaskPrediction, 'id' | 'createdAt'>) => void;
  updateUserPatterns: (patterns: UserPattern[]) => void;
  generateContent: (request: Omit<ContentGeneration, 'id' | 'createdAt'>) => Promise<void>;
  setProcessing: (processing: boolean) => void;
  updateModelAccuracy: (accuracy: number) => void;
  clearOldPredictions: (olderThan: Date) => void;
}

export interface AISlice {
  ai: AIState;
  updateModelSettings: AIActions['updateModelSettings'];
  addPrediction: AIActions['addPrediction'];
  updateUserPatterns: AIActions['updateUserPatterns'];
  generateContent: AIActions['generateContent'];
  setProcessing: AIActions['setProcessing'];
  updateModelAccuracy: AIActions['updateModelAccuracy'];
  clearOldPredictions: AIActions['clearOldPredictions'];
}

export const aiSlice: StateCreator<
  AISlice,
  [['zustand/immer', never]],
  [],
  AISlice
> = (set, get) => ({
  ai: {
    modelSettings: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      model: 'gpt-3.5-turbo',
      enableLocalInference: true,
    },
    predictions: [],
    userPatterns: [],
    contentGenerations: [],
    isProcessing: false,
    lastModelUpdate: null,
    modelAccuracy: 0.85,
  },

  updateModelSettings: (settings) =>
    set((state) => {
      state.ai.modelSettings = {
        ...state.ai.modelSettings,
        ...settings,
      };
      state.ai.lastModelUpdate = new Date();
    }),

  addPrediction: (predictionData) =>
    set((state) => {
      const prediction: TaskPrediction = {
        ...predictionData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };
      
      state.ai.predictions.push(prediction);
      
      // Keep only last 100 predictions
      if (state.ai.predictions.length > 100) {
        state.ai.predictions = state.ai.predictions.slice(-100);
      }
    }),

  updateUserPatterns: (patterns) =>
    set((state) => {
      state.ai.userPatterns = patterns.map(pattern => ({
        ...pattern,
        lastUpdated: new Date(),
      }));
    }),

  generateContent: async (request) => {
    set((state) => {
      state.ai.isProcessing = true;
    });

    try {
      // Simulate AI content generation
      // In a real implementation, this would call your AI service
      const result = await simulateContentGeneration(request);
      
      set((state) => {
        const generation: ContentGeneration = {
          ...request,
          result,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        };
        
        state.ai.contentGenerations.push(generation);
        
        // Keep only last 50 generations
        if (state.ai.contentGenerations.length > 50) {
          state.ai.contentGenerations = state.ai.contentGenerations.slice(-50);
        }
        
        state.ai.isProcessing = false;
      });
    } catch (error) {
      set((state) => {
        state.ai.isProcessing = false;
      });
      throw error;
    }
  },

  setProcessing: (processing) =>
    set((state) => {
      state.ai.isProcessing = processing;
    }),

  updateModelAccuracy: (accuracy) =>
    set((state) => {
      state.ai.modelAccuracy = Math.max(0, Math.min(1, accuracy));
    }),

  clearOldPredictions: (olderThan) =>
    set((state) => {
      state.ai.predictions = state.ai.predictions.filter(
        p => p.createdAt > olderThan
      );
    }),
});

// Simulate AI content generation for demo purposes
async function simulateContentGeneration(request: Omit<ContentGeneration, 'id' | 'createdAt'>): Promise<string> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  switch (request.type) {
    case 'text':
      return `Generated text content based on: "${request.prompt}". This is a simulated response that would normally come from an AI model.`;
    
    case 'code':
      return `// Generated code for: ${request.prompt}\nfunction generatedFunction() {\n  // Implementation would go here\n  return 'Generated code';\n}`;
    
    case 'diagram':
      return `graph TD\n  A[${request.prompt}] --> B[Generated Diagram]\n  B --> C[Output]`;
    
    case 'summary':
      return `Summary of "${request.prompt}": This is a concise summary of the requested content, highlighting key points and main ideas.`;
    
    default:
      return `Generated content for: ${request.prompt}`;
  }
}