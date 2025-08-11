'use client';

import Link from 'next/link';

interface Headline {
  title: string;
  timeAgo: string;
  slug?: string;
}

interface TopHeadlinesProps {
  headlines: Headline[];
}

export default function TopHeadlines({ headlines }: TopHeadlinesProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <div className="w-1 h-6 bg-red-600 rounded-full mr-3"></div>
          Top Headlines
        </h2>
        <Link
          href="/news"
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold text-sm flex items-center transition-colors duration-200"
        >
          View All
          <svg
            className="ml-2 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </Link>
      </div>

      <div className="space-y-4">
        {headlines.map((headline, index) => (
          <Link
            key={index}
            href={`/news/${headline.slug || `headline-${index + 1}`}`}
            className="group block p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <span className="text-red-600 dark:text-red-400 font-bold text-xs">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 line-clamp-2 leading-snug mb-1">
                  {headline.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
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
