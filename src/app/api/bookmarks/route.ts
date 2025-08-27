import { NextRequest, NextResponse } from 'next/server';
import { getSafePrismaClient } from '@/lib/db-safe/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { articleId, emailHash } = await request.json();

  if (!articleId || !emailHash) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const prisma = getSafePrismaClient();
  if (!prisma) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  try {
    // Use comments table as proxy for bookmarks until schema is updated
    const existing = await prisma.comment.findFirst({
      where: {
        articleId,
        authorEmailHash: emailHash,
        body: 'bookmark:saved',
      },
    });

    if (existing) {
      await prisma.comment.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ action: 'removed', bookmarked: false });
    } else {
      await prisma.comment.create({
        data: {
          articleId,
          authorEmailHash: emailHash,
          authorName: 'Anonymous',
          body: 'bookmark:saved',
          status: 'APPROVED',
        },
      });
      return NextResponse.json({ action: 'added', bookmarked: true });
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to toggle bookmark' },
      { status: 500 }
    );
  }
}
