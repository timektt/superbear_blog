'use client';
import Link from 'next/link';
import Image from 'next/image';

interface StorylineItem {
  title: string;
  category: string;
  imageUrl: string;
  slug?: string;
}

interface StorylinesStripProps {
  items: StorylineItem[];
}

export default function StorylinesStrip({ items }: StorylinesStripProps) {
  return (
    <section className="bg-gray-50 dark:bg-gray-800 py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <div className="w-1 h-6 bg-indigo-600 rounded-full mr-3"></div>
            In Brief
          </h2>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
            {items.map((item, index) => (
              <article
                key={index}
                className="group flex-shrink-0 w-72 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-200"
              >
                <Link href={`/news/${item.slug || `storyline-${index + 1}`}`}>
                  <div className="flex gap-3 p-4">
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

                    <div className="flex-1 min-w-0">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 mb-2">
                        {item.category}
                      </span>

                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 line-clamp-2">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
