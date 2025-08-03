import PublicLayout from '@/components/layout/PublicLayout';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;

  return (
    <PublicLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Article: {slug}
        </h1>
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">
            Article content will be displayed here once the database is set up.
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
