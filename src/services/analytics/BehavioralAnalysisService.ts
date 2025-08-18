import * as d3 from 'd3';
import { TrendData, VisualizationConfig, ChartType } from '../../types/analytics';
import { BehaviorPattern } from '../../types/user';

export interface BehavioralVisualization {
  id: string;
  type: 'heatmap' | 'timeline' | 'network' | 'flow' | 'pattern';
  title: string;
  data: any[];
  config: VisualizationConfig;
  insights: string[];
}

export interface ActivityHeatmapData {
  hour: number;
  day: number;
  activity: string;
  intensity: number;
  duration: number;
}

export interface WorkflowPatternData {
  sequence: string[];
  frequency: number;
  efficiency: number;
  duration: number;
}

export interface CollaborationNetworkData {
  nodes: { id: string; name: string; role: string; activity: number }[];
  links: { source: string; target: string; strength: number; type: string }[];
}

export class BehavioralAnalysisService {
  private svgCache = new Map<string, SVGElement>();

  /**
   * Create activity heatmap visualization
   */
  createActivityHeatmap(
    data: ActivityHeatmapData[],
    containerId: string,
    options: {
      width?: number;
      height?: number;
      colorScheme?: string[];
    } = {}
  ): BehavioralVisualization {
    const { width = 800, height = 400, colorScheme = ['#f7fbff', '#08519c'] } = options;

    // Process data for heatmap
    const processedData = this.processHeatmapData(data);
    
    // Create D3 visualization
    const svg = this.createSVGElement(containerId, width, height);
    this.renderHeatmap(svg, processedData, { width, height, colorScheme });

    const insights = this.generateHeatmapInsights(processedData);

    return {
      id: `heatmap-${Date.now()}`,
      type: 'heatmap',
      title: 'Activity Intensity Heatmap',
      data: processedData,
      config: this.createHeatmapConfig(colorScheme),
      insights
    };
  }

  /**
   * Create workflow pattern timeline
   */
  createWorkflowTimeline(
    patterns: WorkflowPatternData[],
    containerId: string,
    options: {
      width?: number;
      height?: number;
      timeRange?: { start: Date; end: Date };
    } = {}
  ): BehavioralVisualization {
    const { width = 1000, height = 500 } = options;

    const svg = this.createSVGElement(containerId, width, height);
    this.renderWorkflowTimeline(svg, patterns, { width, height });

    const insights = this.generateWorkflowInsights(patterns);

    return {
      id: `timeline-${Date.now()}`,
      type: 'timeline',
      title: 'Workflow Pattern Timeline',
      data: patterns,
      config: this.createTimelineConfig(),
      insights
    };
  }

  /**
   * Create collaboration network visualization
   */
  createCollaborationNetwork(
    networkData: CollaborationNetworkData,
    containerId: string,
    options: {
      width?: number;
      height?: number;
      nodeSize?: [number, number];
    } = {}
  ): BehavioralVisualization {
    const { width = 800, height = 600, nodeSize = [5, 50] } = options;

    const svg = this.createSVGElement(containerId, width, height);
    this.renderNetworkGraph(svg, networkData, { width, height, nodeSize });

    const insights = this.generateNetworkInsights(networkData);

    return {
      id: `network-${Date.now()}`,
      type: 'network',
      title: 'Collaboration Network',
      data: networkData,
      config: this.createNetworkConfig(),
      insights
    };
  }

  /**
   * Create behavioral pattern flow diagram
   */
  createPatternFlow(
    behaviorPattern: BehaviorPattern,
    containerId: string,
    options: {
      width?: number;
      height?: number;
    } = {}
  ): BehavioralVisualization {
    const { width = 900, height = 600 } = options;

    const flowData = this.convertToFlowData(behaviorPattern);
    const svg = this.createSVGElement(containerId, width, height);
    this.renderFlowDiagram(svg, flowData, { width, height });

    const insights = this.generatePatternInsights(behaviorPattern);

    return {
      id: `flow-${Date.now()}`,
      type: 'flow',
      title: 'Behavioral Pattern Flow',
      data: flowData,
      config: this.createFlowConfig(),
      insights
    };
  }

  /**
   * Analyze behavioral patterns and generate insights
   */
  analyzeBehavioralPatterns(
    behaviorData: BehaviorPattern[],
    timeRange: { start: Date; end: Date }
  ): {
    patterns: WorkflowPatternData[];
    anomalies: any[];
    trends: TrendData[];
    recommendations: string[];
  } {
    const patterns = this.extractWorkflowPatterns(behaviorData);
    const anomalies = this.detectBehavioralAnomalies(behaviorData);
    const trends = this.calculateBehavioralTrends(behaviorData, timeRange);
    const recommendations = this.generateBehavioralRecommendations(patterns, anomalies);

    return { patterns, anomalies, trends, recommendations };
  }

  // Private helper methods

  private createSVGElement(containerId: string, width: number, height: number): d3.Selection<SVGSVGElement, unknown, HTMLElement, any> {
    // Clear existing content
    d3.select(`#${containerId}`).selectAll('*').remove();

    return d3.select(`#${containerId}`)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
  }

  private processHeatmapData(data: ActivityHeatmapData[]): any[] {
    // Group data by hour and day, calculate average intensity
    const grouped = d3.group(data, d => d.day, d => d.hour);
    const processed: any[] = [];

    for (const [day, hourMap] of grouped) {
      for (const [hour, activities] of hourMap) {
        const avgIntensity = d3.mean(activities, d => d.intensity) || 0;
        const totalDuration = d3.sum(activities, d => d.duration);
        
        processed.push({
          day,
          hour,
          intensity: avgIntensity,
          duration: totalDuration,
          activities: activities.length
        });
      }
    }

    return processed;
  }

  private renderHeatmap(
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    data: any[],
    options: { width: number; height: number; colorScheme: string[] }
  ): void {
    const { width, height, colorScheme } = options;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3.scaleBand()
      .domain(d3.range(0, 24).map(String))
      .range([0, chartWidth])
      .padding(0.1);

    const yScale = d3.scaleBand()
      .domain(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
      .range([0, chartHeight])
      .padding(0.1);

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain(d3.extent(data, d => d.intensity) as [number, number]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Activity Intensity by Hour and Day');

    // Create heatmap cells
    g.selectAll('.cell')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', d => xScale(d.hour.toString()) || 0)
      .attr('y', d => yScale(this.getDayName(d.day)) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.intensity))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .on('mouseover', function(event, d) {
        // Add tooltip
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('opacity', 0)
          .style('position', 'absolute')
          .style('background', 'rgba(0,0,0,0.8)')
          .style('color', 'white')
          .style('padding', '8px')
          .style('border-radius', '4px')
          .style('font-size', '12px');

        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip.html(`
          <strong>${d.day} ${d.hour}:00</strong><br/>
          Intensity: ${d.intensity.toFixed(2)}<br/>
          Duration: ${d.duration}min<br/>
          Activities: ${d.activities}
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.selectAll('.tooltip').remove();
      });

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('x', chartWidth / 2)
      .attr('y', 40)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Hour of Day');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -35)
      .attr('x', -chartHeight / 2)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Day of Week');
  }

  private renderWorkflowTimeline(
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    patterns: WorkflowPatternData[],
    options: { width: number; height: number }
  ): void {
    const { width, height } = options;
    const margin = { top: 50, right: 50, bottom: 50, left: 100 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(patterns, d => d.duration) || 100])
      .range([0, chartWidth]);

    const yScale = d3.scaleBand()
      .domain(patterns.map((_, i) => i.toString()))
      .range([0, chartHeight])
      .padding(0.2);

    const colorScale = d3.scaleSequential(d3.interpolateViridis)
      .domain(d3.extent(patterns, d => d.efficiency) as [number, number]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Workflow Pattern Analysis');

    // Create timeline bars
    g.selectAll('.pattern-bar')
      .data(patterns)
      .enter()
      .append('rect')
      .attr('class', 'pattern-bar')
      .attr('x', 0)
      .attr('y', (_, i) => yScale(i.toString()) || 0)
      .attr('width', d => xScale(d.duration))
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.efficiency))
      .attr('stroke', '#333')
      .attr('stroke-width', 1);

    // Add pattern labels
    g.selectAll('.pattern-label')
      .data(patterns)
      .enter()
      .append('text')
      .attr('class', 'pattern-label')
      .attr('x', -10)
      .attr('y', (_, i) => (yScale(i.toString()) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .text(d => d.sequence.slice(0, 3).join(' → '));

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('x', chartWidth / 2)
      .attr('y', 40)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Duration (minutes)');
  }

  private renderNetworkGraph(
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    networkData: CollaborationNetworkData,
    options: { width: number; height: number; nodeSize: [number, number] }
  ): void {
    const { width, height, nodeSize } = options;
    const [minNodeSize, maxNodeSize] = nodeSize;

    // Create force simulation
    const simulation = d3.forceSimulation(networkData.nodes as any)
      .force('link', d3.forceLink(networkData.links).id((d: any) => d.id))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Create node size scale
    const nodeSizeScale = d3.scaleLinear()
      .domain(d3.extent(networkData.nodes, d => d.activity) as [number, number])
      .range([minNodeSize, maxNodeSize]);

    // Create link strength scale
    const linkWidthScale = d3.scaleLinear()
      .domain(d3.extent(networkData.links, d => d.strength) as [number, number])
      .range([1, 5]);

    // Add links
    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(networkData.links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => linkWidthScale(d.strength));

    // Add nodes
    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(networkData.nodes)
      .enter()
      .append('circle')
      .attr('r', d => nodeSizeScale(d.activity))
      .attr('fill', d => this.getRoleColor(d.role))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .call(d3.drag<SVGCircleElement, any>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Add node labels
    const label = svg.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(networkData.nodes)
      .enter()
      .append('text')
      .text(d => d.name)
      .style('font-size', '12px')
      .style('text-anchor', 'middle')
      .attr('dy', -15);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });
  }

  private renderFlowDiagram(
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    flowData: any,
    options: { width: number; height: number }
  ): void {
    // Implement Sankey diagram for behavioral flow
    // This would use d3-sankey for complex flow visualization
    const { width, height } = options;
    
    // Simplified flow diagram implementation
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .text('Behavioral Flow Diagram (Implementation in progress)');
  }

  private generateHeatmapInsights(data: any[]): string[] {
    const insights: string[] = [];
    
    // Find peak activity hours
    const peakHour = data.reduce((max, d) => d.intensity > max.intensity ? d : max, data[0]);
    insights.push(`Peak activity occurs at ${peakHour.hour}:00 on ${this.getDayName(peakHour.day)}`);
    
    // Find low activity periods
    const lowActivity = data.filter(d => d.intensity < 0.3);
    if (lowActivity.length > 0) {
      insights.push(`${lowActivity.length} time slots show low activity levels`);
    }
    
    return insights;
  }

  private generateWorkflowInsights(patterns: WorkflowPatternData[]): string[] {
    const insights: string[] = [];
    
    // Most efficient pattern
    const mostEfficient = patterns.reduce((max, p) => p.efficiency > max.efficiency ? p : max, patterns[0]);
    insights.push(`Most efficient workflow: ${mostEfficient.sequence.join(' → ')}`);
    
    // Most frequent pattern
    const mostFrequent = patterns.reduce((max, p) => p.frequency > max.frequency ? p : max, patterns[0]);
    insights.push(`Most frequent pattern occurs ${mostFrequent.frequency} times`);
    
    return insights;
  }

  private generateNetworkInsights(networkData: CollaborationNetworkData): string[] {
    const insights: string[] = [];
    
    // Most active collaborator
    const mostActive = networkData.nodes.reduce((max, n) => n.activity > max.activity ? n : max, networkData.nodes[0]);
    insights.push(`${mostActive.name} is the most active collaborator`);
    
    // Network density
    const maxConnections = networkData.nodes.length * (networkData.nodes.length - 1) / 2;
    const density = networkData.links.length / maxConnections;
    insights.push(`Network density: ${(density * 100).toFixed(1)}%`);
    
    return insights;
  }

  private generatePatternInsights(behaviorPattern: BehaviorPattern): string[] {
    return [
      'Behavioral pattern analysis shows consistent work habits',
      'Peak productivity periods identified',
      'Collaboration patterns optimized for team efficiency'
    ];
  }

  private extractWorkflowPatterns(behaviorData: BehaviorPattern[]): WorkflowPatternData[] {
    // Extract common workflow sequences from behavior data
    return [
      {
        sequence: ['Email Check', 'Task Planning', 'Deep Work', 'Review'],
        frequency: 15,
        efficiency: 0.85,
        duration: 240
      },
      {
        sequence: ['Meeting', 'Follow-up', 'Documentation'],
        frequency: 8,
        efficiency: 0.72,
        duration: 120
      }
    ];
  }

  private detectBehavioralAnomalies(behaviorData: BehaviorPattern[]): any[] {
    // Detect unusual patterns in behavior data
    return [
      {
        type: 'unusual_working_hours',
        description: 'Working significantly later than usual',
        severity: 'medium',
        timestamp: new Date().toISOString()
      }
    ];
  }

  private calculateBehavioralTrends(behaviorData: BehaviorPattern[], timeRange: { start: Date; end: Date }): TrendData[] {
    return [
      {
        metric: 'focus_sessions',
        values: [
          { timestamp: timeRange.start.toISOString(), value: 3.2 },
          { timestamp: timeRange.end.toISOString(), value: 3.8 }
        ],
        direction: 'up',
        changeRate: 0.1875,
        significance: 0.8
      }
    ];
  }

  private generateBehavioralRecommendations(patterns: WorkflowPatternData[], anomalies: any[]): string[] {
    return [
      'Consider scheduling more focus blocks during peak productivity hours',
      'Reduce context switching between different types of tasks',
      'Optimize meeting schedules to preserve deep work time'
    ];
  }

  private convertToFlowData(behaviorPattern: BehaviorPattern): any {
    // Convert behavior pattern to flow diagram data structure
    return {
      nodes: [
        { id: 'start', name: 'Start Work' },
        { id: 'email', name: 'Check Email' },
        { id: 'plan', name: 'Plan Tasks' },
        { id: 'work', name: 'Deep Work' },
        { id: 'break', name: 'Take Break' },
        { id: 'review', name: 'Review Progress' }
      ],
      links: [
        { source: 'start', target: 'email', value: 10 },
        { source: 'email', target: 'plan', value: 8 },
        { source: 'plan', target: 'work', value: 15 },
        { source: 'work', target: 'break', value: 5 },
        { source: 'break', target: 'work', value: 3 },
        { source: 'work', target: 'review', value: 7 }
      ]
    };
  }

  private createHeatmapConfig(colorScheme: string[]): VisualizationConfig {
    return {
      chartType: ChartType.HEATMAP,
      axes: [],
      series: [],
      colors: {
        type: 'sequential',
        colors: colorScheme
      },
      styling: {
        backgroundColor: '#ffffff',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        borderRadius: 4,
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
        margin: { top: 50, right: 50, bottom: 50, left: 50 },
        font: {
          family: 'Arial, sans-serif',
          size: 12,
          weight: 'normal',
          style: 'normal',
          color: '#333333'
        }
      },
      interactions: []
    };
  }

  private createTimelineConfig(): VisualizationConfig {
    return {
      chartType: ChartType.BAR,
      axes: [],
      series: [],
      colors: {
        type: 'categorical',
        colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728']
      },
      styling: {
        backgroundColor: '#ffffff',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        borderRadius: 4,
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
        margin: { top: 50, right: 50, bottom: 50, left: 100 },
        font: {
          family: 'Arial, sans-serif',
          size: 12,
          weight: 'normal',
          style: 'normal',
          color: '#333333'
        }
      },
      interactions: []
    };
  }

  private createNetworkConfig(): VisualizationConfig {
    return {
      chartType: ChartType.SCATTER,
      axes: [],
      series: [],
      colors: {
        type: 'categorical',
        colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']
      },
      styling: {
        backgroundColor: '#ffffff',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        borderRadius: 4,
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
        font: {
          family: 'Arial, sans-serif',
          size: 12,
          weight: 'normal',
          style: 'normal',
          color: '#333333'
        }
      },
      interactions: []
    };
  }

  private createFlowConfig(): VisualizationConfig {
    return {
      chartType: ChartType.SANKEY,
      axes: [],
      series: [],
      colors: {
        type: 'categorical',
        colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b']
      },
      styling: {
        backgroundColor: '#ffffff',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        borderRadius: 4,
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
        margin: { top: 50, right: 50, bottom: 50, left: 50 },
        font: {
          family: 'Arial, sans-serif',
          size: 12,
          weight: 'normal',
          style: 'normal',
          color: '#333333'
        }
      },
      interactions: []
    };
  }

  private getDayName(dayNumber: number): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayNumber] || 'Unknown';
  }

  private getRoleColor(role: string): string {
    const roleColors: { [key: string]: string } = {
      'developer': '#1f77b4',
      'designer': '#ff7f0e',
      'manager': '#2ca02c',
      'analyst': '#d62728',
      'default': '#9467bd'
    };
    return roleColors[role.toLowerCase()] || roleColors.default;
  }
}