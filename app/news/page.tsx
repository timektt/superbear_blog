import PublicLayout from '@/components/layout/PublicLayout';

export default function NewsPage() {
  return (
    <PublicLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Latest News</h1>
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">
            No articles published yet. Check back soon!
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
