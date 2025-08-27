import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NewsletterIssueManagement } from '@/components/admin/NewsletterIssueManagement';
import { LoadingSpinner } from '@/components/ui/loading-states';

export const metadata = {
  title: 'Newsletter Management - Admin',
  description: 'Manage newsletter issues and campaigns',
};

async function NewsletterPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/admin/login');
  }

  // Check if user has admin role
  if (session.user.role !== 'ADMIN' && session.user.role !== 'EDITOR') {
    redirect('/');
  }

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingSpinner />}>
        <NewsletterIssueManagement />
      </Suspense>
    </div>
  );
}

export default NewsletterPage;
