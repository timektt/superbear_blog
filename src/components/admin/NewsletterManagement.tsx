'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/lib/hooks/useToast';

interface Subscriber {
  id: string;
  email: string;
  status: 'PENDING' | 'ACTIVE' | 'UNSUBSCRIBED' | 'BOUNCED';
  subscribedAt: string;
  verifiedAt?: string;
  unsubscribedAt?: string;
  source?: string;
  preferences?: any;
}

interface NewsletterStats {
  total: number;
  active: number;
  recent: number;
  byStatus: Record<string, number>;
}

interface NewsletterData {
  subscribers: Subscriber[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: NewsletterStats;
}

export default function NewsletterManagement() {
  const [data, setData] = useState<NewsletterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    page: 1,
  });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: '20',
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await fetch(`/api/admin/newsletter?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        showError('Failed to load newsletter data');
      }
    } catch (error) {
      console.error('Error fetching newsletter data:', error);
      showError('Failed to load newsletter data');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedSubscribers.length === 0) {
      showError('Please select subscribers first');
      return;
    }

    try {
      const response = await fetch('/api/admin/newsletter', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          subscriberIds: selectedSubscribers,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showSuccess(result.message);
        setSelectedSubscribers([]);
        fetchData();
      } else {
        showError(result.message || 'Bulk action failed');
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      showError('Bulk action failed');
    }
  };

  const handleSelectAll = () => {
    if (selectedSubscribers.length === data?.subscribers.length) {
      setSelectedSubscribers([]);
    } else {
      setSelectedSubscribers(data?.subscribers.map(s => s.id) || []);
    }
  };

  const handleSelectSubscriber = (id: string) => {
    setSelectedSubscribers(prev =>
      prev.includes(id)
        ? prev.filter(sid => sid !== id)
        : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      UNSUBSCRIBED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      BOUNCED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || styles.PENDING}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Failed to load newsletter data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Subscribers</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active</h3>
          <p className="text-2xl font-bold text-green-600">{data.stats.active}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Recent (7 days)</h3>
          <p className="text-2xl font-bold text-blue-600">{data.stats.recent}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">{data.stats.byStatus.PENDING || 0}</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label htmlFor="status-filter" className="sr-only">Filter by status</label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="unsubscribed">Unsubscribed</option>
                <option value="bounced">Bounced</option>
              </select>
            </div>
            <div>
              <label htmlFor="search" className="sr-only">Search subscribers</label>
              <input
                id="search"
                type="text"
                placeholder="Search by email..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {selectedSubscribers.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                Activate ({selectedSubscribers.length})
              </button>
              <button
                onClick={() => handleBulkAction('unsubscribe')}
                className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
              >
                Unsubscribe ({selectedSubscribers.length})
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                Delete ({selectedSubscribers.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedSubscribers.length === data.subscribers.length && data.subscribers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Subscribed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.subscribers.map((subscriber) => (
                <tr key={subscriber.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedSubscribers.includes(subscriber.id)}
                      onChange={() => handleSelectSubscriber(subscriber.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {subscriber.email}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(subscriber.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(subscriber.subscribedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {subscriber.source || 'Unknown'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.pagination.pages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                {data.pagination.total} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={data.pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={data.pagination.page === data.pagination.pages}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}