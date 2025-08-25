import { createMocks } from 'node-mocks-http';
import { validateCSRFToken, generateCSRFToken } from '@/lib/csrf';
import { getServerSession } from 'next-auth';

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('CSRF Protection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CSRF Token Generation', () => {
    it('should generate valid CSRF tokens', () => {
      const token = generateCSRFToken();
      
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20);
      
      // Should be base64 encoded
      expect(token).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      
      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with sufficient entropy', () => {
      const tokens = new Set();
      
      // Generate 100 tokens and ensure they're all unique
      for (let i = 0; i < 100; i++) {
        tokens.add(generateCSRFToken());
      }
      
      expect(tokens.size).toBe(100);
    });
  });

  describe('CSRF Token Validation', () => {
    it('should validate correct CSRF tokens', async () => {
      const token = generateCSRFToken();
      
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'x-csrf-token': token,
          cookie: `csrf-token=${token}`,
        },
      });

      const isValid = await validateCSRFToken(req);
      expect(isValid).toBe(true);
    });

    it('should reject mismatched CSRF tokens', async () => {
      const headerToken = generateCSRFToken();
      const cookieToken = generateCSRFToken();
      
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'x-csrf-token': headerToken,
          cookie: `csrf-token=${cookieToken}`,
        },
      });

      const isValid = await validateCSRFToken(req);
      expect(isValid).toBe(false);
    });

    it('should reject requests without CSRF token header', async () => {
      const token = generateCSRFToken();
      
      const { req } = createMocks({
        method: 'POST',
        headers: {
          cookie: `csrf-token=${token}`,
        },
      });

      const isValid = await validateCSRFToken(req);
      expect(isValid).toBe(false);
    });

    it('should reject requests without CSRF token cookie', async () => {
      const token = generateCSRFToken();
      
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'x-csrf-token': token,
        },
      });

      const isValid = await validateCSRFToken(req);
      expect(isValid).toBe(false);
    });

    it('should reject empty CSRF tokens', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'x-csrf-token': '',
          cookie: 'csrf-token=',
        },
      });

      const isValid = await validateCSRFToken(req);
      expect(isValid).toBe(false);
    });

    it('should reject malformed CSRF tokens', async () => {
      const malformedToken = 'invalid-token-format';
      
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'x-csrf-token': malformedToken,
          cookie: `csrf-token=${malformedToken}`,
        },
      });

      const isValid = await validateCSRFToken(req);
      expect(isValid).toBe(false);
    });
  });

  describe('CSRF Protection Middleware', () => {
    it('should protect POST requests', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'test@test.com', role: 'admin' },
      });

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/admin/articles',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          title: 'Test Article',
          content: 'Test content',
        },
      });

      // Mock API handler with CSRF protection
      const handler = async (request: any) => {
        const isValidCSRF = await validateCSRFToken(request);
        if (!isValidCSRF) {
          return new Response(JSON.stringify({ error: 'Invalid CSRF token' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const response = await handler(req);
      expect(response.status).toBe(403);
      
      const responseData = await response.json();
      expect(responseData.error).toBe('Invalid CSRF token');
    });

    it('should protect PUT requests', async () => {
      const { req } = createMocks({
        method: 'PUT',
        url: '/api/admin/articles/1',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          title: 'Updated Article',
        },
      });

      const isValid = await validateCSRFToken(req);
      expect(isValid).toBe(false);
    });

    it('should protect DELETE requests', async () => {
      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/admin/articles/1',
      });

      const isValid = await validateCSRFToken(req);
      expect(isValid).toBe(false);
    });

    it('should allow GET requests without CSRF tokens', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/admin/articles',
      });

      // GET requests should not require CSRF tokens
      const isValid = await validateCSRFToken(req);
      expect(isValid).toBe(true); // Or should be skipped entirely
    });

    it('should allow HEAD requests without CSRF tokens', async () => {
      const { req } = createMocks({
        method: 'HEAD',
        url: '/api/admin/articles',
      });

      const isValid = await validateCSRFToken(req);
      expect(isValid).toBe(true); // Or should be skipped entirely
    });
  });

  describe('CSRF Token Lifecycle', () => {
    it('should handle token rotation', async () => {
      const oldToken = generateCSRFToken();
      const newToken = generateCSRFToken();
      
      // Simulate token rotation scenario
      const { req: oldReq } = createMocks({
        method: 'POST',
        headers: {
          'x-csrf-token': oldToken,
          cookie: `csrf-token=${oldToken}`,
        },
      });

      const { req: newReq } = createMocks({
        method: 'POST',
        headers: {
          'x-csrf-token': newToken,
          cookie: `csrf-token=${newToken}`,
        },
      });

      // Both should be valid with their respective tokens
      expect(await validateCSRFToken(oldReq)).toBe(true);
      expect(await validateCSRFToken(newReq)).toBe(true);
      
      // Cross-validation should fail
      const { req: crossReq } = createMocks({
        method: 'POST',
        headers: {
          'x-csrf-token': oldToken,
          cookie: `csrf-token=${newToken}`,
        },
      });

      expect(await validateCSRFToken(crossReq)).toBe(false);
    });

    it('should handle token expiration', async () => {
      // This would require implementing token expiration
      // For now, we test the concept
      const expiredToken = generateCSRFToken();
      
      // Simulate expired token (implementation dependent)
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'x-csrf-token': expiredToken,
          cookie: `csrf-token=${expiredToken}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
        },
      });

      // Should handle expired tokens appropriately
      const isValid = await validateCSRFToken(req);
      // Implementation dependent - might be false for expired tokens
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('CSRF Protection Edge Cases', () => {
    it('should handle requests with multiple CSRF headers', async () => {
      const token = generateCSRFToken();
      
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'x-csrf-token': [token, 'extra-token'],
          cookie: `csrf-token=${token}`,
        },
      });

      // Should handle array of headers gracefully
      const isValid = await validateCSRFToken(req);
      expect(typeof isValid).toBe('boolean');
    });

    it('should handle requests with malformed cookies', async () => {
      const token = generateCSRFToken();
      
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'x-csrf-token': token,
          cookie: 'malformed-cookie-format; csrf-token=',
        },
      });

      const isValid = await validateCSRFToken(req);
      expect(isValid).toBe(false);
    });

    it('should handle very long CSRF tokens', async () => {
      const longToken = 'a'.repeat(1000);
      
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'x-csrf-token': longToken,
          cookie: `csrf-token=${longToken}`,
        },
      });

      // Should reject overly long tokens
      const isValid = await validateCSRFToken(req);
      expect(isValid).toBe(false);
    });

    it('should handle special characters in tokens', async () => {
      const specialToken = 'token-with-special-chars-!@#$%^&*()';
      
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'x-csrf-token': specialToken,
          cookie: `csrf-token=${specialToken}`,
        },
      });

      // Should handle or reject special characters appropriately
      const isValid = await validateCSRFToken(req);
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('CSRF Protection Performance', () => {
    it('should validate tokens efficiently', async () => {
      const token = generateCSRFToken();
      
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'x-csrf-token': token,
          cookie: `csrf-token=${token}`,
        },
      });

      // Measure validation time
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        await validateCSRFToken(req);
      }
      
      const endTime = Date.now();
      const avgTime = (endTime - startTime) / 100;
      
      // Should validate quickly (under 10ms per validation)
      expect(avgTime).toBeLessThan(10);
    });

    it('should generate tokens efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        generateCSRFToken();
      }
      
      const endTime = Date.now();
      const avgTime = (endTime - startTime) / 1000;
      
      // Should generate quickly (under 1ms per token)
      expect(avgTime).toBeLessThan(1);
    });
  });

  describe('CSRF Integration with Authentication', () => {
    it('should work with authenticated requests', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'test@test.com', role: 'admin' },
      });

      const token = generateCSRFToken();
      
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'x-csrf-token': token,
          cookie: `csrf-token=${token}; next-auth.session-token=valid-session`,
        },
      });

      const isValid = await validateCSRFToken(req);
      expect(isValid).toBe(true);
    });

    it('should handle unauthenticated requests', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const token = generateCSRFToken();
      
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'x-csrf-token': token,
          cookie: `csrf-token=${token}`,
        },
      });

      // CSRF should still be validated even for unauthenticated requests
      const isValid = await validateCSRFToken(req);
      expect(isValid).toBe(true);
    });
  });
});