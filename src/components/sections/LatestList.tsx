'use client';
import Link from 'next/link';
import Image from 'next/image';

interface LatestArticle {
  title: string;
  category: string;
  author: string;
  date: string;
  imageUrl: string;
  slug?: string;
  snippet?: string;
}

interface LatestListProps {
  articles: LatestArticle[];
}

export default function LatestList({ articles }: LatestListProps) {
  return (
    <div className="space-y-6">
      {articles.map((article, index) => (
        <article
          key={index}
          className="group flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
        >
          <Link
            href={`/news/${article.slug || `article-${index + 1}`}`}
            className="flex-shrink-0"
          >
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 80px, 96px"
              />
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                {article.category}
              </span>
            </div>

            <Link href={`/news/${article.slug || `article-${index + 1}`}`}>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 line-clamp-2 mb-2">
                {article.title}
              </h3>
            </Link>

            {article.snippet && (
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                {article.snippet}
              </p>
            )}

            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">{article.author}</span>
              <span className="mx-2">•</span>
              <span>{article.date}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
