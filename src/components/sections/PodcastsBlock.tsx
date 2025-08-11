'use client';
import Link from 'next/link';
import Image from 'next/image';

interface PodcastItem {
  title: string;
  description: string;
  imageUrl: string;
  slug?: string;
  category?: string;
}

interface PodcastsBlockProps {
  title: string;
  items: PodcastItem[];
}

export default function PodcastsBlock({ title, items }: PodcastsBlockProps) {
  return (
    <section className="bg-gray-50 dark:bg-gray-800 py-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <div className="w-1 h-8 bg-purple-500 rounded-full mr-4"></div>
            {title}
          </h2>
          <Link
            href="/podcast"
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold text-sm flex items-center transition-colors duration-200"
          >
            Explore All
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, index) => (
            <article
              key={index}
              className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <Link href={`/podcast/${item.slug || `episode-${index + 1}`}`}>
                <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  {item.category && (
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        {item.category}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                    {item.title}
                  </h3>

                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                    {item.description}
                  </p>

                  <div className="flex items-center text-purple-600 dark:text-purple-400 font-semibold text-sm group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-200">
                    <span>Listen Now</span>
                    <svg
                      className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200"
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
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
