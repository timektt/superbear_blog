'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/lib/hooks/useToast';

interface Campaign {
  id: string;
  title: string;
  subject: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'CANCELLED';
  recipients: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  template?: {
    name: string;
  };
  openRate?: number;
  clickRate?: number;
}

interface CampaignListProps {
  onRefresh?: () => void;
}

export default function CampaignList({ onRefresh }: CampaignListProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sendingCampaign, setSendingCampaign] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const fetchCampaigns = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/campaigns?page=${page}&limit=10`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json();
      setCampaigns(data.campaigns);
      setTotalPages(data.pagination.pages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      showError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [campaigns, onRefresh]);

  const handleSendCampaign = async (campaignId: string) => {
    if (
      !confirm(
        'Are you sure you want to send this campaign? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setSendingCampaign(campaignId);
      const response = await fetch(`/api/admin/campaigns/${campaignId}/send`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send campaign');
      }

      success('Campaign sent successfully!');
      fetchCampaigns(currentPage);
    } catch (error) {
      console.error('Error sending campaign:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to send campaign'
      );
    } finally {
      setSendingCampaign(null);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this campaign? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete campaign');
      }

      success('Campaign deleted successfully!');
      fetchCampaigns(currentPage);
    } catch (error) {
      console.error('Error deleting campaign:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to delete campaign'
      );
    }
  };

  const getStatusBadge = (status: Campaign['status']) => {
    const statusStyles = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SCHEDULED: 'bg-blue-100 text-blue-800',
      SENDING: 'bg-yellow-100 text-yellow-800',
      SENT: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}
      >
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Email Campaigns
        </h2>
        <Link
          href="/admin/campaigns/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Create Campaign
        </Link>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Recipients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {campaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {campaign.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {campaign.subject}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {campaign.template?.name || 'No template'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(campaign.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {campaign.recipients.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {campaign.status === 'SENT' && (
                      <div className="text-sm">
                        <div className="text-gray-900 dark:text-white">
                          Open: {((campaign.openRate || 0) * 100).toFixed(1)}%
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          Click: {((campaign.clickRate || 0) * 100).toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {campaign.sentAt ? (
                        <div>
                          <div>Sent</div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {formatDate(campaign.sentAt)}
                          </div>
                        </div>
                      ) : campaign.scheduledAt ? (
                        <div>
                          <div>Scheduled</div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {formatDate(campaign.scheduledAt)}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div>Created</div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {formatDate(campaign.createdAt)}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        href={`/admin/campaigns/${campaign.id}`}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View
                      </Link>

                      {campaign.status === 'DRAFT' && (
                        <button
                          onClick={() => handleSendCampaign(campaign.id)}
                          disabled={sendingCampaign === campaign.id}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                        >
                          {sendingCampaign === campaign.id
                            ? 'Sending...'
                            : 'Send'}
                        </button>
                      )}

                      {(campaign.status === 'DRAFT' ||
                        campaign.status === 'SCHEDULED') && (
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {campaigns.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400">
              No campaigns found. Create your first campaign to get started.
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => fetchCampaigns(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Previous
          </button>

          <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => fetchCampaigns(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
