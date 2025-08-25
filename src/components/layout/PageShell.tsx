import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageShellProps {
  title: string;
  subtitle?: string;
  seeMoreHref?: string;
  seeMoreText?: string;
  children: React.ReactNode;
  className?: string;
}

export default function PageShell({
  title,
  subtitle,
  seeMoreHref,
  seeMoreText = 'See all',
  children,
  className = '',
}: PageShellProps) {
  return (
    <section className={`bg-background py-8 transition-colors duration-300 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          {seeMoreHref && (
            <Button variant="outline" asChild>
              <Link href={seeMoreHref} className="flex items-center space-x-2">
                <span>{seeMoreText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          )}
        </div>

        {/* Content */}
        {children}
      </div>
    </section>
  );
}