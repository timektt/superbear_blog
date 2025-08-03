import { prisma } from './prisma';
import { Status } from '@prisma/client';

// Utility functions for common database operations

export const dbUtils = {
  // Article utilities
  async getPublishedArticles() {
    return prisma.article.findMany({
      where: { status: Status.PUBLISHED },
      include: {
        author: true,
        category: true,
        tags: true,
      },
      orderBy: { publishedAt: 'desc' },
    });
  },

  async getArticleBySlug(slug: string) {
    return prisma.article.findUnique({
      where: { slug },
      include: {
        author: true,
        category: true,
        tags: true,
      },
    });
  },

  // Category utilities
  async getAllCategories() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  },

  // Tag utilities
  async getAllTags() {
    return prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
  },

  // Author utilities
  async getAllAuthors() {
    return prisma.author.findMany({
      orderBy: { name: 'asc' },
    });
  },

  // Admin utilities
  async getAdminByEmail(email: string) {
    return prisma.adminUser.findUnique({
      where: { email },
    });
  },

  // Search utilities
  async searchArticles(query: string) {
    return prisma.article.findMany({
      where: {
        AND: [
          { status: Status.PUBLISHED },
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { summary: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      include: {
        author: true,
        category: true,
        tags: true,
      },
      orderBy: { publishedAt: 'desc' },
    });
  },
};
