/**
 * Enhanced animation utilities with cross-browser support
 * Provides smooth animations, transitions, and performance optimizations
 */

export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  fill?: 'none' | 'forwards' | 'backwards' | 'both';
  iterations?: number | 'infinite';
}

export interface TransitionConfig {
  property?: string;
  duration?: number;
  easing?: string;
  delay?: number;
}

/**
 * Easing functions for smooth animations
 */
export const easings = {
  // Standard easing
  ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
  easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
  
  // Custom easing for better UX
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  
  // Performance-optimized easing
  fastOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  slowIn: 'cubic-bezier(0.8, 0, 0.6, 1)',
  
  // Material Design easing
  standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
} as const;

/**
 * Animation presets for common UI patterns
 */
export const animations = {
  fadeIn: {
    keyframes: [
      { opacity: 0 },
      { opacity: 1 }
    ],
    options: { duration: 300, easing: easings.smooth, fill: 'forwards' as const }
  },
  
  fadeOut: {
    keyframes: [
      { opacity: 1 },
      { opacity: 0 }
    ],
    options: { duration: 300, easing: easings.smooth, fill: 'forwards' as const }
  },
  
  slideInUp: {
    keyframes: [
      { transform: 'translateY(20px)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ],
    options: { duration: 400, easing: easings.smooth, fill: 'forwards' as const }
  },
  
  slideInDown: {
    keyframes: [
      { transform: 'translateY(-20px)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ],
    options: { duration: 400, easing: easings.smooth, fill: 'forwards' as const }
  },
  
  slideInLeft: {
    keyframes: [
      { transform: 'translateX(-20px)', opacity: 0 },
      { transform: 'translateX(0)', opacity: 1 }
    ],
    options: { duration: 400, easing: easings.smooth, fill: 'forwards' as const }
  },
  
  slideInRight: {
    keyframes: [
      { transform: 'translateX(20px)', opacity: 0 },
      { transform: 'translateX(0)', opacity: 1 }
    ],
    options: { duration: 400, easing: easings.smooth, fill: 'forwards' as const }
  },
  
  scaleIn: {
    keyframes: [
      { transform: 'scale(0.95)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ],
    options: { duration: 300, easing: easings.smooth, fill: 'forwards' as const }
  },
  
  scaleOut: {
    keyframes: [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(0.95)', opacity: 0 }
    ],
    options: { duration: 300, easing: easings.smooth, fill: 'forwards' as const }
  },
  
  bounce: {
    keyframes: [
      { transform: 'translateY(0)' },
      { transform: 'translateY(-10px)' },
      { transform: 'translateY(0)' }
    ],
    options: { duration: 600, easing: easings.bounce, fill: 'forwards' as const }
  },
  
  pulse: {
    keyframes: [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.05)', opacity: 0.8 },
      { transform: 'scale(1)', opacity: 1 }
    ],
    options: { duration: 1000, easing: easings.smooth, iterations: 'infinite' as const }
  },
  
  shake: {
    keyframes: [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(0)' }
    ],
    options: { duration: 400, easing: easings.smooth, fill: 'forwards' as const }
  },
  
  spin: {
    keyframes: [
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(360deg)' }
    ],
    options: { duration: 1000, easing: 'linear', iterations: 'infinite' as const }
  }
} as const;

/**
 * Check if animations should be reduced based on user preference
 */
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animate an element with Web Animations API
 */
export function animate(
  element: Element,
  keyframes: Keyframe[],
  options: AnimationConfig = {}
): Animation | null {
  if (typeof window === 'undefined' || !element) return null;
  
  // Check if user prefers reduced motion
  if (shouldReduceMotion()) {
    // Apply final state immediately
    const finalFrame = keyframes[keyframes.length - 1];
    if (finalFrame && typeof finalFrame === 'object') {
      Object.assign((element as HTMLElement).style, finalFrame);
    }
    return null;
  }
  
  // Check for Web Animations API support
  if (!element.animate) {
    console.warn('Web Animations API not supported');
    return null;
  }
  
  const animationOptions: KeyframeAnimationOptions = {
    duration: options.duration || 300,
    delay: options.delay || 0,
    easing: options.easing || easings.smooth,
    fill: options.fill || 'forwards',
    iterations: typeof options.iterations === 'number' ? options.iterations : (options.iterations === 'infinite' ? Infinity : 1),
  };
  
  try {
    return element.animate(keyframes, animationOptions);
  } catch (error) {
    console.warn('Animation failed:', error);
    return null;
  }
}

/**
 * Apply a preset animation to an element
 */
export function applyAnimation(
  element: Element,
  animationName: keyof typeof animations,
  customOptions?: Partial<AnimationConfig>
): Animation | null {
  const animation = animations[animationName];
  if (!animation) {
    console.warn(`Animation "${animationName}" not found`);
    return null;
  }
  
  const options = { ...animation.options, ...customOptions };
  return animate(element, [...animation.keyframes], options);
}

/**
 * Create a staggered animation for multiple elements
 */
export function staggerAnimation(
  elements: Element[],
  animationName: keyof typeof animations,
  staggerDelay: number = 100,
  customOptions?: Partial<AnimationConfig>
): Animation[] {
  const animations: Animation[] = [];
  
  elements.forEach((element, index) => {
    const delay = (customOptions?.delay || 0) + (index * staggerDelay);
    const animation = applyAnimation(element, animationName, {
      ...customOptions,
      delay
    });
    
    if (animation) {
      animations.push(animation);
    }
  });
  
  return animations;
}

/**
 * Create smooth transitions for CSS properties
 */
export function createTransition(config: TransitionConfig): string {
  const {
    property = 'all',
    duration = 300,
    easing = easings.smooth,
    delay = 0
  } = config;
  
  return `${property} ${duration}ms ${easing} ${delay}ms`;
}

/**
 * Apply multiple transitions to an element
 */
export function applyTransitions(
  element: HTMLElement,
  transitions: TransitionConfig[]
): void {
  if (!element) return;
  
  const transitionStrings = transitions.map(createTransition);
  element.style.transition = transitionStrings.join(', ');
}

/**
 * Intersection Observer for scroll-triggered animations
 */
export class ScrollAnimator {
  private observer: IntersectionObserver | null = null;
  private elements: Map<Element, () => void> = new Map();
  
  constructor(options: IntersectionObserverInit = {}) {
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      return;
    }
    
    const defaultOptions: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
      ...options
    };
    
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const callback = this.elements.get(entry.target);
          if (callback) {
            callback();
            this.unobserve(entry.target);
          }
        }
      });
    }, defaultOptions);
  }
  
  observe(element: Element, callback: () => void): void {
    if (!this.observer) {
      // Fallback: execute immediately if no observer support
      callback();
      return;
    }
    
    this.elements.set(element, callback);
    this.observer.observe(element);
  }
  
  unobserve(element: Element): void {
    if (this.observer) {
      this.observer.unobserve(element);
    }
    this.elements.delete(element);
  }
  
  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.elements.clear();
  }
}

/**
 * Performance-optimized animation utilities
 */
export class PerformanceAnimator {
  private static rafId: number | null = null;
  private static callbacks: (() => void)[] = [];
  
  static schedule(callback: () => void): void {
    this.callbacks.push(callback);
    
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        const callbacks = [...this.callbacks];
        this.callbacks = [];
        this.rafId = null;
        
        callbacks.forEach(cb => cb());
      });
    }
  }
  
  static cancel(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.callbacks = [];
  }
  
  /**
   * Optimize element for animations
   */
  static optimizeForAnimation(element: HTMLElement): void {
    element.style.willChange = 'transform, opacity';
    element.style.transform = 'translateZ(0)'; // Force hardware acceleration
  }
  
  /**
   * Clean up animation optimizations
   */
  static cleanupOptimizations(element: HTMLElement): void {
    element.style.willChange = 'auto';
    element.style.transform = '';
  }
}

/**
 * CSS-based animation utilities for better performance
 */
export function addAnimationClass(
  element: Element,
  className: string,
  duration?: number
): Promise<void> {
  return new Promise((resolve) => {
    if (shouldReduceMotion()) {
      resolve();
      return;
    }
    
    element.classList.add(className);
    
    const cleanup = () => {
      element.classList.remove(className);
      resolve();
    };
    
    if (duration) {
      setTimeout(cleanup, duration);
    } else {
      // Listen for animation end
      const handleAnimationEnd = () => {
        element.removeEventListener('animationend', handleAnimationEnd);
        cleanup();
      };
      
      element.addEventListener('animationend', handleAnimationEnd);
      
      // Fallback timeout
      setTimeout(cleanup, 5000);
    }
  });
}

/**
 * Initialize animation system
 */
export function initializeAnimations(): void {
  if (typeof window === 'undefined') return;
  
  // Add reduced motion class if user prefers it
  if (shouldReduceMotion()) {
    document.documentElement.classList.add('reduce-motion');
  }
  
  // Listen for changes in motion preference
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', (e) => {
    if (e.matches) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  });
  
  // Add animation support class
  if ('animate' in document.createElement('div')) {
    document.documentElement.classList.add('supports-web-animations');
  }
}