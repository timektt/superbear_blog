import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    if (session.user.role !== 'ADMIN' && session.user.role !== 'EDITOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the highest issue number
    const lastIssue = await prisma.newsletterIssue.findFirst({
      orderBy: { issueNumber: 'desc' },
      select: { issueNumber: true },
    });

    const nextNumber = (lastIssue?.issueNumber || 0) + 1;

    return NextResponse.json({ nextNumber });
  } catch (error) {
    console.error('Error getting next issue number:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
