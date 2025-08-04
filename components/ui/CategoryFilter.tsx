'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryFilterProps {
  categories: Category[];
}

export default function CategoryFilter({ categories }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || '');
  }, [searchParams]);

  const handleCategoryChange = (categorySlug: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (categorySlug) {
      params.set('category', categorySlug);
    } else {
      params.delete('category');
    }

    // Reset to first page when filtering
    params.delete('page');

    const queryString = params.toString();
    const newUrl = queryString ? `/news?${queryString}` : '/news';

    router.push(newUrl);
  };

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleCategoryChange('')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === ''
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          All Categories
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => handleCategoryChange(category.slug)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.slug
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
