import { articleSchema, loginSchema } from '@/lib/validations/article';

describe('Validation Schemas', () => {
  describe('articleSchema', () => {
    const validArticleData = {
      title: 'Test Article',
      slug: 'test-article',
      summary: 'This is a test article summary',
      content: { type: 'doc', content: [] },
      categoryId: '1',
      status: 'DRAFT',
    };

    it('should validate correct article data', () => {
      const result = articleSchema.safeParse(validArticleData);
      expect(result.success).toBe(true);
    });

    it('should require title', () => {
      const invalidData = { ...validArticleData, title: '' };
      const result = articleSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Title is required');
      }
    });

    it('should validate title length', () => {
      const invalidData = {
        ...validArticleData,
        title: 'a'.repeat(201), // Too long
      };
      const result = articleSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Title must be less than 200 characters'
        );
      }
    });

    it('should validate slug format', () => {
      const invalidData = { ...validArticleData, slug: 'Invalid Slug!' };
      const result = articleSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Slug must be URL-friendly'
        );
      }
    });

    it('should validate summary length', () => {
      const invalidData = {
        ...validArticleData,
        summary: 'a'.repeat(501), // Too long
      };
      const result = articleSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Summary must be less than 500 characters'
        );
      }
    });

    it('should require categoryId', () => {
      const invalidData = { ...validArticleData, categoryId: '' };
      const result = articleSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Category is required'
        );
      }
    });

    it('should validate status enum', () => {
      const invalidData = { ...validArticleData, status: 'INVALID_STATUS' };
      const result = articleSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid');
      }
    });

    it('should accept valid status values', () => {
      const statuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

      statuses.forEach((status) => {
        const data = { ...validArticleData, status };
        const result = articleSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should validate content structure', () => {
      const invalidData = {
        ...validArticleData,
        content: 'invalid content', // Should be object
      };
      const result = articleSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Content must be valid JSON'
        );
      }
    });

    it('should allow optional fields to be undefined', () => {
      const minimalData = {
        title: 'Test Article',
        categoryId: '1',
        status: 'DRAFT',
        content: { type: 'doc', content: [] },
      };

      const result = articleSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    it('should allow empty image URL', () => {
      const dataWithEmptyImage = {
        ...validArticleData,
        image: '',
      };
      const result = articleSchema.safeParse(dataWithEmptyImage);

      expect(result.success).toBe(true);
    });

    it('should accept valid image URLs', () => {
      const validUrls = [
        'https://example.com/image.jpg',
        'https://res.cloudinary.com/test/image/upload/v1/test.jpg',
        'http://localhost:3000/image.png',
      ];

      validUrls.forEach((image) => {
        const data = { ...validArticleData, image };
        const result = articleSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('loginSchema', () => {
    const validLoginData = {
      email: 'admin@example.com',
      password: 'password123',
    };

    it('should validate correct login data', () => {
      const result = loginSchema.safeParse(validLoginData);
      expect(result.success).toBe(true);
    });

    it('should require email', () => {
      const invalidData = { ...validLoginData, email: '' };
      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Email is required');
      }
    });

    it('should validate email format', () => {
      const invalidData = { ...validLoginData, email: 'invalid-email' };
      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Invalid email format'
        );
      }
    });

    it('should require password', () => {
      const invalidData = { ...validLoginData, password: '' };
      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Password is required'
        );
      }
    });

    it('should validate password length', () => {
      const invalidData = { ...validLoginData, password: '123' }; // Too short
      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Password must be at least 6 characters'
        );
      }
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'admin@test.co.uk',
        'user.name+tag@example.org',
        'user123@domain-name.com',
      ];

      validEmails.forEach((email) => {
        const data = { ...validLoginData, email };
        const result = loginSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'plainaddress',
        '@missingdomain.com',
        'missing@.com',
        'missing.domain@.com',
        'spaces in@email.com',
      ];

      invalidEmails.forEach((email) => {
        const data = { ...validLoginData, email };
        const result = loginSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });
});
