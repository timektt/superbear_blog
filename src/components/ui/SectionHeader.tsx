'use client';

import Link from 'next/link';

interface SectionHeaderProps {
  title: string;
  viewAllHref?: string;
  viewAllText?: string;
  accentColor?: 'indigo' | 'red';
  className?: string;
}

export default function SectionHeader({
  title,
  viewAllHref,
  viewAllText = 'View All',
  accentColor = 'indigo',
  className = '',
}: SectionHeaderProps) {
  const accentColorClasses = {
    indigo: {
      bar: 'bg-indigo-600',
      link: 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300',
      ring: 'focus-visible:ring-indigo-500',
    },
    red: {
      bar: 'bg-red-600',
      link: 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300',
      ring: 'focus-visible:ring-red-500',
    },
  };

  const colors = accentColorClasses[accentColor];

  return (
    <div className={`flex items-center justify-between mb-8 ${className}`}>
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
        <div className={`w-1 h-8 ${colors.bar} rounded-full mr-4`}></div>
        {title}
      </h2>

      {viewAllHref && (
        <Link
          href={viewAllHref}
          className={`${colors.link} font-semibold text-sm flex items-center transition-colors duration-200 ${colors.ring} focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 rounded-md px-2 py-1`}
        >
          {viewAllText}
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
      )}
    </div>
  );
}