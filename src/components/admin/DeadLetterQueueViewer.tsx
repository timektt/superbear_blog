'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '@/lib/hooks/useToast';

interface DLQItem {
  id: string;
  campaignId: string;
  recipientEmail: string;
  attempts: number;
  lastError: string;
  lastAttemptAt: string;
  campaign: {
    id: string;
    title: string;
    status: string;
  };
}

interface DLQViewerProps {
  campaignId?: string;
}

export function DeadLetterQueueViewer({ campaignId }: DLQViewerProps) {
  const [dlqItems, setDlqItems] = useState<DLQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const { toast } = useToast();

  const fetchDLQItems = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(campaignId && { campaignId }),
      });

      const response = await fetch(`/api/admin/campaigns/dlq?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch DLQ items');
      }

      setDlqItems(result.data);
      setPagination(result.pagination);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch DLQ items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const moveToDLQ = async (targetCampaignId: string) => {
    if (!confirm('Are you sure you want to move failed deliveries to Dead Letter Queue?')) {
      return;
    }

    setActionLoading('move-dlq');
    try {
      const response = await fetch('/api/admin/campaigns/dlq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: targetCampaignId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to move to DLQ');
      }

      toast({
        title: 'Success',
        description: `${result.movedCount} deliveries moved to Dead Letter Queue`,
      });

      fetchDLQItems(pagination.page);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to move to DLQ',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchDLQItems();
  }, [campaignId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const truncateError = (error: string, maxLength = 100) => {
    return error.length > maxLength ? `${error.substring(0, maxLength)}...` : error;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Dead Letter Queue
            {pagination.total > 0 && (
              <Badge variant="destructive">{pagination.total}</Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDLQItems(pagination.page)}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {campaignId && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => moveToDLQ(campaignId)}
                disabled={actionLoading === 'move-dlq'}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {actionLoading === 'move-dlq' ? 'Moving...' : 'Move Failed to DLQ'}
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading DLQ items...</span>
          </div>
        ) : dlqItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No items in Dead Letter Queue</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Last Error</TableHead>
                  <TableHead>Last Attempt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dlqItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.campaign.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.campaignId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">{item.recipientEmail}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">{item.attempts}</Badge>
                    </TableCell>
                    <TableCell>
                      <div 
                        className="text-sm text-destructive"
                        title={item.lastError}
                      >
                        {truncateError(item.lastError)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(item.lastAttemptAt)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} items
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchDLQItems(pagination.page - 1)}
                    disabled={pagination.page <= 1 || loading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchDLQItems(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}