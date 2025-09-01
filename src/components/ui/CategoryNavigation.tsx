'use client';

import { useState, useRef, useEffect } from 'react';
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

  // Check scroll position and update button states
  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, [categories]);

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Add "All" category at the beginning
  const allCategories = [
    { name: 'All', slug: '', count: categories.reduce((sum, cat) => sum + (cat.count || 0), 0) },
    ...categories,
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Left scroll button */}
      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 shadow-sm hover:bg-background transition-colors"
          aria-label="Scroll categories left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Categories container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {allCategories.map((category) => {
          const isActive = activeCategory === category.slug;
          
          return (
            <button
              key={category.slug || 'all'}
              onClick={() => onCategoryChange(category.slug || '')}
              className={`
                flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }
              `}
              aria-pressed={isActive}
            >
              <span>{category.name}</span>
              {showCounts && category.count !== undefined && (
                <span className={`ml-2 text-xs ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  ({category.count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right scroll button */}
      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 shadow-sm hover:bg-background transition-colors"
          aria-label="Scroll categories right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}