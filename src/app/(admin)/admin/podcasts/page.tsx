import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PodcastManagement } from '@/components/admin/PodcastManagement';
import { LoadingSpinner } from '@/components/ui/loading-states';

export const metadata = {
  title: 'Podcast Management - Admin',
  description: 'Manage podcast episodes and content',
};

async function PodcastsPage() {
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
        <PodcastManagement />
      </Suspense>
    </div>
  );
}

export default PodcastsPage;
