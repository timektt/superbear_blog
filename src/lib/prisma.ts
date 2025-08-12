import { IS_DB_CONFIGURED } from './env';

export type PrismaClientType =
  | typeof import('@prisma/client').PrismaClient
  | null;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType;
};

export function getPrisma(): PrismaClientType {
  if (!IS_DB_CONFIGURED) return null;

  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  try {
    const { PrismaClient } = require('@prisma/client');
    const client = new PrismaClient();

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = client;
    }

    return client;
  } catch (error) {
    console.warn(
      'Prisma client initialization failed, falling back to mock data:',
      error
    );
    return null;
  }
}

// Legacy export for backward compatibility
export const prisma = getPrisma();
