import { 
  generateSlug, 
  extractTextFromContent, 
  validateContent,
  sanitizeContent 
} from '@/lib/editor-utils'

describe('editor-utils', () => {
  describe('generateSlug', () => {
    it('should generate slug from title', () => {
      expect(generateSlug('Hello World')).toBe('hello-world')
      expect(generateSlug('React Testing Guide')).toBe('react-testing-guide')
      expect(generateSlug('AI & Machine Learning')).toBe('ai-machine-learning')
    })

    it('should handle special characters', () => {
      expect(generateSlug('React.js vs Vue.js')).toBe('reactjs-vs-vuejs')
      expect(generateSlug('C++ Programming')).toBe('c-programming')
      expect(generateSlug('Node.js & Express')).toBe('nodejs-express')
    })

    it('should handle multiple spaces and trim', () => {
      expect(generateSlug('  Multiple   Spaces  ')).toBe('multiple-spaces')
      expect(generateSlug('Title with    many    spaces')).toBe('title-with-many-spaces')
    })

    it('should handle empty or invalid input', () => {
      expect(generateSlug('')).toBe('')
      expect(generateSlug('   ')).toBe('')
      expect(generateSlug('123')).toBe('123')
    })

    it('should handle unicode characters', () => {
      expect(generateSlug('Café & Résumé')).toBe('café-résumé')
      expect(generateSlug('测试文章')).toBe('测试文章')
    })
  })

  describe('extractTextFromContent', () => {
    it('should extract text from Tiptap JSON content', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Hello ' },
              { type: 'text', text: 'world', marks: [{ type: 'bold' }] }
            ]
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [
              { type: 'text', text: 'Heading Text' }
            ]
          }
        ]
      }

      const result = extractTextFromContent(content)
      expect(result).toBe('Hello world Heading Text')
    })

    it('should handle empty content', () => {
      const content = { type: 'doc', content: [] }
      const result = extractTextFromContent(content)
      expect(result).toBe('')
    })

    it('should handle code blocks', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'javascript' },
            content: [
              { type: 'text', text: 'console.log("Hello");' }
            ]
          }
        ]
      }

      const result = extractTextFromContent(content)
      expect(result).toBe('console.log("Hello");')
    })

    it('should handle nested content structures', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: 'List item 1' }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }

      const result = extractTextFromContent(content)
      expect(result).toBe('List item 1')
    })
  })

  describe('validateContent', () => {
    it('should validate correct Tiptap content structure', () => {
      const validContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Valid content' }
            ]
          }
        ]
      }

      expect(validateContent(validContent)).toBe(true)
    })

    it('should reject invalid content structure', () => {
      const invalidContent = {
        type: 'invalid',
        content: 'not an array'
      }

      expect(validateContent(invalidContent)).toBe(false)
    })

    it('should reject content without type', () => {
      const invalidContent = {
        content: []
      }

      expect(validateContent(invalidContent)).toBe(false)
    })

    it('should handle null or undefined content', () => {
      expect(validateContent(null)).toBe(false)
      expect(validateContent(undefined)).toBe(false)
    })
  })

  describe('sanitizeContent', () => {
    it('should remove dangerous script tags from content', () => {
      const dangerousContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Safe content' }
            ]
          },
          {
            type: 'script',
            content: [
              { type: 'text', text: 'alert("xss")' }
            ]
          }
        ]
      }

      const sanitized = sanitizeContent(dangerousContent)
      expect(sanitized.content).toHaveLength(1)
      expect(sanitized.content[0].type).toBe('paragraph')
    })

    it('should preserve safe content', () => {
      const safeContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Safe content' }
            ]
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [
              { type: 'text', text: 'Safe heading' }
            ]
          }
        ]
      }

      const sanitized = sanitizeContent(safeContent)
      expect(sanitized).toEqual(safeContent)
    })

    it('should handle empty content', () => {
      const emptyContent = { type: 'doc', content: [] }
      const sanitized = sanitizeContent(emptyContent)
      expect(sanitized).toEqual(emptyContent)
    })
  })
})