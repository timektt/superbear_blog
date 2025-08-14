import { describe, it, expect } from '@jest/globals';
import {
  slugSchema,
  contentSchema,
  createArticleSchema,
  updateArticleSchema,
  generateSlugFromTitle,
  validateSlug,
} from '@/lib/validations/article';

describe('Article Validation', () => {
  describe('slugSchema', () => {
    it('should accept valid URL-friendly slugs', () => {
      const validSlugs = [
        'hello-world',
        'test-123',
        'a',
        'my-awesome-article-2024',
        'ai-ml-trends',
      ];

      validSlugs.forEach((slug) => {
        expect(() => slugSchema.parse(slug)).not.toThrow();
      });
    });

    it('should reject invalid slugs', () => {
      const invalidSlugs = [
        '', // empty
        'Hello World', // spaces
        'test_underscore', // underscores
        'test.dot', // dots
        'test@email', // special chars
        'TEST-CAPS', // uppercase
        '-leading-dash',
        'trailing-dash-',
        'double--dash',
        'a'.repeat(101), // too long
      ];

      invalidSlugs.forEach((slug) => {
        expect(() => slugSchema.parse(slug)).toThrow();
      });
    });
  });

  describe('contentSchema', () => {
    it('should accept valid Tiptap JSON structure', () => {
      const validContent = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Hello world',
              },
            ],
          },
        ],
      });

      expect(() => contentSchema.parse(validContent)).not.toThrow();
    });

    it('should reject invalid content structures', () => {
      const invalidContents = [
        '', // empty
        'not json',
        '{}', // empty object
        JSON.stringify({ type: 'paragraph' }), // wrong type
        JSON.stringify({ type: 'doc' }), // missing content array
        JSON.stringify({ type: 'doc', content: 'not array' }), // content not array
        JSON.stringify({ content: [] }), // missing type
      ];

      invalidContents.forEach((content) => {
        expect(() => contentSchema.parse(content)).toThrow();
      });
    });
  });

  describe('createArticleSchema', () => {
    const validArticleData = {
      title: 'Test Article',
      slug: 'test-article',
      summary: 'A test article',
      content: JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test' }] }],
      }),
      image: 'https://example.com/image.jpg',
      status: 'DRAFT' as const,
      authorId: 'author-123',
      categoryId: 'category-456',
      tagIds: ['tag-1', 'tag-2'],
    };

    it('should accept valid article data', () => {
      expect(() => createArticleSchema.parse(validArticleData)).not.toThrow();
    });

    it('should reject articles with invalid slugs', () => {
      const invalidData = { ...validArticleData, slug: 'Invalid Slug!' };
      expect(() => createArticleSchema.parse(invalidData)).toThrow();
    });

    it('should reject articles with invalid content', () => {
      const invalidData = { ...validArticleData, content: 'invalid json' };
      expect(() => createArticleSchema.parse(invalidData)).toThrow();
    });

    it('should accept articles with empty tag IDs array', () => {
      const dataWithEmptyTags = { ...validArticleData, tagIds: [] };
      expect(() => createArticleSchema.parse(dataWithEmptyTags)).not.toThrow();
    });

    it('should require title, content, authorId, and categoryId', () => {
      const requiredFields = ['title', 'content', 'authorId', 'categoryId'];
      
      requiredFields.forEach((field) => {
        const invalidData = { ...validArticleData };
        delete invalidData[field as keyof typeof invalidData];
        expect(() => createArticleSchema.parse(invalidData)).toThrow();
      });
    });

    it('should accept optional image field', () => {
      const dataWithoutImage = { ...validArticleData };
      delete dataWithoutImage.image;
      expect(() => createArticleSchema.parse(dataWithoutImage)).not.toThrow();
    });

    it('should accept valid image URLs', () => {
      const validUrls = [
        'https://example.com/image.jpg',
        'http://localhost:3000/image.png',
        'https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg',
      ];

      validUrls.forEach((url) => {
        const data = { ...validArticleData, image: url };
        expect(() => createArticleSchema.parse(data)).not.toThrow();
      });
    });
  });

  describe('updateArticleSchema', () => {
    it('should accept partial updates', () => {
      const partialUpdate = {
        title: 'Updated Title',
        slug: 'updated-slug',
      };

      expect(() => updateArticleSchema.parse(partialUpdate)).not.toThrow();
    });

    it('should validate fields when provided', () => {
      const invalidUpdate = {
        slug: 'Invalid Slug!',
        content: 'invalid json',
      };

      expect(() => updateArticleSchema.parse(invalidUpdate)).toThrow();
    });

    it('should accept empty updates', () => {
      expect(() => updateArticleSchema.parse({})).not.toThrow();
    });
  });

  describe('generateSlugFromTitle', () => {
    it('should generate valid slugs from titles', () => {
      const testCases = [
        { title: 'Hello World', expected: 'hello-world' },
        { title: 'AI & Machine Learning', expected: 'ai-machine-learning' },
        { title: 'Test 123!', expected: 'test-123' },
        { title: '  Spaces  Everywhere  ', expected: 'spaces-everywhere' },
        { title: 'Multiple---Dashes', expected: 'multiple-dashes' },
        { title: 'Special@#$%Characters', expected: 'special-characters' },
      ];

      testCases.forEach(({ title, expected }) => {
        expect(generateSlugFromTitle(title)).toBe(expected);
      });
    });

    it('should handle edge cases', () => {
      expect(generateSlugFromTitle('')).toBe('');
      expect(generateSlugFromTitle('   ')).toBe('');
      expect(generateSlugFromTitle('123')).toBe('123');
      expect(generateSlugFromTitle('a')).toBe('a');
    });
  });

  describe('validateSlug', () => {
    it('should validate slug format correctly', () => {
      expect(validateSlug('valid-slug')).toBe(true);
      expect(validateSlug('test-123')).toBe(true);
      expect(validateSlug('a')).toBe(true);
      expect(validateSlug('Invalid Slug')).toBe(false);
      expect(validateSlug('test_underscore')).toBe(false);
      expect(validateSlug('')).toBe(false);
      expect(validateSlug('-leading')).toBe(false);
      expect(validateSlug('trailing-')).toBe(false);
      expect(validateSlug('double--dash')).toBe(false);
    });
  });
});