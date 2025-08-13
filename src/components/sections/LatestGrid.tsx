'use client';

import ArticleCard from '@/components/ui/ArticleCard';
import SectionHeader from '@/components/ui/SectionHeader';

interface Article {
  title: string;
  category: string;
  author: string;
  date: string;
  imageUrl: string;
  tags: string[];
  slug?: string;
  snippet?: string;
}

interface LatestGridProps {
  articles: Article[];
}

export default function LatestGrid({ articles }: LatestGridProps) {
  return (
    <section className="bg-white dark:bg-gray-900 py-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <SectionHeader
          title="Latest News"
          viewAllHref="/news"
          viewAllText="View All"
          accentColor="indigo"
        />

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {articles.map((article, index) => (
            <ArticleCard
              key={index}
              title={article.title}
              category={article.category}
              author={article.author}
              date={article.date}
              imageUrl={article.imageUrl}
              slug={article.slug || `article-${index + 1}`}
              snippet={article.snippet}
              tags={article.tags}
              variant="default"
            />
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-12">
          <button className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200">
            Load More Articles
            <svg
              className="ml-2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
