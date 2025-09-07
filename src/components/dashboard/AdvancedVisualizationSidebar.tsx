import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  Activity, 
  Zap,
  Eye,
  Download,
  Settings,
  RefreshCw,
  Layers,
  Globe,
  Target,
  Brain,
  Users,
  Clock,
  Filter,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface VisualizationWidget {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'heatmap' | 'scatter' | 'area';
  data: any[];
  config: any;
  isExpanded: boolean;
}

interface AdvancedVisualizationSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export const AdvancedVisualizationSidebar: React.FC<AdvancedVisualizationSidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  className = ''
}) => {
  const [widgets, setWidgets] = useState<VisualizationWidget[]>([]);
  const [activeWidget, setActiveWidget] = useState<string | null>(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [filterType, setFilterType] = useState('all');
  
  // Chart refs
  const miniChartRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Initialize widgets
  useEffect(() => {
    const initialWidgets: VisualizationWidget[] = [
      {
        id: 'productivity-trend',
        title: 'Productivity',
        type: 'line',
        data: generateTimeSeriesData(24),
        config: { color: '#3b82f6', showGrid: true },
        isExpanded: false
      },
      {
        id: 'task-distribution',
        title: 'Task Types',
        type: 'pie',
        data: generatePieData(),
        config: { colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'] },
        isExpanded: false
      },
      {
        id: 'team-activity',
        title: 'Team Activity',
        type: 'bar',
        data: generateBarData(),
        config: { color: '#8b5cf6', showValues: true },
        isExpanded: false
      },
      {
        id: 'focus-heatmap',
        title: 'Focus Patterns',
        type: 'heatmap',
        data: generateHeatmapData(),
        config: { colorScale: ['#fef3c7', '#f59e0b', '#dc2626'] },
        isExpanded: false
      },
      {
        id: 'collaboration-network',
        title: 'Collaboration',
        type: 'scatter',
        data: generateScatterData(),
        config: { color: '#06b6d4', showTrend: true },
        isExpanded: false
      },
      {
        id: 'performance-area',
        title: 'Performance',
        type: 'area',
        data: generateAreaData(),
        config: { color: '#10b981', fillOpacity: 0.3 },
        isExpanded: false
      }
    ];
    
    setWidgets(initialWidgets);
  }, []);

  // Real-time data updates
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(() => {
      setWidgets(prev => prev.map(widget => ({
        ...widget,
        data: updateWidgetData(widget)
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, [isRealTimeEnabled]);

  // Update chart visualizations
  useEffect(() => {
    widgets.forEach(widget => {
      const ref = miniChartRefs.current[widget.id];
      if (ref) {
        renderMiniChart(ref, widget);
      }
    });
  }, [widgets]);

  const generateTimeSeriesData = (hours: number) => {
    const data = [];
    const now = new Date();
    for (let i = hours; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        time: time.toISOString(),
        value: 0.5 + Math.random() * 0.5,
        label: time.getHours() + ':00'
      });
    }
    return data;
  };

  const generatePieData = () => [
    { label: 'Development', value: 45, color: '#3b82f6' },
    { label: 'Meetings', value: 25, color: '#ef4444' },
    { label: 'Planning', value: 20, color: '#10b981' },
    { label: 'Other', value: 10, color: '#f59e0b' }
  ];

  const generateBarData = () => [
    { label: 'Mon', value: 85 },
    { label: 'Tue', value: 92 },
    { label: 'Wed', value: 78 },
    { label: 'Thu', value: 96 },
    { label: 'Fri', value: 88 },
    { label: 'Sat', value: 45 },
    { label: 'Sun', value: 32 }
  ];

  const generateHeatmapData = () => {
    const data = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const hours = Array.from({ length: 9 }, (_, i) => i + 9); // 9 AM to 5 PM
    
    days.forEach((day, dayIndex) => {
      hours.forEach((hour, hourIndex) => {
        data.push({
          day,
          hour,
          value: Math.random(),
          dayIndex,
          hourIndex
        });
      });
    });
    return data;
  };

  const generateScatterData = () => {
    return Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 10 + 5
    }));
  };

  const generateAreaData = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      value: 50 + Math.random() * 50,
      target: 75
    }));
  };

  const updateWidgetData = (widget: VisualizationWidget) => {
    switch (widget.type) {
      case 'line':
        const newPoint = {
          time: new Date().toISOString(),
          value: 0.5 + Math.random() * 0.5,
          label: new Date().getHours() + ':' + new Date().getMinutes()
        };
        return [...widget.data.slice(-23), newPoint];
      
      case 'pie':
        return widget.data.map(item => ({
          ...item,
          value: Math.max(5, item.value + (Math.random() - 0.5) * 10)
        }));
      
      case 'bar':
        return widget.data.map(item => ({
          ...item,
          value: Math.max(10, Math.min(100, item.value + (Math.random() - 0.5) * 20))
        }));
      
      default:
        return widget.data;
    }
  };

  const renderMiniChart = (container: HTMLDivElement, widget: VisualizationWidget) => {
    const { type, data, config } = widget;
    
    switch (type) {
      case 'line':
        renderLineChart(container, data, config);
        break;
      case 'pie':
        renderPieChart(container, data, config);
        break;
      case 'bar':
        renderBarChart(container, data, config);
        break;
      case 'heatmap':
        renderHeatmap(container, data, config);
        break;
      case 'scatter':
        renderScatterChart(container, data, config);
        break;
      case 'area':
        renderAreaChart(container, data, config);
        break;
    }
  };

  const renderLineChart = (container: HTMLDivElement, data: any[], config: any) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - (d.value / maxValue) * 80;
      return `${x},${y}`;
    }).join(' ');

    container.innerHTML = `
      <svg class="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="${config.color}"
          stroke-width="2"
          points="${points}"
          vector-effect="non-scaling-stroke"
        />
        ${data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - (d.value / maxValue) * 80;
          return `<circle cx="${x}" cy="${y}" r="1.5" fill="${config.color}" vector-effect="non-scaling-stroke"/>`;
        }).join('')}
      </svg>
    `;
  };

  const renderPieChart = (container: HTMLDivElement, data: any[], config: any) => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = 0;
    
    const slices = data.map(d => {
      const angle = (d.value / total) * 360;
      const slice = {
        ...d,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        percentage: Math.round((d.value / total) * 100)
      };
      currentAngle += angle;
      return slice;
    });

    container.innerHTML = `
      <div class="w-full h-full flex items-center justify-center">
        <div class="relative w-16 h-16">
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="16" fill="transparent"/>
            ${slices.map((slice, i) => {
              const circumference = 2 * Math.PI * 16;
              const strokeDasharray = `${(slice.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((slices.slice(0, i).reduce((sum, s) => sum + s.percentage, 0) / 100) * circumference);
              return `
                <circle
                  cx="16"
                  cy="16"
                  r="16"
                  fill="transparent"
                  stroke="${slice.color}"
                  stroke-width="8"
                  stroke-dasharray="${strokeDasharray}"
                  stroke-dashoffset="${strokeDashoffset}"
                />
              `;
            }).join('')}
          </svg>
        </div>
      </div>
    `;
  };

  const renderBarChart = (container: HTMLDivElement, data: any[], config: any) => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    container.innerHTML = `
      <div class="w-full h-full flex items-end justify-between px-1 pb-1">
        ${data.map(d => `
          <div class="flex-1 mx-0.5">
            <div 
              class="w-full rounded-t"
              style="height: ${(d.value / maxValue) * 100}%; background-color: ${config.color}; opacity: 0.8;"
            ></div>
          </div>
        `).join('')}
      </div>
    `;
  };

  const renderHeatmap = (container: HTMLDivElement, data: any[], config: any) => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    container.innerHTML = `
      <div class="w-full h-full grid grid-cols-9 gap-0.5 p-1">
        ${data.map(d => `
          <div 
            class="aspect-square rounded-sm"
            style="background-color: ${config.colorScale[Math.floor(d.value * (config.colorScale.length - 1))]}; opacity: ${d.value};"
          ></div>
        `).join('')}
      </div>
    `;
  };

  const renderScatterChart = (container: HTMLDivElement, data: any[], config: any) => {
    container.innerHTML = `
      <svg class="w-full h-full" viewBox="0 0 100 100">
        ${data.map(d => `
          <circle 
            cx="${d.x}" 
            cy="${100 - d.y}" 
            r="${d.size / 10}" 
            fill="${config.color}" 
            opacity="0.7"
          />
        `).join('')}
      </svg>
    `;
  };

  const renderAreaChart = (container: HTMLDivElement, data: any[], config: any) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - (d.value / maxValue) * 80;
      return `${x},${y}`;
    }).join(' ');

    container.innerHTML = `
      <svg class="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon
          fill="${config.color}"
          fill-opacity="${config.fillOpacity}"
          stroke="${config.color}"
          stroke-width="2"
          points="0,100 ${points} 100,100"
          vector-effect="non-scaling-stroke"
        />
      </svg>
    `;
  };

  const toggleWidget = (widgetId: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId 
        ? { ...w, isExpanded: !w.isExpanded }
        : { ...w, isExpanded: false }
    ));
    setActiveWidget(activeWidget === widgetId ? null : widgetId);
  };

  const getWidgetIcon = (type: string) => {
    switch (type) {
      case 'line': return LineChart;
      case 'bar': return BarChart3;
      case 'pie': return PieChart;
      case 'heatmap': return Activity;
      case 'scatter': return Target;
      case 'area': return TrendingUp;
      default: return BarChart3;
    }
  };

  if (isCollapsed) {
    return (
      <motion.div
        animate={{ width: 72 }}
        transition={{ duration: 0.3 }}
        className={`h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col ${className}`}
      >
        {/* Header */}
        <div className="p-3 border-b border-slate-200/50 dark:border-slate-700/50">
          <Button
            onClick={onToggleCollapse}
            variant="outline"
            size="sm"
            className="w-12 h-12 p-0"
          >
            <Layers className="w-4 h-4" />
          </Button>
        </div>

        {/* Collapsed Widget Icons */}
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {widgets.map(widget => {
            const Icon = getWidgetIcon(widget.type);
            return (
              <motion.button
                key={widget.id}
                onClick={() => toggleWidget(widget.id)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                  activeWidget === widget.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={widget.title}
              >
                <Icon className="w-5 h-5" />
              </motion.button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="p-3 border-t border-slate-200/50 dark:border-slate-700/50 space-y-2">
          <Button
            onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
            variant={isRealTimeEnabled ? "default" : "outline"}
            size="sm"
            className="w-12 h-12 p-0"
            title={isRealTimeEnabled ? "Pause updates" : "Resume updates"}
          >
            {isRealTimeEnabled ? (
              <Activity className="w-4 h-4" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      animate={{ width: 320 }}
      transition={{ duration: 0.3 }}
      className={`h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Data Visualization
          </h2>
          <Button
            onClick={onToggleCollapse}
            variant="outline"
            size="sm"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
            variant={isRealTimeEnabled ? "default" : "outline"}
            size="sm"
            className="flex-1"
          >
            <Activity className="w-4 h-4 mr-2" />
            {isRealTimeEnabled ? 'Live' : 'Paused'}
          </Button>
          
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
          >
            <option value="1h">1H</option>
            <option value="24h">24H</option>
            <option value="7d">7D</option>
          </select>
        </div>
      </div>

      {/* Widget List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {widgets.map(widget => {
            const Icon = getWidgetIcon(widget.type);
            return (
              <motion.div
                key={widget.id}
                layout
                className={`border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden transition-all ${
                  widget.isExpanded ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-800'
                }`}
              >
                {/* Widget Header */}
                <div
                  className="p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  onClick={() => toggleWidget(widget.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {widget.title}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isRealTimeEnabled && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      )}
                      <motion.div
                        animate={{ rotate: widget.isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Eye className="w-4 h-4 text-slate-400" />
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Mini Chart */}
                <div className="px-3 pb-3">
                  <div 
                    ref={el => miniChartRefs.current[widget.id] = el}
                    className="h-16 bg-slate-50 dark:bg-slate-700/50 rounded border"
                  />
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {widget.isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-slate-200 dark:border-slate-700"
                    >
                      <div className="p-3 space-y-3">
                        {/* Widget Stats */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center p-2 bg-slate-100 dark:bg-slate-700 rounded">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {widget.data.length}
                            </div>
                            <div className="text-slate-500">Points</div>
                          </div>
                          <div className="text-center p-2 bg-slate-100 dark:bg-slate-700 rounded">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {selectedTimeRange}
                            </div>
                            <div className="text-slate-500">Range</div>
                          </div>
                        </div>

                        {/* Widget Actions */}
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Download className="w-3 h-3 mr-1" />
                            Export
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Maximize2 className="w-3 h-3 mr-1" />
                            Expand
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{widgets.length} widgets active</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Real-time</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};