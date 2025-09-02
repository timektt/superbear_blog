/**
 * Responsive design testing utilities
 * Provides tools for testing layouts across different screen sizes and devices
 */

export interface Breakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
  description: string;
}

export interface DevicePreset {
  name: string;
  width: number;
  height: number;
  pixelRatio: number;
  userAgent: string;
  type: 'mobile' | 'tablet' | 'desktop';
}

export interface ResponsiveTestResult {
  breakpoint: string;
  width: number;
  height: number;
  issues: ResponsiveIssue[];
  score: number;
}

export interface ResponsiveIssue {
  type: 'layout' | 'typography' | 'spacing' | 'interaction' | 'performance';
  severity: 'low' | 'medium' | 'high';
  message: string;
  element?: Element;
  suggestion?: string;
}

/**
 * Standard breakpoints based on Tailwind CSS
 */
export const breakpoints: Breakpoint[] = [
  { name: 'xs', minWidth: 0, maxWidth: 639, description: 'Extra small devices' },
  { name: 'sm', minWidth: 640, maxWidth: 767, description: 'Small devices' },
  { name: 'md', minWidth: 768, maxWidth: 1023, description: 'Medium devices' },
  { name: 'lg', minWidth: 1024, maxWidth: 1279, description: 'Large devices' },
  { name: 'xl', minWidth: 1280, maxWidth: 1535, description: 'Extra large devices' },
  { name: '2xl', minWidth: 1536, description: 'Ultra wide devices' },
];

/**
 * Common device presets for testing
 */
export const devicePresets: DevicePreset[] = [
  // Mobile devices
  {
    name: 'iPhone SE',
    width: 375,
    height: 667,
    pixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    type: 'mobile'
  },
  {
    name: 'iPhone 12 Pro',
    width: 390,
    height: 844,
    pixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    type: 'mobile'
  },
  {
    name: 'Samsung Galaxy S21',
    width: 360,
    height: 800,
    pixelRatio: 3,
    userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36',
    type: 'mobile'
  },
  
  // Tablet devices
  {
    name: 'iPad',
    width: 768,
    height: 1024,
    pixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    type: 'tablet'
  },
  {
    name: 'iPad Pro 11"',
    width: 834,
    height: 1194,
    pixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    type: 'tablet'
  },
  
  // Desktop devices
  {
    name: 'MacBook Air',
    width: 1366,
    height: 768,
    pixelRatio: 1,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    type: 'desktop'
  },
  {
    name: 'Desktop 1080p',
    width: 1920,
    height: 1080,
    pixelRatio: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    type: 'desktop'
  },
  {
    name: 'Desktop 4K',
    width: 3840,
    height: 2160,
    pixelRatio: 2,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    type: 'desktop'
  },
];

/**
 * Get current breakpoint based on window width
 */
export function getCurrentBreakpoint(): Breakpoint | null {
  if (typeof window === 'undefined') return null;
  
  const width = window.innerWidth;
  return breakpoints.find(bp => 
    width >= bp.minWidth && (bp.maxWidth === undefined || width <= bp.maxWidth)
  ) || null;
}

/**
 * Test responsive layout at different breakpoints
 */
export class ResponsiveTester {
  private originalViewport: { width: number; height: number } | null = null;
  private testResults: ResponsiveTestResult[] = [];
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.originalViewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
    }
  }
  
  /**
   * Test layout at specific viewport size
   */
  async testViewport(width: number, height: number): Promise<ResponsiveTestResult> {
    if (typeof window === 'undefined') {
      throw new Error('ResponsiveTester can only be used in browser environment');
    }
    
    // Simulate viewport resize (for testing purposes)
    const breakpoint = breakpoints.find(bp => 
      width >= bp.minWidth && (bp.maxWidth === undefined || width <= bp.maxWidth)
    );
    
    const issues: ResponsiveIssue[] = [];
    
    // Test 1: Check for horizontal scrollbars
    if (document.body.scrollWidth > width) {
      issues.push({
        type: 'layout',
        severity: 'high',
        message: 'Horizontal scrollbar detected',
        suggestion: 'Ensure all content fits within the viewport width'
      });
    }
    
    // Test 2: Check for tiny touch targets on mobile
    if (width < 768) {
      const interactiveElements = document.querySelectorAll('button, a, input, [role="button"]');
      interactiveElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
          issues.push({
            type: 'interaction',
            severity: 'medium',
            message: 'Touch target too small',
            element,
            suggestion: 'Ensure touch targets are at least 44x44px'
          });
        }
      });
    }
    
    // Test 3: Check for text readability
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
    textElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const fontSize = parseFloat(styles.fontSize);
      
      if (width < 768 && fontSize < 14) {
        issues.push({
          type: 'typography',
          severity: 'medium',
          message: 'Text too small on mobile',
          element,
          suggestion: 'Use minimum 14px font size on mobile devices'
        });
      }
    });
    
    // Test 4: Check for proper spacing
    const containers = document.querySelectorAll('[class*="container"], [class*="max-w"]');
    containers.forEach(container => {
      const styles = window.getComputedStyle(container);
      const paddingLeft = parseFloat(styles.paddingLeft);
      const paddingRight = parseFloat(styles.paddingRight);
      
      if (width < 768 && (paddingLeft < 16 || paddingRight < 16)) {
        issues.push({
          type: 'spacing',
          severity: 'low',
          message: 'Insufficient mobile padding',
          element: container,
          suggestion: 'Use minimum 16px padding on mobile devices'
        });
      }
    });
    
    // Test 5: Check for performance issues
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      const naturalWidth = (img as HTMLImageElement).naturalWidth;
      
      if (naturalWidth > rect.width * 2) {
        issues.push({
          type: 'performance',
          severity: 'medium',
          message: 'Image oversized for display',
          element: img,
          suggestion: 'Use responsive images or appropriate sizing'
        });
      }
    });
    
    // Calculate score based on issues
    const score = Math.max(0, 100 - (
      issues.filter(i => i.severity === 'high').length * 20 +
      issues.filter(i => i.severity === 'medium').length * 10 +
      issues.filter(i => i.severity === 'low').length * 5
    ));
    
    return {
      breakpoint: breakpoint?.name || 'unknown',
      width,
      height,
      issues,
      score
    };
  }
  
  /**
   * Test all standard breakpoints
   */
  async testAllBreakpoints(): Promise<ResponsiveTestResult[]> {
    const results: ResponsiveTestResult[] = [];
    
    for (const breakpoint of breakpoints) {
      const testWidth = breakpoint.minWidth === 0 ? 375 : breakpoint.minWidth;
      const testHeight = Math.round(testWidth * 0.75); // Approximate aspect ratio
      
      const result = await this.testViewport(testWidth, testHeight);
      results.push(result);
      
      // Small delay to allow DOM updates
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.testResults = results;
    return results;
  }
  
  /**
   * Test specific device presets
   */
  async testDevicePresets(devices: DevicePreset[] = devicePresets): Promise<ResponsiveTestResult[]> {
    const results: ResponsiveTestResult[] = [];
    
    for (const device of devices) {
      const result = await this.testViewport(device.width, device.height);
      result.breakpoint = device.name;
      results.push(result);
      
      // Small delay to allow DOM updates
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }
  
  /**
   * Get overall responsive score
   */
  getOverallScore(): number {
    if (this.testResults.length === 0) return 0;
    
    const totalScore = this.testResults.reduce((sum, result) => sum + result.score, 0);
    return Math.round(totalScore / this.testResults.length);
  }
  
  /**
   * Get summary of all issues
   */
  getIssuesSummary(): { [key: string]: ResponsiveIssue[] } {
    const summary: { [key: string]: ResponsiveIssue[] } = {};
    
    this.testResults.forEach(result => {
      summary[result.breakpoint] = result.issues;
    });
    
    return summary;
  }
  
  /**
   * Generate responsive testing report
   */
  generateReport(): string {
    if (this.testResults.length === 0) {
      return 'No test results available. Run tests first.';
    }
    
    let report = '# Responsive Design Test Report\n\n';
    report += `Overall Score: ${this.getOverallScore()}/100\n\n`;
    
    this.testResults.forEach(result => {
      report += `## ${result.breakpoint} (${result.width}x${result.height})\n`;
      report += `Score: ${result.score}/100\n`;
      
      if (result.issues.length > 0) {
        report += '\n### Issues:\n';
        result.issues.forEach(issue => {
          report += `- **${issue.severity.toUpperCase()}**: ${issue.message}\n`;
          if (issue.suggestion) {
            report += `  *Suggestion: ${issue.suggestion}*\n`;
          }
        });
      } else {
        report += '\n✅ No issues found\n';
      }
      
      report += '\n';
    });
    
    return report;
  }
}

/**
 * Utility to check if element is visible at current viewport
 */
export function isElementVisible(element: Element): boolean {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= windowHeight &&
    rect.right <= windowWidth
  );
}

/**
 * Check if element has adequate touch target size
 */
export function hasAdequateTouchTarget(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width >= 44 && rect.height >= 44;
}

/**
 * Get responsive image recommendations
 */
export function getImageRecommendations(img: HTMLImageElement): string[] {
  const recommendations: string[] = [];
  const rect = img.getBoundingClientRect();
  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;
  
  if (naturalWidth > rect.width * 2) {
    recommendations.push('Consider using a smaller image or responsive images');
  }
  
  if (!img.loading || img.loading !== 'lazy') {
    recommendations.push('Consider adding lazy loading for better performance');
  }
  
  if (!img.sizes) {
    recommendations.push('Consider adding sizes attribute for responsive images');
  }
  
  if (naturalWidth / naturalHeight !== rect.width / rect.height) {
    recommendations.push('Image aspect ratio doesn\'t match display ratio');
  }
  
  return recommendations;
}

/**
 * Monitor viewport changes and trigger callbacks
 */
export class ViewportMonitor {
  private callbacks: ((breakpoint: Breakpoint | null) => void)[] = [];
  private currentBreakpoint: Breakpoint | null = null;
  private resizeTimeout: number | null = null;
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.currentBreakpoint = getCurrentBreakpoint();
      window.addEventListener('resize', this.handleResize.bind(this));
    }
  }
  
  private handleResize(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    this.resizeTimeout = window.setTimeout(() => {
      const newBreakpoint = getCurrentBreakpoint();
      
      if (newBreakpoint?.name !== this.currentBreakpoint?.name) {
        this.currentBreakpoint = newBreakpoint;
        this.callbacks.forEach(callback => callback(newBreakpoint));
      }
    }, 150);
  }
  
  onBreakpointChange(callback: (breakpoint: Breakpoint | null) => void): void {
    this.callbacks.push(callback);
  }
  
  removeCallback(callback: (breakpoint: Breakpoint | null) => void): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }
  
  getCurrentBreakpoint(): Breakpoint | null {
    return this.currentBreakpoint;
  }
  
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize.bind(this));
    }
    
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    this.callbacks = [];
  }
}