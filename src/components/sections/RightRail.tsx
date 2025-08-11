'use client';
import Link from 'next/link';
import Image from 'next/image';

interface RightRailItem {
  title: string;
  category?: string;
  imageUrl?: string;
  slug?: string;
  timeAgo?: string;
}

interface RightRailProps {
  title: string;
  items: RightRailItem[];
}

export default function RightRail({ title, items }: RightRailProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        {title}
      </h3>

      <div className="space-y-4">
        {items.map((item, index) => (
          <article key={index} className="group">
            <Link
              href={`/news/${item.slug || `popular-${index + 1}`}`}
              className="block"
            >
              <div className="flex gap-3">
                {item.imageUrl && (
                  <div className="flex-shrink-0">
                    <div className="relative w-16 h-16 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="64px"
                      />
                    </div>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {item.category && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 mb-1">
                      {item.category}
                    </span>
                  )}

                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 line-clamp-3 mb-1">
                    {item.title}
                  </h4>

                  {item.timeAgo && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.timeAgo}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
