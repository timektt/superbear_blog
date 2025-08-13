'use client';
import ArticleCard from '@/components/ui/ArticleCard';

interface RightRailItem {
  title: string;
  category?: string;
  imageUrl?: string;
  slug?: string;
  timeAgo?: string;
}

interface RightRailProps {
  title: string;
  items: RightRailItem[];
}

export default function RightRail({ title, items }: RightRailProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        {title}
      </h3>

      <div className="space-y-4">
        {items.map((item, index) => (
          <ArticleCard
            key={index}
            title={item.title}
            category={item.category || 'News'}
            date={item.timeAgo}
            imageUrl={item.imageUrl || '/placeholder-image.jpg'}
            slug={item.slug || `popular-${index + 1}`}
            variant="compact"
          />
        ))}
      </div>
    </div>
  );
}
