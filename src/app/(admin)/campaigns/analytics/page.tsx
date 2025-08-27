'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Mail,
  Eye,
  MousePointer,
  RefreshCw,
  Clock,
  Users,
} from 'lucide-react';

interface AnalyticsSummary {
  totalCampaigns: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  avgOpenRate: number;
  avgClickRate: number;
  avgDeliveryRate: number;
}

interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  status: string;
  createdAt: string;
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  };
  rates: {
    deliveryRate: number;
    openRate: number;
    clickRate: number;
  };
}

interface DashboardData {
  summary: AnalyticsSummary;
  recentCampaigns: CampaignPerformance[];
  topPerformers: CampaignPerformance[];
  trends: {
    sent: number[];
    opened: number[];
    clicked: number[];
    dates: string[];
  };
}

interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  totalViews: number;
  uniqueViews: number;
  avgTimeOnPage: number;
  avgScrollDepth: number;
  bounceRate: number;
  totalShares: number;
  totalClicks: number;
  completionRate: number;
}

interface ViewMetrics {
  totalViews: number;
  uniqueViews: number;
  viewsToday: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
  avgTimeOnPage: number;
  avgScrollDepth: number;
  bounceRate: number;
  completionRate: number;
}

interface EngagementMetrics {
  articleId: string;
  timeOnPage: number;
  scrollDepth: number;
  bounceRate: number;
  interactionRate: number;
  socialShares: number;
  linkClicks: number;
  newsletterSignups: number;
}

type AnalyticsType =
  | 'dashboard'
  | 'category'
  | 'views'
  | 'engagement'
  | 'summary';

export default function CampaignAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(7);
  const [analyticsType, setAnalyticsType] =
    useState<AnalyticsType>('dashboard');
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = async (refresh = false) => {
    try {
      if (refresh) {
        setError(null);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        type: analyticsType,
        days: timeRange.toString(),
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      });

      const endpoint = refresh
        ? '/api/admin/campaigns/analytics'
        : `/api/admin/campaigns/analytics?${params}`;
      const method = refresh ? 'POST' : 'GET';
      const body = refresh
        ? JSON.stringify({
            type: analyticsType,
            days: timeRange,
            startDate: dateRange.from.toISOString(),
            endDate: dateRange.to.toISOString(),
            forceRefresh: true,
          })
        : undefined;

      const response = await fetch(endpoint, {
        method,
        headers: refresh ? { 'Content-Type': 'application/json' } : {},
        body,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const result = await response.json();
      setData(result.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      // Set mock data for development based on type
      if (analyticsType === 'dashboard') {
        setData(getMockDashboardData());
      } else if (analyticsType === 'category') {
        setData(getMockCategoryData());
      } else if (analyticsType === 'views') {
        setData(getMockViewMetrics());
      } else if (analyticsType === 'engagement') {
        setData(getMockEngagementData());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, analyticsType, dateRange]);

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return num.toFixed(1) + '%';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Analytics Data
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No campaign data available for the selected time period.
          </p>
          <Button onClick={fetchAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Campaign Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Performance insights for the last {timeRange} days
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Select
            value={analyticsType}
            onValueChange={(value: AnalyticsType) => setAnalyticsType(value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dashboard">Dashboard</SelectItem>
              <SelectItem value="category">Categories</SelectItem>
              <SelectItem value="views">Views</SelectItem>
              <SelectItem value="engagement">Engagement</SelectItem>
              <SelectItem value="summary">Summary</SelectItem>
            </SelectContent>
          </Select>

          <DateRangePicker value={dateRange} onChange={setDateRange} />

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            aria-label="Time range selector"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>

          <Button onClick={() => fetchAnalytics(true)} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingDown className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-2" />
            <span className="text-amber-800 dark:text-amber-200">
              Using sample data - {error}
            </span>
          </div>
        </div>
      )}

      {lastUpdated && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}

      {/* Render different views based on analytics type */}
      {analyticsType === 'dashboard' && renderDashboardView()}
      {analyticsType === 'category' && renderCategoryView()}
      {analyticsType === 'views' && renderViewsView()}
      {analyticsType === 'engagement' && renderEngagementView()}
      {analyticsType === 'summary' && renderDashboardView()}
    </div>
  );

  function renderDashboardView() {
    if (!data || !data.summary) return null;

    return (
      <>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Sent
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(data.summary.totalSent)}
                </p>
              </div>
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {data.summary.totalCampaigns} campaigns
              </span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg. Open Rate
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPercentage(data.summary.avgOpenRate)}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">
                {formatNumber(data.summary.totalOpened)} opens
              </span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg. Click Rate
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPercentage(data.summary.avgClickRate)}
                </p>
              </div>
              <MousePointer className="w-8 h-8 text-purple-600" />
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 text-purple-600 mr-1" />
              <span className="text-sm text-purple-600">
                {formatNumber(data.summary.totalClicked)} clicks
              </span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Delivery Rate
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPercentage(data.summary.avgDeliveryRate)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {formatNumber(data.summary.totalDelivered)} delivered
              </span>
            </div>
          </Card>
        </div>

        {/* Recent Campaigns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Campaigns
            </h3>
            <div className="space-y-4">
              {data.recentCampaigns.map((campaign) => (
                <div
                  key={campaign.campaignId}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {campaign.campaignName}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatPercentage(campaign.rates.openRate)} open
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {formatNumber(campaign.metrics.sent)} sent
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top Performers
            </h3>
            <div className="space-y-4">
              {data.topPerformers.map((campaign, index) => (
                <div
                  key={campaign.campaignId}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {campaign.campaignName}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatNumber(campaign.metrics.sent)} recipients
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      {formatPercentage(campaign.rates.openRate)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      open rate
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Simple Trends Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Trends Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Emails Sent
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {formatNumber(data.trends.sent.reduce((a, b) => a + b, 0))}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total in period
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Emails Opened
              </p>
              <p className="text-2xl font-bold text-green-600">
                {formatNumber(data.trends.opened.reduce((a, b) => a + b, 0))}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total in period
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Links Clicked
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {formatNumber(data.trends.clicked.reduce((a, b) => a + b, 0))}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total in period
              </p>
            </div>
          </div>
        </Card>
      </>
    );
  }

  function renderCategoryView() {
    if (!data || !Array.isArray(data)) return null;

    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Category Performance
        </h3>
        <div className="space-y-4">
          {data.map((category: CategoryPerformance) => (
            <div
              key={category.categoryId}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {category.categoryName}
                </h4>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {category.totalViews.toLocaleString()} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {category.uniqueViews.toLocaleString()} unique
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.round(category.avgTimeOnPage)}s avg
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {category.avgScrollDepth.toFixed(1)}% scroll
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {category.bounceRate.toFixed(1)}% bounce
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  function renderViewsView() {
    if (!data) return null;

    const viewMetrics = data as ViewMetrics;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Views
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(viewMetrics.totalViews)}
              </p>
            </div>
            <Eye className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatNumber(viewMetrics.uniqueViews)} unique visitors
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Time on Page
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(viewMetrics.avgTimeOnPage)}s
              </p>
            </div>
            <Clock className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {viewMetrics.avgScrollDepth.toFixed(1)}% avg scroll
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Bounce Rate
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPercentage(viewMetrics.bounceRate)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatPercentage(viewMetrics.completionRate)} completion
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Recent Activity
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {viewMetrics.viewsToday}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {viewMetrics.viewsThisWeek} this week
            </span>
          </div>
        </Card>
      </div>
    );
  }

  function renderEngagementView() {
    if (!data || !Array.isArray(data)) return null;

    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Engagement Metrics
        </h3>
        <div className="space-y-4">
          {data.map((engagement: EngagementMetrics) => (
            <div
              key={engagement.articleId}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Article {engagement.articleId.substring(0, 8)}...
                </h4>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>{Math.round(engagement.timeOnPage)}s time</span>
                  <span>{engagement.scrollDepth.toFixed(1)}% scroll</span>
                  <span>
                    {engagement.interactionRate.toFixed(1)}% interaction
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {engagement.socialShares} shares
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {engagement.linkClicks} clicks
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }
}

/**
 * Generate mock category data for development
 */
function getMockCategoryData(): CategoryPerformance[] {
  return [
    {
      categoryId: 'ai-ml',
      categoryName: 'AI & Machine Learning',
      totalViews: 15420,
      uniqueViews: 12340,
      avgTimeOnPage: 245,
      avgScrollDepth: 78.5,
      bounceRate: 32.1,
      totalShares: 234,
      totalClicks: 567,
      completionRate: 65.2,
    },
    {
      categoryId: 'dev-tools',
      categoryName: 'Developer Tools',
      totalViews: 8930,
      uniqueViews: 7120,
      avgTimeOnPage: 198,
      avgScrollDepth: 71.2,
      bounceRate: 28.7,
      totalShares: 156,
      totalClicks: 423,
      completionRate: 58.9,
    },
    {
      categoryId: 'startups',
      categoryName: 'Startups',
      totalViews: 6780,
      uniqueViews: 5430,
      avgTimeOnPage: 312,
      avgScrollDepth: 82.1,
      bounceRate: 25.4,
      totalShares: 189,
      totalClicks: 345,
      completionRate: 72.3,
    },
  ];
}

/**
 * Generate mock view metrics for development
 */
function getMockViewMetrics(): ViewMetrics {
  return {
    totalViews: 2340,
    uniqueViews: 1890,
    viewsToday: 45,
    viewsThisWeek: 312,
    viewsThisMonth: 1240,
    avgTimeOnPage: 234,
    avgScrollDepth: 76.8,
    bounceRate: 29.3,
    completionRate: 68.7,
  };
}

/**
 * Generate mock engagement data for development
 */
function getMockEngagementData(): EngagementMetrics[] {
  return [
    {
      articleId: 'mock-article-1',
      timeOnPage: 245,
      scrollDepth: 78.5,
      bounceRate: 32.1,
      interactionRate: 45.2,
      socialShares: 23,
      linkClicks: 67,
      newsletterSignups: 12,
    },
    {
      articleId: 'mock-article-2',
      timeOnPage: 198,
      scrollDepth: 71.2,
      bounceRate: 28.7,
      interactionRate: 52.3,
      socialShares: 18,
      linkClicks: 43,
      newsletterSignups: 8,
    },
    {
      articleId: 'mock-article-3',
      timeOnPage: 312,
      scrollDepth: 82.1,
      bounceRate: 25.4,
      interactionRate: 38.9,
      socialShares: 31,
      linkClicks: 89,
      newsletterSignups: 15,
    },
  ];
}

/**
 * Generate mock dashboard data for development
 */
function getMockDashboardData(): DashboardData {
  return {
    summary: {
      totalCampaigns: 12,
      totalSent: 15420,
      totalDelivered: 14876,
      totalOpened: 5234,
      totalClicked: 1456,
      avgOpenRate: 35.2,
      avgClickRate: 27.8,
      avgDeliveryRate: 96.5,
    },
    recentCampaigns: [
      {
        campaignId: 'mock-1',
        campaignName: 'Weekly Tech Digest #42',
        status: 'sent',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        metrics: { sent: 1250, delivered: 1198, opened: 456, clicked: 89 },
        rates: { deliveryRate: 95.8, openRate: 38.1, clickRate: 19.5 },
      },
      {
        campaignId: 'mock-2',
        campaignName: 'AI News Roundup',
        status: 'sent',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        metrics: { sent: 890, delivered: 867, opened: 312, clicked: 67 },
        rates: { deliveryRate: 97.4, openRate: 36.0, clickRate: 21.5 },
      },
      {
        campaignId: 'mock-3',
        campaignName: 'Startup Spotlight',
        status: 'sent',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        metrics: { sent: 654, delivered: 634, opened: 198, clicked: 45 },
        rates: { deliveryRate: 96.9, openRate: 31.2, clickRate: 22.7 },
      },
    ],
    topPerformers: [
      {
        campaignId: 'mock-top-1',
        campaignName: 'Developer Tools Weekly',
        status: 'sent',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        metrics: { sent: 756, delivered: 734, opened: 334, clicked: 89 },
        rates: { deliveryRate: 97.1, openRate: 45.5, clickRate: 26.6 },
      },
      {
        campaignId: 'mock-top-2',
        campaignName: 'Open Source Highlights',
        status: 'sent',
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        metrics: { sent: 432, delivered: 421, opened: 178, clicked: 56 },
        rates: { deliveryRate: 97.5, openRate: 42.3, clickRate: 31.5 },
      },
      {
        campaignId: 'mock-top-3',
        campaignName: 'Tech Trends Analysis',
        status: 'sent',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        metrics: { sent: 987, delivered: 956, opened: 389, clicked: 123 },
        rates: { deliveryRate: 96.9, openRate: 40.7, clickRate: 31.6 },
      },
    ],
    trends: {
      sent: [1250, 890, 654, 756, 432, 987, 1123],
      opened: [456, 312, 198, 334, 178, 389, 445],
      clicked: [89, 67, 45, 89, 56, 123, 134],
      dates: [
        '2025-08-10',
        '2025-08-11',
        '2025-08-12',
        '2025-08-13',
        '2025-08-14',
        '2025-08-15',
        '2025-08-16',
      ],
    },
  };
}
