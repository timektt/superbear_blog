import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return session;
}

export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function createSuccessResponse(data: unknown, status: number = 200) {
  return NextResponse.json(data, { status });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Newsletter verification token functions
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function verifyToken(token: string, email: string): boolean {
  // In a production environment, you would store tokens in database with expiration
  // For now, we'll do basic validation
  return token && token.length === 64 && email && email.includes('@');
}
