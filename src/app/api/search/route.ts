import { NextRequest, NextResponse } from 'next/server';
import { getSafePrismaClient } from '@/lib/db-safe/client';
import { searchArticles, getSearchSuggestions } from '@/lib/search/query';
import { rateLimit } from '@/lib/rate-limit';
import { compressedApiRoute } from '@/lib/compression';
import e from 'express';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handler(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await rateLimit(request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const tag = searchParams.get('tag') || '';
  const category = searchParams.get('category') || '';
  const author = searchParams.get('author') || '';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const sortBy = searchParams.get('sortBy') as 'relevance' | 'date' | 'popularity' || 'relevance';
  const suggest = searchParams.get('suggest') === 'true';
  
  const prisma = getSafePrismaClient();
  if (!prisma) {
    return NextResponse.json({
      articles: [],
      total: 0,
      facets: { tags: [], authors: [], categories: [] },
      query: { q, tag, category, author },
    });
  }
  
  try {
    // Handle search suggestions
    if (suggest && q) {
      const suggestions = await getSearchSuggestions(prisma, q, 10);
      return NextResponse.json({ suggestions });
    }

    // Parse date range
    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }

    const results = await searchArticles(prisma, {
      query: q,
      tag: tag || undefined,
      category: category || undefined,
      author: author || undefined,
      dateRange,
      limit: Math.min(limit, 50),
      offset: Math.max(0, offset),
      sortBy,
    });
    
    const response = NextResponse.json({
      articles: results.articles,
      total: results.total,
      facets: results.facets,
      query: { q, tag, category, author, startDate, endDate, sortBy },
      pagination: {
        limit,
        offset,
        hasMore: results.total > offset + limit
      }
    });

    // Add cache headers for search results
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    response.headers.set('X-Cache', 'MISS');
    
    return response;
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({
      articles: [],
      total: 0,
      facets: { tags: [], authors: [], categories: [] },
      query: { q, tag, category, author },
      error: 'Search failed',
    }, { status: 500 });
  }
}e
xport const GET = compressedApiRoute(handler, {
  threshold: 512, // Compress search responses larger than 512 bytes
  level: 7, // Higher compression for search results
});