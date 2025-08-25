'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Clock, 
  Share2, 
  MousePointer, 
  Users,
  RefreshCw,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useToast } from '@/lib/hooks/useToast';
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';
import { AnalyticsLoading } from '@/components/ui/loading-states';

interface AnalyticsDashboardProps {
  className?: string;
}

interface DashboardData {
  topPerforming: {
    byViews: Array<{ articleId: string; title: string; slug: string; value: number }>;
    byEngagement: Array<{ articleId: string; title: string; slug: string; value: number }>;
    byShares: Array<{ articleId: string; title: string; slug: string; value: number }>;
    byTime: Array<{ articleId: string; title: string; slug: string; value: number }>;
  };
  overallStats: {
    totalViews: number;
    totalArticles: number;
    avgCompletionRate: number;
    avgTimeOnPage: number;
    avgBounceRate: number;
    totalShares: number;
  };
  categoryStats: Array<{
    categoryName: string;
    categoryId: string;
    totalViews: number;
    uniqueViews: number;
    avgTimeOnPage: number;
    avgScrollDepth: number;
    articleCount: number;
  }>;
  recentActivity: {
    recentViews: Array<{
      id: string;
      articleTitle: string;
      articleSlug: string;
      timestamp: string;
      device: string;
      country: string;
    }>;
    recentInteractions: Array<{
      id: string;
      articleTitle: string;
      articleSlug: string;
      type: string;
      timestamp: string;
    }>;
  };
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const { handleAsync, createRetryHandler } = useErrorHandler();

  const fetchDashboardData = async (range: string = timeRange) => {
    setRefreshing(true);
    
    const [result, error] = await handleAsync(
      fetch(`/api/analytics/dashboard?range=${range}&limit=10`).then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to fetch analytics data`);
        }
        return response.json();
      }),
      { 
        context: 'analytics-fetch',
        showToast: true 
      }
    );

    if (result) {
      setData(result.data);
    } else if (error) {
      // Error is already handled by useErrorHandler
      console.error('Analytics fetch failed:', error);
    }

    setLoading(false);
    setRefreshing(false);
  };

  const retryFetchData = createRetryHandler(
    () => fetchDashboardData(timeRange),
    3,
    1000,
    { context: 'analytics-retry' }
  );

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, timeRange]);

  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange);
    fetchDashboardData(newRange);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  if (loading && !data) {
    return <AnalyticsLoading className={className} />;
  }

  if (!data) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
        <p className="text-muted-foreground mb-4">
          We couldn't load your analytics data. This might be due to a connection issue.
        </p>
        <Button onClick={retryFetchData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track article performance and reader engagement</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-32">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData()}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.overallStats.totalViews)}</div>
            <p className="text-xs text-muted-foreground">
              Across {data.overallStats.totalArticles} articles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time on Page</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(data.overallStats.avgTimeOnPage)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(data.overallStats.avgCompletionRate)} completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Social Shares</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.overallStats.totalShares)}</div>
            <p className="text-xs text-muted-foreground">
              Across all platforms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(data.overallStats.avgBounceRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.overallStats.avgBounceRate < 50 ? (
                <span className="text-green-600 flex items-center">
                  <ArrowDown className="w-3 h-3 mr-1" />
                  Good engagement
                </span>
              ) : (
                <span className="text-red-600 flex items-center">
                  <ArrowUp className="w-3 h-3 mr-1" />
                  Needs improvement
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="top-performing" className="space-y-6">
        <TabsList>
          <TabsTrigger value="top-performing">Top Performing</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="recent-activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="top-performing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top by Views */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Most Viewed Articles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topPerforming.byViews.slice(0, 5).map((article, index) => (
                    <div key={article.articleId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm truncate max-w-48">
                            {article.title}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {formatNumber(article.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top by Engagement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Highest Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topPerforming.byEngagement.slice(0, 5).map((article, index) => (
                    <div key={article.articleId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm truncate max-w-48">
                            {article.title}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {formatPercentage(article.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top by Shares */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Share2 className="w-5 h-5 mr-2" />
                  Most Shared Articles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topPerforming.byShares.slice(0, 5).map((article, index) => (
                    <div key={article.articleId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm truncate max-w-48">
                            {article.title}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {formatNumber(article.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top by Reading Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Longest Reading Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topPerforming.byTime.slice(0, 5).map((article, index) => (
                    <div key={article.articleId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm truncate max-w-48">
                            {article.title}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {formatTime(article.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.categoryStats.map((category) => (
                  <div key={category.categoryId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{category.categoryName}</h3>
                      <Badge variant="secondary">
                        {category.articleCount} articles
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Views</p>
                        <p className="font-medium">{formatNumber(category.totalViews)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Unique Views</p>
                        <p className="font-medium">{formatNumber(category.uniqueViews)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg. Time</p>
                        <p className="font-medium">{formatTime(category.avgTimeOnPage)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg. Scroll</p>
                        <p className="font-medium">{formatPercentage(category.avgScrollDepth)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent-activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.recentActivity.recentViews.map((view) => (
                    <div key={view.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm truncate max-w-48">
                          {view.articleTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {view.device} • {view.country} • {new Date(view.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Interactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.recentActivity.recentInteractions.map((interaction) => (
                    <div key={interaction.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm truncate max-w-48">
                          {interaction.articleTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {interaction.type} • {new Date(interaction.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {interaction.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}