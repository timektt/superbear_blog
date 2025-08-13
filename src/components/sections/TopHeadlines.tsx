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
  // Ensure exactly 5 headlines for TechCrunch fidelity
  const displayHeadlines = headlines.slice(0, 5);

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-card-foreground flex items-center">
          <div className="w-1 h-5 bg-red-600 rounded-full mr-3"></div>
          Top Headlines
        </h2>
        <Link
          href="/news"
          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium text-sm flex items-center transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded-md px-2 py-1"
        >
          See more
          <svg
            className="ml-1 w-4 h-4"
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

      <div className="space-y-3">
        {displayHeadlines.map((headline, index) => (
          <Link
            key={index}
            href={`/news/${headline.slug || `headline-${index + 1}`}`}
            className="group block py-3 px-2 -mx-2 rounded-lg hover:bg-muted transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-5 h-5 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center">
                <span className="text-red-600 dark:text-red-400 font-bold text-xs">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-card-foreground group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200 line-clamp-2 leading-snug mb-1">
                  {headline.title}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
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
