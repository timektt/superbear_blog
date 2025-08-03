import {
  Article,
  Author,
  Category,
  Tag,
  AdminUser,
  Status,
} from '@prisma/client';

// Base types from Prisma
export type { Article, Author, Category, Tag, AdminUser, Status };

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
