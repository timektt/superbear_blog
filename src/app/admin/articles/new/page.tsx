import AdminLayout from '@/components/layout/AdminLayout';
import ArticleForm from '@/components/admin/ArticleForm';

export default function NewArticlePage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Create New Article
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Create a new article for your blog
          </p>
        </div>

        <ArticleForm mode="create" />
      </div>
    </AdminLayout>
  );
}
