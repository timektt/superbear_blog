/**
 * Memory-efficient utility functions
 * Provides helpers for memory optimization throughout the application
 */

import { memoryMonitor } from './memory-monitor';
import { logger } from './logger';

// Memory-efficient array processing
export class MemoryEfficientProcessor {
  private static readonly CHUNK_SIZE = 1000;

  // Process large arrays in chunks to avoid memory spikes
  static async processArrayInChunks<T, R>(
    array: T[],
    processor: (item: T, index: number) => Promise<R> | R,
    chunkSize: number = MemoryEfficientProcessor.CHUNK_SIZE
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < array.length; i += chunkSize) {
      const chunk = array.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map((item, chunkIndex) => processor(item, i + chunkIndex))
      );

      results.push(...chunkResults);

      // Allow garbage collection between chunks
      if (i + chunkSize < array.length) {
        await new Promise((resolve) => setImmediate(resolve));
      }
    }

    return results;
  }

  // Memory-efficient map operation
  static async mapWithMemoryControl<T, R>(
    array: T[],
    mapper: (item: T, index: number) => Promise<R> | R,
    options: {
      chunkSize?: number;
      memoryThreshold?: number; // Percentage threshold to trigger GC
      onProgress?: (processed: number, total: number) => void;
    } = {}
  ): Promise<R[]> {
    const {
      chunkSize = MemoryEfficientProcessor.CHUNK_SIZE,
      memoryThreshold = 80,
      onProgress,
    } = options;

    const results: R[] = [];

    for (let i = 0; i < array.length; i += chunkSize) {
      const chunk = array.slice(i, i + chunkSize);

      // Check memory pressure before processing chunk
      const memoryStats = memoryMonitor.getCurrentMemoryStats();
      if (memoryStats && memoryStats.heapUsedPercent > memoryThreshold) {
        logger.warn(
          'High memory usage during array processing, triggering optimization',
          {
            heapUsedPercent: memoryStats.heapUsedPercent,
            processedItems: i,
            totalItems: array.length,
          }
        );

        await memoryMonitor.optimizeMemoryUsage();
      }

      const chunkResults = await Promise.all(
        chunk.map((item, chunkIndex) => mapper(item, i + chunkIndex))
      );

      results.push(...chunkResults);

      if (onProgress) {
        onProgress(Math.min(i + chunkSize, array.length), array.length);
      }

      // Yield control to event loop
      await new Promise((resolve) => setImmediate(resolve));
    }

    return results;
  }

  // Memory-efficient filter operation
  static async filterWithMemoryControl<T>(
    array: T[],
    predicate: (item: T, index: number) => Promise<boolean> | boolean,
    chunkSize: number = MemoryEfficientProcessor.CHUNK_SIZE
  ): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < array.length; i += chunkSize) {
      const chunk = array.slice(i, i + chunkSize);

      for (let j = 0; j < chunk.length; j++) {
        const item = chunk[j];
        const shouldInclude = await predicate(item, i + j);

        if (shouldInclude) {
          results.push(item);
        }
      }

      // Yield control between chunks
      if (i + chunkSize < array.length) {
        await new Promise((resolve) => setImmediate(resolve));
      }
    }

    return results;
  }
}

// Memory-efficient string operations
export class MemoryEfficientString {
  // Process large strings without creating intermediate copies
  static processLargeString(
    str: string,
    processor: (chunk: string, offset: number) => string,
    chunkSize: number = 10000
  ): string {
    if (str.length <= chunkSize) {
      return processor(str, 0);
    }

    let result = '';
    for (let i = 0; i < str.length; i += chunkSize) {
      const chunk = str.slice(i, i + chunkSize);
      result += processor(chunk, i);
    }

    return result;
  }

  // Memory-efficient string search
  static findInLargeString(
    str: string,
    searchTerm: string,
    chunkSize: number = 10000
  ): number[] {
    const positions: number[] = [];
    const searchLength = searchTerm.length;

    for (let i = 0; i < str.length; i += chunkSize) {
      // Include overlap to catch matches across chunk boundaries
      const end = Math.min(i + chunkSize + searchLength - 1, str.length);
      const chunk = str.slice(i, end);

      let pos = chunk.indexOf(searchTerm);
      while (pos !== -1) {
        positions.push(i + pos);
        pos = chunk.indexOf(searchTerm, pos + 1);
      }
    }

    return positions;
  }
}

// Memory-efficient object operations
export class MemoryEfficientObject {
  // Deep clone with memory optimization
  static deepCloneOptimized<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // Use structured cloning for better memory efficiency
    if (typeof structuredClone !== 'undefined') {
      try {
        return structuredClone(obj);
      } catch {
        // Fall back to JSON method if structured clone fails
      }
    }

    // Fallback to JSON method (less memory efficient but widely supported)
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      // If JSON fails, use recursive approach
      return this.recursiveClone(obj);
    }
  }

  private static recursiveClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    if (obj instanceof Array) {
      return obj.map((item) => this.recursiveClone(item)) as unknown as T;
    }

    const cloned = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.recursiveClone(obj[key]);
      }
    }

    return cloned;
  }

  // Memory-efficient object comparison
  static shallowEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;

    if (obj1 == null || obj2 == null) return false;

    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      return obj1 === obj2;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key) || obj1[key] !== obj2[key]) {
        return false;
      }
    }

    return true;
  }
}

// Memory-efficient cache implementation
export class MemoryEfficientCache<K, V> {
  private cache = new Map<
    K,
    { value: V; timestamp: number; accessCount: number }
  >();
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(maxSize: number = 1000, ttl: number = 300000) {
    // 5 minutes default TTL
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key: K, value: V): void {
    // Clean expired entries before adding new one
    this.cleanExpired();

    // If at capacity, remove least recently used item
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0,
    });

    // Register with memory monitor for tracking
    memoryMonitor.registerCacheEntry(String(key), value);
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) return undefined;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Update access count for LRU tracking
    entry.accessCount++;
    entry.timestamp = Date.now(); // Update timestamp for LRU

    return entry.value;
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    this.cleanExpired();
    return this.cache.size;
  }

  private cleanExpired(): void {
    const now = Date.now();
    const expiredKeys: K[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => this.cache.delete(key));
  }

  private evictLRU(): void {
    let oldestKey: K | undefined;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey !== undefined) {
      this.cache.delete(oldestKey);
    }
  }

  // Get cache statistics
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    expiredCount: number;
  } {
    this.cleanExpired();

    let totalAccess = 0;
    let expiredCount = 0;
    const now = Date.now();

    for (const entry of this.cache.values()) {
      totalAccess += entry.accessCount;
      if (now - entry.timestamp > this.ttl) {
        expiredCount++;
      }
    }

    const hitRate = totalAccess > 0 ? (this.cache.size / totalAccess) * 100 : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate,
      expiredCount,
    };
  }
}

// Memory-efficient stream processing
export class MemoryEfficientStream {
  // Process readable stream with memory control
  static async processStream<T>(
    stream: ReadableStream<T>,
    processor: (chunk: T) => Promise<void> | void,
    options: {
      highWaterMark?: number;
      memoryThreshold?: number;
    } = {}
  ): Promise<void> {
    const { memoryThreshold = 80 } = options;
    const reader = stream.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // Check memory pressure
        const memoryStats = memoryMonitor.getCurrentMemoryStats();
        if (memoryStats && memoryStats.heapUsedPercent > memoryThreshold) {
          logger.warn('High memory usage during stream processing, pausing', {
            heapUsedPercent: memoryStats.heapUsedPercent,
          });

          await memoryMonitor.optimizeMemoryUsage();
        }

        await processor(value);

        // Yield control to event loop
        await new Promise((resolve) => setImmediate(resolve));
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// Export utility functions
export const memoryUtils = {
  processor: MemoryEfficientProcessor,
  string: MemoryEfficientString,
  object: MemoryEfficientObject,
  cache: MemoryEfficientCache,
  stream: MemoryEfficientStream,
};

// Memory-efficient decorator for functions
export function withMemoryOptimization<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    memoryThreshold?: number;
    enablePooling?: boolean;
    poolName?: string;
  } = {}
): T {
  const { memoryThreshold = 85, enablePooling = false, poolName } = options;

  return ((...args: Parameters<T>): ReturnType<T> => {
    // Check memory before execution
    const memoryStats = memoryMonitor.getCurrentMemoryStats();
    if (memoryStats && memoryStats.heapUsedPercent > memoryThreshold) {
      logger.warn('High memory usage before function execution', {
        functionName: fn.name,
        heapUsedPercent: memoryStats.heapUsedPercent,
      });
    }

    // Use object pooling if enabled
    if (enablePooling && poolName) {
      const pooledResult = memoryMonitor.getPooledObject(poolName, () =>
        fn(...args)
      );
      return pooledResult;
    }

    return fn(...args);
  }) as T;
}
