/**
 * @jest-environment node
 */

import { prisma } from '@/lib/prisma';
import { Status } from '@prisma/client';

describe('Homepage Dynamic Content', () => {
  beforeAll(async () => {
    // Ensure we have test data
    const articleCount = await prisma.article.count({
      where: { status: Status.PUBLISHED },
    });

    if (articleCount === 0) {
      // Create a test article if none exist
      await prisma.article.create({
        data: {
          title: 'Test Article',
          slug: 'test-article',
          summary: 'Test summary',
          content: { type: 'doc', content: [] },
          status: Status.PUBLISHED,
          publishedAt: new Date(),
          author: {
            connectOrCreate: {
              where: { email: 'test@example.com' },
              create: {
                name: 'Test Author',
                email: 'test@example.com',
                bio: 'Test bio',
              },
            },
          },
          category: {
            connectOrCreate: {
              where: { slug: 'test-category' },
              create: {
                name: 'Test Category',
                slug: 'test-category',
              },
            },
          },
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Featured Articles Section', () => {
    it('should fetch featured articles from database', async () => {
      const articles = await prisma.article.findMany({
        where: {
          status: Status.PUBLISHED,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        take: 3,
      });

      expect(articles).toBeDefined();
      expect(Array.isArray(articles)).toBe(true);
      expect(articles.length).toBeGreaterThan(0);

      // Verify article structure
      if (articles.length > 0) {
        const article = articles[0];
        expect(article).toHaveProperty('id');
        expect(article).toHaveProperty('title');
        expect(article).toHaveProperty('slug');
        expect(article).toHaveProperty('author');
        expect(article).toHaveProperty('category');
        expect(article).toHaveProperty('tags');
        expect(article.status).toBe(Status.PUBLISHED);
      }
    });
  });

  describe('Category Navigation', () => {
    it('should fetch categories with article counts', async () => {
      const categories = await prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              articles: {
                where: {
                  status: Status.PUBLISHED,
                },
              },
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      const categoriesWithArticles = categories.filter(
        (category) => category._count.articles > 0
      );

      expect(categoriesWithArticles).toBeDefined();
      expect(Array.isArray(categoriesWithArticles)).toBe(true);

      // Verify category structure
      if (categoriesWithArticles.length > 0) {
        const category = categoriesWithArticles[0];
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('slug');
        expect(category).toHaveProperty('_count');
        expect(category._count.articles).toBeGreaterThan(0);
      }
    });
  });

  describe('Recent Articles Preview', () => {
    it('should fetch recent articles from database', async () => {
      const articles = await prisma.article.findMany({
        where: {
          status: Status.PUBLISHED,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        take: 6,
      });

      expect(articles).toBeDefined();
      expect(Array.isArray(articles)).toBe(true);
      expect(articles.length).toBeGreaterThan(0);

      // Verify articles are ordered by publishedAt desc
      if (articles.length > 1) {
        const firstArticle = articles[0];
        const secondArticle = articles[1];

        if (firstArticle.publishedAt && secondArticle.publishedAt) {
          expect(firstArticle.publishedAt.getTime()).toBeGreaterThanOrEqual(
            secondArticle.publishedAt.getTime()
          );
        }
      }
    });
  });

  describe('Database Connection', () => {
    it('should connect to actual article data from database', async () => {
      // Test that we can fetch published articles
      const publishedArticles = await prisma.article.findMany({
        where: {
          status: Status.PUBLISHED,
        },
      });

      expect(publishedArticles).toBeDefined();
      expect(Array.isArray(publishedArticles)).toBe(true);

      // Test that we can fetch categories
      const categories = await prisma.category.findMany();
      expect(categories).toBeDefined();
      expect(Array.isArray(categories)).toBe(true);

      // Test that we can fetch authors
      const authors = await prisma.author.findMany();
      expect(authors).toBeDefined();
      expect(Array.isArray(authors)).toBe(true);
    });
  });
});
