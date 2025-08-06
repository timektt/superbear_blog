import { Metadata } from 'next';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import HeroSection from '@/components/sections/HeroSection';
import NewsFeedSection from '@/components/sections/NewsFeedSection';
import { generateMetadata as createMetadata } from '@/lib/metadata-utils';
import {
  mockFeaturedArticle,
  mockTopHeadlines,
  mockNewsArticles,
  placeholderImages,
} from '@/lib/mockData';

export const metadata: Metadata = createMetadata({
  title: 'SuperBear Blog - Tech News for Developers',
  description:
    'Filtered, in-depth tech content for developers, AI builders, and tech entrepreneurs. Discover AI & LLM news, developer tools, and startup insights.',
  url: '/',
});

// Transform mock data to use actual placeholder images
function transformMockData() {
  const featuredArticle = {
    ...mockFeaturedArticle,
    imageUrl:
      (placeholderImages as any)[mockFeaturedArticle.imageUrl] ||
      mockFeaturedArticle.imageUrl,
  };

  const newsArticles = mockNewsArticles.map((article) => ({
    ...article,
    imageUrl:
      (placeholderImages as any)[article.imageUrl] || article.imageUrl,
  }));

  return { featuredArticle, newsArticles };
}

export default function Home() {
  const { featuredArticle, newsArticles } = transformMockData();

  return (
    <MainLayout>
      {/* Hero Section with Featured Article */}
      <HeroSection
        featuredArticle={featuredArticle}
        topHeadlines={mockTopHeadlines}
      />

      {/* Latest News Feed */}
      <NewsFeedSection articles={newsArticles} title="Latest News" />

      {/* Categories Section */}
      <section className="bg-white dark:bg-gray-900 py-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center">
              <div className="w-1 h-8 bg-indigo-600 rounded-full mr-4"></div>
              Explore by Category
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Dive deep into the topics that matter most to developers and tech
              entrepreneurs
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            {[
              {
                name: 'AI',
                href: '/ai',
                icon: '🤖',
                color: 'from-purple-500 to-indigo-600',
              },
              {
                name: 'DevTools',
                href: '/devtools',
                icon: '⚡',
                color: 'from-blue-500 to-cyan-600',
              },
              {
                name: 'Open Source',
                href: '/open-source',
                icon: '🔓',
                color: 'from-green-500 to-emerald-600',
              },
              {
                name: 'Startups',
                href: '/startups',
                icon: '🚀',
                color: 'from-orange-500 to-red-600',
              },
            ].map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                ></div>
                <div className="relative">
                  <div className="text-3xl mb-3">{category.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}