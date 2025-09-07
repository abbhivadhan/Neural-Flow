import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataVisualizationService } from '../DataVisualizationService';
import { ChartType } from '../../../types/analytics';

// Mock DOM elements
const mockContainer = {
  clientWidth: 800,
  clientHeight: 400,
  appendChild: vi.fn(),
  removeChild: vi.fn(),
  contains: vi.fn(() => true)
};

// Mock D3 and Plot
vi.mock('d3', () => ({
  select: vi.fn(() => ({
    selectAll: vi.fn(() => ({ remove: vi.fn() })),
    append: vi.fn(() => ({
      attr: vi.fn(() => ({ attr: vi.fn() })),
      style: vi.fn(() => ({ style: vi.fn() }))
    }))
  })),
  scaleTime: vi.fn(() => ({
    domain: vi.fn(() => ({ range: vi.fn() })),
    range: vi.fn()
  })),
  scaleLinear: vi.fn(() => ({
    domain: vi.fn(() => ({ range: vi.fn() })),
    range: vi.fn()
  })),
  line: vi.fn(() => ({
    x: vi.fn(() => ({ y: vi.fn(() => ({ curve: vi.fn() })) })),
    y: vi.fn(),
    curve: vi.fn()
  })),
  axisBottom: vi.fn(),
  axisLeft: vi.fn(),
  extent: vi.fn(() => [new Date(), new Date()]),
  max: vi.fn(() => 1),
  mean: vi.fn(() => 0.5),
  sum: vi.fn(() => 10),
  variance: vi.fn(() => 0.1),
  timeFormat: vi.fn(() => vi.fn()),
  format: vi.fn(() => vi.fn()),
  curveMonotoneX: 'curveMonotoneX',
  interpolateBlues: vi.fn(),
  scaleSequential: vi.fn(() => ({ domain: vi.fn() })),
  scaleBand: vi.fn(() => ({
    domain: vi.fn(() => ({ range: vi.fn(() => ({ padding: vi.fn() })) })),
    range: vi.fn(),
    bandwidth: vi.fn(() => 50)
  }))
}));

vi.mock('@observablehq/plot', () => ({
  plot: vi.fn(() => mockContainer),
  line: vi.fn(),
  cell: vi.fn(),
  text: vi.fn(),
  dot: vi.fn()
}));

// Mock document methods
Object.defineProperty(global, 'document', {
  value: {
    getElementById: vi.fn(() => mockContainer),
    createElement: vi.fn(() => ({
      getContext: vi.fn(() => ({
        drawImage: vi.fn()
      })),
      toBlob: vi.fn((callback) => callback(new Blob())),
      width: 800,
      height: 400
    })),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn()
    }
  }
});

// Mock URL methods
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn()
  }
});

describe('DataVisualizationService', () => {
  let service: DataVisualizationService;

  beforeEach(() => {
    service = new DataVisualizationService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    service.destroy();
  });

  describe('initialization', () => {
    it('should initialize successfully', () => {
      expect(service).toBeDefined();
    });

    it('should initialize color schemes', () => {
      expect(service).toHaveProperty('colorSchemes');
    });
  });

  describe('chart creation', () => {
    const mockData = [
      { date: '2024-01-01', value: 0.7, productivity: 0.8 },
      { date: '2024-01-02', value: 0.8, productivity: 0.9 }
    ];

    it('should create productivity metrics chart', () => {
      const chart = service.createProductivityMetricsChart('test-container', mockData);
      
      expect(chart).toBeDefined();
      expect(chart).toHaveProperty('element');
      expect(chart).toHaveProperty('data');
      expect(chart).toHaveProperty('update');
      expect(chart).toHaveProperty('destroy');
      expect(chart).toHaveProperty('export');
    });

    it('should create behavioral heatmap', () => {
      const heatmapData = [
        { day: 'Monday', hour: 9, value: 50 },
        { day: 'Monday', hour: 10, value: 75 }
      ];

      const chart = service.createBehavioralHeatmap('test-container', heatmapData);
      
      expect(chart).toBeDefined();
      expect(chart.data).toEqual(heatmapData);
    });

    it('should create correlation matrix', () => {
      const correlationData = [
        {
          metric1: 'productivity',
          metric2: 'focus',
          coefficient: 0.8,
          pValue: 0.01,
          strength: 'strong' as const,
          direction: 'positive' as const
        }
      ];

      const chart = service.createCorrelationMatrix('test-container', correlationData);
      
      expect(chart).toBeDefined();
      expect(chart.data).toEqual(correlationData);
    });

    it('should create real-time performance dashboard', () => {
      const realTimeData = [
        { timestamp: '2024-01-01T10:00:00Z', value: 0.7 },
        { timestamp: '2024-01-01T10:01:00Z', value: 0.8 }
      ];

      const chart = service.createRealTimePerformanceDashboard('test-container', realTimeData);
      
      expect(chart).toBeDefined();
      expect(chart.data).toEqual(realTimeData);
    });
  });

  describe('chart updates', () => {
    it('should update chart data', () => {
      const initialData = [{ date: '2024-01-01', value: 0.7 }];
      const newData = [{ date: '2024-01-02', value: 0.8 }];

      const chart = service.createProductivityMetricsChart('test-container', initialData);
      
      expect(() => chart.update(newData)).not.toThrow();
    });
  });

  describe('chart export', () => {
    it('should export chart as SVG', async () => {
      const chart = service.createProductivityMetricsChart('test-container', []);
      
      const blob = await chart.export({ format: 'svg' });
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/svg+xml');
    });

    it('should export chart as PNG', async () => {
      const chart = service.createProductivityMetricsChart('test-container', []);
      
      const blob = await chart.export({ format: 'png', width: 800, height: 400 });
      
      expect(blob).toBeInstanceOf(Blob);
    });

    it('should export chart as CSV', async () => {
      const data = [{ date: '2024-01-01', value: 0.7 }];
      const chart = service.createProductivityMetricsChart('test-container', data);
      
      const blob = await chart.export({ format: 'csv' });
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/csv');
    });

    it('should export chart as JSON', async () => {
      const data = [{ date: '2024-01-01', value: 0.7 }];
      const chart = service.createProductivityMetricsChart('test-container', data);
      
      const blob = await chart.export({ format: 'json' });
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
    });
  });

  describe('insight generation', () => {
    it('should generate trend insights', () => {
      const trendData = [
        { date: '2024-01-01', value: 0.5 },
        { date: '2024-01-02', value: 0.7 },
        { date: '2024-01-03', value: 0.9 }
      ];

      const insights = service.generateVisualizationInsights(trendData, ChartType.LINE);
      
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should generate comparison insights', () => {
      const comparisonData = [
        { name: 'Task A', value: 10 },
        { name: 'Task B', value: 5 }
      ];

      const insights = service.generateVisualizationInsights(comparisonData, ChartType.BAR);
      
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should generate pattern insights for heatmaps', () => {
      const heatmapData = [
        { day: 'Monday', hour: 9, value: 100 },
        { day: 'Monday', hour: 10, value: 20 }
      ];

      const insights = service.generateVisualizationInsights(heatmapData, ChartType.HEATMAP);
      
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should generate correlation insights for scatter plots', () => {
      const scatterData = Array.from({ length: 20 }, (_, i) => ({
        x: i,
        y: i * 2 + Math.random() * 2
      }));

      const insights = service.generateVisualizationInsights(scatterData, ChartType.SCATTER);
      
      expect(Array.isArray(insights)).toBe(true);
    });
  });

  describe('Observable Plot integration', () => {
    it('should create Observable Plot visualization', () => {
      const data = [{ x: 1, y: 2 }, { x: 2, y: 4 }];
      const plotConfig = {
        marks: [],
        x: { domain: [0, 10] },
        y: { domain: [0, 10] }
      };

      const chart = service.createObservablePlot('test-container', data, plotConfig);
      
      expect(chart).toBeDefined();
      expect(chart.data).toEqual(data);
    });
  });

  describe('error handling', () => {
    it('should handle missing container gracefully', () => {
      vi.mocked(document.getElementById).mockReturnValue(null);
      
      expect(() => {
        service.createProductivityMetricsChart('missing-container', []);
      }).toThrow('Container missing-container not found');
    });

    it('should handle export errors gracefully', async () => {
      const chart = service.createProductivityMetricsChart('test-container', []);
      
      await expect(chart.export({ format: 'pdf' as any })).rejects.toThrow();
    });
  });

  describe('resource management', () => {
    it('should track created charts', () => {
      const chart1 = service.createProductivityMetricsChart('container1', []);
      const chart2 = service.createBehavioralHeatmap('container2', []);
      
      expect(service['charts'].size).toBe(2);
    });

    it('should clean up all charts on destroy', () => {
      service.createProductivityMetricsChart('container1', []);
      service.createBehavioralHeatmap('container2', []);
      
      service.destroy();
      
      expect(service['charts'].size).toBe(0);
    });

    it('should handle chart destruction gracefully', () => {
      const chart = service.createProductivityMetricsChart('test-container', []);
      
      expect(() => chart.destroy()).not.toThrow();
    });
  });

  describe('performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        date: new Date(2024, 0, i + 1).toISOString(),
        value: Math.random()
      }));

      const startTime = performance.now();
      const chart = service.createProductivityMetricsChart('test-container', largeDataset);
      const endTime = performance.now();
      
      expect(chart).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});