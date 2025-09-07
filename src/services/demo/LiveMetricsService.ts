export interface LiveMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  history: number[];
  target?: number;
  critical?: boolean;
}

export interface SystemHealth {
  overall: number;
  cpu: number;
  memory: number;
  network: number;
  aiModels: number;
}

export interface AIModelMetrics {
  modelId: string;
  name: string;
  inferenceTime: number;
  accuracy: number;
  throughput: number;
  memoryUsage: number;
  status: 'active' | 'idle' | 'training' | 'error';
  predictions: number;
  confidence: number;
}

export interface UserActivityMetrics {
  activeUsers: number;
  tasksCompleted: number;
  aiInteractions: number;
  productivityScore: number;
  collaborationEvents: number;
  contextSwitches: number;
}

export class LiveMetricsService {
  private metrics: Map<string, LiveMetric> = new Map();
  private systemHealth: SystemHealth = {
    overall: 98.5,
    cpu: 45,
    memory: 62,
    network: 95,
    aiModels: 97
  };
  private aiModels: AIModelMetrics[] = [];
  private userActivity: UserActivityMetrics = {
    activeUsers: 12,
    tasksCompleted: 0,
    aiInteractions: 0,
    productivityScore: 8.7,
    collaborationEvents: 0,
    contextSwitches: 0
  };
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.initializeMetrics();
    this.initializeAIModels();
  }

  private initializeMetrics(): void {
    const initialMetrics: Omit<LiveMetric, 'history'>[] = [
      { id: 'response_time', name: 'Response Time', value: 45, unit: 'ms', trend: 'stable', target: 50 },
      { id: 'throughput', name: 'Throughput', value: 1250, unit: 'req/s', trend: 'up' },
      { id: 'error_rate', name: 'Error Rate', value: 0.02, unit: '%', trend: 'down', critical: true },
      { id: 'ai_accuracy', name: 'AI Accuracy', value: 94.2, unit: '%', trend: 'up', target: 95 },
      { id: 'user_satisfaction', name: 'User Satisfaction', value: 9.1, unit: '/10', trend: 'up', target: 9.0 },
      { id: 'task_completion', name: 'Task Completion Rate', value: 87, unit: '%', trend: 'stable', target: 85 },
      { id: 'prediction_speed', name: 'Prediction Speed', value: 28, unit: 'ms', trend: 'down' },
      { id: 'context_accuracy', name: 'Context Understanding', value: 96.8, unit: '%', trend: 'up' }
    ];

    initialMetrics.forEach(metric => {
      this.metrics.set(metric.id, {
        ...metric,
        history: Array(30).fill(metric.value).map(v => v + (Math.random() - 0.5) * v * 0.1)
      });
    });
  }

  private initializeAIModels(): void {
    this.aiModels = [
      {
        modelId: 'task_predictor',
        name: 'Task Prediction Model',
        inferenceTime: 45,
        accuracy: 94.2,
        throughput: 1250,
        memoryUsage: 512,
        status: 'active',
        predictions: 0,
        confidence: 0.94
      },
      {
        modelId: 'content_generator',
        name: 'Content Generation Model',
        inferenceTime: 120,
        accuracy: 91.8,
        throughput: 850,
        memoryUsage: 1024,
        status: 'active',
        predictions: 0,
        confidence: 0.92
      },
      {
        modelId: 'behavior_analyzer',
        name: 'Behavior Analysis Model',
        inferenceTime: 28,
        accuracy: 96.5,
        throughput: 2100,
        memoryUsage: 256,
        status: 'active',
        predictions: 0,
        confidence: 0.97
      },
      {
        modelId: 'collaboration_optimizer',
        name: 'Collaboration Optimizer',
        inferenceTime: 65,
        accuracy: 89.3,
        throughput: 750,
        memoryUsage: 384,
        status: 'active',
        predictions: 0,
        confidence: 0.89
      }
    ];
  }

  public startLiveUpdates(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.updateMetrics();
      this.updateSystemHealth();
      this.updateAIModels();
      this.updateUserActivity();
    }, 1000);
  }

  public stopLiveUpdates(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
  }

  private updateMetrics(): void {
    this.metrics.forEach((metric, id) => {
      let newValue = metric.value;
      const variance = metric.value * 0.05; // 5% variance
      
      // Simulate realistic changes based on metric type
      switch (id) {
        case 'response_time':
          newValue += (Math.random() - 0.5) * 10;
          newValue = Math.max(20, Math.min(100, newValue));
          break;
        case 'throughput':
          newValue += (Math.random() - 0.5) * 200;
          newValue = Math.max(800, Math.min(2000, newValue));
          break;
        case 'error_rate':
          newValue += (Math.random() - 0.7) * 0.01; // Bias towards lower error rates
          newValue = Math.max(0, Math.min(1, newValue));
          break;
        case 'ai_accuracy':
          newValue += (Math.random() - 0.3) * 2; // Bias towards higher accuracy
          newValue = Math.max(85, Math.min(100, newValue));
          break;
        default:
          newValue += (Math.random() - 0.5) * variance;
          break;
      }

      // Update trend
      const trend = newValue > metric.value ? 'up' : newValue < metric.value ? 'down' : 'stable';
      
      // Update history
      const newHistory = [...metric.history.slice(1), newValue];

      this.metrics.set(id, {
        ...metric,
        value: newValue,
        trend,
        history: newHistory
      });
    });
  }

  private updateSystemHealth(): void {
    this.systemHealth = {
      cpu: Math.max(20, Math.min(90, this.systemHealth.cpu + (Math.random() - 0.5) * 10)),
      memory: Math.max(30, Math.min(85, this.systemHealth.memory + (Math.random() - 0.5) * 5)),
      network: Math.max(80, Math.min(100, this.systemHealth.network + (Math.random() - 0.5) * 5)),
      aiModels: Math.max(90, Math.min(100, this.systemHealth.aiModels + (Math.random() - 0.5) * 2)),
      overall: 0
    };
    
    // Calculate overall health
    this.systemHealth.overall = (
      this.systemHealth.cpu * 0.2 +
      this.systemHealth.memory * 0.2 +
      this.systemHealth.network * 0.3 +
      this.systemHealth.aiModels * 0.3
    );
  }

  private updateAIModels(): void {
    this.aiModels = this.aiModels.map(model => {
      // Simulate processing activity
      const isProcessing = Math.random() > 0.7;
      
      return {
        ...model,
        inferenceTime: Math.max(10, model.inferenceTime + (Math.random() - 0.5) * 20),
        accuracy: Math.max(80, Math.min(100, model.accuracy + (Math.random() - 0.5) * 1)),
        throughput: Math.max(100, model.throughput + (Math.random() - 0.5) * 200),
        memoryUsage: Math.max(128, model.memoryUsage + (Math.random() - 0.5) * 50),
        predictions: model.predictions + (isProcessing ? Math.floor(Math.random() * 5) : 0),
        confidence: Math.max(0.7, Math.min(1, model.confidence + (Math.random() - 0.5) * 0.02)),
        status: Math.random() > 0.95 ? 'training' : 'active'
      };
    });
  }

  private updateUserActivity(): void {
    this.userActivity = {
      activeUsers: Math.max(1, this.userActivity.activeUsers + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0)),
      tasksCompleted: this.userActivity.tasksCompleted + Math.floor(Math.random() * 3),
      aiInteractions: this.userActivity.aiInteractions + Math.floor(Math.random() * 5),
      productivityScore: Math.max(6, Math.min(10, this.userActivity.productivityScore + (Math.random() - 0.5) * 0.2)),
      collaborationEvents: this.userActivity.collaborationEvents + (Math.random() > 0.7 ? 1 : 0),
      contextSwitches: this.userActivity.contextSwitches + (Math.random() > 0.8 ? 1 : 0)
    };
  }

  // Public getters
  public getMetrics(): LiveMetric[] {
    return Array.from(this.metrics.values());
  }

  public getMetric(id: string): LiveMetric | undefined {
    return this.metrics.get(id);
  }

  public getSystemHealth(): SystemHealth {
    return { ...this.systemHealth };
  }

  public getAIModels(): AIModelMetrics[] {
    return [...this.aiModels];
  }

  public getUserActivity(): UserActivityMetrics {
    return { ...this.userActivity };
  }

  public isLive(): boolean {
    return this.isRunning;
  }

  // Simulate specific events for demo purposes
  public simulateHighLoad(): void {
    this.metrics.forEach((metric, id) => {
      if (id === 'response_time') {
        this.metrics.set(id, { ...metric, value: metric.value * 1.5 });
      } else if (id === 'throughput') {
        this.metrics.set(id, { ...metric, value: metric.value * 1.8 });
      }
    });
  }

  public simulateAIOptimization(): void {
    this.aiModels = this.aiModels.map(model => ({
      ...model,
      status: 'training',
      accuracy: Math.min(100, model.accuracy + 2),
      inferenceTime: Math.max(10, model.inferenceTime * 0.8)
    }));
  }

  public resetDemo(): void {
    this.initializeMetrics();
    this.initializeAIModels();
    this.userActivity = {
      activeUsers: 12,
      tasksCompleted: 0,
      aiInteractions: 0,
      productivityScore: 8.7,
      collaborationEvents: 0,
      contextSwitches: 0
    };
  }

  // Additional demo scenarios
  public simulateStressTest(): void {
    this.metrics.forEach((metric, id) => {
      if (id === 'response_time') {
        this.metrics.set(id, { ...metric, value: metric.value * 2.5 });
      } else if (id === 'error_rate') {
        this.metrics.set(id, { ...metric, value: Math.min(5, metric.value * 10) });
      } else if (id === 'throughput') {
        this.metrics.set(id, { ...metric, value: metric.value * 0.6 });
      }
    });
    
    this.systemHealth.cpu = Math.min(95, this.systemHealth.cpu * 1.8);
    this.systemHealth.memory = Math.min(90, this.systemHealth.memory * 1.5);
  }

  public simulateFailureRecovery(): void {
    // Simulate system recovery
    this.aiModels = this.aiModels.map((model, index) => ({
      ...model,
      status: index < 2 ? 'error' : 'active',
      accuracy: index < 2 ? model.accuracy * 0.7 : model.accuracy
    }));

    // Gradually recover over time
    setTimeout(() => {
      this.aiModels = this.aiModels.map(model => ({
        ...model,
        status: 'active',
        accuracy: Math.min(100, model.accuracy * 1.2)
      }));
    }, 5000);
  }

  public simulateAutoScaling(): void {
    // Simulate auto-scaling event
    this.userActivity.activeUsers = Math.floor(this.userActivity.activeUsers * 1.5);
    
    this.metrics.forEach((metric, id) => {
      if (id === 'throughput') {
        this.metrics.set(id, { ...metric, value: metric.value * 1.3 });
      }
    });

    this.systemHealth.cpu = Math.max(30, this.systemHealth.cpu * 0.8);
    this.systemHealth.memory = Math.max(40, this.systemHealth.memory * 0.9);
  }

  public setRefreshRate(rate: number): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = setInterval(() => {
        this.updateMetrics();
        this.updateSystemHealth();
        this.updateAIModels();
        this.updateUserActivity();
      }, rate);
    }
  }

  public exportMetrics(): any {
    return {
      timestamp: new Date().toISOString(),
      metrics: Array.from(this.metrics.values()),
      systemHealth: this.systemHealth,
      aiModels: this.aiModels,
      userActivity: this.userActivity
    };
  }
}