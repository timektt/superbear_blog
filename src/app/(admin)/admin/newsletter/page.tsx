import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import NewsletterManagement from '@/components/admin/NewsletterManagement';

export default async function AdminNewsletterPage() {
  const session = await requireAuth();
  
  if (!session || typeof session !== 'object' || !session.user) {
    redirect('/admin/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Newsletter Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage newsletter subscribers and campaigns
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <NewsletterManagement />
      </Suspense>
    </div>
  );
}

export const metadata = {
  title: 'Newsletter Management | Admin - SuperBear Blog',
  description: 'Manage newsletter subscribers and campaigns',
};