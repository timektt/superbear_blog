import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NewsletterIssueCreateForm } from '@/components/admin/NewsletterIssueCreateForm';
import { LoadingSpinner } from '@/components/ui/loading-states';

export const metadata = {
  title: 'Create New Newsletter Issue - Admin',
  description: 'Create a new newsletter issue',
};

async function NewNewsletterIssuePage() {
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
        <NewsletterIssueCreateForm />
      </Suspense>
    </div>
  );
}

export default NewNewsletterIssuePage;
