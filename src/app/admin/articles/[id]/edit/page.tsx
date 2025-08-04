import { notFound } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import ArticleForm from '@/components/admin/ArticleForm';
import { prisma } from '@/lib/prisma';

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

async function getArticle(id: string) {
  try {
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return article;
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

export default async function EditArticlePage({
  params,
}: EditArticlePageProps) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) {
    notFound();
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Article</h1>
          <p className="mt-1 text-sm text-gray-600">
            Edit &quot;{article.title}&quot;
          </p>
        </div>

        <ArticleForm
          mode="edit"
          initialData={{
            id: article.id,
            title: article.title,
            slug: article.slug,
            summary: article.summary || '',
            content:
              typeof article.content === 'string'
                ? article.content
                : JSON.stringify(article.content),
            image: article.image || '',
            status: article.status,
            authorId: article.authorId,
            categoryId: article.categoryId,
            tags: article.tags,
          }}
        />
      </div>
    </AdminLayout>
  );
}
