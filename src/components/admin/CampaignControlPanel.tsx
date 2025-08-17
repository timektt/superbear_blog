'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Play, Pause, Square, RotateCcw, BarChart3 } from 'lucide-react';
import { useToast } from '@/lib/hooks/useToast';

interface CampaignControlPanelProps {
  campaign: {
    id: string;
    title: string;
    status: string;
  };
  onStatusChange?: () => void;
}

export function CampaignControlPanel({ campaign, onStatusChange }: CampaignControlPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAction = async (action: string, data?: any) => {
    setLoading(action);
    try {
      const response = await fetch(`/api/admin/campaigns/${campaign.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {}),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${action} campaign`);
      }

      toast({
        title: 'Success',
        description: result.message,
      });

      onStatusChange?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${action} campaign`,
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleEmergencyStop = async () => {
    if (!confirm('Are you sure you want to trigger an emergency stop for ALL campaigns? This action cannot be undone.')) {
      return;
    }

    const reason = prompt('Please provide a reason for the emergency stop:');
    if (!reason) return;

    setLoading('emergency-stop');
    try {
      const response = await fetch('/api/admin/campaigns/emergency-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to trigger emergency stop');
      }

      toast({
        title: 'Emergency Stop Triggered',
        description: `${result.affectedCampaigns.length} campaigns have been paused.`,
        variant: 'destructive',
      });

      onStatusChange?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to trigger emergency stop',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      DRAFT: 'outline',
      SCHEDULED: 'secondary',
      QUEUED: 'secondary',
      SENDING: 'default',
      PAUSED: 'destructive',
      COMPLETED: 'default',
      CANCELLED: 'destructive',
      FAILED: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    );
  };

  const canPause = ['QUEUED', 'SENDING'].includes(campaign.status);
  const canResume = campaign.status === 'PAUSED';
  const canCancel = ['QUEUED', 'SENDING', 'PAUSED'].includes(campaign.status);
  const canRetry = ['COMPLETED', 'FAILED', 'CANCELLED'].includes(campaign.status);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Campaign Controls</span>
          {getStatusBadge(campaign.status)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {canPause && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const reason = prompt('Reason for pausing (optional):');
                handleAction('pause', { reason });
              }}
              disabled={loading === 'pause'}
            >
              <Pause className="w-4 h-4 mr-2" />
              {loading === 'pause' ? 'Pausing...' : 'Pause'}
            </Button>
          )}

          {canResume && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('resume')}
              disabled={loading === 'resume'}
            >
              <Play className="w-4 h-4 mr-2" />
              {loading === 'resume' ? 'Resuming...' : 'Resume'}
            </Button>
          )}

          {canCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (!confirm('Are you sure you want to cancel this campaign?')) return;
                const reason = prompt('Reason for cancellation:');
                if (reason) handleAction('cancel', { reason });
              }}
              disabled={loading === 'cancel'}
            >
              <Square className="w-4 h-4 mr-2" />
              {loading === 'cancel' ? 'Cancelling...' : 'Cancel'}
            </Button>
          )}

          {canRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const maxRetries = prompt('Maximum retry attempts (default: 3):');
                handleAction('retry', { maxRetries: maxRetries ? parseInt(maxRetries) : 3 });
              }}
              disabled={loading === 'retry'}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {loading === 'retry' ? 'Retrying...' : 'Retry Failed'}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/api/admin/campaigns/${campaign.id}/stats`, '_blank')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            View Stats
          </Button>
        </div>

        <div className="border-t pt-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleEmergencyStop}
            disabled={loading === 'emergency-stop'}
            className="w-full"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            {loading === 'emergency-stop' ? 'Stopping All...' : 'Emergency Stop All Campaigns'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            This will immediately pause ALL active campaigns system-wide.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}