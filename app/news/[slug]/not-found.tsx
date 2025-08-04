import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';

export default function NotFound() {
  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Article Not Found
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            The article you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/news"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Browse All Articles
          </Link>
          <div>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
