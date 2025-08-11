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
          sizes="(max-width: 1024px) 100vw, 66vw"
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
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight group-hover:text-indigo-200 transition-colors duration-200">
          {featuredArticle.title}
        </h1>

        {/* Summary */}
        <p className="text-gray-200 text-base sm:text-lg mb-6 leading-relaxed">
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
  );
}
