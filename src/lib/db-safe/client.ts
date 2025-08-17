import { PrismaClient } from '@prisma/client';
import { IS_DB_CONFIGURED } from '@/lib/env';

// Global Prisma client instance
let prismaClient: PrismaClient | null = null;

/**
 * Safe Prisma client getter that returns null when DB is not configured
 */
export function getSafePrismaClient(): PrismaClient | null {
  if (!IS_DB_CONFIGURED) {
    return null;
  }

  if (!prismaClient) {
    try {
      prismaClient = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      });
    } catch (error) {
      console.warn('Failed to initialize Prisma client:', error);
      return null;
    }
  }

  return prismaClient;
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  const client = getSafePrismaClient();
  
  if (!client) {
    return false;
  }

  try {
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.warn('Database connection test failed:', error);
    return false;
  }
}

/**
 * Gracefully disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  if (prismaClient) {
    try {
      await prismaClient.$disconnect();
    } catch (error) {
      console.warn('Error disconnecting from database:', error);
    } finally {
      prismaClient = null;
    }
  }
}

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('beforeExit', disconnectDatabase);
  process.on('SIGINT', disconnectDatabase);
  process.on('SIGTERM', disconnectDatabase);
}