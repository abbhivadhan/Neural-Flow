import * as d3 from 'd3';
import * as Plot from '@observablehq/plot';
import { 
  TrendData, 
  ComparisonData, 
  CorrelationData, 
  SegmentData,
  ChartType,
  VisualizationConfig,
  ColorScheme 
} from '../../types/analytics';
import { TimeRange } from '../../types/common';

export interface VisualizationData {
  id: string;
  title: string;
  data: any[];
  config: VisualizationConfig;
  insights?: string[];
}

export interface ExportOptions {
  format: 'png' | 'svg' | 'pdf' | 'csv' | 'json';
  width?: number;
  height?: number;
  quality?: number;
  includeData?: boolean;
}

export interface InteractiveChart {
  element: HTMLElement;
  data: any[];
  update: (newData: any[]) => void;
  destroy: () => void;
  export: (options: ExportOptions) => Promise<Blob>;
}

export class DataVisualizationService {
  private charts: Map<string, InteractiveChart> = new Map();
  private colorSchemes: Map<string, string[]> = new Map();

  constructor() {
    this.initializeColorSchemes();
  }

  /**
   * Create interactive productivity metrics visualization
   */
  createProductivityMetricsChart(
    containerId: string,
    data: any[],
    config: Partial<VisualizationConfig> = {}
  ): InteractiveChart {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);

    const defaultConfig: VisualizationConfig = {
      chartType: ChartType.LINE,
      axes: [
        {
          type: 'x',
          field: 'date',
          label: 'Date',
          scale: 'time' as any,
          format: '%Y-%m-%d',
          gridLines: true
        },
        {
          type: 'y',
          field: 'value',
          label: 'Productivity Score',
          scale: 'linear' as any,
          range: [0, 1],
          format: '.1%',
          gridLines: true
        }
      ],
      series: [
        {
          name: 'Productivity',
          field: 'productivity',
          type: ChartType.LINE,
          color: '#3b82f6',
          style: { lineWidth: 2 },
          markers: { enabled: true, shape: 'circle', size: 4 },
          labels: { enabled: false, position: 'top', format: '.1%' }
        }
      ],
      colors: {
        type: 'categorical',
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
      },
      styling: {
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        borderRadius: 8,
        padding: { top: 20, right: 20, bottom: 40, left: 60 },
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
        font: {
          family: 'Inter, sans-serif',
          size: 12,
          weight: 'normal',
          style: 'normal',
          color: '#374151'
        }
      },
      interactions: [
        { type: 'hover' as any, enabled: true, configuration: {} },
        { type: 'tooltip' as any, enabled: true, configuration: {} }
      ]
    };

    const mergedConfig = { ...defaultConfig, ...config };
    const chart = this.createD3LineChart(container, data, mergedConfig);
    this.charts.set(containerId, chart);
    
    return chart;
  }

  /**
   * Create real-time performance dashboard
   */
  createRealTimePerformanceDashboard(
    containerId: string,
    initialData: any[]
  ): InteractiveChart {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);

    const chart = this.createRealTimeChart(container, initialData);
    this.charts.set(containerId, chart);
    
    return chart;
  }

  /**
   * Create behavioral analysis heatmap
   */
  createBehavioralHeatmap(
    containerId: string,
    data: any[],
    config: Partial<VisualizationConfig> = {}
  ): InteractiveChart {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);

    const chart = this.createD3Heatmap(container, data, config);
    this.charts.set(containerId, chart);
    
    return chart;
  }

  /**
   * Create correlation matrix visualization
   */
  createCorrelationMatrix(
    containerId: string,
    correlations: CorrelationData[]
  ): InteractiveChart {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);

    const chart = this.createCorrelationChart(container, correlations);
    this.charts.set(containerId, chart);
    
    return chart;
  }

  /**
   * Create trend analysis chart with forecasting
   */
  createTrendAnalysisChart(
    containerId: string,
    trends: TrendData[],
    forecasts?: TrendData[]
  ): InteractiveChart {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);

    const chart = this.createTrendChart(container, trends, forecasts);
    this.charts.set(containerId, chart);
    
    return chart;
  }

  /**
   * Create Observable Plot visualization
   */
  createObservablePlot(
    containerId: string,
    data: any[],
    plotConfig: any
  ): InteractiveChart {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);

    const plot = Plot.plot({
      ...plotConfig,
      width: container.clientWidth,
      height: container.clientHeight || 400
    });

    container.appendChild(plot);

    const chart: InteractiveChart = {
      element: plot,
      data,
      update: (newData: any[]) => {
        container.removeChild(plot);
        const newPlot = Plot.plot({
          ...plotConfig,
          data: newData,
          width: container.clientWidth,
          height: container.clientHeight || 400
        });
        container.appendChild(newPlot);
        chart.element = newPlot;
      },
      destroy: () => {
        if (container.contains(plot)) {
          container.removeChild(plot);
        }
      },
      export: async (options: ExportOptions) => {
        return this.exportChart(plot, options);
      }
    };

    this.charts.set(containerId, chart);
    return chart;
  }

  /**
   * Export chart to various formats
   */
  async exportChart(element: HTMLElement, options: ExportOptions): Promise<Blob> {
    switch (options.format) {
      case 'svg':
        return this.exportAsSVG(element);
      case 'png':
        return this.exportAsPNG(element, options);
      case 'pdf':
        return this.exportAsPDF(element, options);
      case 'csv':
        return this.exportAsCSV(element);
      case 'json':
        return this.exportAsJSON(element);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Generate AI insights from visualization data
   */
  generateVisualizationInsights(data: any[], chartType: ChartType): string[] {
    const insights: string[] = [];

    switch (chartType) {
      case ChartType.LINE:
        insights.push(...this.analyzeTrendInsights(data));
        break;
      case ChartType.BAR:
        insights.push(...this.analyzeComparisonInsights(data));
        break;
      case ChartType.HEATMAP:
        insights.push(...this.analyzePatternInsights(data));
        break;
      case ChartType.SCATTER:
        insights.push(...this.analyzeCorrelationInsights(data));
        break;
    }

    return insights;
  }

  // Private implementation methods

  private createD3LineChart(
    container: HTMLElement,
    data: any[],
    config: VisualizationConfig
  ): InteractiveChart {
    if (!data || data.length === 0) {
      container.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">No data available</div>';
      return this.createEmptyChart(container, data);
    }

    const margin = config.styling.margin;
    const width = container.clientWidth - margin.left - margin.right;
    const height = (container.clientHeight || 400) - margin.top - margin.bottom;

    // Clear container
    d3.select(container).selectAll('*').remove();

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.date || d.timestamp)) as [Date, Date])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 1])
      .range([height, 0]);

    // Create line generator
    const line = d3.line<any>()
      .x(d => xScale(new Date(d.date || d.timestamp)))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Add grid lines first (behind everything)
    if (config.axes[1].gridLines) {
      g.append('g')
        .attr('class', 'grid')
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0.3)
        .call(d3.axisLeft(yScale)
          .tickSize(-width)
          .tickFormat(() => '')
        );
    }

    if (config.axes[0].gridLines) {
      g.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${height})`)
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0.3)
        .call(d3.axisBottom(xScale)
          .tickSize(-height)
          .tickFormat(() => '')
        );
    }

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%m/%d')));

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d3.format('.1%')));

    // Add line
    const path = g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', config.series[0].color)
      .attr('stroke-width', config.series[0].style.lineWidth)
      .attr('d', line);

    // Add markers
    if (config.series[0].markers.enabled) {
      g.selectAll('.marker')
        .data(data)
        .enter().append('circle')
        .attr('class', 'marker')
        .attr('cx', d => xScale(new Date(d.date || d.timestamp)))
        .attr('cy', d => yScale(d.value))
        .attr('r', config.series[0].markers.size)
        .attr('fill', config.series[0].color)
        .style('cursor', 'pointer');
    }

    // Add tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000');

    // Add interaction
    g.selectAll('.marker')
      .on('mouseover', (event, d) => {
        tooltip.transition().duration(200).style('opacity', .9);
        const date = new Date(d.date || d.timestamp).toLocaleDateString();
        tooltip.html(`Date: ${date}<br/>Value: ${(d.value * 100).toFixed(1)}%`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(500).style('opacity', 0);
      });

    return {
      element: svg.node()!,
      data,
      update: (newData: any[]) => {
        if (!newData || newData.length === 0) return;
        
        // Update scales
        xScale.domain(d3.extent(newData, d => new Date(d.date || d.timestamp)) as [Date, Date]);
        yScale.domain([0, d3.max(newData, d => d.value) || 1]);

        // Update line
        path.datum(newData)
          .transition()
          .duration(750)
          .attr('d', line);

        // Update markers
        const markers = g.selectAll('.marker')
          .data(newData);

        markers.enter().append('circle')
          .attr('class', 'marker')
          .attr('r', config.series[0].markers.size)
          .attr('fill', config.series[0].color)
          .style('cursor', 'pointer');

        markers.transition()
          .duration(750)
          .attr('cx', d => xScale(new Date(d.date || d.timestamp)))
          .attr('cy', d => yScale(d.value));

        markers.exit().remove();
      },
      destroy: () => {
        d3.select(container).selectAll('*').remove();
        tooltip.remove();
      },
      export: async (options: ExportOptions) => {
        return this.exportChart(svg.node()!, options);
      }
    };
  }

  private createEmptyChart(container: HTMLElement, data: any[]): InteractiveChart {
    return {
      element: container,
      data,
      update: () => {},
      destroy: () => { container.innerHTML = ''; },
      export: async () => new Blob([''], { type: 'text/plain' })
    };
  }

  private createRealTimeChart(container: HTMLElement, data: any[]): InteractiveChart {
    const width = container.clientWidth;
    const height = container.clientHeight || 300;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };

    d3.select(container).selectAll('*').remove();

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.timestamp)) as [Date, Date])
      .range([0, width - margin.left - margin.right]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.value) as [number, number])
      .range([height - margin.top - margin.bottom, 0]);

    const line = d3.line<any>()
      .x(d => xScale(new Date(d.timestamp)))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Add axes
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    const yAxis = g.append('g')
      .call(d3.axisLeft(yScale));

    // Add line path
    const path = g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('d', line);

    return {
      element: svg.node()!,
      data,
      update: (newData: any[]) => {
        // Update scales
        xScale.domain(d3.extent(newData, d => new Date(d.timestamp)) as [Date, Date]);
        yScale.domain(d3.extent(newData, d => d.value) as [number, number]);

        // Update axes
        xAxis.transition().duration(500).call(d3.axisBottom(xScale));
        yAxis.transition().duration(500).call(d3.axisLeft(yScale));

        // Update line
        path.datum(newData)
          .transition()
          .duration(500)
          .attr('d', line);
      },
      destroy: () => {
        d3.select(container).selectAll('*').remove();
      },
      export: async (options: ExportOptions) => {
        return this.exportChart(svg.node()!, options);
      }
    };
  }

  private createD3Heatmap(
    container: HTMLElement,
    data: any[],
    config: Partial<VisualizationConfig>
  ): InteractiveChart {
    const width = container.clientWidth;
    const height = container.clientHeight || 400;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

    d3.select(container).selectAll('*').remove();

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Get unique values for axes
    const hours = Array.from(new Set(data.map(d => d.hour))).sort((a, b) => a - b);
    const days = Array.from(new Set(data.map(d => d.day))).sort();

    const xScale = d3.scaleBand()
      .domain(hours.map(String))
      .range([0, width - margin.left - margin.right])
      .padding(0.1);

    const yScale = d3.scaleBand()
      .domain(days)
      .range([0, height - margin.top - margin.bottom])
      .padding(0.1);

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain(d3.extent(data, d => d.value) as [number, number]);

    // Add rectangles
    g.selectAll('.cell')
      .data(data)
      .enter().append('rect')
      .attr('class', 'cell')
      .attr('x', d => xScale(String(d.hour))!)
      .attr('y', d => yScale(d.day)!)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.value))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale));

    return {
      element: svg.node()!,
      data,
      update: (newData: any[]) => {
        const cells = g.selectAll('.cell')
          .data(newData);

        cells.enter().append('rect')
          .attr('class', 'cell')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1);

        cells.transition()
          .duration(750)
          .attr('fill', d => colorScale(d.value));

        cells.exit().remove();
      },
      destroy: () => {
        d3.select(container).selectAll('*').remove();
      },
      export: async (options: ExportOptions) => {
        return this.exportChart(svg.node()!, options);
      }
    };
  }

  private createCorrelationChart(
    container: HTMLElement,
    correlations: CorrelationData[]
  ): InteractiveChart {
    const width = container.clientWidth;
    const height = container.clientHeight || 400;

    // Create correlation matrix data
    const metrics = Array.from(new Set([
      ...correlations.map(c => c.metric1),
      ...correlations.map(c => c.metric2)
    ]));

    const matrixData = metrics.flatMap(m1 =>
      metrics.map(m2 => {
        if (m1 === m2) return { metric1: m1, metric2: m2, coefficient: 1 };
        const corr = correlations.find(c =>
          (c.metric1 === m1 && c.metric2 === m2) ||
          (c.metric1 === m2 && c.metric2 === m1)
        );
        return {
          metric1: m1,
          metric2: m2,
          coefficient: corr?.coefficient || 0
        };
      })
    );

    const plot = Plot.plot({
      width,
      height,
      padding: 0.1,
      x: { domain: metrics },
      y: { domain: metrics },
      color: { scheme: 'RdBu', domain: [-1, 1] },
      marks: [
        Plot.cell(matrixData, {
          x: 'metric1',
          y: 'metric2',
          fill: 'coefficient'
        }),
        Plot.text(matrixData, {
          x: 'metric1',
          y: 'metric2',
          text: d => d.coefficient.toFixed(2),
          fill: 'white',
          fontSize: 12
        })
      ]
    });

    container.appendChild(plot);

    return {
      element: plot,
      data: correlations,
      update: (newData: CorrelationData[]) => {
        container.removeChild(plot);
        const newPlot = this.createCorrelationChart(container, newData);
        return newPlot;
      },
      destroy: () => {
        if (container.contains(plot)) {
          container.removeChild(plot);
        }
      },
      export: async (options: ExportOptions) => {
        return this.exportChart(plot, options);
      }
    };
  }

  private createTrendChart(
    container: HTMLElement,
    trends: TrendData[],
    forecasts?: TrendData[]
  ): InteractiveChart {
    const width = container.clientWidth;
    const height = container.clientHeight || 400;

    const allData = trends.flatMap(trend =>
      trend.values.map(v => ({
        ...v,
        metric: trend.metric,
        type: 'actual'
      }))
    );

    if (forecasts) {
      allData.push(...forecasts.flatMap(forecast =>
        forecast.values.map(v => ({
          ...v,
          metric: forecast.metric,
          type: 'forecast'
        }))
      ));
    }

    const plot = Plot.plot({
      width,
      height,
      x: { type: 'utc', label: 'Date' },
      y: { label: 'Value' },
      color: { legend: true },
      marks: [
        Plot.line(allData.filter(d => d.type === 'actual'), {
          x: 'timestamp',
          y: 'value',
          stroke: 'metric',
          strokeWidth: 2
        }),
        ...(forecasts ? [
          Plot.line(allData.filter(d => d.type === 'forecast'), {
            x: 'timestamp',
            y: 'value',
            stroke: 'metric',
            strokeWidth: 2,
            strokeDasharray: '5,5'
          })
        ] : []),
        Plot.dot(allData.filter(d => d.type === 'actual'), {
          x: 'timestamp',
          y: 'value',
          fill: 'metric',
          r: 3
        })
      ]
    });

    container.appendChild(plot);

    return {
      element: plot,
      data: trends,
      update: (newData: TrendData[]) => {
        container.removeChild(plot);
        const newChart = this.createTrendChart(container, newData, forecasts);
        return newChart;
      },
      destroy: () => {
        if (container.contains(plot)) {
          container.removeChild(plot);
        }
      },
      export: async (options: ExportOptions) => {
        return this.exportChart(plot, options);
      }
    };
  }

  // Export methods
  private async exportAsSVG(element: HTMLElement): Promise<Blob> {
    const svgElement = element.querySelector('svg') || element as any;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    return new Blob([svgString], { type: 'image/svg+xml' });
  }

  private async exportAsPNG(element: HTMLElement, options: ExportOptions): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = options.width || element.clientWidth;
    canvas.height = options.height || element.clientHeight;

    const svgBlob = await this.exportAsSVG(element);
    const svgUrl = URL.createObjectURL(svgBlob);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => {
          URL.revokeObjectURL(svgUrl);
          if (blob) resolve(blob);
          else reject(new Error('Failed to create PNG'));
        }, 'image/png', options.quality || 0.9);
      };
      img.onerror = reject;
      img.src = svgUrl;
    });
  }

  private async exportAsPDF(element: HTMLElement, options: ExportOptions): Promise<Blob> {
    // This would require a PDF library like jsPDF
    // For now, return PNG as fallback
    return this.exportAsPNG(element, options);
  }

  private async exportAsCSV(element: HTMLElement): Promise<Blob> {
    // Extract data from chart and convert to CSV
    const chart = Array.from(this.charts.values()).find(c => c.element === element);
    if (!chart) throw new Error('Chart not found');

    const csvContent = this.convertToCSV(chart.data);
    return new Blob([csvContent], { type: 'text/csv' });
  }

  private async exportAsJSON(element: HTMLElement): Promise<Blob> {
    const chart = Array.from(this.charts.values()).find(c => c.element === element);
    if (!chart) throw new Error('Chart not found');

    const jsonContent = JSON.stringify(chart.data, null, 2);
    return new Blob([jsonContent], { type: 'application/json' });
  }

  private convertToCSV(data: any[]): string {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value}"` : value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  }

  // Insight generation methods
  private analyzeTrendInsights(data: any[]): string[] {
    const insights: string[] = [];
    
    if (data.length < 2) return insights;
    
    const values = data.map(d => d.value);
    const trend = values[values.length - 1] - values[0];
    const avgChange = trend / (values.length - 1);
    
    if (Math.abs(avgChange) > 0.1) {
      insights.push(`Strong ${trend > 0 ? 'upward' : 'downward'} trend detected with ${(Math.abs(avgChange) * 100).toFixed(1)}% average change`);
    }
    
    // Detect volatility
    const variance = d3.variance(values) || 0;
    if (variance > 0.05) {
      insights.push('High volatility detected - consider investigating underlying causes');
    }
    
    return insights;
  }

  private analyzeComparisonInsights(data: any[]): string[] {
    const insights: string[] = [];
    
    const values = data.map(d => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const maxItem = data.find(d => d.value === max);
    const minItem = data.find(d => d.value === min);
    
    if (max / min > 2) {
      insights.push(`Significant performance gap: ${maxItem?.name} outperforms ${minItem?.name} by ${((max / min - 1) * 100).toFixed(0)}%`);
    }
    
    return insights;
  }

  private analyzePatternInsights(data: any[]): string[] {
    const insights: string[] = [];
    
    // Analyze heatmap patterns
    const values = data.map(d => d.value);
    const avg = d3.mean(values) || 0;
    const hotSpots = data.filter(d => d.value > avg * 1.5);
    
    if (hotSpots.length > 0) {
      insights.push(`${hotSpots.length} high-activity periods identified`);
    }
    
    return insights;
  }

  private analyzeCorrelationInsights(data: any[]): string[] {
    const insights: string[] = [];
    
    // Analyze scatter plot correlations
    if (data.length > 10) {
      const correlation = this.calculateCorrelation(
        data.map(d => d.x),
        data.map(d => d.y)
      );
      
      if (Math.abs(correlation) > 0.7) {
        insights.push(`Strong ${correlation > 0 ? 'positive' : 'negative'} correlation detected (r=${correlation.toFixed(2)})`);
      }
    }
    
    return insights;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = d3.sum(x);
    const sumY = d3.sum(y);
    const sumXY = d3.sum(x.map((xi, i) => xi * y[i]));
    const sumX2 = d3.sum(x.map(xi => xi * xi));
    const sumY2 = d3.sum(y.map(yi => yi * yi));
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private initializeColorSchemes(): void {
    this.colorSchemes.set('productivity', ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']);
    this.colorSchemes.set('performance', ['#8b5cf6', '#06b6d4', '#84cc16', '#f97316']);
    this.colorSchemes.set('wellbeing', ['#ec4899', '#14b8a6', '#fbbf24', '#f87171']);
  }

  /**
   * Clean up all charts
   */
  destroy(): void {
    this.charts.forEach(chart => chart.destroy());
    this.charts.clear();
  }
}