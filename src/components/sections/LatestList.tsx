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
  // Ensure minimum 6 articles for TechCrunch fidelity
  const displayArticles = articles.slice(0, 10);

  return (
    <div className="space-y-6">
      {displayArticles.map((article, index) => (
        <article
          key={index}
          className="group flex gap-4 py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-4 px-4 rounded-lg transition-all duration-200"
        >
          <Link
            href={`/news/${article.slug || `article-${index + 1}`}`}
            className="flex-shrink-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 rounded-lg"
          >
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 64px, 80px"
              />
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {article.category}
              </span>
            </div>

            <Link 
              href={`/news/${article.slug || `article-${index + 1}`}`}
              className="focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 rounded-md"
            >
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 line-clamp-2 mb-2 leading-tight">
                {article.title}
              </h3>
            </Link>

            {article.snippet && (
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3 leading-relaxed">
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
