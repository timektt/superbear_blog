'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NewsletterIssueList } from './NewsletterIssueList';
import { useToast } from '@/lib/hooks/useToast';

export function NewsletterIssueManagement() {
  const router = useRouter();
  const { toast } = useToast();
  const [issues, setIssues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/newsletter/issues');
      if (response.ok) {
        const data = await response.json();
        setIssues(data.issues || []);
      } else {
        throw new Error('Failed to fetch newsletter issues');
      }
    } catch (error) {
      console.error('Error fetching newsletter issues:', error);
      toast({
        title: 'Failed to load newsletter issues',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/newsletter/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/newsletter/issues/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ title: 'Newsletter issue deleted successfully' });
        fetchIssues();
      } else {
        throw new Error('Failed to delete newsletter issue');
      }
    } catch (error) {
      console.error('Error deleting newsletter issue:', error);
      toast({
        title: 'Failed to delete newsletter issue',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/newsletter/issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast({ title: 'Newsletter issue status updated' });
        fetchIssues();
      } else {
        throw new Error('Failed to update newsletter issue status');
      }
    } catch (error) {
      console.error('Error updating newsletter issue status:', error);
      toast({
        title: 'Failed to update newsletter issue status',
        variant: 'destructive',
      });
    }
  };

  const handleSend = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/newsletter/issues/${id}/send`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({ title: 'Newsletter sent successfully' });
        fetchIssues();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send newsletter');
      }
    } catch (error) {
      console.error('Error sending newsletter:', error);
      toast({
        title: 'Failed to send newsletter',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
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
    <NewsletterIssueList
      issues={issues}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onStatusChange={handleStatusChange}
      onSend={handleSend}
      onRefresh={fetchIssues}
    />
  );
}
