'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CleanupMetrics {
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  successRate: number
  totalFilesProcessed: number
  totalFilesDeleted: number
  totalSpaceFreed: number
  averageOperationTime: number
  operationsByType: Record<string, number>
  recentOperations: Array<{
    id: string
    operationType: string
    status: string
    filesProcessed: number
    filesDeleted: number
    spaceFreed: number
    startedAt: Date
    completedAt?: Date
    duration?: number
  }>
}

interface CleanupPerformance {
  averageFilesPerSecond: number
  averageBytesPerSecond: number
  peakPerformance: {
    filesPerSecond: number
    bytesPerSecond: number
    timestamp: Date
  }
  slowestOperations: Array<{
    id: string
    duration: number
    filesProcessed: number
    timestamp: Date
  }>
}

interface ActiveOperation {
  id: string
  operationType: string
  filesProcessed: number
  filesDeleted: number
  spaceFreed: number
  startedAt: Date
  duration: number
  currentFile?: string
}

interface CleanupAlert {
  type: string
  severity: 'warning' | 'error' | 'critical'
  message: string
  details: Record<string, any>
  timestamp: Date
  operationId?: string
}

export default function CleanupMonitoringDashboard() {
  const [metrics, setMetrics] = useState<CleanupMetrics | null>(null)
  const [performance, setPerformance] = useState<CleanupPerformance | null>(null)
  const [activeOperations, setActiveOperations] = useState<ActiveOperation[]>([])
  const [alerts, setAlerts] = useState<CleanupAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchActiveOperations, 5000) // Update active operations every 5 seconds
    return () => clearInterval(interval)
  }, [timeRange])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchMetrics(),
        fetchPerformance(),
        fetchActiveOperations(),
        fetchAlerts()
      ])
    } catch (error) {
      console.error('Failed to fetch cleanup monitoring data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async () => {
    const response = await fetch(`/api/admin/media/cleanup/monitoring?type=metrics&days=${timeRange}`)
    const result = await response.json()
    if (result.success) {
      setMetrics(result.data)
    }
  }

  const fetchPerformance = async () => {
    const response = await fetch(`/api/admin/media/cleanup/monitoring?type=performance&days=${timeRange}`)
    const result = await response.json()
    if (result.success) {
      setPerformance(result.data)
    }
  }

  const fetchActiveOperations = async () => {
    const response = await fetch('/api/admin/media/cleanup/monitoring?type=active')
    const result = await response.json()
    if (result.success) {
      setActiveOperations(result.data)
    }
  }

  const fetchAlerts = async () => {
    const response = await fetch('/api/admin/media/cleanup/monitoring?type=alerts')
    const result = await response.json()
    if (result.success) {
      setAlerts(result.data)
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
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`
    return `${(ms / 3600000).toFixed(1)}h`
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'running':
        return 'secondary'
      case 'failed':
        return 'destructive'
      case 'cancelled':
        return 'outline'
      default:
        return 'default'
    }
  }

  const getAlertBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'error':
        return 'destructive'
      case 'warning':
        return 'secondary'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Cleanup Monitoring</h2>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cleanup Monitoring</h2>
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
          <Button onClick={fetchData} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Active Operations Alert */}
      {activeOperations.length > 0 && (
        <Card className="p-4 border-blue-200 bg-blue-50">
          <h3 className="font-semibold mb-3 text-blue-800">Active Cleanup Operations</h3>
          <div className="space-y-2">
            {activeOperations.map((operation) => (
              <div key={operation.id} className="flex items-center justify-between p-3 bg-white rounded border">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{operation.operationType}</Badge>
                  <span className="text-sm">
                    {operation.filesProcessed} files processed, {operation.filesDeleted} deleted
                  </span>
                  <span className="text-xs text-gray-500">
                    Running for {formatDuration(operation.duration)}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {formatBytes(operation.spaceFreed)} freed
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Recent Alerts</h3>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <Badge variant={getAlertBadgeVariant(alert.severity)}>
                    {alert.severity}
                  </Badge>
                  <span className="text-sm">{alert.message}</span>
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
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {metrics && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Operations</p>
                    <p className="text-2xl font-bold">{metrics.totalOperations.toLocaleString()}</p>
                  </div>
                </Card>

                <Card className="p-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-green-600">{metrics.successRate.toFixed(1)}%</p>
                  </div>
                </Card>

                <Card className="p-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Files Deleted</p>
                    <p className="text-2xl font-bold">{metrics.totalFilesDeleted.toLocaleString()}</p>
                  </div>
                </Card>

                <Card className="p-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Space Freed</p>
                    <p className="text-2xl font-bold">{formatBytes(metrics.totalSpaceFreed)}</p>
                  </div>
                </Card>
              </div>

              {/* Operation Types */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Operations by Type</h3>
                  <div className="space-y-3">
                    {Object.entries(metrics.operationsByType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{type}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Performance Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg Operation Time</span>
                      <span className="font-medium">{formatDuration(metrics.averageOperationTime)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Files Processed</span>
                      <span className="font-medium">{metrics.totalFilesProcessed.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Deletion Rate</span>
                      <span className="font-medium">
                        {metrics.totalFilesProcessed > 0 
                          ? ((metrics.totalFilesDeleted / metrics.totalFilesProcessed) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          {metrics && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Recent Operations</h3>
              <div className="space-y-3">
                {metrics.recentOperations.map((operation) => (
                  <div key={operation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusBadgeVariant(operation.status)}>
                        {operation.status}
                      </Badge>
                      <span className="text-sm font-medium">{operation.operationType}</span>
                      <span className="text-sm text-gray-600">
                        {operation.filesDeleted}/{operation.filesProcessed} files
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatBytes(operation.spaceFreed)}</div>
                      <div className="text-xs text-gray-500">
                        {operation.duration ? formatDuration(operation.duration) : 'In progress'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {performance && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Files/Second</p>
                    <p className="text-2xl font-bold">{performance.averageFilesPerSecond.toFixed(2)}</p>
                  </div>
                </Card>

                <Card className="p-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Bytes/Second</p>
                    <p className="text-2xl font-bold">{formatBytes(performance.averageBytesPerSecond)}/s</p>
                  </div>
                </Card>

                <Card className="p-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Peak Performance</p>
                    <p className="text-2xl font-bold">{performance.peakPerformance.filesPerSecond.toFixed(2)} files/s</p>
                    <p className="text-xs text-gray-500">
                      {new Date(performance.peakPerformance.timestamp).toLocaleString()}
                    </p>
                  </div>
                </Card>
              </div>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Slowest Operations</h3>
                <div className="space-y-3">
                  {performance.slowestOperations.map((operation, index) => (
                    <div key={operation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono">{operation.id.slice(0, 8)}...</span>
                        <span className="text-sm">{operation.filesProcessed} files</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatDuration(operation.duration)}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(operation.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">All Alerts</h3>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getAlertBadgeVariant(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <span className="font-medium">{alert.type.replace('_', ' ')}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                  {alert.operationId && (
                    <p className="text-xs text-gray-500">Operation: {alert.operationId}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}