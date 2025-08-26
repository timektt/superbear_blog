'use client';

import Link from 'next/link';

const categories = [
  {
    name: 'AI',
    href: '/ai',
    icon: '🤖',
    description:
      'Latest developments in artificial intelligence and machine learning',
    color: 'from-purple-500 to-indigo-600',
  },
  {
    name: 'DevTools',
    href: '/devtools',
    icon: '⚡',
    description: 'Developer tools, frameworks, and productivity solutions',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    name: 'Open Source',
    href: '/open-source',
    icon: '🔓',
    description: 'Open source projects, contributions, and community news',
    color: 'from-green-500 to-emerald-600',
  },
  {
    name: 'Startups',
    href: '/startups',
    icon: '🚀',
    description: 'Startup funding, launches, and entrepreneurship insights',
    color: 'from-orange-500 to-red-600',
  },
];

export default function ExploreByCategory() {
  return (
    <section className="bg-muted/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Featured Topics
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore the latest in tech development and entrepreneurship
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="inline-flex items-center space-x-2 rounded-full border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted hover:text-primary transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="text-lg">{category.icon}</span>
              <span>{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
