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
      className="group block relative overflow-hidden rounded-xl bg-muted aspect-[16/9] hover:shadow-xl transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={featuredArticle.imageUrl}
          alt={featuredArticle.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          priority
          sizes="(max-width: 1024px) 100vw, 66vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
        {/* Category Badge */}
        <div className="mb-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-red-600 text-white uppercase tracking-wide">
            {featuredArticle.category}
          </span>
        </div>

        {/* Title - TechCrunch style with line clamp */}
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 leading-tight line-clamp-3 group-hover:text-gray-100 transition-colors duration-200">
          {featuredArticle.title}
        </h1>

        {/* Summary - TechCrunch dek style */}
        <p className="text-gray-200 text-sm sm:text-base mb-4 leading-relaxed line-clamp-2">
          {featuredArticle.summary}
        </p>

        {/* Meta Info - TechCrunch byline style */}
        <div className="flex items-center text-xs text-gray-300">
          <span className="font-medium">{featuredArticle.author}</span>
          <span className="mx-2">•</span>
          <span>{featuredArticle.date}</span>
        </div>
      </div>
    </Link>
  );
}
