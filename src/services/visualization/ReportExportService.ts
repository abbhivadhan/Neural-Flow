import { 
  AnalyticsReport, 
  ReportType, 
  ReportTemplate, 
  ReportSection, 
  SectionType,
  ExportOptions 
} from '../../types/analytics';
import { DataVisualizationService } from './DataVisualizationService';
import { TimeRange } from '../../types/common';

export interface ReportExportOptions {
  format: 'pdf' | 'html' | 'csv' | 'json' | 'xlsx';
  includeCharts: boolean;
  includeData: boolean;
  includeInsights: boolean;
  template?: ReportTemplate;
  branding?: BrandingOptions;
}

export interface BrandingOptions {
  logo?: string;
  companyName?: string;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fonts?: {
    heading: string;
    body: string;
  };
}

export interface ReportData {
  title: string;
  subtitle?: string;
  timeRange: TimeRange;
  sections: ReportSectionData[];
  metadata: {
    generatedAt: string;
    generatedBy: string;
    version: string;
  };
}

export interface ReportSectionData {
  id: string;
  title: string;
  type: SectionType;
  content: any;
  charts?: string[];
  insights?: string[];
}

export class ReportExportService {
  private visualizationService: DataVisualizationService;

  constructor(visualizationService: DataVisualizationService) {
    this.visualizationService = visualizationService;
  }

  /**
   * Generate comprehensive analytics report
   */
  async generateAnalyticsReport(
    reportData: ReportData,
    options: ReportExportOptions
  ): Promise<Blob> {
    switch (options.format) {
      case 'pdf':
        return this.generatePDFReport(reportData, options);
      case 'html':
        return this.generateHTMLReport(reportData, options);
      case 'csv':
        return this.generateCSVReport(reportData, options);
      case 'json':
        return this.generateJSONReport(reportData, options);
      case 'xlsx':
        return this.generateExcelReport(reportData, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Generate executive summary report
   */
  async generateExecutiveSummary(
    data: any,
    insights: string[],
    options: ReportExportOptions
  ): Promise<Blob> {
    const reportData: ReportData = {
      title: 'Executive Productivity Summary',
      subtitle: 'AI-Powered Analytics Report',
      timeRange: data.timeRange,
      sections: [
        {
          id: 'executive-summary',
          title: 'Executive Summary',
          type: SectionType.SUMMARY,
          content: this.generateExecutiveSummaryContent(data, insights)
        },
        {
          id: 'key-metrics',
          title: 'Key Performance Metrics',
          type: SectionType.METRICS,
          content: this.extractKeyMetrics(data)
        },
        {
          id: 'insights',
          title: 'AI-Generated Insights',
          type: SectionType.INSIGHTS,
          content: insights,
          insights: insights
        },
        {
          id: 'recommendations',
          title: 'Strategic Recommendations',
          type: SectionType.RECOMMENDATIONS,
          content: this.generateRecommendations(data, insights)
        }
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'Neural Flow AI',
        version: '1.0.0'
      }
    };

    return this.generateAnalyticsReport(reportData, options);
  }

  /**
   * Generate detailed productivity report
   */
  async generateProductivityReport(
    productivityData: any,
    behaviorData: any,
    options: ReportExportOptions
  ): Promise<Blob> {
    const reportData: ReportData = {
      title: 'Comprehensive Productivity Analysis',
      subtitle: 'Detailed Performance and Behavior Report',
      timeRange: productivityData.timeRange,
      sections: [
        {
          id: 'overview',
          title: 'Productivity Overview',
          type: SectionType.SUMMARY,
          content: this.generateProductivityOverview(productivityData)
        },
        {
          id: 'trends',
          title: 'Performance Trends',
          type: SectionType.CHART,
          content: productivityData.trends,
          charts: ['productivity-trend', 'efficiency-trend']
        },
        {
          id: 'behavior-analysis',
          title: 'Behavioral Patterns',
          type: SectionType.CHART,
          content: behaviorData,
          charts: ['activity-heatmap', 'focus-patterns']
        },
        {
          id: 'detailed-metrics',
          title: 'Detailed Metrics',
          type: SectionType.TABLE,
          content: this.generateDetailedMetricsTable(productivityData)
        }
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'Neural Flow AI',
        version: '1.0.0'
      }
    };

    return this.generateAnalyticsReport(reportData, options);
  }

  /**
   * Generate custom report from template
   */
  async generateCustomReport(
    template: ReportTemplate,
    data: any,
    options: ReportExportOptions
  ): Promise<Blob> {
    const reportData: ReportData = {
      title: template.name,
      timeRange: data.timeRange,
      sections: await this.processSectionsFromTemplate(template.sections, data),
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'Neural Flow AI',
        version: '1.0.0'
      }
    };

    return this.generateAnalyticsReport(reportData, { ...options, template });
  }

  // Private implementation methods

  private async generatePDFReport(
    reportData: ReportData,
    options: ReportExportOptions
  ): Promise<Blob> {
    // This would use a library like jsPDF or Puppeteer
    // For now, generate HTML and convert to PDF
    const htmlContent = await this.generateHTMLContent(reportData, options);
    
    // Mock PDF generation - in real implementation, use proper PDF library
    return new Blob([htmlContent], { type: 'application/pdf' });
  }

  private async generateHTMLReport(
    reportData: ReportData,
    options: ReportExportOptions
  ): Promise<Blob> {
    const htmlContent = await this.generateHTMLContent(reportData, options);
    return new Blob([htmlContent], { type: 'text/html' });
  }

  private async generateHTMLContent(
    reportData: ReportData,
    options: ReportExportOptions
  ): Promise<string> {
    const branding = options.branding || {};
    const primaryColor = branding.colors?.primary || '#3b82f6';
    const headingFont = branding.fonts?.heading || 'Inter, sans-serif';
    const bodyFont = branding.fonts?.body || 'Inter, sans-serif';

    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reportData.title}</title>
    <style>
        body {
            font-family: ${bodyFont};
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid ${primaryColor};
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            font-family: ${headingFont};
            color: ${primaryColor};
            margin: 0;
            font-size: 2.5em;
        }
        .header .subtitle {
            color: #666;
            font-size: 1.2em;
            margin-top: 10px;
        }
        .metadata {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        .section h2 {
            font-family: ${headingFont};
            color: ${primaryColor};
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .metric-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid ${primaryColor};
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: ${primaryColor};
        }
        .metric-label {
            color: #666;
            font-size: 0.9em;
        }
        .insights-list {
            list-style: none;
            padding: 0;
        }
        .insights-list li {
            background: #e3f2fd;
            margin: 10px 0;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #2196f3;
        }
        .recommendations-list {
            list-style: none;
            padding: 0;
        }
        .recommendations-list li {
            background: #e8f5e8;
            margin: 10px 0;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #4caf50;
        }
        .chart-placeholder {
            background: #f0f0f0;
            height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            margin: 20px 0;
            color: #666;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background: ${primaryColor};
            color: white;
        }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #666;
            font-size: 0.9em;
        }
        @media print {
            body { margin: 0; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        ${branding.logo ? `<img src="${branding.logo}" alt="Logo" style="max-height: 60px; margin-bottom: 20px;">` : ''}
        <h1>${reportData.title}</h1>
        ${reportData.subtitle ? `<div class="subtitle">${reportData.subtitle}</div>` : ''}
    </div>

    <div class="metadata">
        <strong>Report Period:</strong> ${new Date(reportData.timeRange.start).toLocaleDateString()} - ${new Date(reportData.timeRange.end).toLocaleDateString()}<br>
        <strong>Generated:</strong> ${new Date(reportData.metadata.generatedAt).toLocaleString()}<br>
        <strong>Version:</strong> ${reportData.metadata.version}
    </div>
`;

    // Add sections
    for (const section of reportData.sections) {
      html += await this.generateSectionHTML(section, options);
    }

    html += `
    <div class="footer">
        Generated by ${reportData.metadata.generatedBy} • ${branding.companyName || 'Neural Flow'}
    </div>
</body>
</html>`;

    return html;
  }

  private async generateSectionHTML(
    section: ReportSectionData,
    options: ReportExportOptions
  ): Promise<string> {
    let sectionHTML = `<div class="section">
        <h2>${section.title}</h2>`;

    switch (section.type) {
      case SectionType.SUMMARY:
        sectionHTML += `<div class="content">${section.content}</div>`;
        break;

      case SectionType.METRICS:
        sectionHTML += this.generateMetricsHTML(section.content);
        break;

      case SectionType.CHART:
        if (options.includeCharts && section.charts) {
          for (const chartId of section.charts) {
            sectionHTML += `<div class="chart-placeholder">Chart: ${chartId}</div>`;
          }
        }
        break;

      case SectionType.TABLE:
        sectionHTML += this.generateTableHTML(section.content);
        break;

      case SectionType.INSIGHTS:
        sectionHTML += this.generateInsightsHTML(section.content);
        break;

      case SectionType.RECOMMENDATIONS:
        sectionHTML += this.generateRecommendationsHTML(section.content);
        break;

      default:
        sectionHTML += `<div class="content">${JSON.stringify(section.content)}</div>`;
    }

    sectionHTML += '</div>';
    return sectionHTML;
  }

  private generateMetricsHTML(metrics: any): string {
    if (!metrics || typeof metrics !== 'object') return '';

    let html = '<div class="metrics-grid">';
    
    Object.entries(metrics).forEach(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      const formattedValue = typeof value === 'number' 
        ? (value < 1 ? (value * 100).toFixed(1) + '%' : value.toFixed(2))
        : String(value);

      html += `
        <div class="metric-card">
          <div class="metric-value">${formattedValue}</div>
          <div class="metric-label">${formattedKey}</div>
        </div>`;
    });

    html += '</div>';
    return html;
  }

  private generateTableHTML(data: any[]): string {
    if (!Array.isArray(data) || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    let html = '<table><thead><tr>';
    
    headers.forEach(header => {
      const formattedHeader = header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      html += `<th>${formattedHeader}</th>`;
    });
    
    html += '</tr></thead><tbody>';
    
    data.forEach(row => {
      html += '<tr>';
      headers.forEach(header => {
        const value = row[header];
        const formattedValue = typeof value === 'number' 
          ? value.toFixed(2)
          : String(value);
        html += `<td>${formattedValue}</td>`;
      });
      html += '</tr>';
    });
    
    html += '</tbody></table>';
    return html;
  }

  private generateInsightsHTML(insights: string[]): string {
    if (!Array.isArray(insights)) return '';

    let html = '<ul class="insights-list">';
    insights.forEach(insight => {
      html += `<li>${insight}</li>`;
    });
    html += '</ul>';
    return html;
  }

  private generateRecommendationsHTML(recommendations: string[]): string {
    if (!Array.isArray(recommendations)) return '';

    let html = '<ul class="recommendations-list">';
    recommendations.forEach(recommendation => {
      html += `<li>${recommendation}</li>`;
    });
    html += '</ul>';
    return html;
  }

  private async generateCSVReport(
    reportData: ReportData,
    options: ReportExportOptions
  ): Promise<Blob> {
    let csvContent = `Report: ${reportData.title}\n`;
    csvContent += `Generated: ${reportData.metadata.generatedAt}\n`;
    csvContent += `Period: ${reportData.timeRange.start} to ${reportData.timeRange.end}\n\n`;

    // Add sections data
    reportData.sections.forEach(section => {
      csvContent += `\n${section.title}\n`;
      
      if (section.type === SectionType.METRICS && typeof section.content === 'object') {
        csvContent += 'Metric,Value\n';
        Object.entries(section.content).forEach(([key, value]) => {
          csvContent += `${key},${value}\n`;
        });
      } else if (Array.isArray(section.content)) {
        section.content.forEach(item => {
          csvContent += `${typeof item === 'string' ? item : JSON.stringify(item)}\n`;
        });
      }
    });

    return new Blob([csvContent], { type: 'text/csv' });
  }

  private async generateJSONReport(
    reportData: ReportData,
    options: ReportExportOptions
  ): Promise<Blob> {
    const jsonContent = JSON.stringify(reportData, null, 2);
    return new Blob([jsonContent], { type: 'application/json' });
  }

  private async generateExcelReport(
    reportData: ReportData,
    options: ReportExportOptions
  ): Promise<Blob> {
    // This would use a library like SheetJS
    // For now, return CSV format
    return this.generateCSVReport(reportData, options);
  }

  // Helper methods for content generation

  private generateExecutiveSummaryContent(data: any, insights: string[]): string {
    return `
This executive summary provides a high-level overview of productivity performance and key insights derived from AI analysis.

Key Highlights:
• Overall productivity score: ${data.productivityScore ? (data.productivityScore * 100).toFixed(1) + '%' : 'N/A'}
• Primary trend: ${data.trend || 'Stable performance'}
• Critical insights identified: ${insights.length}
• Recommended actions: ${insights.filter((i: string) => i.includes('recommend')).length}

The analysis reveals significant opportunities for optimization and provides actionable recommendations for improved performance.
    `;
  }

  private extractKeyMetrics(data: any): any {
    return {
      productivityScore: data.productivityScore || 0,
      focusTime: data.focusTime || 0,
      efficiencyRatio: data.efficiencyRatio || 0,
      tasksCompleted: data.tasksCompleted || 0,
      collaborationIndex: data.collaborationIndex || 0,
      burnoutRisk: data.burnoutRisk || 0
    };
  }

  private generateRecommendations(data: any, insights: string[]): string[] {
    const recommendations = [
      'Maintain current successful productivity strategies',
      'Focus on high-impact optimization opportunities',
      'Implement regular performance monitoring',
      'Consider workflow automation for repetitive tasks'
    ];

    // Add insight-based recommendations
    if (data.burnoutRisk > 0.7) {
      recommendations.push('Implement stress management and workload balancing measures');
    }

    if (data.efficiencyRatio < 0.6) {
      recommendations.push('Review and optimize current work processes');
    }

    return recommendations;
  }

  private generateProductivityOverview(data: any): string {
    return `
This comprehensive productivity analysis examines performance across multiple dimensions including task completion, focus time, efficiency, and behavioral patterns.

Performance Summary:
The analysis covers ${data.period || 'the selected time period'} and includes detailed metrics on work patterns, productivity trends, and optimization opportunities.

Key Areas Analyzed:
• Task completion rates and efficiency
• Focus time and attention patterns  
• Collaboration and communication effectiveness
• Behavioral trends and work rhythms
• Burnout risk and wellbeing indicators
    `;
  }

  private generateDetailedMetricsTable(data: any): any[] {
    return [
      { metric: 'Productivity Score', value: data.productivityScore || 0, trend: 'up', target: 0.8 },
      { metric: 'Focus Time (hours)', value: data.focusTime || 0, trend: 'stable', target: 6 },
      { metric: 'Efficiency Ratio', value: data.efficiencyRatio || 0, trend: 'up', target: 0.85 },
      { metric: 'Tasks Completed', value: data.tasksCompleted || 0, trend: 'up', target: 20 },
      { metric: 'Collaboration Index', value: data.collaborationIndex || 0, trend: 'stable', target: 0.7 },
      { metric: 'Burnout Risk', value: data.burnoutRisk || 0, trend: 'down', target: 0.3 }
    ];
  }

  private async processSectionsFromTemplate(
    templateSections: ReportSection[],
    data: any
  ): Promise<ReportSectionData[]> {
    return templateSections.map(section => ({
      id: section.id,
      title: section.name,
      type: section.type,
      content: this.processTemplateContent(section.content, data),
      charts: section.content?.visualization ? [section.content.visualization] : undefined,
      insights: section.type === SectionType.INSIGHTS ? data.insights : undefined
    }));
  }

  private processTemplateContent(content: any, data: any): any {
    if (!content) return '';
    
    // Process template variables
    let processedContent = content.template || content.data || content;
    
    if (typeof processedContent === 'string') {
      // Replace template variables like {{variable}}
      processedContent = processedContent.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
        return data[variable] || match;
      });
    }
    
    return processedContent;
  }
}