import { NextRequest, NextResponse } from 'next/server';
import { getSafePrismaClient } from '@/lib/db-safe/client';
import { sanitizeHtml } from '@/lib/comments/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 }); // 1 minute
    return true;
  }
  
  if (limit.count >= 5) return false; // 5 comments per minute
  
  limit.count++;
  return true;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get('articleId');
  
  if (!articleId) {
    return NextResponse.json({ error: 'articleId required' }, { status: 400 });
  }
  
  const prisma = getSafePrismaClient();
  if (!prisma) {
    return NextResponse.json({ comments: [] });
  }
  
  try {
    const comments = await prisma.comment.findMany({
      where: {
        articleId,
        status: 'approved',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    
    return NextResponse.json({ comments });
  } catch {
    return NextResponse.json({ comments: [] });
  }
}

export async function POST(request: NextRequest) {
  const ip = request.ip || 'unknown';
  
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
  
  const { articleId, body, authorName, authorEmailHash, parentId } = await request.json();
  
  if (!articleId || !body || !authorName || !authorEmailHash) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  const prisma = getSafePrismaClient();
  if (!prisma) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
  
  try {
    const sanitizedBody = sanitizeHtml(body);
    const status = process.env.NODE_ENV === 'development' ? 'approved' : 'pending';
    
    const comment = await prisma.comment.create({
      data: {
        articleId,
        parentId,
        body: sanitizedBody,
        authorName,
        authorEmailHash,
        status,
      },
    });
    
    return NextResponse.json({ comment, status: 'success' });
  } catch {
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}