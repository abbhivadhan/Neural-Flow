/**
 * Types for AI-powered content generation system
 */

export interface ContentGenerationRequest {
  prompt: string;
  type: ContentType;
  style?: WritingStyle;
  context?: ContentContext;
  maxLength?: number;
  temperature?: number;
}

export interface ContentGenerationResponse {
  content: string;
  confidence: number;
  metadata: ContentMetadata;
  suggestions?: string[];
}

export interface ContentEnhancementRequest {
  originalContent: string;
  enhancementType: EnhancementType[];
  targetAudience?: string;
  tone?: WritingTone;
}

export interface ContentEnhancementResponse {
  enhancedContent: string;
  improvements: ContentImprovement[];
  qualityScore: number;
}

export interface VisualGenerationRequest {
  data: any[];
  chartType: ChartType;
  title?: string;
  description?: string;
  theme?: VisualTheme;
}

export interface VisualGenerationResponse {
  svg: string;
  config: ChartConfiguration;
  insights: DataInsight[];
}

export interface WritingStyle {
  tone: WritingTone;
  formality: FormalityLevel;
  vocabulary: VocabularyLevel;
  structure: StructurePreference;
  voice: VoiceType;
}

export interface ContentContext {
  domain: string;
  audience: string;
  purpose: ContentPurpose;
  relatedDocuments?: string[];
  keywords?: string[];
}

export interface ContentMetadata {
  generatedAt: Date;
  modelUsed: string;
  processingTime: number;
  wordCount: number;
  readabilityScore: number;
}

export interface ContentImprovement {
  type: ImprovementType;
  description: string;
  originalText: string;
  improvedText: string;
  confidence: number;
}

export interface DataInsight {
  type: InsightType;
  description: string;
  significance: number;
  recommendation?: string;
}

export interface ChartConfiguration {
  width: number;
  height: number;
  margins: Margins;
  colors: string[];
  animations: boolean;
}

// Enums
export enum ContentType {
  ARTICLE = 'article',
  EMAIL = 'email',
  SUMMARY = 'summary',
  PRESENTATION = 'presentation',
  DOCUMENTATION = 'documentation',
  CREATIVE = 'creative',
  TECHNICAL = 'technical',
  MARKETING = 'marketing'
}

export enum WritingTone {
  PROFESSIONAL = 'professional',
  CASUAL = 'casual',
  FRIENDLY = 'friendly',
  AUTHORITATIVE = 'authoritative',
  PERSUASIVE = 'persuasive',
  INFORMATIVE = 'informative',
  CREATIVE = 'creative',
  TECHNICAL = 'technical'
}

export enum FormalityLevel {
  VERY_FORMAL = 'very_formal',
  FORMAL = 'formal',
  NEUTRAL = 'neutral',
  INFORMAL = 'informal',
  VERY_INFORMAL = 'very_informal'
}

export enum VocabularyLevel {
  SIMPLE = 'simple',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum StructurePreference {
  LINEAR = 'linear',
  HIERARCHICAL = 'hierarchical',
  NARRATIVE = 'narrative',
  ANALYTICAL = 'analytical'
}

export enum VoiceType {
  FIRST_PERSON = 'first_person',
  SECOND_PERSON = 'second_person',
  THIRD_PERSON = 'third_person',
  PASSIVE = 'passive'
}

export enum ContentPurpose {
  INFORM = 'inform',
  PERSUADE = 'persuade',
  ENTERTAIN = 'entertain',
  INSTRUCT = 'instruct',
  ANALYZE = 'analyze',
  SUMMARIZE = 'summarize'
}

export enum EnhancementType {
  GRAMMAR = 'grammar',
  STYLE = 'style',
  CLARITY = 'clarity',
  CONCISENESS = 'conciseness',
  ENGAGEMENT = 'engagement',
  SEO = 'seo',
  ACCESSIBILITY = 'accessibility'
}

export enum ImprovementType {
  GRAMMAR_FIX = 'grammar_fix',
  STYLE_IMPROVEMENT = 'style_improvement',
  CLARITY_ENHANCEMENT = 'clarity_enhancement',
  WORD_CHOICE = 'word_choice',
  STRUCTURE_OPTIMIZATION = 'structure_optimization',
  TONE_ADJUSTMENT = 'tone_adjustment'
}

export enum ChartType {
  BAR = 'bar',
  LINE = 'line',
  PIE = 'pie',
  SCATTER = 'scatter',
  AREA = 'area',
  HISTOGRAM = 'histogram',
  HEATMAP = 'heatmap',
  TREEMAP = 'treemap',
  SANKEY = 'sankey',
  NETWORK = 'network'
}

export enum VisualTheme {
  LIGHT = 'light',
  DARK = 'dark',
  COLORFUL = 'colorful',
  MINIMAL = 'minimal',
  PROFESSIONAL = 'professional'
}

export enum InsightType {
  TREND = 'trend',
  OUTLIER = 'outlier',
  CORRELATION = 'correlation',
  PATTERN = 'pattern',
  ANOMALY = 'anomaly',
  PREDICTION = 'prediction'
}

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}