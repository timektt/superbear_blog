'use client';
import ArticleCard from '@/components/ui/ArticleCard';

interface RightRailItem {
  title: string;
  category?: string;
  imageUrl?: string;
  slug?: string;
  timeAgo?: string;
  excerpt?: string;
}

interface RightRailProps {
  title: string;
  items: RightRailItem[];
}

export default function RightRail({ title, items }: RightRailProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
        {title}
      </h3>

      <div className="space-y-6">
        {items.map((item, index) => (
          <ArticleCard
            key={index}
            title={item.title}
            category={item.category || 'News'}
            date={item.timeAgo}
            imageUrl={item.imageUrl || '/placeholder-image.svg'}
            slug={item.slug || `popular-${index + 1}`}
            variant="compact"
          />
        ))}
      </div>
    </div>
  );
}
