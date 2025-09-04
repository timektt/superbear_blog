import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PodcastEditForm } from '@/components/admin/PodcastEditForm';
import { LoadingSpinner } from '@/components/ui/loading-states';

export const metadata = {
  title: 'Edit Podcast Episode - Admin',
  description: 'Edit podcast episode details',
};

interface EditPodcastPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function fetchPodcast(id: string) {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/admin/podcasts/${id}`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      throw new Error('Failed to fetch podcast');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching podcast:', error);
    throw error;
  }
}

async function EditPodcastPage({ params }: EditPodcastPageProps) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/admin/login');
  }

  // Check if user has admin role
  if (session.user.role !== 'ADMIN' && session.user.role !== 'EDITOR') {
    redirect('/');
  }

  const podcast = await fetchPodcast(resolvedParams.id);

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingSpinner />}>
        <PodcastEditForm podcast={podcast} />
      </Suspense>
    </div>
  );
}

export default EditPodcastPage;
