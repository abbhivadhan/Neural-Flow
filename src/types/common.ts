// Common types used across the application

export type UUID = string;
export type Timestamp = Date;
export type Duration = number; // in milliseconds

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export interface BaseEntity {
  id: UUID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Metadata {
  [key: string]: any;
}

export interface TimeRange {
  start: Timestamp;
  end: Timestamp;
}

export interface Coordinates {
  x: number;
  y: number;
  z?: number;
}

export interface Color {
  hex: string;
  rgb: [number, number, number];
  hsl: [number, number, number];
}

export interface Theme {
  primary: Color;
  secondary: Color;
  accent: Color;
  background: Color;
  text: Color;
  isDark: boolean;
}