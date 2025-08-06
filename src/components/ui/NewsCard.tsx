'use client';

import Link from 'next/link';
import Image from 'next/image';

interface NewsCardProps {
  article: {
    title: string;
    category: string;
    author: string;
    date: string;
    imageUrl: string;
    slug: string;
    summary?: string;
  };
}

export default function NewsCard({ article }: NewsCardProps) {
  return (
    <article className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-300">
      <Link href={`/news/${article.slug}`} className="block">
        {/* Article Image */}
        <div className="relative aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-700">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          
          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white backdrop-blur-sm">
              {article.category}
            </span>
          </div>
        </div>

        {/* Article Content */}
        <div className="p-6">
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 leading-tight">
            {article.title}
          </h3>

          {/* Summary */}
          {article.summary && (
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
              {article.summary}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium">{article.author}</span>
            <span>{article.date}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}