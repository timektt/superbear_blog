import { getPrisma } from '@/lib/prisma';
import { IS_DB_CONFIGURED } from '@/lib/env';
import { MOCK_LATEST, mockRightRailItems } from '@/lib/mockData';

export type PublicListItem = {
  id: string;
  title: string;
  slug: string;
  imageUrl?: string;
  category: string;
  author: string;
  date: string;
  snippet?: string;
  tags: string[];
  status?: 'PUBLISHED' | 'DRAFT';
  createdAt?: Date;
};

export type PaginatedResult = {
  items: PublicListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// Enhanced mock data for different categories
const MOCK_CATEGORIES = {
  ai: MOCK_LATEST.filter(item => item.category === 'AI'),
  devtools: MOCK_LATEST.filter(item => item.category === 'DevTools'),
  'open-source': MOCK_LATEST.filter(item => item.category === 'Open Source'),
  startups: [
    {
      id: 'mock-startup-1',
      title: 'Y Combinator Winter 2025 batch includes record number of AI startups',
      category: 'Startups',
      author: 'Emma Thompson',
      date: 'Aug 6, 2025',
      slug: 'yc-winter-2025-ai-startups',
      imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=480&q=80',
      snippet: 'The accelerator\'s latest cohort features 127 companies, with 45% focused on AI.',
      tags: ['Startups', 'AI', 'Y Combinator'],
      status: 'PUBLISHED' as const,
      createdAt: new Date('2025-08-06'),
    },
    {
      id: 'mock-startup-2',
      title: 'Fintech startup Ramp valued at $8.1B in latest funding round',
      category: 'Startups',
      author: 'Michael Brown',
      date: 'Aug 5, 2025',
      slug: 'ramp-8b-valuation',
      imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=480&q=80',
      snippet: 'The corporate card and expense management company raised $300M in Series D.',
      tags: ['Fintech', 'Funding'],
      status: 'PUBLISHED' as const,
      createdAt: new Date('2025-08-05'),
    },
  ],
};

export async function getLatest(opts: { page?: number; pageSize?: number } = {}): Promise<PaginatedResult> {
  const { page = 1, pageSize = 12 } = opts;
  const prisma = getPrisma();

  if (!IS_DB_CONFIGURED || !prisma) {
    // Mock pagination
    const start = (page - 1) * pageSize;
    const items = MOCK_LATEST.slice(start, start + pageSize);
    return {
      items,
      total: MOCK_LATEST.length,
      page,
      pageSize,
      totalPages: Math.ceil(MOCK_LATEST.length / pageSize),
    };
  }

  try {
    const [items, total] = await Promise.all([
      prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { author: true, category: true, tags: true },
      }),
      prisma.article.count({ where: { status: 'PUBLISHED' } }),
    ]);

    const transformedItems: PublicListItem[] = items.map(item => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      imageUrl: item.image || undefined,
      category: item.category.name,
      author: item.author.name,
      date: item.publishedAt?.toLocaleDateString() || item.createdAt.toLocaleDateString(),
      snippet: item.summary || undefined,
      tags: item.tags.map(tag => tag.name),
      status: item.status as 'PUBLISHED' | 'DRAFT',
      createdAt: item.createdAt,
    }));

    return {
      items: transformedItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.warn('Database query failed, falling back to mock data:', error);
    const start = (page - 1) * pageSize;
    const items = MOCK_LATEST.slice(start, start + pageSize);
    return {
      items,
      total: MOCK_LATEST.length,
      page,
      pageSize,
      totalPages: Math.ceil(MOCK_LATEST.length / pageSize),
    };
  }
}

export async function getByCategory(categoryName: string, opts: { page?: number; pageSize?: number } = {}): Promise<PaginatedResult> {
  const { page = 1, pageSize = 12 } = opts;
  const prisma = getPrisma();

  if (!IS_DB_CONFIGURED || !prisma) {
    // Mock category filtering
    const categoryKey = categoryName.toLowerCase().replace(' ', '-') as keyof typeof MOCK_CATEGORIES;
    const categoryItems = MOCK_CATEGORIES[categoryKey] || [];
    const start = (page - 1) * pageSize;
    const items = categoryItems.slice(start, start + pageSize);
    
    return {
      items,
      total: categoryItems.length,
      page,
      pageSize,
      totalPages: Math.ceil(categoryItems.length / pageSize),
    };
  }

  try {
    const [items, total] = await Promise.all([
      prisma.article.findMany({
        where: { 
          status: 'PUBLISHED',
          category: { name: { equals: categoryName } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { author: true, category: true, tags: true },
      }),
      prisma.article.count({ 
        where: { 
          status: 'PUBLISHED',
          category: { name: { equals: categoryName } }
        }
      }),
    ]);

    const transformedItems: PublicListItem[] = items.map(item => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      imageUrl: item.image || undefined,
      category: item.category.name,
      author: item.author.name,
      date: item.publishedAt?.toLocaleDateString() || item.createdAt.toLocaleDateString(),
      snippet: item.summary || undefined,
      tags: item.tags.map(tag => tag.name),
      status: item.status as 'PUBLISHED' | 'DRAFT',
      createdAt: item.createdAt,
    }));

    return {
      items: transformedItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.warn('Database query failed, falling back to mock data:', error);
    return getLatest(opts);
  }
}

export async function getByTag(tagSlug: string, opts: { page?: number; pageSize?: number } = {}): Promise<PaginatedResult> {
  const { page = 1, pageSize = 12 } = opts;
  const prisma = getPrisma();

  if (!IS_DB_CONFIGURED || !prisma) {
    // Mock tag filtering
    const taggedItems = MOCK_LATEST.filter(item => 
      item.tags.some(tag => tag.toLowerCase().replace(/\s+/g, '-') === tagSlug)
    );
    const start = (page - 1) * pageSize;
    const items = taggedItems.slice(start, start + pageSize);
    
    return {
      items,
      total: taggedItems.length,
      page,
      pageSize,
      totalPages: Math.ceil(taggedItems.length / pageSize),
    };
  }

  try {
    const [items, total] = await Promise.all([
      prisma.article.findMany({
        where: { 
          status: 'PUBLISHED',
          tags: { some: { slug: tagSlug } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { author: true, category: true, tags: true },
      }),
      prisma.article.count({ 
        where: { 
          status: 'PUBLISHED',
          tags: { some: { slug: tagSlug } }
        }
      }),
    ]);

    const transformedItems: PublicListItem[] = items.map(item => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      imageUrl: item.image || undefined,
      category: item.category.name,
      author: item.author.name,
      date: item.publishedAt?.toLocaleDateString() || item.createdAt.toLocaleDateString(),
      snippet: item.summary || undefined,
      tags: item.tags.map(tag => tag.name),
      status: item.status as 'PUBLISHED' | 'DRAFT',
      createdAt: item.createdAt,
    }));

    return {
      items: transformedItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.warn('Database query failed, falling back to mock data:', error);
    return getLatest(opts);
  }
}

export async function searchArticles(q: string, opts: { page?: number; pageSize?: number } = {}): Promise<PaginatedResult> {
  const { page = 1, pageSize = 12 } = opts;
  const prisma = getPrisma();

  if (!q.trim()) {
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  if (!IS_DB_CONFIGURED || !prisma) {
    // Mock search
    const query = q.toLowerCase();
    const searchResults = MOCK_LATEST.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.snippet?.toLowerCase().includes(query) ||
      item.tags.some(tag => tag.toLowerCase().includes(query))
    );
    const start = (page - 1) * pageSize;
    const items = searchResults.slice(start, start + pageSize);
    
    return {
      items,
      total: searchResults.length,
      page,
      pageSize,
      totalPages: Math.ceil(searchResults.length / pageSize),
    };
  }

  try {
    const [items, total] = await Promise.all([
      prisma.article.findMany({
        where: { 
          status: 'PUBLISHED',
          OR: [
            { title: { contains: q } },
            { summary: { contains: q } },
            { tags: { some: { name: { contains: q } } } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { author: true, category: true, tags: true },
      }),
      prisma.article.count({ 
        where: { 
          status: 'PUBLISHED',
          OR: [
            { title: { contains: q } },
            { summary: { contains: q } },
            { tags: { some: { name: { contains: q } } } }
          ]
        }
      }),
    ]);

    const transformedItems: PublicListItem[] = items.map(item => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      imageUrl: item.image || undefined,
      category: item.category.name,
      author: item.author.name,
      date: item.publishedAt?.toLocaleDateString() || item.createdAt.toLocaleDateString(),
      snippet: item.summary || undefined,
      tags: item.tags.map(tag => tag.name),
      status: item.status as 'PUBLISHED' | 'DRAFT',
      createdAt: item.createdAt,
    }));

    return {
      items: transformedItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.warn('Database query failed, falling back to mock data:', error);
    return searchArticles(q, opts);
  }
}

export async function getMostPopular(limit = 5): Promise<PublicListItem[]> {
  const prisma = getPrisma();

  if (!IS_DB_CONFIGURED || !prisma) {
    return mockRightRailItems.slice(0, limit).map((item, index) => ({
      id: `popular-${index}`,
      title: item.title,
      slug: item.slug,
      imageUrl: item.imageUrl,
      category: item.category,
      author: 'SuperBear Reporter',
      date: item.timeAgo,
      tags: [],
    }));
  }

  try {
    const items = await prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' }, // In real app, would order by views
      take: limit,
      include: { author: true, category: true, tags: true },
    });

    return items.map(item => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      imageUrl: item.image || undefined,
      category: item.category.name,
      author: item.author.name,
      date: item.publishedAt?.toLocaleDateString() || item.createdAt.toLocaleDateString(),
      snippet: item.summary || undefined,
      tags: item.tags.map(tag => tag.name),
      status: item.status as 'PUBLISHED' | 'DRAFT',
      createdAt: item.createdAt,
    }));
  } catch (error) {
    console.warn('Database query failed, falling back to mock data:', error);
    return getMostPopular(limit);
  }
}

export async function getInBrief(limit = 8): Promise<PublicListItem[]> {
  const prisma = getPrisma();

  if (!IS_DB_CONFIGURED || !prisma) {
    return MOCK_LATEST.slice(0, limit);
  }

  try {
    const items = await prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { author: true, category: true, tags: true },
    });

    return items.map(item => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      imageUrl: item.image || undefined,
      category: item.category.name,
      author: item.author.name,
      date: item.publishedAt?.toLocaleDateString() || item.createdAt.toLocaleDateString(),
      snippet: item.summary || undefined,
      tags: item.tags.map(tag => tag.name),
      status: item.status as 'PUBLISHED' | 'DRAFT',
      createdAt: item.createdAt,
    }));
  } catch (error) {
    console.warn('Database query failed, falling back to mock data:', error);
    return getInBrief(limit);
  }
}