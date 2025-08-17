// Common Zod validation schemas
import { z } from 'zod';

// Basic types
export const UUIDSchema = z.string().uuid();
export const TimestampSchema = z.date();
export const DurationSchema = z.number().positive();

// Enums
export const PrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
export const StatusSchema = z.enum(['active', 'inactive', 'pending', 'completed', 'archived']);

// Base entity schema
export const BaseEntitySchema = z.object({
  id: UUIDSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// Common structures
export const MetadataSchema = z.record(z.any());

export const TimeRangeSchema = z.object({
  start: TimestampSchema,
  end: TimestampSchema,
});

export const CoordinatesSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number().optional(),
});

export const ColorSchema = z.object({
  hex: z.string().regex(/^#[0-9A-F]{6}$/i),
  rgb: z.tuple([z.number().min(0).max(255), z.number().min(0).max(255), z.number().min(0).max(255)]),
  hsl: z.tuple([z.number().min(0).max(360), z.number().min(0).max(100), z.number().min(0).max(100)]),
});

export const ThemeSchema = z.object({
  primary: ColorSchema,
  secondary: ColorSchema,
  accent: ColorSchema,
  background: ColorSchema,
  text: ColorSchema,
  isDark: z.boolean(),
});

// Validation helpers
export const validateUUID = (value: string): boolean => {
  return UUIDSchema.safeParse(value).success;
};

export const validateEmail = z.string().email();
export const validateURL = z.string().url();
export const validatePhoneNumber = z.string().regex(/^\+?[1-9]\d{1,14}$/);

// Common validation functions
export const createPaginationSchema = (maxLimit = 100) => z.object({
  offset: z.number().min(0).default(0),
  limit: z.number().min(1).max(maxLimit).default(20),
});

export const createSortSchema = <T extends string>(fields: readonly T[]) => z.object({
  field: z.enum(fields as [T, ...T[]]),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

export const createDateRangeSchema = () => z.object({
  start: TimestampSchema.optional(),
  end: TimestampSchema.optional(),
}).refine(data => !data.start || !data.end || data.start <= data.end, {
  message: "Start date must be before or equal to end date",
  path: ["start"],
});