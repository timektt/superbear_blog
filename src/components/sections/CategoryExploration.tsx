'use client';

import Link from 'next/link';
import { CategoryWithCount } from '@/types/content';
import Container, { Section, Grid, TouchTarget } from '@/components/ui/Container';
import { typography, animations, grid } from '@/lib/responsive';

interface CategoryExplorationProps {
  categories: CategoryWithCount[];
}

export default function CategoryExploration({ categories }: CategoryExplorationProps) {
  // Filter to show only categories with articles and limit to 4-6 categories
  const displayCategories = categories
    .filter(category => category.articleCount > 0)
    .slice(0, 6);

  if (displayCategories.length === 0) {
    return (
      <Section 
        className="bg-gray-50 dark:bg-gray-900" 
        padding="md"
        data-testid="category-exploration"
      >
        <Container size="xl" padding="md">
          <h2 className={`${typography.section.title} font-bold text-gray-900 dark:text-white mb-8`}>
            Explore by Category
          </h2>
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              No categories available at the moment.
            </p>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section 
      className="bg-gray-50 dark:bg-gray-900" 
      padding="md"
      data-testid="category-exploration"
    >
      <Container size="xl" padding="md">
        <h2 className={`${typography.section.title} font-bold text-gray-900 dark:text-white mb-8`}>
          Explore by Category
        </h2>
        
        {/* Responsive grid: 2 cols mobile, 3 tablet, 4 desktop */}
        <Grid
          cols={{ default: 2, md: 3, lg: 4 }}
          gap="md"
          className={grid.categoryExploration}
        >
          {displayCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </Grid>
      </Container>
    </Section>
  );
}

interface CategoryCardProps {
  category: CategoryWithCount;
}

function CategoryCard({ category }: CategoryCardProps) {
  return (
    <TouchTarget size="lg" className="w-full h-full">
      <Link
        href={`/search?category=${category.slug}`}
        className={`group block w-full h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-red-300 dark:hover:border-red-600 transition-all duration-200 ${animations.hover.lift} ${animations.focus.ring} ${animations.focus.outline}`}
        data-testid={`category-card-${category.slug}`}
      >
        <div className="text-center h-full flex flex-col justify-center">
          {/* Category Icon (if available) */}
          {category.icon && (
            <div className="mb-3">
              <span className="text-2xl" role="img" aria-label={category.name}>
                {category.icon}
              </span>
            </div>
          )}
          
          {/* Category Name */}
          <h3 className={`${typography.card.title} font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors`}>
            {category.name}
          </h3>
          
          {/* Article Count */}
          <p className={`${typography.card.meta} text-gray-600 dark:text-gray-400`}>
            {category.articleCount} {category.articleCount === 1 ? 'article' : 'articles'}
          </p>
          
          {/* Category Color Accent (if available) */}
          {category.color && (
            <div 
              className="mt-3 h-1 w-12 mx-auto rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: category.color }}
              aria-hidden="true"
            />
          )}
        </div>
      </Link>
    </TouchTarget>
  );
}