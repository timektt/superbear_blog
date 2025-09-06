import React from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Responsive container component with consistent max-width and padding
 * Implements the magazine layout's responsive grid system requirements
 */
export default function Container({
  children,
  className,
  size = 'xl',
  padding = 'md',
  as: Component = 'div',
}: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12',
  };

  return (
    <Component
      className={cn(
        'mx-auto w-full',
        sizeClasses[size],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * Grid component with responsive breakpoints
 * Supports mobile-first responsive design
 */
interface GridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  as?: keyof JSX.IntrinsicElements;
}

export function Grid({
  children,
  className,
  cols = { default: 1, md: 2, lg: 3 },
  gap = 'md',
  as: Component = 'div',
}: GridProps) {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2 md:gap-3',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8',
    xl: 'gap-8 md:gap-12',
  };

  const getColClasses = () => {
    const classes = ['grid'];
    
    if (cols.default) classes.push(`grid-cols-${cols.default}`);
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    
    return classes.join(' ');
  };

  return (
    <Component
      className={cn(
        getColClasses(),
        gapClasses[gap],
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * Flex container with responsive direction and alignment
 */
interface FlexProps {
  children: React.ReactNode;
  className?: string;
  direction?: {
    default?: 'row' | 'col';
    sm?: 'row' | 'col';
    md?: 'row' | 'col';
    lg?: 'row' | 'col';
  };
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  wrap?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

export function Flex({
  children,
  className,
  direction = { default: 'row' },
  align = 'start',
  justify = 'start',
  gap = 'md',
  wrap = false,
  as: Component = 'div',
}: FlexProps) {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2 md:gap-3',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8',
    xl: 'gap-8 md:gap-12',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const getDirectionClasses = () => {
    const classes = ['flex'];
    
    if (direction.default === 'col') classes.push('flex-col');
    if (direction.sm === 'row') classes.push('sm:flex-row');
    if (direction.sm === 'col') classes.push('sm:flex-col');
    if (direction.md === 'row') classes.push('md:flex-row');
    if (direction.md === 'col') classes.push('md:flex-col');
    if (direction.lg === 'row') classes.push('lg:flex-row');
    if (direction.lg === 'col') classes.push('lg:flex-col');
    
    return classes.join(' ');
  };

  return (
    <Component
      className={cn(
        getDirectionClasses(),
        alignClasses[align],
        justifyClasses[justify],
        gapClasses[gap],
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * Section wrapper with consistent spacing
 */
interface SectionProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  background?: 'default' | 'muted' | 'accent';
  as?: keyof JSX.IntrinsicElements;
}

export function Section({
  children,
  className,
  padding = 'md',
  background = 'default',
  as: Component = 'section',
}: SectionProps) {
  const paddingClasses = {
    none: '',
    sm: 'py-6 md:py-8',
    md: 'py-8 md:py-12',
    lg: 'py-12 md:py-16',
    xl: 'py-16 md:py-24',
  };

  const backgroundClasses = {
    default: '',
    muted: 'bg-muted/50',
    accent: 'bg-accent/10',
  };

  return (
    <Component
      className={cn(
        paddingClasses[padding],
        backgroundClasses[background],
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * Touch-friendly interactive element wrapper
 * Ensures minimum 44px touch targets as per requirements
 */
interface TouchTargetProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  as?: keyof JSX.IntrinsicElements;
}

export function TouchTarget({
  children,
  className,
  size = 'md',
  as: Component = 'div',
}: TouchTargetProps) {
  const sizeClasses = {
    sm: 'min-h-[40px] min-w-[40px]',
    md: 'min-h-[44px] min-w-[44px]',
    lg: 'min-h-[48px] min-w-[48px]',
  };

  return (
    <Component
      className={cn(
        'flex items-center justify-center',
        'touch-manipulation',
        sizeClasses[size],
        className
      )}
    >
      {children}
    </Component>
  );
}