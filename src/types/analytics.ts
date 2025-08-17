// Analytics and insights related type definitions
import { BaseEntity, UUID, Timestamp, Metadata, TimeRange } from './common';

export interface AnalyticsDashboard extends BaseEntity {
  name: string;
  description: string;
  owner: UUID;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  filters: DashboardFilter[];
  refreshRate: number; // seconds
  isPublic: boolean;
  tags: string[];
  lastViewed: Timestamp;
}

export interface DashboardWidget {
  id: UUID;
  type: WidgetType;
  title: string;
  description?: string;
  position: WidgetPosition;
  size: WidgetSize;
  configuration: WidgetConfiguration;
  dataSource: DataSource;
  visualization: VisualizationConfig;
  interactions: WidgetInteraction[];
  lastUpdated: Timestamp;
}

export enum WidgetType {
  METRIC = 'metric',
  CHART = 'chart',
  TABLE = 'table',
  HEATMAP = 'heatmap',
  GAUGE = 'gauge',
  PROGRESS = 'progress',
  LIST = 'list',
  MAP = 'map',
  CALENDAR = 'calendar',
  TIMELINE = 'timeline'
}

export interface WidgetPosition {
  x: number;
  y: number;
  z?: number;
}

export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface WidgetConfiguration {
  refreshInterval: number;
  autoRefresh: boolean;
  showLegend: boolean;
  showTooltips: boolean;
  allowDrillDown: boolean;
  exportEnabled: boolean;
  customSettings: Metadata;
}

export interface DataSource {
  id: UUID;
  type: DataSourceType;
  connection: DataConnection;
  query: DataQuery;
  transformations: DataTransformation[];
  cache: CacheConfig;
}

export enum DataSourceType {
  DATABASE = 'database',
  API = 'api',
  FILE = 'file',
  STREAM = 'stream',
  CALCULATED = 'calculated',
  EXTERNAL = 'external'
}

export interface DataConnection {
  endpoint: string;
  authentication: AuthenticationConfig;
  headers?: { [key: string]: string };
  timeout: number;
  retryPolicy: RetryPolicy;
}

export interface AuthenticationConfig {
  type: 'none' | 'basic' | 'bearer' | 'oauth' | 'api_key';
  credentials: Metadata;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential';
  initialDelay: number;
  maxDelay: number;
}

export interface DataQuery {
  query: string;
  parameters: { [key: string]: any };
  timeRange?: TimeRange;
  filters: QueryFilter[];
  aggregations: Aggregation[];
  sorting: SortConfig[];
  limit?: number;
}

export interface QueryFilter {
  field: string;
  operator: FilterOperator;
  value: any;
  condition: 'AND' | 'OR';
}

export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_EQUAL = 'greater_equal',
  LESS_EQUAL = 'less_equal',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IN = 'in',
  NOT_IN = 'not_in',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null'
}

export interface Aggregation {
  field: string;
  function: AggregationFunction;
  alias?: string;
  groupBy?: string[];
}

export enum AggregationFunction {
  COUNT = 'count',
  SUM = 'sum',
  AVG = 'avg',
  MIN = 'min',
  MAX = 'max',
  MEDIAN = 'median',
  STDDEV = 'stddev',
  VARIANCE = 'variance',
  DISTINCT = 'distinct'
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
  priority: number;
}

export interface DataTransformation {
  type: TransformationType;
  parameters: Metadata;
  order: number;
}

export enum TransformationType {
  FILTER = 'filter',
  MAP = 'map',
  REDUCE = 'reduce',
  GROUP = 'group',
  JOIN = 'join',
  PIVOT = 'pivot',
  UNPIVOT = 'unpivot',
  CALCULATE = 'calculate',
  NORMALIZE = 'normalize',
  AGGREGATE = 'aggregate'
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // seconds
  strategy: 'memory' | 'disk' | 'redis';
  invalidationRules: InvalidationRule[];
}

export interface InvalidationRule {
  trigger: 'time' | 'data_change' | 'manual';
  condition: string;
  action: 'refresh' | 'clear';
}

export interface VisualizationConfig {
  chartType: ChartType;
  axes: AxisConfig[];
  series: SeriesConfig[];
  colors: ColorScheme;
  styling: ChartStyling;
  interactions: ChartInteraction[];
}

export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  COLUMN = 'column',
  PIE = 'pie',
  DONUT = 'donut',
  SCATTER = 'scatter',
  BUBBLE = 'bubble',
  AREA = 'area',
  HEATMAP = 'heatmap',
  TREEMAP = 'treemap',
  SANKEY = 'sankey',
  FUNNEL = 'funnel',
  GAUGE = 'gauge',
  RADAR = 'radar'
}

export interface AxisConfig {
  type: 'x' | 'y' | 'z';
  field: string;
  label: string;
  scale: ScaleType;
  range?: [number, number];
  format: string;
  gridLines: boolean;
  tickInterval?: number;
}

export enum ScaleType {
  LINEAR = 'linear',
  LOGARITHMIC = 'logarithmic',
  TIME = 'time',
  CATEGORICAL = 'categorical',
  ORDINAL = 'ordinal'
}

export interface SeriesConfig {
  name: string;
  field: string;
  type: ChartType;
  color?: string;
  style: SeriesStyle;
  markers: MarkerConfig;
  labels: LabelConfig;
}

export interface SeriesStyle {
  lineWidth?: number;
  fillOpacity?: number;
  strokeDashArray?: string;
  gradient?: GradientConfig;
}

export interface MarkerConfig {
  enabled: boolean;
  shape: 'circle' | 'square' | 'triangle' | 'diamond';
  size: number;
  color?: string;
}

export interface LabelConfig {
  enabled: boolean;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  format: string;
  rotation?: number;
}

export interface GradientConfig {
  type: 'linear' | 'radial';
  stops: ColorStop[];
  direction?: number;
}

export interface ColorStop {
  offset: number;
  color: string;
}

export interface ColorScheme {
  type: 'categorical' | 'sequential' | 'diverging';
  colors: string[];
  customPalette?: string[];
}

export interface ChartStyling {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  padding: Padding;
  margin: Margin;
  font: FontConfig;
}

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface FontConfig {
  family: string;
  size: number;
  weight: 'normal' | 'bold' | 'lighter' | 'bolder';
  style: 'normal' | 'italic' | 'oblique';
  color: string;
}

export interface ChartInteraction {
  type: InteractionType;
  enabled: boolean;
  configuration: Metadata;
}

export enum InteractionType {
  HOVER = 'hover',
  CLICK = 'click',
  ZOOM = 'zoom',
  PAN = 'pan',
  BRUSH = 'brush',
  CROSSFILTER = 'crossfilter',
  DRILL_DOWN = 'drill_down',
  TOOLTIP = 'tooltip'
}

export interface WidgetInteraction {
  type: 'filter' | 'highlight' | 'navigate' | 'export';
  target: UUID[];
  configuration: Metadata;
}

export interface DashboardLayout {
  type: 'grid' | 'freeform' | 'tabs' | 'accordion';
  columns: number;
  rowHeight: number;
  gap: number;
  responsive: boolean;
  breakpoints: Breakpoint[];
}

export interface Breakpoint {
  name: string;
  width: number;
  columns: number;
  layouts: { [widgetId: string]: WidgetPosition & WidgetSize };
}

export interface DashboardFilter {
  id: UUID;
  name: string;
  type: FilterType;
  field: string;
  values: FilterValue[];
  defaultValue?: any;
  required: boolean;
  cascading: boolean;
  dependencies: UUID[];
}

export enum FilterType {
  DROPDOWN = 'dropdown',
  MULTISELECT = 'multiselect',
  DATE_RANGE = 'date_range',
  SLIDER = 'slider',
  TEXT = 'text',
  CHECKBOX = 'checkbox',
  RADIO = 'radio'
}

export interface FilterValue {
  label: string;
  value: any;
  count?: number;
  selected: boolean;
}

export interface AnalyticsReport extends BaseEntity {
  name: string;
  description: string;
  type: ReportType;
  schedule: ReportSchedule;
  recipients: ReportRecipient[];
  template: ReportTemplate;
  data: ReportData;
  status: ReportStatus;
  lastGenerated: Timestamp;
  nextGeneration: Timestamp;
}

export enum ReportType {
  PRODUCTIVITY = 'productivity',
  PERFORMANCE = 'performance',
  COLLABORATION = 'collaboration',
  INSIGHTS = 'insights',
  CUSTOM = 'custom',
  EXECUTIVE = 'executive',
  OPERATIONAL = 'operational'
}

export interface ReportSchedule {
  frequency: ScheduleFrequency;
  time: string; // HH:MM
  timezone: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  enabled: boolean;
}

export enum ScheduleFrequency {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export interface ReportRecipient {
  userId: UUID;
  email: string;
  deliveryMethod: 'email' | 'dashboard' | 'api' | 'webhook';
  format: 'pdf' | 'html' | 'csv' | 'json';
  customization: ReportCustomization;
}

export interface ReportCustomization {
  sections: string[];
  filters: { [key: string]: any };
  branding: BrandingConfig;
  language: string;
}

export interface BrandingConfig {
  logo?: string;
  colors: ColorScheme;
  fonts: FontConfig;
  header?: string;
  footer?: string;
}

export interface ReportTemplate {
  id: UUID;
  name: string;
  sections: ReportSection[];
  styling: ReportStyling;
  variables: ReportVariable[];
}

export interface ReportSection {
  id: UUID;
  name: string;
  type: SectionType;
  content: SectionContent;
  order: number;
  conditional?: ConditionalRule;
}

export enum SectionType {
  HEADER = 'header',
  SUMMARY = 'summary',
  CHART = 'chart',
  TABLE = 'table',
  TEXT = 'text',
  IMAGE = 'image',
  METRICS = 'metrics',
  INSIGHTS = 'insights',
  RECOMMENDATIONS = 'recommendations'
}

export interface SectionContent {
  title?: string;
  description?: string;
  data?: any;
  visualization?: VisualizationConfig;
  template?: string;
  parameters?: Metadata;
}

export interface ConditionalRule {
  condition: string;
  showIf: boolean;
  parameters: Metadata;
}

export interface ReportStyling {
  pageSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margins: Margin;
  fonts: FontConfig;
  colors: ColorScheme;
  theme: 'light' | 'dark' | 'custom';
}

export interface ReportVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  defaultValue: any;
  description: string;
}

export interface ReportData {
  generatedAt: Timestamp;
  timeRange: TimeRange;
  filters: { [key: string]: any };
  sections: { [sectionId: string]: any };
  metadata: ReportMetadata;
}

export interface ReportMetadata {
  version: string;
  generator: string;
  executionTime: number;
  dataFreshness: Timestamp;
  warnings: string[];
  errors: string[];
}

export enum ReportStatus {
  DRAFT = 'draft',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface Insight extends BaseEntity {
  title: string;
  description: string;
  type: InsightType;
  category: InsightCategory;
  severity: InsightSeverity;
  confidence: number; // 0-1
  impact: InsightImpact;
  recommendations: Recommendation[];
  data: InsightData;
  visualization?: VisualizationConfig;
  status: InsightStatus;
  feedback: InsightFeedback[];
}

export enum InsightType {
  TREND = 'trend',
  ANOMALY = 'anomaly',
  CORRELATION = 'correlation',
  PREDICTION = 'prediction',
  OPPORTUNITY = 'opportunity',
  RISK = 'risk',
  PATTERN = 'pattern'
}

export enum InsightCategory {
  PRODUCTIVITY = 'productivity',
  PERFORMANCE = 'performance',
  COLLABORATION = 'collaboration',
  WELLBEING = 'wellbeing',
  EFFICIENCY = 'efficiency',
  QUALITY = 'quality',
  INNOVATION = 'innovation'
}

export enum InsightSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface InsightImpact {
  scope: 'individual' | 'team' | 'organization';
  magnitude: 'small' | 'medium' | 'large';
  timeframe: 'immediate' | 'short_term' | 'long_term';
  metrics: string[];
}

export interface Recommendation {
  id: UUID;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  actions: RecommendationAction[];
  timeline: number; // days
  dependencies: UUID[];
}

export interface RecommendationAction {
  description: string;
  type: 'manual' | 'automated' | 'hybrid';
  assignee?: UUID;
  dueDate?: Timestamp;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

export interface InsightData {
  metrics: { [key: string]: number };
  trends: TrendData[];
  comparisons: ComparisonData[];
  correlations: CorrelationData[];
  segments: SegmentData[];
}

export interface TrendData {
  metric: string;
  values: { timestamp: Timestamp; value: number }[];
  direction: 'up' | 'down' | 'stable';
  changeRate: number;
  significance: number;
}

export interface ComparisonData {
  metric: string;
  current: number;
  previous: number;
  benchmark?: number;
  percentChange: number;
  significance: number;
}

export interface CorrelationData {
  metric1: string;
  metric2: string;
  coefficient: number;
  pValue: number;
  strength: 'weak' | 'moderate' | 'strong';
  direction: 'positive' | 'negative';
}

export interface SegmentData {
  dimension: string;
  segments: { name: string; value: number; percentage: number }[];
  insights: string[];
}

export enum InsightStatus {
  NEW = 'new',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

export interface InsightFeedback {
  userId: UUID;
  rating: number; // 1-5
  helpful: boolean;
  comment?: string;
  timestamp: Timestamp;
}