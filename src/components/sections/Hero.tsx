'use client';

import Link from 'next/link';
import Image from 'next/image';

interface HeroProps {
  featuredArticle: {
    title: string;
    summary: string;
    category: string;
    author: string;
    date: string;
    imageUrl: string;
    slug?: string;
  };
}

export default function Hero({ featuredArticle }: HeroProps) {
  return (
    <section className="relative bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/news/${featuredArticle.slug || 'featured-article'}`}
          className="group block relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 aspect-[16/9] lg:aspect-[21/9] hover:scale-[1.02] transition-transform duration-300"
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={featuredArticle.imageUrl}
              alt={featuredArticle.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>

          {/* Content Overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 lg:p-12">
            {/* Category Badge */}
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-600 text-white">
                {featuredArticle.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white mb-4 leading-tight group-hover:text-indigo-200 transition-colors duration-200 max-w-4xl">
              {featuredArticle.title}
            </h1>

            {/* Summary */}
            <p className="text-gray-200 text-base sm:text-lg lg:text-xl mb-6 leading-relaxed max-w-3xl">
              {featuredArticle.summary}
            </p>

            {/* Meta Info */}
            <div className="flex items-center text-sm text-gray-300 mb-6">
              <span className="font-medium">{featuredArticle.author}</span>
              <span className="mx-2">•</span>
              <span>{featuredArticle.date}</span>
            </div>

            {/* Read More Button */}
            <div className="flex items-center text-white font-semibold group-hover:text-indigo-200 transition-colors duration-200">
              <span className="mr-2 text-lg">Read More</span>
              <svg
                className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-200"
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
    </section>
  );
}