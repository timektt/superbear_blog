'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Category {
  id?: string;
  name: string;
  slug?: string;
  count?: number;
}

interface CategoryNavigationProps {
  categories: Category[];
  activeCategory?: string;
  onCategoryChange: (slug: string) => void;
  className?: string;
  showCounts?: boolean;
}

export default function CategoryNavigation({
  categories,
  activeCategory,
  onCategoryChange,
  className = '',
  showCounts = false,
}: CategoryNavigationProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Check scroll position and update button states
  const checkScrollButtons = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      const handleScroll = () => {
        checkScrollButtons();
        setIsScrolling(true);
        // Clear scrolling state after animation completes
        setTimeout(() => setIsScrolling(false), 150);
      };

      container.addEventListener('scroll', handleScroll, { passive: true });
      // Also check on resize
      window.addEventListener('resize', checkScrollButtons);
      
      return () => {
        container.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [categories, checkScrollButtons]);

  // Enhanced scroll functions with better UX
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = Math.min(250, scrollContainerRef.current.clientWidth * 0.8);
      scrollContainerRef.current.scrollBy({ 
        left: -scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = Math.min(250, scrollContainerRef.current.clientWidth * 0.8);
      scrollContainerRef.current.scrollBy({ 
        left: scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  // Add "All" category at the beginning
  const allCategories = [
    { 
      name: 'All', 
      slug: '', 
      count: categories.reduce((sum, cat) => sum + (cat.count || 0), 0) 
    },
    ...categories,
  ];

  return (
    <div className={`relative group animate-fade-in-up ${className}`}>
      {/* Left scroll button with enhanced styling */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 
                     bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm 
                     border border-gray-200 dark:border-gray-700 
                     rounded-full p-2.5 shadow-lg 
                     hover:bg-white dark:hover:bg-gray-900 
                     hover:shadow-xl hover:scale-105
                     transition-all duration-200 ease-out
                     opacity-0 group-hover:opacity-100
                     focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          aria-label="Scroll categories left"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
      )}

      {/* Categories container with enhanced styling */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-3 scroll-smooth px-8 sm:px-12 md:px-0"
      >
        {allCategories.map((category, index) => {
          const isActive = activeCategory === category.slug;
          
          return (
            <button
              key={category.slug || 'all'}
              type="button"
              onClick={() => onCategoryChange(category.slug || '')}
              className={`
                flex-shrink-0 relative px-5 py-2.5 rounded-full text-sm font-medium 
                transition-all duration-300 ease-out
                transform hover:scale-105 active:scale-95
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${isActive
                  ? `bg-gradient-to-r from-blue-600 to-blue-700 
                     text-white shadow-lg shadow-blue-500/25
                     focus:ring-blue-500/50
                     before:absolute before:inset-0 before:rounded-full 
                     before:bg-gradient-to-r before:from-blue-500 before:to-blue-600 
                     before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300`
                  : `bg-gray-100 dark:bg-gray-800 
                     text-gray-700 dark:text-gray-300 
                     hover:bg-gray-200 dark:hover:bg-gray-700 
                     hover:text-gray-900 dark:hover:text-gray-100
                     hover:shadow-md
                     focus:ring-gray-500/50`
                }
                ${isScrolling ? 'pointer-events-none' : ''}
              `}
              aria-pressed={isActive ? 'true' : 'false'}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Filter by ${category.name}${showCounts && category.count !== undefined ? ` (${category.count} articles)` : ''}`}
            >
              <span className="relative z-10 whitespace-nowrap">
                {category.name}
                {showCounts && category.count !== undefined && (
                  <span className={`ml-2 text-xs font-normal opacity-75
                    ${isActive ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                    ({category.count})
                  </span>
                )}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 
                               w-1.5 h-1.5 bg-white rounded-full
                               animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right scroll button with enhanced styling */}
      {canScrollRight && (
        <button
          type="button"
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 
                     bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm 
                     border border-gray-200 dark:border-gray-700 
                     rounded-full p-2.5 shadow-lg 
                     hover:bg-white dark:hover:bg-gray-900 
                     hover:shadow-xl hover:scale-105
                     transition-all duration-200 ease-out
                     opacity-0 group-hover:opacity-100
                     focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          aria-label="Scroll categories right"
        >
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
      )}

      {/* Gradient overlays for visual scroll indication */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 
                       bg-gradient-to-r from-white dark:from-gray-950 to-transparent 
                       pointer-events-none z-10" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 
                       bg-gradient-to-l from-white dark:from-gray-950 to-transparent 
                       pointer-events-none z-10" />
      )}
    </div>
  );
}