// Main cache exports
export {
  cache,
  CacheManager,
  initRedis,
  getRedisClient,
  CACHE_CONFIG,
  CACHE_KEYS,
} from '../redis';

// Cache utilities
export { ArticleCache } from './article-cache';
export { SearchCache } from './search-cache';
export { AnalyticsCache } from './analytics-cache';
export { SessionCache } from './session-cache';

// Cache management
export { CacheInvalidation, CacheHooks } from './invalidation';
export { CacheWarming } from './warming';
export { CacheMiddleware } from './middleware';

// Types
export type { CachedArticle, ArticleListCache } from './article-cache';
export type {
  SearchResult,
  SearchCache as SearchCacheType,
} from './search-cache';
export type { AnalyticsData, CampaignAnalytics } from './analytics-cache';
export type { CachedSession, CSRFToken } from './session-cache';
