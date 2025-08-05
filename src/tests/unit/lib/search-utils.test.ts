import {
  highlightSearchTerm,
  escapeRegExp,
  createSearchExcerpt,
  extractTextFromTiptapContent,
} from '@/lib/search-utils';

describe('search-utils', () => {
  describe('highlightSearchTerm', () => {
    it('should highlight single search term', () => {
      const text = 'React is a JavaScript library';
      const query = 'React';
      const result = highlightSearchTerm(text, query);

      expect(result).toBe(
        '<mark class="bg-yellow-200 px-1 rounded">React</mark> is a JavaScript library'
      );
    });

    it('should highlight multiple occurrences', () => {
      const text = 'React components make React development easier';
      const query = 'React';
      const result = highlightSearchTerm(text, query);

      expect(result).toBe(
        '<mark class="bg-yellow-200 px-1 rounded">React</mark> components make <mark class="bg-yellow-200 px-1 rounded">React</mark> development easier'
      );
    });

    it('should be case insensitive', () => {
      const text = 'React is awesome';
      const query = 'react';
      const result = highlightSearchTerm(text, query);

      expect(result).toBe(
        '<mark class="bg-yellow-200 px-1 rounded">React</mark> is awesome'
      );
    });

    it('should handle empty query', () => {
      const text = 'React is awesome';
      const query = '';
      const result = highlightSearchTerm(text, query);

      expect(result).toBe('React is awesome');
    });

    it('should handle special regex characters', () => {
      const text = 'Use React.js for development';
      const query = 'React.js';
      const result = highlightSearchTerm(text, query);

      expect(result).toBe(
        'Use <mark class="bg-yellow-200 px-1 rounded">React.js</mark> for development'
      );
    });
  });

  describe('escapeRegExp', () => {
    it('should escape special regex characters', () => {
      const input = 'test.with*special+chars?';
      const result = escapeRegExp(input);
      expect(result).toBe('test\\.with\\*special\\+chars\\?');
    });

    it('should handle empty string', () => {
      const result = escapeRegExp('');
      expect(result).toBe('');
    });
  });

  describe('createSearchExcerpt', () => {
    it('should create excerpt with search term centered', () => {
      const text =
        'This is a long text with React in the middle and more content after';
      const searchTerm = 'React';
      const result = createSearchExcerpt(text, searchTerm, 30);

      expect(result).toContain('React');
      expect(result.length).toBeLessThanOrEqual(36); // 30 + ellipsis
    });

    it('should return full text if shorter than maxLength', () => {
      const text = 'Short text with React';
      const searchTerm = 'React';
      const result = createSearchExcerpt(text, searchTerm, 100);

      expect(result).toBe(text);
    });

    it('should handle missing search term', () => {
      const text = 'This text does not contain the search term';
      const searchTerm = 'missing';
      const result = createSearchExcerpt(text, searchTerm, 20);

      expect(result).toBe('This text does not c...');
    });
  });

  describe('extractTextFromTiptapContent', () => {
    it('should extract text from Tiptap content', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Hello ' },
              { type: 'text', text: 'world!' },
            ],
          },
        ],
      };

      const result = extractTextFromTiptapContent(content);
      expect(result).toBe('Hello world!');
    });

    it('should handle empty content', () => {
      const result = extractTextFromTiptapContent(null);
      expect(result).toBe('');
    });

    it('should handle invalid content', () => {
      const result = extractTextFromTiptapContent('invalid');
      expect(result).toBe('');
    });
  });
});
