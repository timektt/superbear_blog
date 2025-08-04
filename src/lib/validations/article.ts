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
