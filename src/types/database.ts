import type { Prisma } from '@prisma/client';

// Base types from Prisma
export type Article = Prisma.ArticleGetPayload<Record<string, never>>;
export type Author = Prisma.AuthorGetPayload<Record<string, never>>;
export type Category = Prisma.CategoryGetPayload<Record<string, never>>;
export type Tag = Prisma.TagGetPayload<Record<string, never>>;
export type AdminUser = Prisma.AdminUserGetPayload<Record<string, never>>;
export type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

// Extended types with relations
export type ArticleWithRelations = Article & {
  author: Author;
  category: Category;
  tags: Tag[];
};

export type AuthorWithArticles = Author & {
  articles: Article[];
};

export type CategoryWithArticles = Category & {
  articles: Article[];
};

export type TagWithArticles = Tag & {
  articles: Article[];
};

// Form types for creating/updating
export type CreateArticleData = Omit<Article, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateArticleData = Partial<CreateArticleData>;

export type CreateAuthorData = Omit<Author, 'id'>;
export type UpdateAuthorData = Partial<CreateAuthorData>;

export type CreateCategoryData = Omit<Category, 'id'>;
export type UpdateCategoryData = Partial<CreateCategoryData>;

export type CreateTagData = Omit<Tag, 'id'>;
export type UpdateTagData = Partial<CreateTagData>;

export type CreateAdminUserData = Omit<AdminUser, 'id'>;
export type UpdateAdminUserData = Partial<CreateAdminUserData>;
// Cloudinary types
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

export interface CloudinaryError {
  message: string;
  http_code?: number;
}

export interface ImageUploadResponse {
  success: boolean;
  data?: {
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
  };
  error?: string;
}
