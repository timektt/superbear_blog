import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NewsletterIssueEditForm } from '@/components/admin/NewsletterIssueEditForm';
import { LoadingSpinner } from '@/components/ui/loading-states';

export const metadata = {
  title: 'Edit Newsletter Issue - Admin',
  description: 'Edit newsletter issue details',
};

interface EditNewsletterIssuePageProps {
  params: {
    id: string;
  };
}

async function fetchNewsletterIssue(id: string) {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/admin/newsletter/issues/${id}`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      throw new Error('Failed to fetch newsletter issue');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching newsletter issue:', error);
    throw error;
  }
}

async function EditNewsletterIssuePage({
  params,
}: EditNewsletterIssuePageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/admin/login');
  }

  // Check if user has admin role
  if (session.user.role !== 'ADMIN' && session.user.role !== 'EDITOR') {
    redirect('/');
  }

  const issue = await fetchNewsletterIssue(params.id);

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingSpinner />}>
        <NewsletterIssueEditForm issue={issue} />
      </Suspense>
    </div>
  );
}

export default EditNewsletterIssuePage;
