import { IS_DB_CONFIGURED } from './env';

export type PrismaClientType = 
  typeof import('@prisma/client').PrismaClient | null;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType;
};

let prisma: PrismaClientType = null;

export function getPrisma(): PrismaClientType {
  if (!IS_DB_CONFIGURED) return null;
  
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  if (prisma) return prisma;
  
  try {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
    
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prisma;
    }
    
    return prisma;
  } catch (error) {
    console.warn('Prisma client initialization failed, falling back to mock data:', error);
    return null;
  }
}

// Legacy export for backward compatibility
export const prisma = getPrisma();
