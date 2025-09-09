'use client';

import { useEffect, useRef } from 'react';
import { useArticleAnalytics as useAnalyticsClient } from '@/lib/analytics-client';

interface UseArticleAnalyticsProps {
  articleId: string;
  enabled?: boolean;
}

export function useArticleAnalyticsTracking({
  articleId,
  enabled = true,
}: UseArticleAnalyticsProps) {
  const analyticsRef = useRef<any | null>(
    null
  );

  useEffect(() => {
    if (!enabled || !articleId || typeof window === 'undefined') {
      return;
    }

    // Initialize analytics tracking
    const analytics = useAnalyticsClient(articleId, {
      enableScrollTracking: true,
      enableTimeTracking: true,
      enableLinkTracking: true,
      scrollMilestones: [25, 50, 75, 100],
      timeMilestones: [30, 60, 120, 300], // 30s, 1m, 2m, 5m
    });

    analyticsRef.current = analytics;

    // Cleanup function
    return () => {
      analyticsRef.current = null;
    };
  }, [articleId, enabled]);

  // Return tracking functions
  return {
    trackSocialShare: (platform: string, url?: string) => {
      analyticsRef.current?.trackSocialShare(platform, url);
    },
    trackNewsletterSignup: () => {
      analyticsRef.current?.trackNewsletterSignup();
    },
    trackCustomEvent: (eventType: string, data?: Record<string, any>) => {
      analyticsRef.current?.trackCustomEvent(eventType, data);
    },
    getSessionStats: () => {
      return analyticsRef.current?.getSessionStats();
    },
  };
}
