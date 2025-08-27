/**
 * Automatic slug generation with conflict resolution
 */

import { PrismaClient } from '@prisma/client';

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      // Replace spaces and special characters with hyphens
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '')
      // Limit length
      .substring(0, 100)
  );
}

/**
 * Generate a unique slug by checking for conflicts and appending numbers
 */
export async function generateUniqueSlug(
  prisma: PrismaClient,
  title: string,
  excludeId?: string
): Promise<string> {
  const baseSlug = generateSlug(title);

  if (!baseSlug) {
    throw new Error('Cannot generate slug from title');
  }

  // Check if base slug is available
  const existingArticle = await prisma.article.findUnique({
    where: { slug: baseSlug },
    select: { id: true },
  });

  // If no conflict or it's the same article being updated
  if (!existingArticle || existingArticle.id === excludeId) {
    return baseSlug;
  }

  // Find the next available slug with number suffix
  let counter = 1;
  let candidateSlug = `${baseSlug}-${counter}`;

  while (counter <= 100) {
    // Prevent infinite loops
    const existing = await prisma.article.findUnique({
      where: { slug: candidateSlug },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) {
      return candidateSlug;
    }

    counter++;
    candidateSlug = `${baseSlug}-${counter}`;
  }

  // Fallback: append timestamp
  const timestamp = Date.now().toString(36);
  return `${baseSlug}-${timestamp}`;
}

/**
 * Validate slug format
 */
export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug) {
    return { valid: false, error: 'Slug is required' };
  }

  if (slug.length < 3) {
    return { valid: false, error: 'Slug must be at least 3 characters long' };
  }

  if (slug.length > 100) {
    return { valid: false, error: 'Slug must be less than 100 characters' };
  }

  // Check format: lowercase letters, numbers, and hyphens only
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return {
      valid: false,
      error: 'Slug can only contain lowercase letters, numbers, and hyphens',
    };
  }

  // Cannot start or end with hyphen
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return {
      valid: false,
      error: 'Slug cannot start or end with a hyphen',
    };
  }

  // Cannot have consecutive hyphens
  if (slug.includes('--')) {
    return {
      valid: false,
      error: 'Slug cannot contain consecutive hyphens',
    };
  }

  // Reserved slugs
  const reservedSlugs = [
    'admin',
    'api',
    'search',
    'tag',
    'category',
    'author',
    'about',
    'contact',
    'privacy',
    'terms',
    'sitemap',
    'robots',
    'feed',
    'rss',
    'atom',
    'xml',
    'json',
    'css',
    'js',
    'img',
    'images',
    'assets',
    'static',
    'public',
    'www',
    'mail',
    'email',
    'ftp',
    'news',
    'blog',
    'post',
    'page',
    'home',
    'index',
  ];

  if (reservedSlugs.includes(slug)) {
    return {
      valid: false,
      error: 'This slug is reserved and cannot be used',
    };
  }

  return { valid: true };
}

/**
 * Check if slug is available
 */
export async function isSlugAvailable(
  prisma: PrismaClient,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const validation = validateSlug(slug);
  if (!validation.valid) {
    return false;
  }

  const existing = await prisma.article.findUnique({
    where: { slug },
    select: { id: true },
  });

  return !existing || existing.id === excludeId;
}

/**
 * Suggest alternative slugs when there's a conflict
 */
export async function suggestAlternativeSlug(
  prisma: PrismaClient,
  title: string,
  excludeId?: string
): Promise<string[]> {
  const baseSlug = generateSlug(title);
  const suggestions: string[] = [];

  // Try variations of the base slug
  const variations = [
    baseSlug,
    `${baseSlug}-article`,
    `${baseSlug}-post`,
    `${baseSlug}-news`,
    `${baseSlug}-guide`,
    `${baseSlug}-${new Date().getFullYear()}`,
    `${baseSlug}-${new Date().getMonth() + 1}`,
  ];

  for (const variation of variations) {
    if (await isSlugAvailable(prisma, variation, excludeId)) {
      suggestions.push(variation);
      if (suggestions.length >= 5) break;
    }
  }

  // If still not enough, add numbered variations
  if (suggestions.length < 5) {
    for (let i = 1; i <= 10; i++) {
      const numberedSlug = `${baseSlug}-${i}`;
      if (await isSlugAvailable(prisma, numberedSlug, excludeId)) {
        suggestions.push(numberedSlug);
        if (suggestions.length >= 5) break;
      }
    }
  }

  return suggestions;
}
