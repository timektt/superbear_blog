import { NextRequest, NextResponse } from 'next/server';
import { getSafePrismaClient } from '@/lib/db-safe/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { articleId, emailHash, type = 'like' } = await request.json();
  
  if (!articleId || !emailHash) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  const prisma = getSafePrismaClient();
  if (!prisma) {
    return NextResponse.json({ error: 'Service unavailable', safeMode: true }, { status: 503 });
  }
  
  try {
    const { CommentStatus } = await import('@prisma/client');
    // For now, use comments table as a proxy for reactions until schema is updated
    const existing = await prisma.comment.findFirst({
      where: {
        articleId,
        authorEmailHash: emailHash,
        body: `reaction:${type}`,
      },
    });
    
    if (existing) {
      await prisma.comment.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ action: 'removed', liked: false });
    } else {
      await prisma.comment.create({
        data: {
          articleId,
          authorEmailHash: emailHash,
          authorName: 'Anonymous',
          body: `reaction:${type}`,
          status: CommentStatus.approved,
        },
      });
      return NextResponse.json({ action: 'added', liked: true });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to toggle reaction' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get('articleId');
  
  if (!articleId) {
    return NextResponse.json({ error: 'articleId required' }, { status: 400 });
  }
  
  const prisma = getSafePrismaClient();
  if (!prisma) {
    return NextResponse.json({ count: 0, safeMode: true });
  }
  
  try {
    const { CommentStatus } = await import('@prisma/client');
    const count = await prisma.comment.count({
      where: { 
        articleId, 
        body: 'reaction:like',
        status: CommentStatus.approved
      },
    });
    
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0, safeMode: true });
  }
}