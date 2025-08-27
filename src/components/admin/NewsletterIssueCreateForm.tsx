'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NewsletterIssueForm } from './NewsletterIssueForm';
import { useToast } from '@/lib/hooks/useToast';

export function NewsletterIssueCreateForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/newsletter/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        toast({ title: 'Newsletter issue created successfully' });
        router.push('/admin/newsletter');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create newsletter issue');
      }
    } catch (error) {
      console.error('Error creating newsletter issue:', error);
      toast({
        title: 'Failed to create newsletter issue',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/newsletter');
  };

  return (
    <NewsletterIssueForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={isLoading}
    />
  );
}
