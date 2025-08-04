'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Tag {
  id: string;
  name: string;
  slug: string;
  _count?: {
    articles: number;
  };
}

interface TagFilterProps {
  tags: Tag[];
  className?: string;
}

export default function TagFilter({ tags, className = '' }: TagFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const currentTags =
      searchParams.get('tags')?.split(',').filter(Boolean) || [];
    setSelectedTags(currentTags);
  }, [searchParams]);

  const handleTagToggle = (tagSlug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    let newSelectedTags: string[];

    if (selectedTags.includes(tagSlug)) {
      newSelectedTags = selectedTags.filter((tag) => tag !== tagSlug);
    } else {
      newSelectedTags = [...selectedTags, tagSlug];
    }

    if (newSelectedTags.length > 0) {
      params.set('tags', newSelectedTags.join(','));
    } else {
      params.delete('tags');
    }

    // Reset to first page when filtering
    params.delete('page');

    const queryString = params.toString();
    const newUrl = queryString ? `/news?${queryString}` : '/news';

    router.push(newUrl);
  };

  const clearAllTags = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('tags');
    params.delete('page');

    const queryString = params.toString();
    const newUrl = queryString ? `/news?${queryString}` : '/news';

    router.push(newUrl);
  };

  if (tags.length === 0) {
    return null;
  }

  const displayTags = isExpanded ? tags : tags.slice(0, 8);
  const hasMoreTags = tags.length > 8;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Filter by Tags</h3>
        {selectedTags.length > 0 && (
          <button
            type="button"
            onClick={clearAllTags}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {displayTags.map((tag) => {
          const isSelected = selectedTags.includes(tag.slug);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleTagToggle(tag.slug)}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isSelected
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              {tag.name}
              {tag._count && (
                <span className="ml-1.5 text-xs opacity-75">
                  {tag._count.articles}
                </span>
              )}
            </button>
          );
        })}

        {hasMoreTags && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-300 bg-white"
          >
            {isExpanded ? (
              <>
                Show less
                <svg
                  className="ml-1 h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </>
            ) : (
              <>
                +{tags.length - 8} more
                <svg
                  className="ml-1 h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </>
            )}
          </button>
        )}
      </div>

      {selectedTags.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center text-xs text-gray-500">
            <span>Active filters:</span>
            <div className="ml-2 flex flex-wrap gap-1">
              {selectedTags.map((tagSlug) => {
                const tag = tags.find((t) => t.slug === tagSlug);
                return tag ? (
                  <span
                    key={tagSlug}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700"
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => handleTagToggle(tagSlug)}
                      className="ml-1 text-indigo-500 hover:text-indigo-700"
                    >
                      ×
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
