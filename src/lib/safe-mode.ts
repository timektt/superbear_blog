/**
 * Safe mode utilities for development and Edge runtime compatibility
 */

export const IS_SAFE_MODE = 
  process.env.NODE_ENV === 'development' || 
  process.env.SAFE_MODE === 'true' ||
  !process.env.DATABASE_URL;

export const IS_EDGE_RUNTIME = 
  typeof EdgeRuntime !== 'undefined' ||
  process.env.NEXT_RUNTIME === 'edge';

/**
 * Check if we can safely use Node.js APIs
 */
export function canUseNodeAPIs(): boolean {
  return !IS_EDGE_RUNTIME && typeof process !== 'undefined';
}

/**
 * Safe dynamic import for Node.js only modules
 */
export async function safeImport<T>(modulePath: string): Promise<T | null> {
  if (!canUseNodeAPIs()) {
    return null;
  }
  
  try {
    return await import(modulePath);
  } catch (error) {
    console.warn(`Failed to import ${modulePath}:`, error);
    return null;
  }
}