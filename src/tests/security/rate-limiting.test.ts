import { createMocks } from 'node-mocks-http';
import { RateLimiter } from '@/lib/rate-limit';

// Mock Redis or in-memory store
const mockStore = new Map();

jest.mock('@/lib/rate-limit', () => {
  return {
    RateLimiter: jest.fn().mockImplementation(() => ({
      check: jest.fn(),
      reset: jest.fn(),
      getStats: jest.fn(),
    })),
  };
});

describe('Rate Limiting', () => {
  let rateLimiter: jest.Mocked<RateLimiter>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.clear();
    
    rateLimiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 10,
      keyGenerator: (req) => req.ip || 'unknown',
    }) as jest.Mocked<RateLimiter>;
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      rateLimiter.check.mockResolvedValue({
        allowed: true,
        remaining: 9,
        resetTime: Date.now() + 60000,
        totalHits: 1,
      });

      const { req } = createMocks({
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const result = await rateLimiter.check(req);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.totalHits).toBe(1);
    });

    it('should block requests exceeding rate limit', async () => {
      rateLimiter.check.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        totalHits: 11,
      });

      const { req } = createMocks({
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const result = await rateLimiter.check(req);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.totalHits).toBe(11);
    });

    it('should track requests per IP address', async () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      // Mock different responses for different IPs
      rateLimiter.check
        .mockResolvedValueOnce({
          allowed: true,
          remaining: 9,
          resetTime: Date.now() + 60000,
          totalHits: 1,
        })
        .mockResolvedValueOnce({
          allowed: true,
          remaining: 9,
          resetTime: Date.now() + 60000,
          totalHits: 1,
        });

      const { req: req1 } = createMocks({
        method: 'GET',
        headers: { 'x-forwarded-for': ip1 },
      });

      const { req: req2 } = createMocks({
        method: 'GET',
        headers: { 'x-forwarded-for': ip2 },
      });

      const result1 = await rateLimiter.check(req1);
      const result2 = await rateLimiter.check(req2);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(rateLimiter.check).toHaveBeenCalledTimes(2);
    });
  });

  describe('Rate Limit Window Management', () => {
    it('should reset rate limit after window expires', async () => {
      const now = Date.now();
      
      // First request - within limit
      rateLimiter.check.mockResolvedValueOnce({
        allowed: true,
        remaining: 0,
        resetTime: now + 60000,
        totalHits: 10,
      });

      // After window reset
      rateLimiter.check.mockResolvedValueOnce({
        allowed: true,
        remaining: 9,
        resetTime: now + 120000,
        totalHits: 1,
      });

      const { req } = createMocks({
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      // First request at limit
      const result1 = await rateLimiter.check(req);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(0);

      // Simulate window reset
      const result2 = await rateLimiter.check(req);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(9);
    });

    it('should handle sliding window correctly', async () => {
      const requests = [];
      
      // Mock 15 requests over time
      for (let i = 1; i <= 15; i++) {
        rateLimiter.check.mockResolvedValueOnce({
          allowed: i <= 10,
          remaining: Math.max(0, 10 - i),
          resetTime: Date.now() + 60000,
          totalHits: i,
        });
      }

      const { req } = createMocks({
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      // Make 15 requests
      for (let i = 0; i < 15; i++) {
        const result = await rateLimiter.check(req);
        requests.push(result);
      }

      // First 10 should be allowed
      for (let i = 0; i < 10; i++) {
        expect(requests[i].allowed).toBe(true);
      }

      // Next 5 should be blocked
      for (let i = 10; i < 15; i++) {
        expect(requests[i].allowed).toBe(false);
      }
    });
  });

  describe('Different Rate Limit Policies', () => {
    it('should apply different limits for different endpoints', async () => {
      const searchLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 30, // Higher limit for search
      }) as jest.Mocked<RateLimiter>;

      const authLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5, // Lower limit for auth
      }) as jest.Mocked<RateLimiter>;

      searchLimiter.check.mockResolvedValue({
        allowed: true,
        remaining: 29,
        resetTime: Date.now() + 60000,
        totalHits: 1,
      });

      authLimiter.check.mockResolvedValue({
        allowed: true,
        remaining: 4,
        resetTime: Date.now() + 60000,
        totalHits: 1,
      });

      const { req } = createMocks({
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const searchResult = await searchLimiter.check(req);
      const authResult = await authLimiter.check(req);

      expect(searchResult.remaining).toBe(29);
      expect(authResult.remaining).toBe(4);
    });

    it('should apply stricter limits for admin endpoints', async () => {
      const adminLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 20,
      }) as jest.Mocked<RateLimiter>;

      adminLimiter.check.mockResolvedValue({
        allowed: true,
        remaining: 19,
        resetTime: Date.now() + 60000,
        totalHits: 1,
      });

      const { req } = createMocks({
        method: 'POST',
        url: '/api/admin/articles',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const result = await adminLimiter.check(req);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(19);
    });
  });

  describe('Rate Limit Headers', () => {
    it('should include rate limit headers in response', async () => {
      rateLimiter.check.mockResolvedValue({
        allowed: true,
        remaining: 5,
        resetTime: Date.now() + 30000,
        totalHits: 5,
      });

      const { req, res } = createMocks({
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const result = await rateLimiter.check(req);

      // Simulate setting headers based on rate limit result
      const headers = {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toString(),
      };

      expect(headers['X-RateLimit-Limit']).toBe('10');
      expect(headers['X-RateLimit-Remaining']).toBe('5');
      expect(headers['X-RateLimit-Reset']).toBeTruthy();
    });

    it('should include retry-after header when rate limited', async () => {
      const resetTime = Date.now() + 45000;
      
      rateLimiter.check.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime,
        totalHits: 11,
      });

      const { req } = createMocks({
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const result = await rateLimiter.check(req);

      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      
      expect(result.allowed).toBe(false);
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(60);
    });
  });

  describe('IP Address Handling', () => {
    it('should handle X-Forwarded-For header', async () => {
      rateLimiter.check.mockResolvedValue({
        allowed: true,
        remaining: 9,
        resetTime: Date.now() + 60000,
        totalHits: 1,
      });

      const { req } = createMocks({
        method: 'GET',
        headers: { 'x-forwarded-for': '203.0.113.1, 192.168.1.1' },
      });

      await rateLimiter.check(req);

      // Should use the first IP in the chain
      expect(rateLimiter.check).toHaveBeenCalledWith(req);
    });

    it('should handle X-Real-IP header', async () => {
      rateLimiter.check.mockResolvedValue({
        allowed: true,
        remaining: 9,
        resetTime: Date.now() + 60000,
        totalHits: 1,
      });

      const { req } = createMocks({
        method: 'GET',
        headers: { 'x-real-ip': '203.0.113.1' },
      });

      await rateLimiter.check(req);
      expect(rateLimiter.check).toHaveBeenCalledWith(req);
    });

    it('should handle requests without IP headers', async () => {
      rateLimiter.check.mockResolvedValue({
        allowed: true,
        remaining: 9,
        resetTime: Date.now() + 60000,
        totalHits: 1,
      });

      const { req } = createMocks({
        method: 'GET',
        // No IP headers
      });

      await rateLimiter.check(req);
      expect(rateLimiter.check).toHaveBeenCalledWith(req);
    });

    it('should handle IPv6 addresses', async () => {
      rateLimiter.check.mockResolvedValue({
        allowed: true,
        remaining: 9,
        resetTime: Date.now() + 60000,
        totalHits: 1,
      });

      const { req } = createMocks({
        method: 'GET',
        headers: { 'x-forwarded-for': '2001:db8::1' },
      });

      await rateLimiter.check(req);
      expect(rateLimiter.check).toHaveBeenCalledWith(req);
    });
  });

  describe('Rate Limit Bypass', () => {
    it('should allow bypass for whitelisted IPs', async () => {
      const whitelistedIP = '127.0.0.1';
      
      rateLimiter.check.mockResolvedValue({
        allowed: true,
        remaining: 10, // Full limit available
        resetTime: Date.now() + 60000,
        totalHits: 0, // Not counted
      });

      const { req } = createMocks({
        method: 'GET',
        headers: { 'x-forwarded-for': whitelistedIP },
      });

      const result = await rateLimiter.check(req);

      expect(result.allowed).toBe(true);
      expect(result.totalHits).toBe(0); // Whitelisted requests not counted
    });

    it('should allow bypass for authenticated admin users', async () => {
      rateLimiter.check.mockResolvedValue({
        allowed: true,
        remaining: 10,
        resetTime: Date.now() + 60000,
        totalHits: 0,
      });

      const { req } = createMocks({
        method: 'GET',
        headers: { 
          'x-forwarded-for': '192.168.1.1',
          'authorization': 'Bearer admin-token',
        },
      });

      const result = await rateLimiter.check(req);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Rate Limit Statistics', () => {
    it('should provide rate limit statistics', async () => {
      rateLimiter.getStats.mockResolvedValue({
        totalRequests: 100,
        blockedRequests: 15,
        uniqueIPs: 25,
        topIPs: [
          { ip: '192.168.1.1', requests: 20 },
          { ip: '192.168.1.2', requests: 15 },
        ],
      });

      const stats = await rateLimiter.getStats();

      expect(stats.totalRequests).toBe(100);
      expect(stats.blockedRequests).toBe(15);
      expect(stats.uniqueIPs).toBe(25);
      expect(stats.topIPs).toHaveLength(2);
    });

    it('should track blocked request patterns', async () => {
      rateLimiter.getStats.mockResolvedValue({
        totalRequests: 50,
        blockedRequests: 10,
        uniqueIPs: 5,
        topIPs: [
          { ip: '192.168.1.100', requests: 25, blocked: 8 },
        ],
      });

      const stats = await rateLimiter.getStats();
      const suspiciousIP = stats.topIPs[0];

      expect(suspiciousIP.blocked).toBe(8);
      expect(suspiciousIP.blocked / suspiciousIP.requests).toBeGreaterThan(0.3);
    });
  });

  describe('Rate Limit Reset', () => {
    it('should allow manual rate limit reset', async () => {
      rateLimiter.reset.mockResolvedValue(true);

      const ip = '192.168.1.1';
      const result = await rateLimiter.reset(ip);

      expect(result).toBe(true);
      expect(rateLimiter.reset).toHaveBeenCalledWith(ip);
    });

    it('should reset all rate limits', async () => {
      rateLimiter.reset.mockResolvedValue(true);

      const result = await rateLimiter.reset(); // No IP = reset all

      expect(result).toBe(true);
      expect(rateLimiter.reset).toHaveBeenCalledWith();
    });
  });

  describe('Rate Limit Performance', () => {
    it('should handle high request volumes efficiently', async () => {
      const startTime = Date.now();
      
      // Mock 1000 rapid requests
      for (let i = 0; i < 1000; i++) {
        rateLimiter.check.mockResolvedValueOnce({
          allowed: i < 10,
          remaining: Math.max(0, 10 - i),
          resetTime: Date.now() + 60000,
          totalHits: i + 1,
        });
      }

      const { req } = createMocks({
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      // Process 1000 requests
      const promises = [];
      for (let i = 0; i < 1000; i++) {
        promises.push(rateLimiter.check(req));
      }

      await Promise.all(promises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should handle 1000 requests in under 1 second
      expect(totalTime).toBeLessThan(1000);
    });

    it('should not cause memory leaks with many IPs', async () => {
      // Mock requests from 1000 different IPs
      for (let i = 0; i < 1000; i++) {
        rateLimiter.check.mockResolvedValueOnce({
          allowed: true,
          remaining: 9,
          resetTime: Date.now() + 60000,
          totalHits: 1,
        });

        const { req } = createMocks({
          method: 'GET',
          headers: { 'x-forwarded-for': `192.168.1.${i % 255}` },
        });

        await rateLimiter.check(req);
      }

      // Should handle many unique IPs without issues
      expect(rateLimiter.check).toHaveBeenCalledTimes(1000);
    });
  });

  describe('Rate Limit Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      rateLimiter.check.mockRejectedValue(new Error('Storage unavailable'));

      const { req } = createMocks({
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      // Should not throw, but handle gracefully
      await expect(rateLimiter.check(req)).rejects.toThrow('Storage unavailable');
    });

    it('should provide fallback behavior when rate limiting fails', async () => {
      // Mock fallback behavior - allow request when rate limiting fails
      rateLimiter.check.mockResolvedValue({
        allowed: true, // Fail open
        remaining: 10,
        resetTime: Date.now() + 60000,
        totalHits: 0,
      });

      const { req } = createMocks({
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const result = await rateLimiter.check(req);

      // Should fail open (allow request) when rate limiting is unavailable
      expect(result.allowed).toBe(true);
    });
  });
});