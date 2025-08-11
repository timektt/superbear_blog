'use client';

import Link from 'next/link';
import Image from 'next/image';

interface FeaturedArticle {
  title: string;
  summary: string;
  category: string;
  imageUrl: string;
  slug: string;
  author: string;
  date: string;
}

interface TopHeadline {
  title: string;
  slug: string;
  category: string;
}

interface HeroSectionProps {
  featuredArticle: FeaturedArticle;
  topHeadlines: TopHeadline[];
}

export default function HeroSection({
  featuredArticle,
  topHeadlines,
}: HeroSectionProps) {
  return (
    <section className="relative bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Featured Article */}
          <div className="lg:col-span-2">
            <Link
              href={`/news/${featuredArticle.slug}`}
              className="group block relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 aspect-[16/10] hover:scale-[1.02] transition-transform duration-300"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <Image
                  src={featuredArticle.imageUrl}
                  alt={featuredArticle.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
                {/* Category Badge */}
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-600 text-white">
                    {featuredArticle.category}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight group-hover:text-indigo-200 transition-colors duration-200">
                  {featuredArticle.title}
                </h1>

                {/* Summary */}
                <p className="text-gray-200 text-base sm:text-lg mb-4 leading-relaxed line-clamp-2">
                  {featuredArticle.summary}
                </p>

                {/* Meta Info */}
                <div className="flex items-center text-sm text-gray-300 mb-4">
                  <span>{featuredArticle.author}</span>
                  <span className="mx-2">•</span>
                  <span>{featuredArticle.date}</span>
                </div>

                {/* Read More Button */}
                <div className="flex items-center text-white font-semibold group-hover:text-indigo-200 transition-colors duration-200">
                  <span className="mr-2">Read More</span>
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200"
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
          </div>

          {/* Top Headlines Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 h-full">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-1 h-6 bg-indigo-600 rounded-full mr-3"></div>
                Top Headlines
              </h2>

              <div className="space-y-4">
                {topHeadlines.map((headline, index) => (
                  <Link
                    key={index}
                    href={`/news/${headline.slug}`}
                    className="group block p-4 bg-white dark:bg-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 line-clamp-2 leading-snug">
                          {headline.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {headline.category}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* View All Headlines */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <Link
                  href="/news"
                  className="flex items-center justify-center w-full py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-200"
                >
                  View All Headlines
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
