'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PublicListItem } from '@/lib/publicData';

interface InBriefProps {
  items: PublicListItem[];
  title?: string;
}

export default function InBrief({ items, title = 'In Brief' }: InBriefProps) {
  if (!items.length) return null;

  return (
    <section className="bg-gray-50 dark:bg-gray-800 py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <div className="w-1 h-6 bg-indigo-600 rounded-full mr-3"></div>
            {title}
          </h2>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, index) => (
            <Link
              key={item.id || index}
              href={`/news/${item.slug}`}
              className="group block bg-white dark:bg-gray-900 rounded-lg p-4 hover:shadow-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
            >
              <div className="flex items-start space-x-3">
                {item.imageUrl && (
                  <div className="flex-shrink-0">
                    <div className="relative w-14 h-14 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="56px"
                      />
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 line-clamp-2 leading-tight mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {item.date}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile Horizontal Scroll */}
        <div className="md:hidden">
          <div className="flex space-x-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {items.map((item, index) => (
              <Link
                key={item.id || index}
                href={`/news/${item.slug}`}
                className="group flex-shrink-0 w-64 bg-white dark:bg-gray-900 rounded-lg p-4 hover:shadow-md transition-all duration-200 snap-start focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
              >
                <div className="flex items-start space-x-3">
                  {item.imageUrl && (
                    <div className="flex-shrink-0">
                      <div className="relative w-14 h-14 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="56px"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 line-clamp-2 leading-tight mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {item.date}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
