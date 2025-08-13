'use client';

import Link from 'next/link';
import SectionHeader from '@/components/ui/SectionHeader';

interface Headline {
  title: string;
  timeAgo: string;
  slug?: string;
}

interface TopHeadlinesProps {
  headlines: Headline[];
}

export default function TopHeadlines({ headlines }: TopHeadlinesProps) {
  // Ensure exactly 5 headlines for TechCrunch fidelity
  const displayHeadlines = headlines.slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <SectionHeader
        title="Top Headlines"
        viewAllHref="/news"
        viewAllText="See more"
        accentColor="red"
        className="mb-6"
      />

      <div className="space-y-3">
        {displayHeadlines.map((headline, index) => (
          <Link
            key={index}
            href={`/news/${headline.slug || `headline-${index + 1}`}`}
            className="group block py-3 px-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-5 h-5 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center">
                <span className="text-red-600 dark:text-red-400 font-bold text-xs">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200 line-clamp-2 leading-snug mb-1">
                  {headline.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {headline.timeAgo}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
