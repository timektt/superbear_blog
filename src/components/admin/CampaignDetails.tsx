'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  updatedAt: string;
  content?: any;
  openRate?: number;
  clickRate?: number;
  template?: {
    id: string;
    name: string;
    category: string;
    description?: string;
  };
}

interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
}

interface CampaignDetailsProps {
  campaign: Campaign;
}

export default function CampaignDetails({
  campaign: initialCampaign,
}: CampaignDetailsProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [campaign, setCampaign] = useState<Campaign>(initialCampaign);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch campaign stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/admin/campaigns/${campaign.id}`);
        if (!response.ok) throw new Error('Failed to fetch stats');

        const data = await response.json();
        setStats(data.stats);
        setCampaign(data.campaign);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [campaign.id]);

  const handleSendCampaign = async () => {
    if (
      !confirm(
        'Are you sure you want to send this campaign? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/campaigns/${campaign.id}/send`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send campaign');
      }

      toast({ title: 'Campaign sent successfully!', variant: 'success' });

      // Refresh campaign data
      const updatedResponse = await fetch(
        `/api/admin/campaigns/${campaign.id}`
      );
      if (updatedResponse.ok) {
        const data = await updatedResponse.json();
        setCampaign(data.campaign);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast({ 
        title: 'Failed to send campaign',
        description: error instanceof Error ? error.message : 'Failed to send campaign',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this campaign? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/campaigns/${campaign.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete campaign');
      }

      toast({ title: 'Campaign deleted successfully!', variant: 'success' });
      router.push('/admin/campaigns');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({ 
        title: 'Failed to delete campaign',
        description: error instanceof Error ? error.message : 'Failed to delete campaign',
        variant: 'destructive'
      });
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
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusStyles[status]}`}
      >
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return 0;
    return ((numerator / denominator) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {campaign.title}
            </h1>
            {getStatusBadge(campaign.status)}
          </div>
          <p className="text-gray-600 dark:text-gray-400">{campaign.subject}</p>
        </div>

        <div className="flex space-x-3">
          <Link
            href="/admin/campaigns"
            className="px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            ← Back to Campaigns
          </Link>

          {campaign.status === 'DRAFT' && (
            <button
              onClick={handleSendCampaign}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Now'}
            </button>
          )}

          {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
            <button
              onClick={handleDeleteCampaign}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Campaign Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {campaign.recipients.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Recipients
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {campaign.template?.name || 'No Template'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Template
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {campaign.sentAt
              ? formatDate(campaign.sentAt)
              : campaign.scheduledAt
                ? formatDate(campaign.scheduledAt)
                : formatDate(campaign.createdAt)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {campaign.sentAt
              ? 'Sent'
              : campaign.scheduledAt
                ? 'Scheduled'
                : 'Created'}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {campaign.template?.category || 'Unknown'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Category
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      {campaign.status === 'SENT' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Performance
          </h2>

          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {stats.delivered.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Delivered
                </div>
                <div className="text-xs text-gray-500">
                  {calculateRate(stats.delivered, stats.sent)}% delivery rate
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {stats.opened.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Opened
                </div>
                <div className="text-xs text-gray-500">
                  {calculateRate(stats.opened, stats.delivered)}% open rate
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {stats.clicked.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Clicked
                </div>
                <div className="text-xs text-gray-500">
                  {calculateRate(stats.clicked, stats.opened)}% click rate
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {stats.bounced.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Bounced
                </div>
                <div className="text-xs text-gray-500">
                  {calculateRate(stats.bounced, stats.sent)}% bounce rate
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">
              No performance data available
            </div>
          )}
        </div>
      )}

      {/* Template Info */}
      {campaign.template && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Template Details
          </h2>

          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Name:
              </span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {campaign.template.name}
              </span>
            </div>

            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Category:
              </span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {campaign.template.category}
              </span>
            </div>

            {campaign.template.description && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Description:
                </span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {campaign.template.description}
                </span>
              </div>
            )}

            <div className="pt-3">
              <Link
                href={`/admin/email-templates/${campaign.template.id}`}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View Template →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Timeline
        </h2>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Campaign Created
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(campaign.createdAt)}
              </div>
            </div>
          </div>

          {campaign.scheduledAt && (
            <div className="flex items-center space-x-3">
              <div
                className={`w-3 h-3 rounded-full ${campaign.status === 'SCHEDULED' ? 'bg-yellow-500' : 'bg-green-500'}`}
              ></div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Scheduled
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(campaign.scheduledAt)}
                </div>
              </div>
            </div>
          )}

          {campaign.sentAt && (
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Campaign Sent
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(campaign.sentAt)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
