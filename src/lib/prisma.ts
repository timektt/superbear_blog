import { IS_DB_CONFIGURED } from './env';

export type PrismaClientType = any | null;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType;
};

export function getPrisma(): PrismaClientType {
  if (!IS_DB_CONFIGURED) {
    console.info('Database not configured, using safe mode');
    return null;
  }

  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  try {
    const { PrismaClient } = require('@prisma/client');
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = client;
    }

    return client;
  } catch (error) {
    console.info('Prisma client not available, using safe mode');
    return null;
  }
}

// Legacy export for backward compatibility
export const prisma = getPrisma();
