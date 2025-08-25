'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PodcastForm } from './PodcastForm';
import { useToast } from '@/lib/hooks/useToast';

export function PodcastCreateForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/podcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        toast({ title: 'Podcast episode created successfully' });
        router.push('/admin/podcasts');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create podcast');
      }
    } catch (error) {
      console.error('Error creating podcast:', error);
      toast({ 
        title: 'Failed to create podcast', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/podcasts');
  };

  return (
    <PodcastForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={isLoading}
    />
  );
}