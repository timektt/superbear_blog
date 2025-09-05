import Link from 'next/link';

interface TopHeaderProps {
  title: string;
  tagline: string;
  ctaText: string;
  ctaHref: string;
}

export default function TopHeader({
  title,
  tagline,
  ctaText,
  ctaHref
}: TopHeaderProps) {
  return (
    <section 
      className="bg-gradient-to-r from-red-600 to-red-800 text-white py-16 md:py-24"
      data-testid="top-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Brand Title */}
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            {title}
          </h1>
          
          {/* Tagline */}
          <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto leading-relaxed opacity-95">
            {tagline}
          </p>
          
          {/* CTA Button */}
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-red-600 bg-white rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50 transition-all duration-200 transform hover:scale-105 active:scale-95"
            aria-label={`${ctaText} - Navigate to articles page`}
          >
            {ctaText}
          </Link>
        </div>
      </div>
    </section>
  );
}