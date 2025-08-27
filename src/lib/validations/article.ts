import { z } from 'zod';

// Consistent slug validation schema
export const slugSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must contain only lowercase letters, numbers, and hyphens'
  )
  .min(1, 'Slug is required')
  .max(100, 'Slug must be less than 100 characters');

// Content validation schema for Tiptap JSON
export const contentSchema = z
  .string()
  .min(1, 'Content is required')
  .refine((val) => {
    try {
      const parsed = JSON.parse(val);
      return (
        parsed &&
        typeof parsed === 'object' &&
        parsed.type === 'doc' &&
        Array.isArray(parsed.content)
      );
    } catch {
      return false;
    }
  }, 'Content must be valid Tiptap JSON with type "doc" and content array');

export const articleFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  slug: slugSchema.optional(),
  summary: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length <= 500,
      'Summary must be less than 500 characters'
    ),
  content: contentSchema,
  image: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  authorId: z.string().min(1, 'Author is required'),
  categoryId: z.string().min(1, 'Category is required'),
  tagIds: z.array(z.string()).default([]),
});

export type ArticleFormData = z.infer<typeof articleFormSchema>;

export const generateSlugFromTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export const validateSlug = (slug: string): boolean => {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
};

// Create article schema for API routes
export const createArticleSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  slug: slugSchema.optional(),
  summary: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length <= 500,
      'Summary must be less than 500 characters'
    ),
  content: contentSchema,
  image: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    }, 'Invalid image URL'),
  status: z
    .enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'], {
      message: 'Invalid status',
    })
    .default('DRAFT'),
  authorId: z.string().min(1, 'Author is required'),
  categoryId: z.string().min(1, 'Category is required'),
  tagIds: z.array(z.string()).default([]),
});

// Update article schema for API routes
export const updateArticleSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .optional(),
  slug: slugSchema.optional(),
  summary: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length <= 500,
      'Summary must be less than 500 characters'
    ),
  content: contentSchema.optional(),
  image: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    }, 'Invalid image URL'),
  status: z
    .enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'], {
      message: 'Invalid status',
    })
    .optional(),
  authorId: z.string().optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Podcast Episode Validation Schemas
export const podcastFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  slug: slugSchema.optional(),
  description: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length <= 2000,
      'Description must be less than 2000 characters'
    ),
  summary: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length <= 500,
      'Summary must be less than 500 characters'
    ),
  audioUrl: z
    .string()
    .min(1, 'Audio URL is required')
    .url('Valid audio URL required'),
  coverImage: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    }, 'Invalid cover image URL'),
  duration: z.number().positive('Duration must be positive').optional(),
  episodeNumber: z
    .number()
    .positive('Episode number must be positive')
    .optional(),
  seasonNumber: z
    .number()
    .positive('Season number must be positive')
    .optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).default([]),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  publishedAt: z.date().optional(),
});

export type PodcastFormData = z.infer<typeof podcastFormSchema>;

// Create podcast schema for API routes
export const createPodcastSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  slug: slugSchema.optional(),
  description: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length <= 2000,
      'Description must be less than 2000 characters'
    ),
  summary: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length <= 500,
      'Summary must be less than 500 characters'
    ),
  audioUrl: z
    .string()
    .min(1, 'Audio URL is required')
    .url('Valid audio URL required'),
  coverImage: z.string().optional().url('Invalid cover image URL'),
  duration: z.number().positive('Duration must be positive').optional(),
  episodeNumber: z
    .number()
    .positive('Episode number must be positive')
    .optional(),
  seasonNumber: z
    .number()
    .positive('Season number must be positive')
    .optional(),
  authorId: z.string().min(1, 'Author is required'),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).default([]),
  status: z
    .enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'], {
      message: 'Invalid status',
    })
    .default('DRAFT'),
  publishedAt: z.string().datetime().optional(),
});

// Update podcast schema for API routes
export const updatePodcastSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .optional(),
  slug: slugSchema.optional(),
  description: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length <= 2000,
      'Description must be less than 2000 characters'
    ),
  summary: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length <= 500,
      'Summary must be less than 500 characters'
    ),
  audioUrl: z.string().url('Valid audio URL required').optional(),
  coverImage: z.string().optional().url('Invalid cover image URL'),
  duration: z.number().positive('Duration must be positive').optional(),
  episodeNumber: z
    .number()
    .positive('Episode number must be positive')
    .optional(),
  seasonNumber: z
    .number()
    .positive('Season number must be positive')
    .optional(),
  authorId: z.string().optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  status: z
    .enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'], {
      message: 'Invalid status',
    })
    .optional(),
  publishedAt: z.string().datetime().optional(),
});

// Newsletter Issue Validation Schemas
export const newsletterIssueFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  slug: slugSchema.optional(),
  summary: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length <= 500,
      'Summary must be less than 500 characters'
    ),
  content: z.any(), // Tiptap JSON content - flexible validation
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  publishedAt: z.date().optional(),
});

export type NewsletterIssueFormData = z.infer<typeof newsletterIssueFormSchema>;

// Create newsletter issue schema for API routes
export const createNewsletterIssueSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  slug: slugSchema.optional(),
  summary: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length <= 500,
      'Summary must be less than 500 characters'
    ),
  content: z.any(), // Tiptap JSON content
  authorId: z.string().min(1, 'Author is required'),
  status: z
    .enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'], {
      message: 'Invalid status',
    })
    .default('DRAFT'),
  publishedAt: z.string().datetime().optional(),
});

// Update newsletter issue schema for API routes
export const updateNewsletterIssueSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .optional(),
  slug: slugSchema.optional(),
  summary: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length <= 500,
      'Summary must be less than 500 characters'
    ),
  content: z.any().optional(), // Tiptap JSON content
  authorId: z.string().optional(),
  status: z
    .enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'], {
      message: 'Invalid status',
    })
    .optional(),
  publishedAt: z.string().datetime().optional(),
});
