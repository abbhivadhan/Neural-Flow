// Analytics-related Zod validation schemas
import { z } from 'zod';
import { 
  BaseEntitySchema, 
  UUIDSchema, 
  TimestampSchema, 
  MetadataSchema,
  TimeRangeSchema
} from './common';

// Enums
export const WidgetTypeSchema = z.enum(['metric', 'chart', 'table', 'heatmap', 'gauge', 'progress', 'list', 'map', 'calendar', 'timeline']);
export const DataSourceTypeSchema = z.enum(['database', 'api', 'file', 'stream', 'calculated', 'external']);
export const FilterOperatorSchema = z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'contains', 'not_contains', 'starts_with', 'ends_with', 'in', 'not_in', 'is_null', 'is_not_null']);
export const AggregationFunctionSchema = z.enum(['count', 'sum', 'avg', 'min', 'max', 'median', 'stddev', 'variance', 'distinct']);
export const TransformationTypeSchema = z.enum(['filter', 'map', 'reduce', 'group', 'join', 'pivot', 'unpivot', 'calculate', 'normalize', 'aggregate']);
export const ChartTypeSchema = z.enum(['line', 'bar', 'column', 'pie', 'donut', 'scatter', 'bubble', 'area', 'heatmap', 'treemap', 'sankey', 'funnel', 'gauge', 'radar']);
export const ScaleTypeSchema = z.enum(['linear', 'logarithmic', 'time', 'categorical', 'ordinal']);
export const InteractionTypeSchema = z.enum(['hover', 'click', 'zoom', 'pan', 'brush', 'crossfilter', 'drill_down', 'tooltip']);
export const ReportTypeSchema = z.enum(['productivity', 'performance', 'collaboration', 'insights', 'custom', 'executive', 'operational']);
export const ScheduleFrequencySchema = z.enum(['once', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly']);
export const SectionTypeSchema = z.enum(['header', 'summary', 'chart', 'table', 'text', 'image', 'metrics', 'insights', 'recommendations']);
export const ReportStatusSchema = z.enum(['draft', 'generating', 'completed', 'failed', 'cancelled']);
export const InsightTypeSchema = z.enum(['trend', 'anomaly', 'correlation', 'prediction', 'opportunity', 'risk', 'pattern']);
export const InsightCategorySchema = z.enum(['productivity', 'performance', 'collaboration', 'wellbeing', 'efficiency', 'quality', 'innovation']);
export const InsightSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const InsightStatusSchema = z.enum(['new', 'acknowledged', 'in_progress', 'resolved', 'dismissed']);

// Core schemas
export const WidgetPositionSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  z: z.number().optional(),
});

export const WidgetSizeSchema = z.object({
  width: z.number().min(1),
  height: z.number().min(1),
  minWidth: z.number().min(1).optional(),
  minHeight: z.number().min(1).optional(),
  maxWidth: z.number().min(1).optional(),
  maxHeight: z.number().min(1).optional(),
});

export const WidgetConfigurationSchema = z.object({
  refreshInterval: z.number().min(1),
  autoRefresh: z.boolean(),
  showLegend: z.boolean(),
  showTooltips: z.boolean(),
  allowDrillDown: z.boolean(),
  exportEnabled: z.boolean(),
  customSettings: MetadataSchema,
});

export const AuthenticationConfigSchema = z.object({
  type: z.enum(['none', 'basic', 'bearer', 'oauth', 'api_key']),
  credentials: MetadataSchema,
});

export const RetryPolicySchema = z.object({
  maxAttempts: z.number().min(1).max(10),
  backoffStrategy: z.enum(['linear', 'exponential']),
  initialDelay: z.number().min(0),
  maxDelay: z.number().min(0),
});

export const DataConnectionSchema = z.object({
  endpoint: z.string().url(),
  authentication: AuthenticationConfigSchema,
  headers: z.record(z.string()).optional(),
  timeout: z.number().min(1000),
  retryPolicy: RetryPolicySchema,
});

export const QueryFilterSchema = z.object({
  field: z.string().min(1),
  operator: FilterOperatorSchema,
  value: z.any(),
  condition: z.enum(['AND', 'OR']),
});

export const AggregationSchema = z.object({
  field: z.string().min(1),
  function: AggregationFunctionSchema,
  alias: z.string().optional(),
  groupBy: z.array(z.string()).optional(),
});

export const SortConfigSchema = z.object({
  field: z.string().min(1),
  direction: z.enum(['asc', 'desc']),
  priority: z.number().min(0),
});

export const DataQuerySchema = z.object({
  query: z.string().min(1),
  parameters: z.record(z.any()),
  timeRange: TimeRangeSchema.optional(),
  filters: z.array(QueryFilterSchema),
  aggregations: z.array(AggregationSchema),
  sorting: z.array(SortConfigSchema),
  limit: z.number().min(1).optional(),
});

export const DataTransformationSchema = z.object({
  type: TransformationTypeSchema,
  parameters: MetadataSchema,
  order: z.number().min(0),
});

export const InvalidationRuleSchema = z.object({
  trigger: z.enum(['time', 'data_change', 'manual']),
  condition: z.string().min(1),
  action: z.enum(['refresh', 'clear']),
});

export const CacheConfigSchema = z.object({
  enabled: z.boolean(),
  ttl: z.number().min(0),
  strategy: z.enum(['memory', 'disk', 'redis']),
  invalidationRules: z.array(InvalidationRuleSchema),
});

export const DataSourceSchema = z.object({
  id: UUIDSchema,
  type: DataSourceTypeSchema,
  connection: DataConnectionSchema,
  query: DataQuerySchema,
  transformations: z.array(DataTransformationSchema),
  cache: CacheConfigSchema,
});

export const AxisConfigSchema = z.object({
  type: z.enum(['x', 'y', 'z']),
  field: z.string().min(1),
  label: z.string().min(1),
  scale: ScaleTypeSchema,
  range: z.tuple([z.number(), z.number()]).optional(),
  format: z.string(),
  gridLines: z.boolean(),
  tickInterval: z.number().optional(),
});

export const MarkerConfigSchema = z.object({
  enabled: z.boolean(),
  shape: z.enum(['circle', 'square', 'triangle', 'diamond']),
  size: z.number().min(1),
  color: z.string().optional(),
});

export const LabelConfigSchema = z.object({
  enabled: z.boolean(),
  position: z.enum(['top', 'bottom', 'left', 'right', 'center']),
  format: z.string(),
  rotation: z.number().optional(),
});

export const ColorStopSchema = z.object({
  offset: z.number().min(0).max(1),
  color: z.string(),
});

export const GradientConfigSchema = z.object({
  type: z.enum(['linear', 'radial']),
  stops: z.array(ColorStopSchema),
  direction: z.number().optional(),
});

export const SeriesStyleSchema = z.object({
  lineWidth: z.number().min(0).optional(),
  fillOpacity: z.number().min(0).max(1).optional(),
  strokeDashArray: z.string().optional(),
  gradient: GradientConfigSchema.optional(),
});

export const SeriesConfigSchema = z.object({
  name: z.string().min(1),
  field: z.string().min(1),
  type: ChartTypeSchema,
  color: z.string().optional(),
  style: SeriesStyleSchema,
  markers: MarkerConfigSchema,
  labels: LabelConfigSchema,
});

export const ColorSchemeSchema = z.object({
  type: z.enum(['categorical', 'sequential', 'diverging']),
  colors: z.array(z.string()),
  customPalette: z.array(z.string()).optional(),
});

export const PaddingSchema = z.object({
  top: z.number().min(0),
  right: z.number().min(0),
  bottom: z.number().min(0),
  left: z.number().min(0),
});

export const MarginSchema = z.object({
  top: z.number().min(0),
  right: z.number().min(0),
  bottom: z.number().min(0),
  left: z.number().min(0),
});

export const FontConfigSchema = z.object({
  family: z.string().min(1),
  size: z.number().min(8),
  weight: z.enum(['normal', 'bold', 'lighter', 'bolder']),
  style: z.enum(['normal', 'italic', 'oblique']),
  color: z.string(),
});

export const ChartStylingSchema = z.object({
  backgroundColor: z.string(),
  borderColor: z.string(),
  borderWidth: z.number().min(0),
  borderRadius: z.number().min(0),
  padding: PaddingSchema,
  margin: MarginSchema,
  font: FontConfigSchema,
});

export const ChartInteractionSchema = z.object({
  type: InteractionTypeSchema,
  enabled: z.boolean(),
  configuration: MetadataSchema,
});

export const VisualizationConfigSchema = z.object({
  chartType: ChartTypeSchema,
  axes: z.array(AxisConfigSchema),
  series: z.array(SeriesConfigSchema),
  colors: ColorSchemeSchema,
  styling: ChartStylingSchema,
  interactions: z.array(ChartInteractionSchema),
});

export const WidgetInteractionSchema = z.object({
  type: z.enum(['filter', 'highlight', 'navigate', 'export']),
  target: z.array(UUIDSchema),
  configuration: MetadataSchema,
});

export const DashboardWidgetSchema = z.object({
  id: UUIDSchema,
  type: WidgetTypeSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  position: WidgetPositionSchema,
  size: WidgetSizeSchema,
  configuration: WidgetConfigurationSchema,
  dataSource: DataSourceSchema,
  visualization: VisualizationConfigSchema,
  interactions: z.array(WidgetInteractionSchema),
  lastUpdated: TimestampSchema,
});

export const BreakpointSchema = z.object({
  name: z.string().min(1),
  width: z.number().min(1),
  columns: z.number().min(1),
  layouts: z.record(WidgetPositionSchema.merge(WidgetSizeSchema)),
});

export const DashboardLayoutSchema = z.object({
  type: z.enum(['grid', 'freeform', 'tabs', 'accordion']),
  columns: z.number().min(1),
  rowHeight: z.number().min(1),
  gap: z.number().min(0),
  responsive: z.boolean(),
  breakpoints: z.array(BreakpointSchema),
});

export const FilterValueSchema = z.object({
  label: z.string().min(1),
  value: z.any(),
  count: z.number().min(0).optional(),
  selected: z.boolean(),
});

export const DashboardFilterSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(100),
  type: z.enum(['dropdown', 'multiselect', 'date_range', 'slider', 'text', 'checkbox', 'radio']),
  field: z.string().min(1),
  values: z.array(FilterValueSchema),
  defaultValue: z.any().optional(),
  required: z.boolean(),
  cascading: z.boolean(),
  dependencies: z.array(UUIDSchema),
});

export const AnalyticsDashboardSchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(200),
  description: z.string().max(1000),
  owner: UUIDSchema,
  widgets: z.array(DashboardWidgetSchema),
  layout: DashboardLayoutSchema,
  filters: z.array(DashboardFilterSchema),
  refreshRate: z.number().min(1),
  isPublic: z.boolean(),
  tags: z.array(z.string().min(1).max(50)),
  lastViewed: TimestampSchema,
});

export const InsightImpactSchema = z.object({
  scope: z.enum(['individual', 'team', 'organization']),
  magnitude: z.enum(['small', 'medium', 'large']),
  timeframe: z.enum(['immediate', 'short_term', 'long_term']),
  metrics: z.array(z.string()),
});

export const RecommendationActionSchema = z.object({
  description: z.string().min(1).max(500),
  type: z.enum(['manual', 'automated', 'hybrid']),
  assignee: UUIDSchema.optional(),
  dueDate: TimestampSchema.optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped']),
});

export const RecommendationSchema = z.object({
  id: UUIDSchema,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  priority: z.enum(['low', 'medium', 'high']),
  impact: z.enum(['low', 'medium', 'high']),
  effort: z.enum(['low', 'medium', 'high']),
  actions: z.array(RecommendationActionSchema),
  timeline: z.number().min(1),
  dependencies: z.array(UUIDSchema),
});

export const TrendDataPointSchema = z.object({
  timestamp: TimestampSchema,
  value: z.number(),
  metadata: MetadataSchema.optional(),
});

export const TrendDataSchema = z.object({
  metric: z.string().min(1),
  values: z.array(TrendDataPointSchema),
  direction: z.enum(['up', 'down', 'stable']),
  changeRate: z.number(),
  significance: z.number().min(0).max(1),
});

export const ComparisonDataSchema = z.object({
  metric: z.string().min(1),
  current: z.number(),
  previous: z.number(),
  benchmark: z.number().optional(),
  percentChange: z.number(),
  significance: z.number().min(0).max(1),
});

export const CorrelationDataSchema = z.object({
  metric1: z.string().min(1),
  metric2: z.string().min(1),
  coefficient: z.number().min(-1).max(1),
  pValue: z.number().min(0).max(1),
  strength: z.enum(['weak', 'moderate', 'strong']),
  direction: z.enum(['positive', 'negative']),
});

export const SegmentDataSchema = z.object({
  dimension: z.string().min(1),
  segments: z.array(z.object({
    name: z.string().min(1),
    value: z.number(),
    percentage: z.number().min(0).max(100),
  })),
  insights: z.array(z.string()),
});

export const InsightDataSchema = z.object({
  metrics: z.record(z.number()),
  trends: z.array(TrendDataSchema),
  comparisons: z.array(ComparisonDataSchema),
  correlations: z.array(CorrelationDataSchema),
  segments: z.array(SegmentDataSchema),
});

export const InsightFeedbackSchema = z.object({
  userId: UUIDSchema,
  rating: z.number().min(1).max(5),
  helpful: z.boolean(),
  comment: z.string().max(1000).optional(),
  timestamp: TimestampSchema,
});

export const InsightSchema = BaseEntitySchema.extend({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  type: InsightTypeSchema,
  category: InsightCategorySchema,
  severity: InsightSeveritySchema,
  confidence: z.number().min(0).max(1),
  impact: InsightImpactSchema,
  recommendations: z.array(RecommendationSchema),
  data: InsightDataSchema,
  visualization: VisualizationConfigSchema.optional(),
  status: InsightStatusSchema,
  feedback: z.array(InsightFeedbackSchema),
});

// Validation functions
export const validateAnalyticsDashboard = (data: unknown) => AnalyticsDashboardSchema.safeParse(data);
export const validateDashboardWidget = (data: unknown) => DashboardWidgetSchema.safeParse(data);
export const validateInsight = (data: unknown) => InsightSchema.safeParse(data);
export const validateVisualizationConfig = (data: unknown) => VisualizationConfigSchema.safeParse(data);

// Partial schemas for updates
export const AnalyticsDashboardUpdateSchema = AnalyticsDashboardSchema.partial();
export const DashboardWidgetUpdateSchema = DashboardWidgetSchema.partial();
export const InsightUpdateSchema = InsightSchema.partial();