import { z } from 'zod';

export const articleFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  slug: z.string().optional(),
  summary: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length <= 500,
      'Summary must be less than 500 characters'
    ),
  content: z.string().min(1, 'Content is required'),
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

// Schema for article validation (alias for articleFormSchema)
export const articleSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  slug: z
    .string()
    .optional()
    .refine((val) => !val || validateSlug(val), 'Slug must be URL-friendly'),
  summary: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length <= 500,
      'Summary must be less than 500 characters'
    ),
  content: z.any().refine((val) => {
    if (typeof val === 'object' && val !== null) {
      return true;
    }
    return false;
  }, 'Content must be valid JSON'),
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
  categoryId: z.string().min(1, 'Category is required'),
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
