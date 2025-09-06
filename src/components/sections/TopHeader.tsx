import Link from 'next/link';
import Container, { Section, TouchTarget } from '@/components/ui/Container';
import { typography, animations } from '@/lib/responsive';

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
    <Section 
      className="bg-gradient-to-r from-red-600 to-red-800 text-white"
      padding="xl"
      data-testid="top-header"
      as="section"
    >
      <Container size="xl" padding="md">
        <div className="text-center">
          {/* Brand Title */}
          <h1 className={`${typography.hero.title} font-bold mb-4 tracking-tight`}>
            {title}
          </h1>
          
          {/* Tagline */}
          <p className={`${typography.hero.subtitle} mb-8 max-w-4xl mx-auto leading-relaxed opacity-95`}>
            {tagline}
          </p>
          
          {/* CTA Button */}
          <TouchTarget size="lg" as="div">
            <Link
              href={ctaHref}
              className={`inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-red-600 bg-white rounded-lg hover:bg-gray-50 ${animations.focus.ring} ${animations.focus.outline} transition-all duration-200 transform ${animations.hover.scale} active:scale-95`}
              aria-label={`${ctaText} - Navigate to articles page`}
            >
              {ctaText}
            </Link>
          </TouchTarget>
        </div>
      </Container>
    </Section>
  );
}