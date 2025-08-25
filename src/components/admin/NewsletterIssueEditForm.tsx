'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NewsletterIssueForm } from './NewsletterIssueForm';
import { useToast } from '@/lib/hooks/useToast';

interface NewsletterIssueEditFormProps {
  issue: any;
}

export function NewsletterIssueEditForm({ issue }: NewsletterIssueEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/newsletter/issues/${issue.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        toast({ title: 'Newsletter issue updated successfully' });
        router.push('/admin/newsletter');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update newsletter issue');
      }
    } catch (error) {
      console.error('Error updating newsletter issue:', error);
      toast({ 
        title: 'Failed to update newsletter issue', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
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
      issue={issue}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={isLoading}
    />
  );
}