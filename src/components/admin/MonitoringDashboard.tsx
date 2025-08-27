'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SystemMetrics {
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  averageResponseTime: number;
  slowRequests: number;
  uptime: number;
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<
    string,
    { status: 'pass' | 'fail'; message?: string; responseTime?: number }
  >;
  timestamp: string;
}

interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  requestId: string;
  userAgent?: string;
  ip?: string;
  error?: string;
}

interface MonitoringData {
  systemMetrics: SystemMetrics;
  healthStatus: HealthStatus;
  recentRequests: RequestMetrics[];
  windowMetrics: {
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
  };
}

export default function MonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMonitoringData = async () => {
    try {
      const response = await fetch('/api/admin/monitoring?action=overview');
      if (!response.ok) {
        throw new Error('Failed to fetch monitoring data');
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const clearMetrics = async () => {
    try {
      const response = await fetch('/api/admin/monitoring?action=clear', {
        method: 'POST',
      });
      if (response.ok) {
        await fetchMonitoringData();
      }
    } catch (err) {
      setError('Failed to clear metrics');
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchMonitoringData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="p-6">Loading monitoring data...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <Button onClick={fetchMonitoringData}>Retry</Button>
      </div>
    );
  }

  if (!data) {
    return <div className="p-6">No monitoring data available</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">System Monitoring</h1>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button onClick={fetchMonitoringData}>Refresh</Button>
          <Button
            onClick={() => window.open('/admin/memory', '_blank')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Memory Optimization
          </Button>
          <Button variant="destructive" onClick={clearMetrics}>
            Clear Metrics
          </Button>
        </div>
      </div>

      {/* Health Status */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-3 h-3 rounded-full ${getStatusColor(data.healthStatus.status)}`}
          />
          <h2 className="text-lg font-semibold">
            System Health: {data.healthStatus.status}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(data.healthStatus.checks).map(([check, result]) => (
            <div
              key={check}
              className="flex items-center justify-between p-2 border rounded"
            >
              <span className="font-medium">{check}</span>
              <div className="flex items-center gap-2">
                <Badge
                  variant={result.status === 'pass' ? 'default' : 'destructive'}
                >
                  {result.status}
                </Badge>
                {result.message && (
                  <span className="text-sm text-gray-600">
                    {result.message}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Total Requests</h3>
          <div className="text-2xl font-bold">
            {data.systemMetrics.totalRequests}
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Success Rate</h3>
          <div className="text-2xl font-bold text-green-600">
            {data.systemMetrics.totalRequests > 0
              ? (
                  (data.systemMetrics.successfulRequests /
                    data.systemMetrics.totalRequests) *
                  100
                ).toFixed(1)
              : 0}
            %
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Avg Response Time</h3>
          <div className="text-2xl font-bold">
            {data.systemMetrics.averageResponseTime.toFixed(0)}ms
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Uptime</h3>
          <div className="text-2xl font-bold">
            {formatUptime(data.systemMetrics.uptime)}
          </div>
        </Card>
      </div>

      {/* Memory Usage */}
      {data.systemMetrics.memoryUsage && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Memory Usage</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Heap Used</div>
              <div className="font-bold">
                {formatBytes(data.systemMetrics.memoryUsage.heapUsed)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Heap Total</div>
              <div className="font-bold">
                {formatBytes(data.systemMetrics.memoryUsage.heapTotal)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">External</div>
              <div className="font-bold">
                {formatBytes(data.systemMetrics.memoryUsage.external)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">RSS</div>
              <div className="font-bold">
                {formatBytes(data.systemMetrics.memoryUsage.rss)}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Requests */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Recent Requests</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Method</th>
                <th className="text-left p-2">Path</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Response Time</th>
                <th className="text-left p-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.recentRequests.map((request) => (
                <tr key={request.requestId} className="border-b">
                  <td className="p-2">
                    <Badge variant="outline">{request.method}</Badge>
                  </td>
                  <td className="p-2 font-mono text-xs">{request.path}</td>
                  <td className="p-2">
                    <Badge
                      variant={
                        request.statusCode < 400 ? 'default' : 'destructive'
                      }
                    >
                      {request.statusCode}
                    </Badge>
                  </td>
                  <td className="p-2">{request.responseTime}ms</td>
                  <td className="p-2">
                    {new Date(request.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
