/**
 * Responsive breakpoint utilities for the magazine layout
 * Implements consistent breakpoints across all components
 */

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Responsive spacing utilities
 */
export const spacing = {
  container: {
    sm: 'px-4',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12',
  },
  section: {
    sm: 'py-6 md:py-8',
    md: 'py-8 md:py-12',
    lg: 'py-12 md:py-16',
    xl: 'py-16 md:py-24',
  },
  gap: {
    sm: 'gap-2 md:gap-3',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8',
    xl: 'gap-8 md:gap-12',
  },
} as const;

/**
 * Touch target utilities for accessibility
 */
export const touchTargets = {
  minimum: 'min-h-[44px] min-w-[44px]',
  comfortable: 'min-h-[48px] min-w-[48px]',
  large: 'min-h-[56px] min-w-[56px]',
} as const;

/**
 * Grid system utilities
 */
export const grid = {
  cols: {
    mobile: 'grid-cols-1',
    tablet: 'md:grid-cols-2',
    desktop: 'lg:grid-cols-3',
    wide: 'xl:grid-cols-4',
  },
  categoryExploration: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  heroMosaic: {
    mobile: 'flex-col',
    tablet: 'md:flex-row md:gap-6',
    desktop: 'lg:gap-8',
  },
} as const;

/**
 * Container max-width utilities
 */
export const containers = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
} as const;

/**
 * Responsive image aspect ratios
 */
export const aspectRatios = {
  hero: 'aspect-[16/9]',
  card: 'aspect-[4/3]',
  square: 'aspect-square',
  wide: 'aspect-[21/9]',
} as const;

/**
 * Typography scale for responsive design
 */
export const typography = {
  hero: {
    title: 'text-4xl md:text-6xl',
    subtitle: 'text-xl md:text-2xl',
  },
  section: {
    title: 'text-2xl md:text-3xl',
    subtitle: 'text-lg md:text-xl',
  },
  card: {
    title: 'text-lg md:text-xl',
    subtitle: 'text-base md:text-lg',
    meta: 'text-sm md:text-base',
  },
} as const;

/**
 * Utility function to generate responsive classes
 */
export function responsive(config: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  wide?: string;
}): string {
  const classes = [];
  
  if (config.mobile) classes.push(config.mobile);
  if (config.tablet) classes.push(`md:${config.tablet}`);
  if (config.desktop) classes.push(`lg:${config.desktop}`);
  if (config.wide) classes.push(`xl:${config.wide}`);
  
  return classes.join(' ');
}

/**
 * Media query hooks for JavaScript
 */
export function useMediaQuery(query: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia(query);
  return mediaQuery.matches;
}

/**
 * Breakpoint detection utilities
 */
export const mediaQueries = {
  sm: `(min-width: ${breakpoints.sm})`,
  md: `(min-width: ${breakpoints.md})`,
  lg: `(min-width: ${breakpoints.lg})`,
  xl: `(min-width: ${breakpoints.xl})`,
  '2xl': `(min-width: ${breakpoints['2xl']})`,
} as const;

/**
 * Scroll behavior utilities for horizontal rails
 */
export const scrollBehavior = {
  horizontal: {
    container: 'overflow-x-auto scrollbar-hide',
    snapType: 'scroll-snap-type-x mandatory',
    snapAlign: 'scroll-snap-align-start',
    touch: '-webkit-overflow-scrolling-touch',
  },
  smooth: 'scroll-behavior-smooth',
} as const;

/**
 * Animation and transition utilities
 */
export const animations = {
  hover: {
    lift: 'hover:-translate-y-1 transition-transform duration-200',
    scale: 'hover:scale-105 transition-transform duration-300',
    fade: 'hover:opacity-80 transition-opacity duration-200',
  },
  focus: {
    ring: 'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    outline: 'focus-visible:outline-none',
  },
} as const;