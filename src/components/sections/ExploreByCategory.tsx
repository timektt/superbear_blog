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
    <section className="bg-gray-50 dark:bg-gray-800 py-16 transition-colors duration-300">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group relative overflow-hidden bg-white dark:bg-gray-700 rounded-2xl p-8 border border-gray-200 dark:border-gray-600 hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
              ></div>
              <div className="relative">
                <div className="text-4xl mb-4">{category.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {category.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
