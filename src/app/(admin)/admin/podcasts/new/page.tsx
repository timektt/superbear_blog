import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PodcastCreateForm } from '@/components/admin/PodcastCreateForm';
import { LoadingSpinner } from '@/components/ui/loading-states';

export const metadata = {
  title: 'Create New Podcast Episode - Admin',
  description: 'Create a new podcast episode',
};

async function NewPodcastPage() {
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
        <PodcastCreateForm />
      </Suspense>
    </div>
  );
}

export default NewPodcastPage;
