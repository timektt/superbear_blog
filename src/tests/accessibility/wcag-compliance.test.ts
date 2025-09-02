/**
 * @jest-environment jsdom
 */

import {
  checkColorContrast,
  validateAriaAttributes,
  checkKeyboardNavigation,
  checkSemanticStructure,
  auditAccessibility,
  screenReaderUtils,
  type AccessibilityIssue,
  type ColorContrastResult,
} from '@/lib/accessibility/testing-utils';

describe('WCAG 2.1 AA Compliance Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('Color Contrast', () => {
    it('should pass AA standards for normal text', () => {
      const result = checkColorContrast('#000000', '#ffffff', 16, false);
      expect(result.level).toBe('AAA');
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should pass AA standards for large text', () => {
      const result = checkColorContrast('#666666', '#ffffff', 18, false);
      expect(result.level).toBeIn(['AA', 'AAA']);
      expect(result.ratio).toBeGreaterThanOrEqual(3);
    });

    it('should fail for insufficient contrast', () => {
      const result = checkColorContrast('#cccccc', '#ffffff', 16, false);
      expect(result.level).toBe('fail');
      expect(result.ratio).toBeLessThan(4.5);
    });

    it('should handle bold text correctly', () => {
      const result = checkColorContrast('#666666', '#ffffff', 14, true);
      expect(result.level).toBeIn(['AA', 'AAA']);
    });
  });

  describe('ARIA Attributes', () => {
    it('should detect missing alt text on images', () => {
      document.body.innerHTML = '<img src="test.jpg" />';
      const img = document.querySelector('img')!;
      const issues = validateAriaAttributes(img);
      
      expect(issues).toHaveLength(1);
      expect(issues[0].rule).toBe('img-alt');
      expect(issues[0].type).toBe('error');
    });

    it('should pass for images with alt text', () => {
      document.body.innerHTML = '<img src="test.jpg" alt="Test image" />';
      const img = document.querySelector('img')!;
      const issues = validateAriaAttributes(img);
      
      expect(issues).toHaveLength(0);
    });

    it('should detect unlabeled buttons', () => {
      document.body.innerHTML = '<button></button>';
      const button = document.querySelector('button')!;
      const issues = validateAriaAttributes(button);
      
      expect(issues).toHaveLength(1);
      expect(issues[0].rule).toBe('button-name');
      expect(issues[0].type).toBe('error');
    });

    it('should pass for properly labeled buttons', () => {
      document.body.innerHTML = '<button aria-label="Close dialog">×</button>';
      const button = document.querySelector('button')!;
      const issues = validateAriaAttributes(button);
      
      expect(issues).toHaveLength(0);
    });

    it('should detect unlabeled form inputs', () => {
      document.body.innerHTML = '<input type="text" />';
      const input = document.querySelector('input')!;
      const issues = validateAriaAttributes(input);
      
      expect(issues).toHaveLength(1);
      expect(issues[0].rule).toBe('label');
      expect(issues[0].type).toBe('error');
    });

    it('should pass for properly labeled inputs', () => {
      document.body.innerHTML = `
        <label for="email">Email</label>
        <input type="email" id="email" />
      `;
      const input = document.querySelector('input')!;
      const issues = validateAriaAttributes(input);
      
      expect(issues).toHaveLength(0);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should detect positive tabindex values', () => {
      document.body.innerHTML = '<button tabindex="1">Button</button>';
      const issues = checkKeyboardNavigation(document.body);
      
      const tabindexIssue = issues.find(i => i.rule === 'tabindex');
      expect(tabindexIssue).toBeDefined();
      expect(tabindexIssue?.type).toBe('warning');
    });

    it('should allow tabindex="0" and negative values', () => {
      document.body.innerHTML = `
        <button tabindex="0">Button 1</button>
        <button tabindex="-1">Button 2</button>
      `;
      const issues = checkKeyboardNavigation(document.body);
      
      const tabindexIssues = issues.filter(i => i.rule === 'tabindex');
      expect(tabindexIssues).toHaveLength(0);
    });
  });

  describe('Semantic Structure', () => {
    it('should detect missing landmark elements', () => {
      document.body.innerHTML = '<div>Content without landmarks</div>';
      const issues = checkSemanticStructure(document.body);
      
      const landmarkIssue = issues.find(i => i.rule === 'landmark');
      expect(landmarkIssue).toBeDefined();
      expect(landmarkIssue?.type).toBe('warning');
    });

    it('should pass with proper landmarks', () => {
      document.body.innerHTML = `
        <header>Header</header>
        <nav>Navigation</nav>
        <main>Main content</main>
        <footer>Footer</footer>
      `;
      const issues = checkSemanticStructure(document.body);
      
      const landmarkIssues = issues.filter(i => i.rule === 'landmark');
      expect(landmarkIssues).toHaveLength(0);
    });

    it('should detect improper list structure', () => {
      document.body.innerHTML = '<div><li>Invalid list item</li></div>';
      const issues = checkSemanticStructure(document.body);
      
      const listIssue = issues.find(i => i.rule === 'listitem');
      expect(listIssue).toBeDefined();
      expect(listIssue?.type).toBe('error');
    });

    it('should pass with proper list structure', () => {
      document.body.innerHTML = `
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      `;
      const issues = checkSemanticStructure(document.body);
      
      const listIssues = issues.filter(i => i.rule === 'listitem');
      expect(listIssues).toHaveLength(0);
    });
  });

  describe('Screen Reader Utilities', () => {
    it('should get accessible name from aria-label', () => {
      document.body.innerHTML = '<button aria-label="Close dialog">×</button>';
      const button = document.querySelector('button')!;
      const name = screenReaderUtils.getAccessibleName(button);
      
      expect(name).toBe('Close dialog');
    });

    it('should get accessible name from aria-labelledby', () => {
      document.body.innerHTML = `
        <span id="label">Submit form</span>
        <button aria-labelledby="label">Submit</button>
      `;
      const button = document.querySelector('button')!;
      const name = screenReaderUtils.getAccessibleName(button);
      
      expect(name).toBe('Submit form');
    });

    it('should get accessible name from text content', () => {
      document.body.innerHTML = '<button>Click me</button>';
      const button = document.querySelector('button')!;
      const name = screenReaderUtils.getAccessibleName(button);
      
      expect(name).toBe('Click me');
    });

    it('should detect focusable elements', () => {
      document.body.innerHTML = `
        <button>Button</button>
        <a href="#">Link</a>
        <input type="text" />
        <div>Not focusable</div>
      `;
      
      const button = document.querySelector('button')!;
      const link = document.querySelector('a')!;
      const input = document.querySelector('input')!;
      const div = document.querySelector('div')!;
      
      expect(screenReaderUtils.isFocusable(button)).toBe(true);
      expect(screenReaderUtils.isFocusable(link)).toBe(true);
      expect(screenReaderUtils.isFocusable(input)).toBe(true);
      expect(screenReaderUtils.isFocusable(div)).toBe(false);
    });

    it('should get element roles correctly', () => {
      document.body.innerHTML = `
        <button>Button</button>
        <a href="#">Link</a>
        <nav>Navigation</nav>
        <div role="banner">Banner</div>
      `;
      
      const button = document.querySelector('button')!;
      const link = document.querySelector('a')!;
      const nav = document.querySelector('nav')!;
      const banner = document.querySelector('[role="banner"]')!;
      
      expect(screenReaderUtils.getRole(button)).toBe('button');
      expect(screenReaderUtils.getRole(link)).toBe('link');
      expect(screenReaderUtils.getRole(nav)).toBe('navigation');
      expect(screenReaderUtils.getRole(banner)).toBe('banner');
    });
  });

  describe('Comprehensive Accessibility Audit', () => {
    it('should provide a complete accessibility report', () => {
      document.body.innerHTML = `
        <header>
          <nav>
            <a href="/">Home</a>
            <button aria-label="Menu">☰</button>
          </nav>
        </header>
        <main>
          <h1>Page Title</h1>
          <img src="hero.jpg" alt="Hero image" />
          <p>Content goes here</p>
        </main>
        <footer>
          <p>&copy; 2024 Company</p>
        </footer>
      `;
      
      const audit = auditAccessibility(document.body);
      
      expect(audit.summary.score).toBeGreaterThan(80);
      expect(audit.summary.errors).toBe(0);
      expect(audit.issues).toBeInstanceOf(Array);
    });

    it('should detect multiple issues and calculate score', () => {
      document.body.innerHTML = `
        <div>
          <img src="test.jpg" />
          <button></button>
          <input type="text" />
          <li>Orphaned list item</li>
        </div>
      `;
      
      const audit = auditAccessibility(document.body);
      
      expect(audit.summary.errors).toBeGreaterThan(0);
      expect(audit.summary.score).toBeLessThan(100);
      expect(audit.issues.length).toBeGreaterThan(0);
    });
  });
});

describe('Component-Specific Accessibility Tests', () => {
  describe('Article Card Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      document.body.innerHTML = `
        <article role="article" aria-labelledby="article-title-test" aria-describedby="article-summary-test">
          <a href="/article/test" aria-label="Read article: Test Article">
            <img src="test.jpg" alt="Featured image for Test Article" />
            <h3 id="article-title-test">Test Article</h3>
            <p id="article-summary-test">Article summary</p>
          </a>
        </article>
      `;
      
      const audit = auditAccessibility(document.body);
      expect(audit.summary.errors).toBe(0);
    });
  });

  describe('Navigation Accessibility', () => {
    it('should have proper keyboard navigation', () => {
      document.body.innerHTML = `
        <nav role="navigation" aria-label="Main navigation">
          <button 
            id="more-menu-button"
            aria-expanded="false"
            aria-haspopup="menu"
            aria-label="More navigation options"
          >
            More
          </button>
          <div role="menu" aria-labelledby="more-menu-button">
            <a href="/page1" role="menuitem">Page 1</a>
            <a href="/page2" role="menuitem">Page 2</a>
          </div>
        </nav>
      `;
      
      const audit = auditAccessibility(document.body);
      expect(audit.summary.errors).toBe(0);
    });
  });

  describe('Form Accessibility', () => {
    it('should have proper form labels and descriptions', () => {
      document.body.innerHTML = `
        <form>
          <label for="email">Email Address</label>
          <input 
            type="email" 
            id="email" 
            aria-describedby="email-help"
            aria-required="true"
          />
          <div id="email-help">We'll never share your email</div>
          
          <button type="submit">Subscribe</button>
        </form>
      `;
      
      const audit = auditAccessibility(document.body);
      expect(audit.summary.errors).toBe(0);
    });
  });
});

// Custom Jest matchers for accessibility testing
expect.extend({
  toBeIn(received: any, expected: any[]) {
    const pass = expected.includes(received);
    return {
      message: () => `expected ${received} to be in [${expected.join(', ')}]`,
      pass,
    };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeIn(expected: any[]): R;
    }
  }
}