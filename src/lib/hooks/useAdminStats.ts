import { useState, useEffect } from 'react';

export interface AdminStats {
  articles: {
    total: number;
    byStatus: {
      DRAFT: number;
      PUBLISHED: number;
      ARCHIVED: number;
    };
    recentlyCreated: number;
    recentlyPublished: number;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    articleCount: number;
  }>;
  authors: Array<{
    id: string;
    name: string;
    articleCount: number;
  }>;
  activity: {
    articlesCreatedLast7Days: number;
    articlesPublishedLast7Days: number;
  };
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/admin/stats');

        if (!response.ok) {
          throw new Error('Failed to fetch admin statistics');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const refetch = async () => {
    await fetchStats();
  };

  return { stats, loading, error, refetch };
}

async function fetchStats() {
  const response = await fetch('/api/admin/stats');

  if (!response.ok) {
    throw new Error('Failed to fetch admin statistics');
  }

  return response.json();
}
