import { NextRequest, NextResponse } from 'next/server';
import { getSafePrismaClient } from '@/lib/db-safe/client';
import { searchArticles } from '@/lib/search/query';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const tag = searchParams.get('tag') || '';
  const category = searchParams.get('category') || '';
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  
  const prisma = getSafePrismaClient();
  if (!prisma) {
    return NextResponse.json({
      articles: [],
      total: 0,
      query: { q, tag, category },
    });
  }
  
  try {
    const results = await searchArticles(prisma, {
      query: q,
      tag,
      category,
      limit: Math.min(limit, 50),
    });
    
    return NextResponse.json({
      articles: results.articles,
      total: results.total,
      query: { q, tag, category },
    });
  } catch {
    return NextResponse.json({
      articles: [],
      total: 0,
      query: { q, tag, category },
      error: 'Search failed',
    });
  }
}