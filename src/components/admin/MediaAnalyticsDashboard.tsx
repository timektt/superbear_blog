'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface UploadMetrics {
  totalUploads: number
  successfulUploads: number
  failedUploads: number
  successRate: number
  averageUploadTime: number
  totalStorageUsed: number
  uploadsByFormat: Record<string, number>
  uploadsByFolder: Record<string, number>
  uploadTrends: Array<{
    date: string
    uploads: number
    storage: number
  }>
}

interface UsageMetrics {
  totalMediaFiles: number
  referencedFiles: number
  orphanedFiles: number
  orphanPercentage: number
  storageByStatus: {
    referenced: number
    orphaned: number
  }
  usageByContentType: Record<string, number>
  topReferencedMedia: Array<{
    publicId: string
    filename: string
    referenceCount: number
  }>
}

interface MediaAnalytics {
  uploadMetrics: UploadMetrics
  usageMetrics: UsageMetrics
  storageGrowth: Array<{
    date: string
    totalFiles: number
    totalStorage: number
  }>
  performanceMetrics: {
    averageUploadTime: number
    p95UploadTime: number
    errorRate: number
  }
}

interface Alert {
  type: string
  timestamp: string
  rate?: number
  averageTime?: number
  threshold: number
  currentUsage?: number
  limit?: number
  percentage?: number
}

export default function MediaAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<MediaAnalytics | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchAnalytics()
    fetchAlerts()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/media/analytics?days=${timeRange}&type=all`)
      const result = await response.json()
      
      if (result.success) {
        setAnalytics(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/admin/media/alerts?limit=10')
      const result = await response.json()
      
      if (result.success) {
        setAlerts(result.data.alerts)
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getAlertBadgeVariant = (type: string) => {
    switch (type) {
      case 'quota_exceeded':
      case 'high_failure_rate':
        return 'destructive'
      case 'quota_warning':
      case 'slow_uploads':
        return 'secondary'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Media Analytics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load analytics data</p>
        <Button onClick={fetchAnalytics} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Media Analytics</h2>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Recent Alerts</h3>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <Badge variant={getAlertBadgeVariant(alert.type)}>
                    {alert.type.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm">
                    {alert.type === 'quota_warning' && `Storage at ${alert.percentage}%`}
                    {alert.type === 'quota_exceeded' && 'Storage quota exceeded'}
                    {alert.type === 'high_failure_rate' && `Upload failure rate: ${alert.rate}%`}
                    {alert.type === 'slow_uploads' && `Slow uploads: ${formatDuration(alert.averageTime || 0)}`}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="uploads">Uploads</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Files</p>
                  <p className="text-2xl font-bold">{analytics.usageMetrics.totalMediaFiles.toLocaleString()}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Storage Used</p>
                  <p className="text-2xl font-bold">{formatBytes(analytics.uploadMetrics.totalStorageUsed)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upload Success Rate</p>
                  <p className="text-2xl font-bold">{analytics.uploadMetrics.successRate.toFixed(1)}%</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Orphaned Files</p>
                  <p className="text-2xl font-bold">{analytics.usageMetrics.orphanPercentage.toFixed(1)}%</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Storage Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Storage by Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Referenced Files</span>
                  <span className="font-medium">{formatBytes(analytics.usageMetrics.storageByStatus.referenced)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Orphaned Files</span>
                  <span className="font-medium">{formatBytes(analytics.usageMetrics.storageByStatus.orphaned)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Usage by Content Type</h3>
              <div className="space-y-3">
                {Object.entries(analytics.usageMetrics.usageByContentType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{type}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="uploads" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Uploads</p>
                <p className="text-2xl font-bold">{analytics.uploadMetrics.totalUploads.toLocaleString()}</p>
              </div>
            </Card>

            <Card className="p-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">{analytics.uploadMetrics.successfulUploads.toLocaleString()}</p>
              </div>
            </Card>

            <Card className="p-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{analytics.uploadMetrics.failedUploads.toLocaleString()}</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Uploads by Format</h3>
              <div className="space-y-3">
                {Object.entries(analytics.uploadMetrics.uploadsByFormat).map(([format, count]) => (
                  <div key={format} className="flex justify-between items-center">
                    <span className="text-sm uppercase">{format}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Uploads by Folder</h3>
              <div className="space-y-3">
                {Object.entries(analytics.uploadMetrics.uploadsByFolder).map(([folder, count]) => (
                  <div key={folder} className="flex justify-between items-center">
                    <span className="text-sm">{folder}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Referenced Files</p>
                <p className="text-2xl font-bold text-green-600">{analytics.usageMetrics.referencedFiles.toLocaleString()}</p>
              </div>
            </Card>

            <Card className="p-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Orphaned Files</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.usageMetrics.orphanedFiles.toLocaleString()}</p>
              </div>
            </Card>

            <Card className="p-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Orphan Percentage</p>
                <p className="text-2xl font-bold">{analytics.usageMetrics.orphanPercentage.toFixed(1)}%</p>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Most Referenced Media</h3>
            <div className="space-y-3">
              {analytics.usageMetrics.topReferencedMedia.map((media, index) => (
                <div key={media.publicId} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{media.filename}</span>
                    <span className="text-sm text-gray-500 ml-2">({media.publicId})</span>
                  </div>
                  <Badge variant="secondary">{media.referenceCount} references</Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Upload Time</p>
                <p className="text-2xl font-bold">{formatDuration(analytics.performanceMetrics.averageUploadTime)}</p>
              </div>
            </Card>

            <Card className="p-6">
              <div>
                <p className="text-sm font-medium text-gray-600">95th Percentile</p>
                <p className="text-2xl font-bold">{formatDuration(analytics.performanceMetrics.p95UploadTime)}</p>
              </div>
            </Card>

            <Card className="p-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold">{analytics.performanceMetrics.errorRate.toFixed(2)}%</p>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}