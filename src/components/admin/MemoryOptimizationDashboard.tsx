'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  heapUsedPercent: number;
  timestamp: number;
}

interface MemoryOptimizationConfig {
  enableAutoGC: boolean;
  gcThreshold: number;
  enableCacheCleanup: boolean;
  cacheCleanupThreshold: number;
  enableMemoryLeakDetection: boolean;
  leakDetectionWindow: number;
  maxCacheSize: number;
  enableObjectPooling: boolean;
}

interface MemoryOptimizationResult {
  beforeStats: MemoryStats;
  afterStats: MemoryStats;
  optimizationsApplied: string[];
  memoryFreed: number;
  success: boolean;
}

interface LeakDetection {
  hasLeak: boolean;
  leakSeverity: 'low' | 'medium' | 'high';
  details: string[];
}

interface MemoryStatus {
  currentStats: MemoryStats;
  pressureLevel: 'low' | 'medium' | 'high' | 'critical';
  trend: {
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
    samples: number;
  };
  historyCount: number;
  recentHistory: MemoryStats[];
}

export default function MemoryOptimizationDashboard() {
  const [memoryStatus, setMemoryStatus] = useState<MemoryStatus | null>(null);
  const [config, setConfig] = useState<MemoryOptimizationConfig | null>(null);
  const [leakDetection, setLeakDetection] = useState<LeakDetection | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [lastOptimization, setLastOptimization] =
    useState<MemoryOptimizationResult | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMemoryStatus = async () => {
    try {
      const response = await fetch(
        '/api/admin/memory/optimization?action=status'
      );
      if (!response.ok) throw new Error('Failed to fetch memory status');
      const data = await response.json();
      setMemoryStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch(
        '/api/admin/memory/optimization?action=config'
      );
      if (!response.ok) throw new Error('Failed to fetch config');
      const data = await response.json();
      setConfig(data.config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fetchLeakDetection = async () => {
    try {
      const response = await fetch(
        '/api/admin/memory/optimization?action=leak-detection'
      );
      if (!response.ok) throw new Error('Failed to fetch leak detection');
      const data = await response.json();
      setLeakDetection(data.leakDetection);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMemoryStatus(),
        fetchConfig(),
        fetchLeakDetection(),
      ]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const optimizeMemory = async () => {
    setOptimizing(true);
    try {
      const response = await fetch(
        '/api/admin/memory/optimization?action=optimize',
        {
          method: 'POST',
        }
      );
      const data = await response.json();

      if (data.success) {
        setLastOptimization(data.result);
        await fetchAllData();
      } else {
        setError(data.message || 'Optimization failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setOptimizing(false);
    }
  };

  const forceGC = async () => {
    try {
      const response = await fetch(
        '/api/admin/memory/optimization?action=force-gc',
        {
          method: 'POST',
        }
      );
      const data = await response.json();

      if (data.success) {
        await fetchMemoryStatus();
      } else {
        setError(data.message || 'GC failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GC failed');
    }
  };

  const updateConfig = async (newConfig: Partial<MemoryOptimizationConfig>) => {
    try {
      const response = await fetch(
        '/api/admin/memory/optimization?action=update-config',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config: newConfig }),
        }
      );
      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
      } else {
        setError(data.message || 'Config update failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Config update failed');
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchAllData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getPressureColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-orange-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'decreasing':
        return 'text-green-600';
      case 'stable':
        return 'text-blue-600';
      case 'increasing':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getLeakSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-yellow-100 text-yellow-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-6">Loading memory optimization dashboard...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <Button onClick={fetchAllData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Memory Optimization</h1>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button onClick={fetchAllData}>Refresh</Button>
          <Button onClick={forceGC} variant="outline">
            Force GC
          </Button>
          <Button
            onClick={optimizeMemory}
            disabled={optimizing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {optimizing ? 'Optimizing...' : 'Optimize Memory'}
          </Button>
        </div>
      </div>

      {/* Current Memory Status */}
      {memoryStatus && (
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-3 h-3 rounded-full ${getPressureColor(memoryStatus.pressureLevel)}`}
            />
            <h2 className="text-lg font-semibold">
              Memory Status: {memoryStatus.pressureLevel} pressure
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-600">Heap Used</div>
              <div className="font-bold">
                {formatBytes(memoryStatus.currentStats.heapUsed)}
              </div>
              <div className="text-xs text-gray-500">
                {memoryStatus.currentStats.heapUsedPercent.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Heap Total</div>
              <div className="font-bold">
                {formatBytes(memoryStatus.currentStats.heapTotal)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">External</div>
              <div className="font-bold">
                {formatBytes(memoryStatus.currentStats.external)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">RSS</div>
              <div className="font-bold">
                {formatBytes(memoryStatus.currentStats.rss)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm text-gray-600">Trend: </span>
              <span
                className={`font-medium ${getTrendColor(memoryStatus.trend.trend)}`}
              >
                {memoryStatus.trend.trend} (
                {memoryStatus.trend.changePercent.toFixed(1)}%)
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Samples: </span>
              <span className="font-medium">{memoryStatus.trend.samples}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Memory Leak Detection */}
      {leakDetection && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Memory Leak Detection</h3>
          <div className="flex items-center gap-3 mb-3">
            <Badge variant={leakDetection.hasLeak ? 'destructive' : 'default'}>
              {leakDetection.hasLeak ? 'Leak Detected' : 'No Leaks'}
            </Badge>
            {leakDetection.hasLeak && (
              <Badge
                className={getLeakSeverityColor(leakDetection.leakSeverity)}
              >
                {leakDetection.leakSeverity} severity
              </Badge>
            )}
          </div>
          {leakDetection.details.length > 0 && (
            <div className="space-y-1">
              {leakDetection.details.map((detail, index) => (
                <div key={index} className="text-sm text-gray-600">
                  • {detail}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Last Optimization Result */}
      {lastOptimization && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Last Optimization Result</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
            <div>
              <div className="text-sm text-gray-600">Memory Freed</div>
              <div className="font-bold text-green-600">
                {formatBytes(lastOptimization.memoryFreed)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Before</div>
              <div className="font-bold">
                {formatBytes(lastOptimization.beforeStats.heapUsed)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">After</div>
              <div className="font-bold">
                {formatBytes(lastOptimization.afterStats.heapUsed)}
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">
              Optimizations Applied:
            </div>
            <div className="flex flex-wrap gap-1">
              {lastOptimization.optimizationsApplied.map((opt, index) => (
                <Badge key={index} variant="outline">
                  {opt.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Configuration */}
      {config && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Optimization Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto GC</label>
                <input
                  type="checkbox"
                  checked={config.enableAutoGC}
                  onChange={(e) =>
                    updateConfig({ enableAutoGC: e.target.checked })
                  }
                  className="rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Cache Cleanup</label>
                <input
                  type="checkbox"
                  checked={config.enableCacheCleanup}
                  onChange={(e) =>
                    updateConfig({ enableCacheCleanup: e.target.checked })
                  }
                  className="rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Leak Detection</label>
                <input
                  type="checkbox"
                  checked={config.enableMemoryLeakDetection}
                  onChange={(e) =>
                    updateConfig({
                      enableMemoryLeakDetection: e.target.checked,
                    })
                  }
                  className="rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Object Pooling</label>
                <input
                  type="checkbox"
                  checked={config.enableObjectPooling}
                  onChange={(e) =>
                    updateConfig({ enableObjectPooling: e.target.checked })
                  }
                  className="rounded"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">
                  GC Threshold ({config.gcThreshold}%)
                </label>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={config.gcThreshold}
                  onChange={(e) =>
                    updateConfig({ gcThreshold: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">
                  Max Cache Size ({config.maxCacheSize})
                </label>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={config.maxCacheSize}
                  onChange={(e) =>
                    updateConfig({ maxCacheSize: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
