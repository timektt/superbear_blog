/**
 * Magazine Homepage Data Fetching Utilities
 * 
 * Provides centralized data fetching functions for the magazine layout
 * with error handling, fallback mechanisms, and caching strategy.
 */

import { cache, CACHE_CONFIG, CACHE_KEYS } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { 
  TickerArticle, 
  FeaturedArticle, 
  Article, 
  CategoryWithCount,
  validateFeaturedArticles,
  sortFeaturedArticles,
  createFallbackFeaturedArticles,
  validateTickerArticles
} from '@/types/content';

// Cache TTL constants (5 minutes as specified in requirements)
const MAGAZINE_CACHE_TTL = 5 * 60; // 5 minutes in seconds

// Cache key generators
const getCacheKey = {
  ticker: () => `${CACHE_KEYS.ARTICLE_LIST}magazine:ticker`,
  featured: () => `${CACHE_KEYS.ARTICLE_LIST}magazine:featured`,
  latest: (take: number) => `${CACHE_KEYS.ARTICLE_LIST}magazine:latest:${take}`,
  categories: () => `${CACHE_KEYS.ARTICLE_LIST}magazine:categories`,
};

// Fallback data for when APIs fail
const FALLBACK_DATA = {
  ticker: [
    { id: 'fallback-1', title: 'Breaking: Stay tuned for updates', slug: '#' }
  ] as TickerArticle[],
  
  featured: [] as FeaturedArticle[],
  
  latest: [] as Article[],
  
  categories: [] as CategoryWithCount[],
};

/**
 * Fetch ticker articles with caching and error handling
 */
export async function getTickerArticles(): Promise<TickerArticle[]> {
  const cacheKey = getCacheKey.ticker();
  
  try {
    // Try to get from cache first
    const cached = await cache.get<TickerArticle[]>(cacheKey);
    if (cached) {
      logger.debug('Ticker articles served from cache');
      return cached;
    }

    // Fetch from API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/articles/ticker`, {
      next: { revalidate: MAGAZINE_CACHE_TTL },
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Ticker API failed with status: ${response.status}`);
    }

    const articles = await response.json() as TickerArticle[];
    
    // Validate and transform data
    const validatedArticles = validateTickerData(articles);
    
    // Cache the result
    await cache.set(cacheKey, validatedArticles, MAGAZINE_CACHE_TTL);
    
    logger.info(`Fetched ${validatedArticles.length} ticker articles`);
    return validatedArticles;

  } catch (error) {
    logger.error('Failed to fetch ticker articles:', error as any);
    
    // Try to return stale cache data
    const staleCache = await cache.get<TickerArticle[]>(cacheKey);
    if (staleCache) {
      logger.warn('Returning stale ticker data due to API failure');
      return staleCache;
    }
    
    // Return fallback data
    logger.warn('Returning fallback ticker data');
    return FALLBACK_DATA.ticker;
  }
}

/**
 * Fetch featured articles with caching and error handling
 */
export async function getFeaturedArticles(): Promise<FeaturedArticle[]> {
  const cacheKey = getCacheKey.featured();
  
  try {
    // Try to get from cache first
    const cached = await cache.get<FeaturedArticle[]>(cacheKey);
    if (cached) {
      logger.debug('Featured articles served from cache');
      return cached;
    }

    // Fetch from API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/articles/featured`, {
      next: { revalidate: MAGAZINE_CACHE_TTL },
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Featured API failed with status: ${response.status}`);
    }

    const articles = await response.json() as Article[];
    
    // Transform and validate featured articles
    const featuredArticles = transformFeaturedArticles(articles);
    
    // Cache the result
    await cache.set(cacheKey, featuredArticles, MAGAZINE_CACHE_TTL);
    
    logger.info(`Fetched ${featuredArticles.length} featured articles`);
    return featuredArticles;

  } catch (error) {
    logger.error('Failed to fetch featured articles:', error as any);
    
    // Try to return stale cache data
    const staleCache = await cache.get<FeaturedArticle[]>(cacheKey);
    if (staleCache) {
      logger.warn('Returning stale featured data due to API failure');
      return staleCache;
    }
    
    // Try to get latest articles as fallback
    try {
      const latestArticles = await getLatestArticles(3);
      const fallbackFeatured = createFallbackFeaturedArticles(latestArticles);
      logger.warn('Using latest articles as featured fallback');
      return fallbackFeatured;
    } catch (fallbackError) {
      logger.error('Fallback featured articles also failed:', fallbackError as any);
      return FALLBACK_DATA.featured;
    }
  }
}

/**
 * Fetch latest articles with caching and error handling
 */
export async function getLatestArticles(take: number = 12): Promise<Article[]> {
  const cacheKey = getCacheKey.latest(take);
  
  try {
    // Try to get from cache first
    const cached = await cache.get<Article[]>(cacheKey);
    if (cached) {
      logger.debug(`Latest articles (${take}) served from cache`);
      return cached;
    }

    // Fetch from API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/articles/latest?take=${take}`, {
      next: { revalidate: MAGAZINE_CACHE_TTL },
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Latest API failed with status: ${response.status}`);
    }

    const articles = await response.json() as Article[];
    
    // Transform and validate articles
    const transformedArticles = transformLatestArticles(articles);
    
    // Cache the result
    await cache.set(cacheKey, transformedArticles, MAGAZINE_CACHE_TTL);
    
    logger.info(`Fetched ${transformedArticles.length} latest articles`);
    return transformedArticles;

  } catch (error) {
    logger.error('Failed to fetch latest articles:', error as any);
    
    // Try to return stale cache data
    const staleCache = await cache.get<Article[]>(cacheKey);
    if (staleCache) {
      logger.warn('Returning stale latest data due to API failure');
      return staleCache;
    }
    
    // Return empty array as fallback
    logger.warn('Returning empty latest articles array');
    return FALLBACK_DATA.latest;
  }
}

/**
 * Fetch categories with article counts
 */
export async function getCategoriesWithCount(): Promise<CategoryWithCount[]> {
  const cacheKey = getCacheKey.categories();
  
  try {
    // Try to get from cache first
    const cached = await cache.get<CategoryWithCount[]>(cacheKey);
    if (cached) {
      logger.debug('Categories served from cache');
      return cached;
    }

    // Fetch from API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/categories/with-count`, {
      next: { revalidate: MAGAZINE_CACHE_TTL * 2 }, // Categories change less frequently
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Categories API failed with status: ${response.status}`);
    }

    const categories = await response.json() as CategoryWithCount[];
    
    // Validate and transform categories
    const validatedCategories = validateCategoriesData(categories);
    
    // Cache the result (longer TTL for categories)
    await cache.set(cacheKey, validatedCategories, MAGAZINE_CACHE_TTL * 2);
    
    logger.info(`Fetched ${validatedCategories.length} categories`);
    return validatedCategories;

  } catch (error) {
    logger.error('Failed to fetch categories:', error as any);
    
    // Try to return stale cache data
    const staleCache = await cache.get<CategoryWithCount[]>(cacheKey);
    if (staleCache) {
      logger.warn('Returning stale categories data due to API failure');
      return staleCache;
    }
    
    // Return empty array as fallback
    logger.warn('Returning empty categories array');
    return FALLBACK_DATA.categories;
  }
}

/**
 * Fetch all magazine data in parallel with Promise.all
 */
export async function getAllMagazineData(latestCount: number = 12) {
  try {
    const [tickerArticles, featuredArticles, latestArticles, categories] = await Promise.all([
      getTickerArticles(),
      getFeaturedArticles(),
      getLatestArticles(latestCount),
      getCategoriesWithCount(),
    ]);

    return {
      tickerArticles,
      featuredArticles,
      latestArticles,
      categories,
      success: true,
      errors: [],
    };
  } catch (error) {
    logger.error('Failed to fetch all magazine data:', error as any);
    
    // Try to fetch each individually to get partial data
    const results = await Promise.allSettled([
      getTickerArticles(),
      getFeaturedArticles(),
      getLatestArticles(latestCount),
      getCategoriesWithCount(),
    ]);

    const errors: string[] = [];
    const [tickerResult, featuredResult, latestResult, categoriesResult] = results;

    return {
      tickerArticles: tickerResult.status === 'fulfilled' ? tickerResult.value : FALLBACK_DATA.ticker,
      featuredArticles: featuredResult.status === 'fulfilled' ? featuredResult.value : FALLBACK_DATA.featured,
      latestArticles: latestResult.status === 'fulfilled' ? latestResult.value : FALLBACK_DATA.latest,
      categories: categoriesResult.status === 'fulfilled' ? categoriesResult.value : FALLBACK_DATA.categories,
      success: results.every(r => r.status === 'fulfilled'),
      errors: results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map(r => r.reason?.message || 'Unknown error'),
    };
  }
}

/**
 * Data transformation utilities
 */

function validateTickerData(articles: any[]): TickerArticle[] {
  if (!Array.isArray(articles)) {
    logger.warn('Invalid ticker data format, using fallback');
    return FALLBACK_DATA.ticker;
  }

  const validArticles = articles.filter(article => 
    article && 
    typeof article.id === 'string' && 
    typeof article.title === 'string' && 
    typeof article.slug === 'string'
  );

  if (validArticles.length === 0) {
    logger.warn('No valid ticker articles found, using fallback');
    return FALLBACK_DATA.ticker;
  }

  return validArticles.map(article => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
  }));
}

function transformFeaturedArticles(articles: Article[]): FeaturedArticle[] {
  if (!Array.isArray(articles) || articles.length === 0) {
    logger.warn('No featured articles available');
    return [];
  }

  // Validate featured articles
  const validation = validateFeaturedArticles(articles);
  if (validation.warnings.length > 0) {
    validation.warnings.forEach(warning => logger.warn(warning));
  }
  if (validation.errors.length > 0) {
    validation.errors.forEach(error => logger.error(error));
  }

  // Sort and transform featured articles
  const featuredArticles = articles.filter(a => a.isFeatured);
  if (featuredArticles.length > 0) {
    return sortFeaturedArticles(articles);
  }

  // Use fallback if no featured articles
  return createFallbackFeaturedArticles(articles);
}

function transformLatestArticles(articles: any[]): Article[] {
  if (!Array.isArray(articles)) {
    logger.warn('Invalid latest articles data format');
    return [];
  }

  return articles.map(article => ({
    ...article,
    // Ensure required fields are present
    excerpt: article.excerpt || article.summary || '',
    coverUrl: article.coverUrl || article.image || article.imageUrl || '',
    thumbnail: article.thumbnail || article.image || article.imageUrl || '',
    // Ensure dates are Date objects
    createdAt: new Date(article.createdAt),
    publishedAt: article.publishedAt ? new Date(article.publishedAt) : undefined,
    updatedAt: article.updatedAt ? new Date(article.updatedAt) : undefined,
  }));
}

function validateCategoriesData(categories: any[]): CategoryWithCount[] {
  if (!Array.isArray(categories)) {
    logger.warn('Invalid categories data format');
    return [];
  }

  return categories
    .filter(category => 
      category && 
      typeof category.id === 'string' && 
      typeof category.name === 'string' && 
      typeof category.slug === 'string' &&
      typeof category.articleCount === 'number'
    )
    .map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      articleCount: category.articleCount,
      color: category.color,
      icon: category.icon,
    }));
}

/**
 * Cache invalidation utilities
 */

export async function invalidateMagazineCache(): Promise<void> {
  try {
    await Promise.all([
      cache.del(getCacheKey.ticker()),
      cache.del(getCacheKey.featured()),
      cache.delPattern(`${CACHE_KEYS.ARTICLE_LIST}magazine:latest:*`),
      cache.del(getCacheKey.categories()),
    ]);
    logger.info('Magazine cache invalidated successfully');
  } catch (error) {
    logger.error('Failed to invalidate magazine cache:', error as any);
  }
}

export async function invalidateArticleCache(articleId?: string): Promise<void> {
  try {
    // Invalidate all magazine caches when an article changes
    await invalidateMagazineCache();
    
    if (articleId) {
      await cache.del(`${CACHE_KEYS.ARTICLE}${articleId}`);
    }
    
    logger.info('Article cache invalidated successfully');
  } catch (error) {
    logger.error('Failed to invalidate article cache:', error as any);
  }
}

export async function warmMagazineCache(): Promise<void> {
  try {
    logger.info('Warming magazine cache...');
    
    // Pre-fetch all magazine data to warm the cache
    await getAllMagazineData();
    
    logger.info('Magazine cache warmed successfully');
  } catch (error) {
    logger.error('Failed to warm magazine cache:', error as unknown);
  }
}

/**
 * Health check for magazine data APIs
 */
export async function checkMagazineDataHealth(): Promise<{
  ticker: boolean;
  featured: boolean;
  latest: boolean;
  categories: boolean;
  overall: boolean;
}> {
  const checks = await Promise.allSettled([
    fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/articles/ticker`),
    fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/articles/featured`),
    fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/articles/latest?take=1`),
    fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/categories/with-count`),
  ]);

  const results = {
    ticker: checks[0].status === 'fulfilled' && (checks[0].value as Response).ok,
    featured: checks[1].status === 'fulfilled' && (checks[1].value as Response).ok,
    latest: checks[2].status === 'fulfilled' && (checks[2].value as Response).ok,
    categories: checks[3].status === 'fulfilled' && (checks[3].value as Response).ok,
    overall: false,
  };

  results.overall = Object.values(results).slice(0, 4).every(Boolean);

  return results;
}