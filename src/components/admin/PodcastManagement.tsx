'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PodcastList } from './PodcastList';
import { useToast } from '@/lib/hooks/useToast';

export function PodcastManagement() {
  const router = useRouter();
  const { toast } = useToast();
  const [podcasts, setPodcasts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPodcasts();
  }, []);

  const fetchPodcasts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/podcasts');
      if (response.ok) {
        const data = await response.json();
        setPodcasts(data.podcasts || []);
      } else {
        throw new Error('Failed to fetch podcasts');
      }
    } catch (error) {
      console.error('Error fetching podcasts:', error);
      toast({ title: 'Failed to load podcasts', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/podcasts/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/podcasts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ title: 'Podcast deleted successfully' });
        fetchPodcasts();
      } else {
        throw new Error('Failed to delete podcast');
      }
    } catch (error) {
      console.error('Error deleting podcast:', error);
      toast({ title: 'Failed to delete podcast', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/podcasts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast({ title: 'Podcast status updated' });
        fetchPodcasts();
      } else {
        throw new Error('Failed to update podcast status');
      }
    } catch (error) {
      console.error('Error updating podcast status:', error);
      toast({ title: 'Failed to update podcast status', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <PodcastList
      podcasts={podcasts}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onStatusChange={handleStatusChange}
      onRefresh={fetchPodcasts}
    />
  );
}