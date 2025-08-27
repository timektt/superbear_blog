/**
 * Database Optimization Dashboard Component
 *
 * Provides admin interface for monitoring database performance,
 * viewing optimization reports, and running maintenance tasks.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface QueryMetrics {
  queryType: string;
  executionTime: number;
  recordsReturned: number;
  indexesUsed: string[];
  suggestions: string[];
}

interface OptimizationReport {
  timestamp: string;
  queries: QueryMetrics[];
  overallHealth: 'excellent' | 'good' | 'needs_attention' | 'critical';
  recommendations: string[];
}

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Array<{
    name: string;
    status: boolean;
    message: string;
  }>;
}

export default function DatabaseOptimization() {
  const [report, setReport] = useState<OptimizationReport | null>(null);
  const [healthCheck, setHealthCheck] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'queries' | 'health' | 'maintenance'
  >('overview');

  const fetchOptimizationReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        '/api/admin/database/optimization?type=full'
      );
      if (response.ok) {
        const data = await response.json();
        setReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch optimization report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        '/api/admin/database/optimization?type=health'
      );
      if (response.ok) {
        const data = await response.json();
        setHealthCheck(data);
      }
    } catch (error) {
      console.error('Failed to fetch health check:', error);
    } finally {
      setLoading(false);
    }
  };

  const runMaintenanceTask = async (action: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/database/optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${action} completed: ${result.message}`);
        // Refresh data after maintenance
        await fetchOptimizationReport();
        await fetchHealthCheck();
      } else {
        const error = await response.json();
        alert(`${action} failed: ${error.message}`);
      }
    } catch (error) {
      console.error(`Failed to run ${action}:`, error);
      alert(`Failed to run ${action}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptimizationReport();
    fetchHealthCheck();
  }, []);

  const getHealthBadgeColor = (health: string) => {
    switch (health) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'needs_attention':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceBadgeColor = (executionTime: number) => {
    if (executionTime < 50) return 'bg-green-100 text-green-800';
    if (executionTime < 100) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Database Optimization</h2>
        <div className="flex gap-2">
          <Button
            onClick={fetchOptimizationReport}
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Refreshing...' : 'Refresh Report'}
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'queries', label: 'Query Performance' },
            { id: 'health', label: 'Health Check' },
            { id: 'maintenance', label: 'Maintenance' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Overall Health</h3>
            <Badge className={getHealthBadgeColor(report.overallHealth)}>
              {report.overallHealth.replace('_', ' ').toUpperCase()}
            </Badge>
            <p className="text-sm text-gray-600 mt-2">
              Last updated: {new Date(report.timestamp).toLocaleString()}
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Query Performance</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total Queries Analyzed:</span>
                <span className="font-medium">{report.queries.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Slow Queries (&gt;100ms):</span>
                <span className="font-medium text-red-600">
                  {report.queries.filter((q) => q.executionTime > 100).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Avg Execution Time:</span>
                <span className="font-medium">
                  {Math.round(
                    report.queries.reduce(
                      (sum, q) => sum + q.executionTime,
                      0
                    ) / report.queries.length
                  )}
                  ms
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
            <div className="text-sm text-gray-600">
              {report.recommendations.length} optimization suggestions available
            </div>
            <Button
              onClick={() => setActiveTab('queries')}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              View Details
            </Button>
          </Card>
        </div>
      )}

      {/* Query Performance Tab */}
      {activeTab === 'queries' && report && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Query Performance Analysis
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Query Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Execution Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Records
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Indexes Used
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.queries.map((query, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {query.queryType.replace(/_/g, ' ').toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Badge
                          className={getPerformanceBadgeColor(
                            query.executionTime
                          )}
                        >
                          {query.executionTime}ms
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {query.recordsReturned}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-wrap gap-1">
                          {query.indexesUsed.map((index, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs"
                            >
                              {index}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {query.suggestions.length > 0 ? (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Needs Optimization
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">
                            Optimized
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recommendations */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Optimization Recommendations
            </h3>
            <div className="space-y-3">
              {report.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p className="text-sm text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Health Check Tab */}
      {activeTab === 'health' && healthCheck && (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Database Health Status</h3>
              <Badge className={getHealthBadgeColor(healthCheck.status)}>
                {healthCheck.status.toUpperCase()}
              </Badge>
            </div>

            <div className="space-y-3">
              {healthCheck.checks.map((check, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-sm">{check.name}</h4>
                    <p className="text-xs text-gray-600">{check.message}</p>
                  </div>
                  <Badge
                    className={
                      check.status
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }
                  >
                    {check.status ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Database Maintenance Tasks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Analyze Slow Queries</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Identify and analyze queries that are performing slowly.
                </p>
                <Button
                  onClick={() => runMaintenanceTask('analyze_slow_queries')}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  Run Analysis
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Update Statistics</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Update database statistics for better query planning.
                </p>
                <Button
                  onClick={() => runMaintenanceTask('update_statistics')}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  Update Stats
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Vacuum Database</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Reclaim storage space and optimize database file.
                </p>
                <Button
                  onClick={() => runMaintenanceTask('vacuum_database')}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  Run Vacuum
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Full Optimization</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Run comprehensive database optimization tasks.
                </p>
                <Button
                  onClick={fetchOptimizationReport}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  Optimize Now
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
