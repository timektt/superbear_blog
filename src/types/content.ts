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