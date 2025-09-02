/**
 * Accessibility testing utilities for WCAG 2.1 AA compliance
 * Provides automated testing helpers for accessibility features
 */

export interface AccessibilityTestResult {
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
  element?: HTMLElement;
}

export interface ColorContrastResult {
  ratio: number;
  passes: {
    aa: boolean;
    aaa: boolean;
    aaLarge: boolean;
    aaaLarge: boolean;
  };
  foreground: string;
  background: string;
}

/**
 * Test color contrast ratios for WCAG compliance
 */
export function testColorContrast(
  foreground: string,
  background: string
): ColorContrastResult {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Calculate relative luminance
    const sRGB = [r, g, b].map((c) => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };

  const fgLuminance = getLuminance(foreground);
  const bgLuminance = getLuminance(background);

  const ratio =
    (Math.max(fgLuminance, bgLuminance) + 0.05) /
    (Math.min(fgLuminance, bgLuminance) + 0.05);

  return {
    ratio,
    passes: {
      aa: ratio >= 4.5,
      aaa: ratio >= 7,
      aaLarge: ratio >= 3,
      aaaLarge: ratio >= 4.5,
    },
    foreground,
    background,
  };
}

/**
 * Test keyboard navigation for interactive elements
 */
export function testKeyboardNavigation(
  container: HTMLElement
): AccessibilityTestResult[] {
  const results: AccessibilityTestResult[] = [];
  
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  // Test if all interactive elements are focusable
  focusableElements.forEach((element, index) => {
    const htmlElement = element as HTMLElement;
    
    if (htmlElement.tabIndex < 0 && !htmlElement.hasAttribute('tabindex')) {
      results.push({
        passed: false,
        message: `Interactive element at index ${index} is not keyboard accessible`,
        severity: 'error',
        element: htmlElement,
      });
    }

    // Test for proper focus indicators
    const computedStyle = window.getComputedStyle(htmlElement, ':focus');
    const hasOutline = computedStyle.outline !== 'none';
    const hasBoxShadow = computedStyle.boxShadow !== 'none';
    const hasFocusRing = htmlElement.classList.contains('focus:ring') || 
                        htmlElement.classList.contains('focus-visible:ring');

    if (!hasOutline && !hasBoxShadow && !hasFocusRing) {
      results.push({
        passed: false,
        message: `Element at index ${index} lacks visible focus indicator`,
        severity: 'warning',
        element: htmlElement,
      });
    }
  });

  return results;
}

/**
 * Test ARIA attributes for validity
 */
export function testAriaAttributes(
  container: HTMLElement
): AccessibilityTestResult[] {
  const results: AccessibilityTestResult[] = [];
  
  const elementsWithAria = container.querySelectorAll('[aria-expanded], [aria-haspopup], [aria-controls], [role]');

  elementsWithAria.forEach((element) => {
    const htmlElement = element as HTMLElement;
    
    // Test aria-expanded
    const ariaExpanded = htmlElement.getAttribute('aria-expanded');
    if (ariaExpanded && !['true', 'false'].includes(ariaExpanded)) {
      results.push({
        passed: false,
        message: `Invalid aria-expanded value: ${ariaExpanded}`,
        severity: 'error',
        element: htmlElement,
      });
    }

    // Test aria-haspopup
    const ariaHaspopup = htmlElement.getAttribute('aria-haspopup');
    if (ariaHaspopup && !['true', 'false', 'menu', 'listbox', 'tree', 'grid', 'dialog'].includes(ariaHaspopup)) {
      results.push({
        passed: false,
        message: `Invalid aria-haspopup value: ${ariaHaspopup}`,
        severity: 'error',
        element: htmlElement,
      });
    }

    // Test aria-controls references
    const ariaControls = htmlElement.getAttribute('aria-controls');
    if (ariaControls) {
      const controlledElement = document.getElementById(ariaControls);
      if (!controlledElement) {
        results.push({
          passed: false,
          message: `aria-controls references non-existent element: ${ariaControls}`,
          severity: 'error',
          element: htmlElement,
        });
      }
    }

    // Test role validity
    const role = htmlElement.getAttribute('role');
    const validRoles = [
      'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
      'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
      'contentinfo', 'definition', 'dialog', 'directory', 'document',
      'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
      'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
      'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
      'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
      'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
      'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
      'slider', 'spinbutton', 'status', 'switch', 'tab', 'table',
      'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar',
      'tooltip', 'tree', 'treegrid', 'treeitem'
    ];

    if (role && !validRoles.includes(role)) {
      results.push({
        passed: false,
        message: `Invalid role: ${role}`,
        severity: 'error',
        element: htmlElement,
      });
    }
  });

  return results;
}

/**
 * Test for proper heading hierarchy
 */
export function testHeadingHierarchy(
  container: HTMLElement
): AccessibilityTestResult[] {
  const results: AccessibilityTestResult[] = [];
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  let previousLevel = 0;
  
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));
    
    if (index === 0 && level !== 1) {
      results.push({
        passed: false,
        message: `First heading should be h1, found ${heading.tagName.toLowerCase()}`,
        severity: 'warning',
        element: heading as HTMLElement,
      });
    }
    
    if (level > previousLevel + 1) {
      results.push({
        passed: false,
        message: `Heading level skipped from h${previousLevel} to h${level}`,
        severity: 'warning',
        element: heading as HTMLElement,
      });
    }
    
    previousLevel = level;
  });

  return results;
}

/**
 * Test for alt text on images
 */
export function testImageAltText(
  container: HTMLElement
): AccessibilityTestResult[] {
  const results: AccessibilityTestResult[] = [];
  const images = container.querySelectorAll('img');

  images.forEach((img) => {
    const alt = img.getAttribute('alt');
    
    if (alt === null) {
      results.push({
        passed: false,
        message: 'Image missing alt attribute',
        severity: 'error',
        element: img,
      });
    } else if (alt === '') {
      // Empty alt is valid for decorative images
      results.push({
        passed: true,
        message: 'Decorative image with empty alt text',
        severity: 'info',
        element: img,
      });
    } else if (alt.length > 125) {
      results.push({
        passed: false,
        message: 'Alt text too long (should be under 125 characters)',
        severity: 'warning',
        element: img,
      });
    }
  });

  return results;
}

/**
 * Test for proper form labels
 */
export function testFormLabels(
  container: HTMLElement
): AccessibilityTestResult[] {
  const results: AccessibilityTestResult[] = [];
  const formControls = container.querySelectorAll('input, select, textarea');

  formControls.forEach((control) => {
    const htmlControl = control as HTMLInputElement;
    const id = htmlControl.id;
    const ariaLabel = htmlControl.getAttribute('aria-label');
    const ariaLabelledby = htmlControl.getAttribute('aria-labelledby');
    
    // Skip hidden inputs
    if (htmlControl.type === 'hidden') return;
    
    let hasLabel = false;
    
    if (id) {
      const label = container.querySelector(`label[for="${id}"]`);
      if (label) hasLabel = true;
    }
    
    if (ariaLabel || ariaLabelledby) hasLabel = true;
    
    if (!hasLabel) {
      results.push({
        passed: false,
        message: 'Form control missing accessible label',
        severity: 'error',
        element: htmlControl,
      });
    }
  });

  return results;
}

/**
 * Run comprehensive accessibility audit
 */
export function runAccessibilityAudit(
  container: HTMLElement = document.body
): {
  passed: boolean;
  results: AccessibilityTestResult[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
} {
  const allResults: AccessibilityTestResult[] = [
    ...testKeyboardNavigation(container),
    ...testAriaAttributes(container),
    ...testHeadingHierarchy(container),
    ...testImageAltText(container),
    ...testFormLabels(container),
  ];

  const summary = {
    errors: allResults.filter(r => r.severity === 'error').length,
    warnings: allResults.filter(r => r.severity === 'warning').length,
    info: allResults.filter(r => r.severity === 'info').length,
  };

  return {
    passed: summary.errors === 0,
    results: allResults,
    summary,
  };
}

/**
 * Screen reader testing utilities
 */
export const screenReaderTesting = {
  /**
   * Test if element is properly announced by screen readers
   */
  testAnnouncement(element: HTMLElement): AccessibilityTestResult {
    const computedName = this.getAccessibleName(element);
    
    if (!computedName) {
      return {
        passed: false,
        message: 'Element has no accessible name for screen readers',
        severity: 'error',
        element,
      };
    }

    return {
      passed: true,
      message: `Element accessible name: "${computedName}"`,
      severity: 'info',
      element,
    };
  },

  /**
   * Get the accessible name of an element
   */
  getAccessibleName(element: HTMLElement): string {
    // Check aria-label first
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Check aria-labelledby
    const ariaLabelledby = element.getAttribute('aria-labelledby');
    if (ariaLabelledby) {
      const labelElement = document.getElementById(ariaLabelledby);
      if (labelElement) return labelElement.textContent || '';
    }

    // Check associated label
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent || '';
    }

    // Check text content
    return element.textContent || '';
  },

  /**
   * Test live regions
   */
  testLiveRegions(container: HTMLElement): AccessibilityTestResult[] {
    const results: AccessibilityTestResult[] = [];
    const liveRegions = container.querySelectorAll('[aria-live]');

    liveRegions.forEach((region) => {
      const ariaLive = region.getAttribute('aria-live');
      if (!['off', 'polite', 'assertive'].includes(ariaLive || '')) {
        results.push({
          passed: false,
          message: `Invalid aria-live value: ${ariaLive}`,
          severity: 'error',
          element: region as HTMLElement,
        });
      }
    });

    return results;
  },
};

/**
 * Performance impact testing for accessibility features
 */
export function testAccessibilityPerformance(): {
  ariaQueries: number;
  focusableElements: number;
  liveRegions: number;
  recommendations: string[];
} {
  const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
  const focusableElements = document.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const liveRegions = document.querySelectorAll('[aria-live]');

  const recommendations: string[] = [];

  if (ariaElements.length > 100) {
    recommendations.push('Consider reducing the number of ARIA attributes for better performance');
  }

  if (focusableElements.length > 50) {
    recommendations.push('Large number of focusable elements may impact keyboard navigation performance');
  }

  if (liveRegions.length > 5) {
    recommendations.push('Multiple live regions may cause screen reader announcement conflicts');
  }

  return {
    ariaQueries: ariaElements.length,
    focusableElements: focusableElements.length,
    liveRegions: liveRegions.length,
    recommendations,
  };
}