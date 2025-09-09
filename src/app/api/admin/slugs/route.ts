import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSafePrismaClient } from '@/lib/db-safe/client';
import {
  generateUniqueSlug,
  validateSlug,
  isSlugAvailable,
  suggestAlternativeSlug,
} from '@/lib/slug-generator';
import { z } from 'zod';

const generateSlugSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  excludeId: z.string().optional(),
});

const validateSlugSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  excludeId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = getSafePrismaClient();
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database unavailable' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'generate': {
        const { title, excludeId } = generateSlugSchema.parse(body);
        const slug = await generateUniqueSlug(prisma, title, excludeId);
        return NextResponse.json({ slug });
      }

      case 'validate': {
        const { slug, excludeId } = validateSlugSchema.parse(body);
        const validation = validateSlug(slug);

        if (!validation.valid) {
          return NextResponse.json({
            valid: false,
            error: validation.error,
          });
        }

        const available = await isSlugAvailable(prisma, slug, excludeId);
        return NextResponse.json({
          valid: available,
          error: available ? undefined : 'This slug is already in use',
        });
      }

      case 'suggest': {
        const { title, excludeId } = generateSlugSchema.parse(body);
        const suggestions = await suggestAlternativeSlug(
          prisma,
          title,
          excludeId
        );
        return NextResponse.json({ suggestions });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: generate, validate, or suggest' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Slug API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
