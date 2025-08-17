/**
 * Visual generation service for creating charts and diagrams
 */

import * as d3 from 'd3';
import {
  VisualGenerationRequest,
  VisualGenerationResponse,
  ChartType,
  ChartConfiguration,
  DataInsight,
  InsightType,
  VisualTheme,

} from './types';

export class VisualGenerationService {
  private themes: Record<VisualTheme, ThemeConfig> = {
    [VisualTheme.LIGHT]: {
      background: '#ffffff',
      foreground: '#333333',
      accent: '#007acc',
      colors: ['#007acc', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14'],
      gridColor: '#e9ecef',
      textColor: '#495057'
    },
    [VisualTheme.DARK]: {
      background: '#1a1a1a',
      foreground: '#ffffff',
      accent: '#4fc3f7',
      colors: ['#4fc3f7', '#66bb6a', '#ffeb3b', '#f44336', '#ab47bc', '#ff9800'],
      gridColor: '#333333',
      textColor: '#ffffff'
    },
    [VisualTheme.COLORFUL]: {
      background: '#ffffff',
      foreground: '#333333',
      accent: '#e91e63',
      colors: ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#00bcd4', '#009688', '#4caf50'],
      gridColor: '#f5f5f5',
      textColor: '#424242'
    },
    [VisualTheme.MINIMAL]: {
      background: '#ffffff',
      foreground: '#000000',
      accent: '#000000',
      colors: ['#000000', '#666666', '#999999', '#cccccc'],
      gridColor: '#f0f0f0',
      textColor: '#000000'
    },
    [VisualTheme.PROFESSIONAL]: {
      background: '#ffffff',
      foreground: '#2c3e50',
      accent: '#3498db',
      colors: ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c'],
      gridColor: '#ecf0f1',
      textColor: '#2c3e50'
    }
  };

  /**
   * Generate visual representation of data
   */
  async generateVisual(request: VisualGenerationRequest): Promise<VisualGenerationResponse> {
    const theme = this.themes[request.theme || VisualTheme.PROFESSIONAL];
    const config = this.createChartConfiguration(request, theme);
    
    let svg: string;
    let insights: DataInsight[] = [];

    try {
      switch (request.chartType) {
        case ChartType.BAR:
          svg = this.generateBarChart(request.data, config, theme);
          insights = this.analyzeBarChartData(request.data);
          break;
        case ChartType.LINE:
          svg = this.generateLineChart(request.data, config, theme);
          insights = this.analyzeTimeSeriesData(request.data);
          break;
        case ChartType.PIE:
          svg = this.generatePieChart(request.data, config, theme);
          insights = this.analyzeCategoricalData(request.data);
          break;
        case ChartType.SCATTER:
          svg = this.generateScatterPlot(request.data, config, theme);
          insights = this.analyzeCorrelationData(request.data);
          break;
        case ChartType.AREA:
          svg = this.generateAreaChart(request.data, config, theme);
          insights = this.analyzeAreaData(request.data);
          break;
        case ChartType.HISTOGRAM:
          svg = this.generateHistogram(request.data, config, theme);
          insights = this.analyzeDistributionData(request.data);
          break;
        case ChartType.HEATMAP:
          svg = this.generateHeatmap(request.data, config, theme);
          insights = this.analyzeHeatmapData(request.data);
          break;
        default:
          throw new Error(`Unsupported chart type: ${request.chartType}`);
      }

      return {
        svg,
        config,
        insights
      };
    } catch (error) {
      console.error('Visual generation failed:', error);
      throw new Error(`Visual generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createChartConfiguration(_request: VisualGenerationRequest, theme: ThemeConfig): ChartConfiguration {
    return {
      width: 800,
      height: 600,
      margins: { top: 40, right: 40, bottom: 60, left: 60 },
      colors: theme.colors,
      animations: true
    };
  }

  private generateBarChart(data: any[], config: ChartConfiguration, theme: ThemeConfig): string {
    const { width, height, margins } = config;
    const innerWidth = width - margins.left - margins.right;
    const innerHeight = height - margins.top - margins.bottom;

    // Create SVG container
    const svg = d3.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background-color', theme.background);

    const g = svg.append('g')
      .attr('transform', `translate(${margins.left},${margins.top})`);

    // Prepare data
    const processedData = data.map((d, i) => ({
      label: d.label || d.name || `Item ${i + 1}`,
      value: +d.value || +d.count || 0
    }));

    // Create scales
    const xScale = d3.scaleBand()
      .domain(processedData.map(d => d.label))
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(processedData, d => d.value) || 0])
      .range([innerHeight, 0]);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('fill', theme.textColor)
      .style('font-size', '12px');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('fill', theme.textColor)
      .style('font-size', '12px');

    // Add bars
    g.selectAll('.bar')
      .data(processedData)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.label) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', d => yScale(d.value))
      .attr('height', d => innerHeight - yScale(d.value))
      .attr('fill', (_d, i) => config.colors[i % config.colors.length] || '#000000')
      .attr('opacity', 0.8);

    // Add value labels
    g.selectAll('.label')
      .data(processedData)
      .enter().append('text')
      .attr('class', 'label')
      .attr('x', d => (xScale(d.label) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.value) - 5)
      .attr('text-anchor', 'middle')
      .style('fill', theme.textColor)
      .style('font-size', '11px')
      .text(d => d.value);

    return svg.node()?.outerHTML || '';
  }

  private generateLineChart(data: any[], config: ChartConfiguration, theme: ThemeConfig): string {
    const { width, height, margins } = config;
    const innerWidth = width - margins.left - margins.right;
    const innerHeight = height - margins.top - margins.bottom;

    const svg = d3.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background-color', theme.background);

    const g = svg.append('g')
      .attr('transform', `translate(${margins.left},${margins.top})`);

    // Prepare data
    const processedData = data.map((d, i) => ({
      x: d.x || d.date || i,
      y: +d.y || +d.value || 0
    }));

    // Create scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(processedData, d => d.x) as [number, number])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(processedData, d => d.y) as [number, number])
      .range([innerHeight, 0]);

    // Create line generator
    const line = d3.line<any>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveMonotoneX);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('fill', theme.textColor);

    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('fill', theme.textColor);

    // Add line
    g.append('path')
      .datum(processedData)
      .attr('fill', 'none')
      .attr('stroke', config.colors[0] || '#000000')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add dots
    g.selectAll('.dot')
      .data(processedData)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', 4)
      .attr('fill', config.colors[0] || '#000000');

    return svg.node()?.outerHTML || '';
  }

  private generatePieChart(data: any[], config: ChartConfiguration, theme: ThemeConfig): string {
    const { width, height } = config;
    const radius = Math.min(width, height) / 2 - 40;

    const svg = d3.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background-color', theme.background);

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Prepare data
    const processedData = data.map((d, i) => ({
      label: d.label || d.name || `Item ${i + 1}`,
      value: +d.value || +d.count || 0
    }));

    const pie = d3.pie<any>()
      .value(d => d.value);

    const arc = d3.arc<any>()
      .innerRadius(0)
      .outerRadius(radius);

    const arcs = g.selectAll('.arc')
      .data(pie(processedData))
      .enter().append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (_d, i) => config.colors[i % config.colors.length] || '#000000')
      .attr('opacity', 0.8);

    // Add labels
    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('fill', theme.textColor)
      .style('font-size', '12px')
      .text(d => d.data.label);

    return svg.node()?.outerHTML || '';
  }

  private generateScatterPlot(data: any[], config: ChartConfiguration, theme: ThemeConfig): string {
    const { width, height, margins } = config;
    const innerWidth = width - margins.left - margins.right;
    const innerHeight = height - margins.top - margins.bottom;

    const svg = d3.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background-color', theme.background);

    const g = svg.append('g')
      .attr('transform', `translate(${margins.left},${margins.top})`);

    // Prepare data
    const processedData = data.map(d => ({
      x: +d.x || 0,
      y: +d.y || 0,
      category: d.category || 'default'
    }));

    // Create scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(processedData, d => d.x) as [number, number])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(processedData, d => d.y) as [number, number])
      .range([innerHeight, 0]);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('fill', theme.textColor);

    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('fill', theme.textColor);

    // Add dots
    g.selectAll('.dot')
      .data(processedData)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', 5)
      .attr('fill', (_d, i) => config.colors[i % config.colors.length] || '#000000')
      .attr('opacity', 0.7);

    return svg.node()?.outerHTML || '';
  }

  private generateAreaChart(data: any[], config: ChartConfiguration, theme: ThemeConfig): string {
    const { width, height, margins } = config;
    const innerWidth = width - margins.left - margins.right;
    const innerHeight = height - margins.top - margins.bottom;

    const svg = d3.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background-color', theme.background);

    const g = svg.append('g')
      .attr('transform', `translate(${margins.left},${margins.top})`);

    // Prepare data
    const processedData = data.map((d, i) => ({
      x: d.x || i,
      y: +d.y || +d.value || 0
    }));

    // Create scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(processedData, d => d.x) as [number, number])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(processedData, d => d.y) || 0])
      .range([innerHeight, 0]);

    // Create area generator
    const area = d3.area<any>()
      .x(d => xScale(d.x))
      .y0(innerHeight)
      .y1(d => yScale(d.y))
      .curve(d3.curveMonotoneX);

    // Add area
    g.append('path')
      .datum(processedData)
      .attr('fill', config.colors[0] || '#000000')
      .attr('opacity', 0.6)
      .attr('d', area);

    // Add line on top
    const line = d3.line<any>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(processedData)
      .attr('fill', 'none')
      .attr('stroke', config.colors[0] || '#000000')
      .attr('stroke-width', 2)
      .attr('d', line);

    return svg.node()?.outerHTML || '';
  }

  private generateHistogram(data: any[], config: ChartConfiguration, theme: ThemeConfig): string {
    const { width, height, margins } = config;
    const innerWidth = width - margins.left - margins.right;
    const innerHeight = height - margins.top - margins.bottom;

    const svg = d3.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background-color', theme.background);

    const g = svg.append('g')
      .attr('transform', `translate(${margins.left},${margins.top})`);

    // Extract values
    const values = data.map(d => +d.value || +d || 0);

    // Create histogram
    const histogram = d3.histogram()
      .domain(d3.extent(values) as [number, number])
      .thresholds(20);

    const bins = histogram(values);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(values) as [number, number])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length) || 0])
      .range([innerHeight, 0]);

    // Add bars
    g.selectAll('.bar')
      .data(bins)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.x0 || 0))
      .attr('width', d => Math.max(0, xScale(d.x1 || 0) - xScale(d.x0 || 0) - 1))
      .attr('y', d => yScale(d.length))
      .attr('height', d => innerHeight - yScale(d.length))
      .attr('fill', config.colors[0] || '#000000')
      .attr('opacity', 0.7);

    return svg.node()?.outerHTML || '';
  }

  private generateHeatmap(data: any[], config: ChartConfiguration, theme: ThemeConfig): string {
    const { width, height, margins } = config;
    const innerWidth = width - margins.left - margins.right;
    const innerHeight = height - margins.top - margins.bottom;

    const svg = d3.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background-color', theme.background);

    const g = svg.append('g')
      .attr('transform', `translate(${margins.left},${margins.top})`);

    // Prepare data (assuming data has x, y, value properties)
    const processedData = data.map(d => ({
      x: d.x || 0,
      y: d.y || 0,
      value: +d.value || 0
    }));

    const xValues = [...new Set(processedData.map(d => d.x))].sort();
    const yValues = [...new Set(processedData.map(d => d.y))].sort();

    const cellWidth = innerWidth / xValues.length;
    const cellHeight = innerHeight / yValues.length;

    // Create color scale
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain(d3.extent(processedData, d => d.value) as [number, number]);

    // Add cells
    g.selectAll('.cell')
      .data(processedData)
      .enter().append('rect')
      .attr('class', 'cell')
      .attr('x', d => xValues.indexOf(d.x) * cellWidth)
      .attr('y', d => yValues.indexOf(d.y) * cellHeight)
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .attr('fill', d => colorScale(d.value))
      .attr('stroke', theme.gridColor)
      .attr('stroke-width', 1);

    return svg.node()?.outerHTML || '';
  }

  // Data analysis methods
  private analyzeBarChartData(data: any[]): DataInsight[] {
    const insights: DataInsight[] = [];
    const values = data.map(d => +d.value || +d.count || 0);
    
    const max = Math.max(...values);
    const maxIndex = values.indexOf(max);
    const maxItem = data[maxIndex];
    
    insights.push({
      type: InsightType.TREND,
      description: `Highest value: ${maxItem.label || maxItem.name} (${max})`,
      significance: 0.9,
      recommendation: 'Focus on understanding what drives this high performance'
    });

    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const aboveAverage = values.filter(val => val > avg).length;
    
    if (aboveAverage < values.length / 3) {
      insights.push({
        type: InsightType.PATTERN,
        description: `Only ${aboveAverage} out of ${values.length} items are above average`,
        significance: 0.7,
        recommendation: 'Consider investigating underperforming categories'
      });
    }

    return insights;
  }

  private analyzeTimeSeriesData(data: any[]): DataInsight[] {
    const insights: DataInsight[] = [];
    const values = data.map(d => +d.y || +d.value || 0);
    
    // Trend analysis
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg * 1.1) {
      insights.push({
        type: InsightType.TREND,
        description: 'Upward trend detected in the second half of the data',
        significance: 0.8,
        recommendation: 'Investigate factors contributing to this positive trend'
      });
    } else if (secondAvg < firstAvg * 0.9) {
      insights.push({
        type: InsightType.TREND,
        description: 'Downward trend detected in the second half of the data',
        significance: 0.8,
        recommendation: 'Analyze potential causes of decline and mitigation strategies'
      });
    }

    return insights;
  }

  private analyzeCategoricalData(data: any[]): DataInsight[] {
    const insights: DataInsight[] = [];
    const values = data.map(d => +d.value || +d.count || 0);
    const total = values.reduce((sum, val) => sum + val, 0);
    
    const largest = Math.max(...values);
    const largestPercentage = (largest / total) * 100;
    
    if (largestPercentage > 50) {
      const largestIndex = values.indexOf(largest);
      const largestItem = data[largestIndex];
      
      insights.push({
        type: InsightType.PATTERN,
        description: `${largestItem.label || largestItem.name} dominates with ${largestPercentage.toFixed(1)}% of the total`,
        significance: 0.9,
        recommendation: 'Consider if this concentration is healthy for your goals'
      });
    }

    return insights;
  }

  private analyzeCorrelationData(data: any[]): DataInsight[] {
    const insights: DataInsight[] = [];
    
    if (data.length < 3) return insights;
    
    const xValues = data.map(d => +d.x || 0);
    const yValues = data.map(d => +d.y || 0);
    
    // Simple correlation calculation
    const correlation = this.calculateCorrelation(xValues, yValues);
    
    if (Math.abs(correlation) > 0.7) {
      insights.push({
        type: InsightType.CORRELATION,
        description: `${correlation > 0 ? 'Strong positive' : 'Strong negative'} correlation detected (r = ${correlation.toFixed(2)})`,
        significance: Math.abs(correlation),
        recommendation: 'This relationship may be worth investigating further'
      });
    }

    return insights;
  }

  private analyzeAreaData(data: any[]): DataInsight[] {
    return this.analyzeTimeSeriesData(data); // Similar analysis to line charts
  }

  private analyzeDistributionData(data: any[]): DataInsight[] {
    const insights: DataInsight[] = [];
    const values = data.map(d => +d.value || +d || 0);
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const median = this.calculateMedian(values);
    
    if (Math.abs(mean - median) > mean * 0.2) {
      insights.push({
        type: InsightType.PATTERN,
        description: `Distribution is skewed (mean: ${mean.toFixed(2)}, median: ${median.toFixed(2)})`,
        significance: 0.7,
        recommendation: 'Consider the impact of outliers on your analysis'
      });
    }

    return insights;
  }

  private analyzeHeatmapData(data: any[]): DataInsight[] {
    const insights: DataInsight[] = [];
    const values = data.map(d => +d.value || 0);
    
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min;
    
    if (range > 0) {
      const hotSpots = data.filter(d => (+d.value || 0) > min + range * 0.8);
      
      if (hotSpots.length > 0) {
        insights.push({
          type: InsightType.PATTERN,
          description: `${hotSpots.length} high-intensity areas detected`,
          significance: 0.8,
          recommendation: 'Focus attention on these high-activity regions'
        });
      }
    }

    return insights;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * (y[i] || 0), 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? ((sorted[mid - 1] || 0) + (sorted[mid] || 0)) / 2
      : (sorted[mid] || 0);
  }
}

interface ThemeConfig {
  background: string;
  foreground: string;
  accent: string;
  colors: string[];
  gridColor: string;
  textColor: string;
}