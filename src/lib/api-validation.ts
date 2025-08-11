/**
 * API validation schemas and utilities
 */

import { z } from 'zod';
import { sanitizeInput } from './security';

// Common validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const searchSchema = z.object({
  q: z
    .string()
    .min(1)
    .max(200)
    .transform((val) => sanitizeInput(val, 200)),
  category: z
    .string()
    .max(100)
    .optional()
    .transform((val) => (val ? sanitizeInput(val, 100) : undefined)),
  tags: z
    .string()
    .max(500)
    .optional()
    .transform((val) =>
      val
        ? val
            .split(',')
            .map((tag) => sanitizeInput(tag.trim(), 50))
            .filter(Boolean)
        : []
    ),
});

export const slugSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(200, 'Slug too long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')
    .transform((val) => sanitizeInput(val, 200)),
});

// Article validation schemas
export const createArticleSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .transform((val) => sanitizeInput(val, 200)),
  slug: z
    .string()
    .max(200, 'Slug too long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')
    .optional()
    .transform((val) => (val ? sanitizeInput(val, 200) : undefined)),
  summary: z
    .string()
    .max(500, 'Summary too long')
    .optional()
    .transform((val) => (val ? sanitizeInput(val, 500) : undefined)),
  content: z
    .string()
    .min(1, 'Content is required')
    .refine((val) => {
      try {
        const parsed = JSON.parse(val);
        return parsed && typeof parsed === 'object' && parsed.type === 'doc';
      } catch {
        return false;
      }
    }, 'Content must be valid Tiptap JSON'),
  image: z
    .string()
    .url('Invalid image URL')
    .optional()
    .refine((val) => {
      if (!val) return true;
      return (
        val.includes('cloudinary.com') || val.includes('res.cloudinary.com')
      );
    }, 'Image must be from Cloudinary'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  authorId: z.string().uuid('Invalid author ID'),
  categoryId: z.string().uuid('Invalid category ID'),
  tagIds: z.array(z.string().uuid('Invalid tag ID')).default([]),
});

export const updateArticleSchema = createArticleSchema.partial().extend({
  id: z.string().uuid('Invalid article ID'),
});

// Query parameter validation
export const articlesQuerySchema = paginationSchema.extend({
  category: z
    .string()
    .max(100)
    .optional()
    .transform((val) => (val ? sanitizeInput(val, 100) : undefined)),
  tags: z
    .string()
    .max(500)
    .optional()
    .transform((val) =>
      val
        ? val
            .split(',')
            .map((tag) => sanitizeInput(tag.trim(), 50))
            .filter(Boolean)
        : []
    ),
  search: z
    .string()
    .max(200)
    .optional()
    .transform((val) => (val ? sanitizeInput(val, 200) : undefined)),
});

export const searchQuerySchema = paginationSchema.merge(searchSchema);

// Validation helper functions
export function validatePagination(searchParams: URLSearchParams) {
  return paginationSchema.parse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
  });
}

export function validateSearch(searchParams: URLSearchParams) {
  return searchQuerySchema.parse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    q: searchParams.get('q'),
    category: searchParams.get('category'),
    tags: searchParams.get('tags'),
  });
}

export function validateArticlesQuery(searchParams: URLSearchParams) {
  return articlesQuerySchema.parse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    category: searchParams.get('category'),
    tags: searchParams.get('tags'),
    search: searchParams.get('search'),
  });
}

export function validateSlug(slug: string) {
  return slugSchema.parse({ slug }).slug;
}

// Error response helpers
export function createValidationErrorResponse(error: z.ZodError) {
  return {
    error: 'Validation failed',
    details: error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
  };
}

// Type exports
export type CreateArticleData = z.infer<typeof createArticleSchema>;
export type UpdateArticleData = z.infer<typeof updateArticleSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type SearchParams = z.infer<typeof searchQuerySchema>;
export type ArticlesQueryParams = z.infer<typeof articlesQuerySchema>;
