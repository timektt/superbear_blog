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
  slug: string;
  content?: unknown; // Rich text content
  imageUrl?: string;
  status: 'PUBLISHED' | 'DRAFT';
  createdAt: Date;
  publishedAt?: Date;
  updatedAt?: Date;
  author: Author;
  category: Category;
  tags: Tag[];
}

export interface Headline {
  title: string;
  timeAgo: string;
  slug: string;
  createdAt?: Date;
}

export interface FeaturedArticle {
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
