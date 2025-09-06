// Shared types for content across the application

export interface Author {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string; // For category-specific styling
  icon?: string; // For category icons
}

export interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  articleCount: number;
  color?: string;
  icon?: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Article {
  id: string;
  title: string;
  summary?: string;
  excerpt?: string; // Alternative to summary for magazine layout
  slug: string;
  content?: unknown; // Rich text content
  imageUrl?: string;
  coverUrl?: string; // Alternative to imageUrl for magazine layout
  status: 'PUBLISHED' | 'DRAFT';
  createdAt: Date;
  publishedAt?: Date;
  updatedAt?: Date;
  author: Author;
  category: Category;
  categoryId: string; // For easier filtering
  tags: Tag[];
  // Magazine layout specific fields
  isFeatured: boolean;
  featureRank?: number; // 1 = large featured, 2+ = small featured
  ticker: boolean; // For highlight ticker display
  readingTime?: number; // Estimated reading time in minutes
}

export interface Headline {
  title: string;
  timeAgo: string;
  slug: string;
  createdAt?: Date;
}

// Magazine-specific article types
export interface TickerArticle {
  id: string;
  title: string;
  slug: string;
}

export interface FeaturedArticle {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  coverUrl: string;
  category: Category;
  publishedAt: Date;
  author: Author;
  featureRank: number;
  readingTime?: number;
}

// Legacy FeaturedArticle for backward compatibility
export interface LegacyFeaturedArticle {
  id: string;
  title: string;
  summary: string;
  slug: string;
  author: Author;
  date: string;
  createdAt?: Date;
  category: Category;
  imageUrl?: string;
  status?: 'PUBLISHED' | 'DRAFT';
  content?: unknown;
  tags?: Tag[];
}

export interface LatestArticle {
  id: string;
  title: string;
  category: string; // Category name as string for compatibility
  author: string; // Author name as string for compatibility
  date: string;
  slug: string;
  imageUrl?: string;
  snippet?: string;
  tags: string[]; // Tag names as strings for compatibility
  status?: 'PUBLISHED' | 'DRAFT';
  createdAt?: Date;
}

export interface PodcastEpisode {
  id: string;
  title: string;
  slug: string;
  description?: string;
  summary?: string;
  audioUrl: string;
  coverImage?: string;
  duration?: number; // Duration in seconds
  episodeNumber?: number;
  seasonNumber?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  author: Author;
  category?: Category;
  tags: Tag[];
}

export interface NewsletterIssue {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content: unknown; // Tiptap JSON content
  issueNumber: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  author: Author;
}

// API Response Types
export interface PodcastResponse {
  id: string;
  title: string;
  slug: string;
  description?: string;
  summary?: string;
  audioUrl: string;
  coverImage?: string;
  duration?: number;
  episodeNumber?: number;
  seasonNumber?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export interface NewsletterIssueResponse {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content: unknown;
  issueNumber: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface PodcastListResponse {
  podcasts: PodcastResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters?: {
    category?: string;
    author?: string;
    status?: string;
  };
}

export interface NewsletterArchiveResponse {
  issues: NewsletterIssueResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Data Types
export interface PodcastFormData {
  title: string;
  slug: string;
  description?: string;
  summary?: string;
  audioUrl: string;
  coverImage?: string;
  duration?: number;
  episodeNumber?: number;
  seasonNumber?: number;
  categoryId?: string;
  tagIds: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: Date;
}

export interface NewsletterIssueFormData {
  title: string;
  slug: string;
  summary?: string;
  content: unknown; // Tiptap JSON
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: Date;
}

// Data validation utilities for magazine layout
export interface FeaturedArticleValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface NewsletterConfig {
  title: string;
  description: string;
  ctaText: string;
  privacyText: string;
}

// Validation functions
export const validateFeaturedArticles = (articles: Article[]): FeaturedArticleValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const featuredArticles = articles.filter(a => a.isFeatured);
  
  if (featuredArticles.length === 0) {
    warnings.push('No featured articles found. Will use latest articles as fallback.');
  }
  
  if (featuredArticles.length < 3) {
    warnings.push(`Only ${featuredArticles.length} featured articles found. Recommend at least 3 for optimal layout.`);
  }
  
  // Check for duplicate feature ranks
  const ranks = featuredArticles.map(a => a.featureRank).filter(r => r !== undefined);
  const uniqueRanks = new Set(ranks);
  if (ranks.length !== uniqueRanks.size) {
    errors.push('Duplicate feature ranks found. Each featured article must have a unique rank.');
  }
  
  // Check for missing cover images
  const missingImages = featuredArticles.filter(a => !a.coverUrl && !a.imageUrl);
  if (missingImages.length > 0) {
    warnings.push(`${missingImages.length} featured articles missing cover images.`);
  }
  
  // Check for missing excerpts
  const missingExcerpts = featuredArticles.filter(a => !a.excerpt && !a.summary);
  if (missingExcerpts.length > 0) {
    warnings.push(`${missingExcerpts.length} featured articles missing excerpts.`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const sortFeaturedArticles = (articles: Article[]): FeaturedArticle[] => {
  return articles
    .filter(a => a.isFeatured)
    .sort((a, b) => (a.featureRank || 999) - (b.featureRank || 999))
    .map(article => ({
      id: article.id,
      title: article.title,
      excerpt: article.excerpt || article.summary || '',
      slug: article.slug,
      coverUrl: article.coverUrl || article.imageUrl || '',
      category: article.category,
      publishedAt: article.publishedAt || article.createdAt,
      author: article.author,
      featureRank: article.featureRank || 999,
      readingTime: article.readingTime
    }));
};

export const createFallbackFeaturedArticles = (articles: Article[]): FeaturedArticle[] => {
  return articles
    .filter(a => a.status === 'PUBLISHED')
    .sort((a, b) => {
      const dateA = a.publishedAt || a.createdAt;
      const dateB = b.publishedAt || b.createdAt;
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 3)
    .map((article, index) => ({
      id: article.id,
      title: article.title,
      excerpt: article.excerpt || article.summary || '',
      slug: article.slug,
      coverUrl: article.coverUrl || article.imageUrl || '',
      category: article.category,
      publishedAt: article.publishedAt || article.createdAt,
      author: article.author,
      featureRank: index + 1,
      readingTime: article.readingTime
    }));
};

export const validateTickerArticles = (articles: Article[]): TickerArticle[] => {
  return articles
    .filter(a => a.ticker && a.status === 'PUBLISHED')
    .sort((a, b) => {
      const dateA = a.publishedAt || a.createdAt;
      const dateB = b.publishedAt || b.createdAt;
      return dateB.getTime() - dateA.getTime();
    })
    .map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug
    }));
};
