import { IS_DB_CONFIGURED } from './env';

// Safe Prisma client that handles Edge runtime and missing client gracefully
export type SafePrismaClient = {
  article: {
    findMany: (args?: any) => Promise<any[]>;
    findFirst: (args?: any) => Promise<any | null>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
} | null;

const globalForPrisma = globalThis as unknown as {
  prisma: SafePrismaClient;
};

let prismaClient: SafePrismaClient = null;

export function getSafePrisma(): SafePrismaClient {
  // Always return null in safe mode or if DB not configured
  if (!IS_DB_CONFIGURED || process.env.SAFE_MODE === 'true') {
    return null;
  }

  // Return cached client if available
  if (prismaClient) return prismaClient;
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  try {
    // Dynamic import to avoid Edge runtime issues
    const { PrismaClient } = require('@prisma/client');
    
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });

    // Cache in development
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = client;
    }
    
    prismaClient = client;
    return client;
  } catch (error) {
    // Silent fallback - just log once
    if (!globalForPrisma.prisma) {
      console.info('Prisma client not available, using safe mode');
      globalForPrisma.prisma = null; // Mark as attempted
    }
    return null;
  }
}

// Export for backward compatibility
export const prisma = getSafePrisma();