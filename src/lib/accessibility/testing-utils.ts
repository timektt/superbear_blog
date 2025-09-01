/**
 * Accessibility testing utilities for automated WCAG compliance checking
 * Provides runtime accessibility validation and reporting
 */

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  rule: string;
  description: string;
  element: Element;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagCriteria: string[];
}

export interface AccessibilityReport {
  issues: AccessibilityIssue[];
  passedRules: string[];
  timestamp: number;
  url: string;
  summary: {
    errors: number;
    warnings: number;
    passed: number;
  };
}

/**
 * Color contrast checker
 */
export class ColorContrastChecker {
  /**
   * Calculate relative luminance of a color
   */
  private getRelativeLuminance(rgb: [number, number, number]): number {
    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
    const l1 = this.getRelativeLuminance(color1);
    const l2 = this.getRelativeLuminance(color2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if contrast ratio meets WCAG standards
   */
  meetsWCAGStandards(
    ratio: number,
    level: 'AA' | 'AAA' = 'AA',
    isLargeText: boolean = false
  ): boolean {
    if (level === 'AA') {
      return isLargeText ? ratio >= 3 : ratio >= 4.5;
    } else {
      return isLargeText ? ratio >= 4.5 : ratio >= 7;
    }
  }

  /**
   * Extract RGB values from computed style
   */
  private extractRGB(color: string): [number, number, number] | null {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
    return null;
  }

  /**
   * Check contrast for an element
   */
  checkElementContrast(element: Element): {
    ratio: number;
    meetsAA: boolean;
    meetsAAA: boolean;
    isLargeText: boolean;
  } | null {
    const computedStyle = window.getComputedStyle(element);
    const color = this.extractRGB(computedStyle.color);
    const backgroundColor = this.extractRGB(computedStyle.backgroundColor);

    if (!color || !backgroundColor) {
      return null;
    }

    const fontSize = parseFloat(computedStyle.fontSize);
    const fontWeight = computedStyle.fontWeight;
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));

    const ratio = this.getContrastRatio(color, backgroundColor);

    return {
      ratio,
      meetsAA: this.meetsWCAGStandards(ratio, 'AA', isLargeText),
      meetsAAA: this.meetsWCAGStandards(ratio, 'AAA', isLargeText),
      isLargeText,
    };
  }
}

/**
 * Keyboard navigation tester
 */
export class KeyboardNavigationTester {
  private focusableElements: Element[] = [];
  private currentIndex = -1;

  /**
   * Get all focusable elements in order
   */
  getFocusableElements(container: Element = document.body): Element[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(container.querySelectorAll(selector))
      .filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      })
      .sort((a, b) => {
        const aTabIndex = parseInt(a.getAttribute('tabindex') || '0');
        const bTabIndex = parseInt(b.getAttribute('tabindex') || '0');
        return aTabIndex - bTabIndex;
      });
  }

  /**
   * Test tab navigation
   */
  testTabNavigation(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    this.focusableElements = this.getFocusableElements();

    // Check for tab traps
    const tabTraps = this.findTabTraps();
    issues.push(...tabTraps);

    // Check for missing focus indicators
    const missingFocusIndicators = this.findMissingFocusIndicators();
    issues.push(...missingFocusIndicators);

    return issues;
  }

  private findTabTraps(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    // Check for elements that might trap focus
    const modals = document.querySelectorAll('[role="dialog"], [role="alertdialog"]');
    
    modals.forEach(modal => {
      const modalFocusable = this.getFocusableElements(modal);
      if (modalFocusable.length === 0) {
        issues.push({
          type: 'error',
          rule: 'focus-trap',
          description: 'Modal dialog has no focusable elements',
          element: modal,
          impact: 'critical',
          wcagLevel: 'AA',
          wcagCriteria: ['2.1.2'],
        });
      }
    });

    return issues;
  }

  private findMissingFocusIndicators(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    this.focusableElements.forEach(element => {
      const style = window.getComputedStyle(element, ':focus');
      const hasOutline = style.outline !== 'none' && style.outline !== '0px';
      const hasBoxShadow = style.boxShadow !== 'none';
      const hasBackground = style.backgroundColor !== 'transparent';

      if (!hasOutline && !hasBoxShadow && !hasBackground) {
        issues.push({
          type: 'warning',
          rule: 'focus-indicator',
          description: 'Element lacks visible focus indicator',
          element,
          impact: 'serious',
          wcagLevel: 'AA',
          wcagCriteria: ['2.4.7'],
        });
      }
    });

    return issues;
  }
}

/**
 * ARIA attributes validator
 */
export class AriaValidator {
  /**
   * Validate ARIA attributes on an element
   */
  validateElement(element: Element): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Check for invalid ARIA attributes
    const ariaAttributes = this.getAriaAttributes(element);
    
    ariaAttributes.forEach(({ name, value }) => {
      const validation = this.validateAriaAttribute(name, value, element);
      if (validation) {
        issues.push(validation);
      }
    });

    // Check for required ARIA attributes
    const requiredAttributes = this.getRequiredAriaAttributes(element);
    requiredAttributes.forEach(attr => {
      if (!element.hasAttribute(attr)) {
        issues.push({
          type: 'error',
          rule: 'aria-required',
          description: `Missing required ARIA attribute: ${attr}`,
          element,
          impact: 'serious',
          wcagLevel: 'AA',
          wcagCriteria: ['4.1.2'],
        });
      }
    });

    return issues;
  }

  private getAriaAttributes(element: Element): Array<{ name: string; value: string }> {
    return Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('aria-'))
      .map(attr => ({ name: attr.name, value: attr.value }));
  }

  private validateAriaAttribute(
    name: string,
    value: string,
    element: Element
  ): AccessibilityIssue | null {
    const validations: Record<string, (value: string) => boolean> = {
      'aria-expanded': (v) => ['true', 'false'].includes(v),
      'aria-pressed': (v) => ['true', 'false', 'mixed'].includes(v),
      'aria-checked': (v) => ['true', 'false', 'mixed'].includes(v),
      'aria-selected': (v) => ['true', 'false'].includes(v),
      'aria-hidden': (v) => ['true', 'false'].includes(v),
      'aria-current': (v) => ['page', 'step', 'location', 'date', 'time', 'true', 'false'].includes(v),
      'aria-live': (v) => ['off', 'polite', 'assertive'].includes(v),
      'aria-haspopup': (v) => ['true', 'false', 'menu', 'listbox', 'tree', 'grid', 'dialog'].includes(v),
    };

    const validator = validations[name];
    if (validator && !validator(value)) {
      return {
        type: 'error',
        rule: 'aria-valid-value',
        description: `Invalid value "${value}" for ${name}`,
        element,
        impact: 'serious',
        wcagLevel: 'AA',
        wcagCriteria: ['4.1.2'],
      };
    }

    return null;
  }

  private getRequiredAriaAttributes(element: Element): string[] {
    const role = element.getAttribute('role');
    const tagName = element.tagName.toLowerCase();

    const requirements: Record<string, string[]> = {
      'button': [],
      'checkbox': ['aria-checked'],
      'radio': ['aria-checked'],
      'slider': ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
      'progressbar': ['aria-valuenow'],
      'tab': ['aria-selected'],
      'tabpanel': ['aria-labelledby'],
      'dialog': ['aria-labelledby'],
      'alertdialog': ['aria-labelledby'],
    };

    return requirements[role || tagName] || [];
  }
}

/**
 * Screen reader compatibility tester
 */
export class ScreenReaderTester {
  /**
   * Check for screen reader compatibility issues
   */
  checkCompatibility(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Check for images without alt text
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.hasAttribute('alt')) {
        issues.push({
          type: 'error',
          rule: 'img-alt',
          description: 'Image missing alt attribute',
          element: img,
          impact: 'critical',
          wcagLevel: 'A',
          wcagCriteria: ['1.1.1'],
        });
      }
    });

    // Check for form inputs without labels
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const hasLabel = this.hasAssociatedLabel(input);
      if (!hasLabel) {
        issues.push({
          type: 'error',
          rule: 'label-required',
          description: 'Form input missing associated label',
          element: input,
          impact: 'critical',
          wcagLevel: 'A',
          wcagCriteria: ['3.3.2'],
        });
      }
    });

    // Check for headings hierarchy
    const headingIssues = this.checkHeadingHierarchy();
    issues.push(...headingIssues);

    return issues;
  }

  private hasAssociatedLabel(input: Element): boolean {
    const id = input.getAttribute('id');
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledBy = input.getAttribute('aria-labelledby');

    if (ariaLabel || ariaLabelledBy) {
      return true;
    }

    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) {
        return true;
      }
    }

    // Check if input is wrapped in a label
    const parentLabel = input.closest('label');
    return !!parentLabel;
  }

  private checkHeadingHierarchy(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    
    let previousLevel = 0;
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (level > previousLevel + 1) {
        issues.push({
          type: 'warning',
          rule: 'heading-hierarchy',
          description: `Heading level ${level} skips level ${previousLevel + 1}`,
          element: heading,
          impact: 'moderate',
          wcagLevel: 'AA',
          wcagCriteria: ['2.4.6'],
        });
      }
      
      previousLevel = level;
    });

    return issues;
  }
}

/**
 * Main accessibility auditor
 */
export class AccessibilityAuditor {
  private colorChecker = new ColorContrastChecker();
  private keyboardTester = new KeyboardNavigationTester();
  private ariaValidator = new AriaValidator();
  private screenReaderTester = new ScreenReaderTester();

  /**
   * Run comprehensive accessibility audit
   */
  async audit(container: Element = document.body): Promise<AccessibilityReport> {
    const issues: AccessibilityIssue[] = [];
    const passedRules: string[] = [];

    // Color contrast check
    const textElements = container.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label');
    textElements.forEach(element => {
      const contrast = this.colorChecker.checkElementContrast(element);
      if (contrast && !contrast.meetsAA) {
        issues.push({
          type: 'error',
          rule: 'color-contrast',
          description: `Insufficient color contrast ratio: ${contrast.ratio.toFixed(2)}`,
          element,
          impact: 'serious',
          wcagLevel: 'AA',
          wcagCriteria: ['1.4.3'],
        });
      } else if (contrast?.meetsAA) {
        passedRules.push('color-contrast');
      }
    });

    // Keyboard navigation
    const keyboardIssues = this.keyboardTester.testTabNavigation();
    issues.push(...keyboardIssues);

    // ARIA validation
    const elementsWithAria = container.querySelectorAll('[role], [aria-label], [aria-labelledby], [aria-describedby]');
    elementsWithAria.forEach(element => {
      const ariaIssues = this.ariaValidator.validateElement(element);
      issues.push(...ariaIssues);
    });

    // Screen reader compatibility
    const screenReaderIssues = this.screenReaderTester.checkCompatibility();
    issues.push(...screenReaderIssues);

    const summary = {
      errors: issues.filter(i => i.type === 'error').length,
      warnings: issues.filter(i => i.type === 'warning').length,
      passed: passedRules.length,
    };

    return {
      issues,
      passedRules,
      timestamp: Date.now(),
      url: window.location.href,
      summary,
    };
  }

  /**
   * Generate accessibility report
   */
  generateReport(report: AccessibilityReport): string {
    const { issues, summary } = report;
    
    let reportText = `Accessibility Audit Report\n`;
    reportText += `URL: ${report.url}\n`;
    reportText += `Timestamp: ${new Date(report.timestamp).toISOString()}\n\n`;
    
    reportText += `Summary:\n`;
    reportText += `- Errors: ${summary.errors}\n`;
    reportText += `- Warnings: ${summary.warnings}\n`;
    reportText += `- Passed: ${summary.passed}\n\n`;

    if (issues.length > 0) {
      reportText += `Issues Found:\n\n`;
      
      issues.forEach((issue, index) => {
        reportText += `${index + 1}. ${issue.description}\n`;
        reportText += `   Type: ${issue.type}\n`;
        reportText += `   Impact: ${issue.impact}\n`;
        reportText += `   WCAG Level: ${issue.wcagLevel}\n`;
        reportText += `   Criteria: ${issue.wcagCriteria.join(', ')}\n`;
        reportText += `   Element: ${issue.element.tagName.toLowerCase()}`;
        if (issue.element.id) reportText += `#${issue.element.id}`;
        if (issue.element.className) reportText += `.${issue.element.className.split(' ').join('.')}`;
        reportText += `\n\n`;
      });
    }

    return reportText;
  }
}

/**
 * Real-time accessibility monitoring
 */
export class AccessibilityMonitor {
  private auditor = new AccessibilityAuditor();
  private mutationObserver?: MutationObserver;
  private issues: AccessibilityIssue[] = [];

  constructor() {
    this.initializeMutationObserver();
  }

  private initializeMutationObserver(): void {
    if (typeof window === 'undefined') return;

    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.auditElement(node as Element);
            }
          });
        }
      });
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private async auditElement(element: Element): Promise<void> {
    const report = await this.auditor.audit(element);
    
    // Filter out duplicate issues
    const newIssues = report.issues.filter(issue => 
      !this.issues.some(existing => 
        existing.rule === issue.rule && 
        existing.element === issue.element
      )
    );

    this.issues.push(...newIssues);

    // Report critical issues immediately
    newIssues.forEach(issue => {
      if (issue.impact === 'critical') {
        console.error(`🚨 Critical accessibility issue: ${issue.description}`, issue.element);
      }
    });
  }

  getIssues(): AccessibilityIssue[] {
    return [...this.issues];
  }

  clearIssues(): void {
    this.issues = [];
  }

  disconnect(): void {
    this.mutationObserver?.disconnect();
  }
}

/**
 * Initialize accessibility monitoring in development
 */
export function initAccessibilityMonitoring(): AccessibilityMonitor | null {
  if (process.env.NODE_ENV !== 'development') return null;

  const monitor = new AccessibilityMonitor();
  const auditor = new AccessibilityAuditor();
  
  // Run initial audit on page load
  window.addEventListener('load', async () => {
    const report = await auditor.audit();
    
    if (report.issues.length > 0) {
      console.group('🔍 Accessibility Issues Found');
      report.issues.forEach(issue => {
        const logFn = issue.type === 'error' ? console.error : console.warn;
        logFn(`${issue.description} (${issue.rule})`, issue.element);
      });
      console.groupEnd();
      
      // Show summary
      console.log(`📊 Summary: ${report.summary.errors} errors, ${report.summary.warnings} warnings`);
    } else {
      console.log('✅ No accessibility issues found');
    }
  });

  // Add keyboard shortcut to run audit (Ctrl+Shift+A)
  document.addEventListener('keydown', async (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      const report = await auditor.audit();
      console.log(auditor.generateReport(report));
    }
  });

  // Add keyboard shortcut to show live issues (Ctrl+Shift+I)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      const issues = monitor.getIssues();
      if (issues.length > 0) {
        console.group('🔴 Live Accessibility Issues');
        issues.forEach(issue => console.log(issue));
        console.groupEnd();
      } else {
        console.log('✅ No live accessibility issues');
      }
    }
  });

  return monitor;
}