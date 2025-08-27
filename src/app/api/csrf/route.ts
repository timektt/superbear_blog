import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken } from '@/lib/csrf';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get session for token binding
    const session = await getServerSession(authOptions);
    const sessionId = session?.user?.id;

    // Generate CSRF token
    const token = generateCSRFToken(sessionId);

    const response = NextResponse.json({
      token,
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    // Set security headers
    response.headers.set(
      'Cache-Control',
      'no-cache, no-store, must-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
