'use client';

import { useCallback } from 'react';

interface NewsletterAnalyticsEvent {
  newsletter_view: {
    variant: string;
    pathname: string;
    ts: number;
  };
  newsletter_submit_clicked: {
    variant: string;
    pathname: string;
    ts: number;
  };
  newsletter_subscribed_ok: {
    variant: string;
    pathname: string;
    ts: number;
  };
  newsletter_subscribed_error: {
    variant: string;
    pathname: string;
    error_code: string;
    ts: number;
  };
  newsletter_verified_ok: {
    ts: number;
  };
  newsletter_unsubscribed_ok: {
    ts: number;
  };
}

type EventName = keyof NewsletterAnalyticsEvent;
type EventData<T extends EventName> = NewsletterAnalyticsEvent[T];

export function useAnalytics() {
  const trackEvent = useCallback(
    <T extends EventName>(eventName: T, data: EventData<T>) => {
      try {
        // Send to analytics service (Google Analytics, Mixpanel, etc.)
        if (typeof window !== 'undefined') {
          // Google Analytics 4
          if (window.gtag) {
            window.gtag('event', eventName, data);
          }

          // Custom analytics endpoint
          fetch('/api/analytics/track', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              event: eventName,
              data,
              timestamp: Date.now(),
              url: window.location.href,
              userAgent: navigator.userAgent,
            }),
          }).catch(console.error);

          // Console log for development
          if (process.env.NODE_ENV === 'development') {
            console.log('📊 Analytics Event:', eventName, data);
          }
        }
      } catch (error) {
        console.error('Analytics tracking error:', error);
      }
    },
    []
  );

  const trackNewsletterView = useCallback(
    (variant: string) => {
      trackEvent('newsletter_view', {
        variant,
        pathname: window.location.pathname,
        ts: Date.now(),
      });
    },
    [trackEvent]
  );

  const trackNewsletterSubmit = useCallback(
    (variant: string) => {
      trackEvent('newsletter_submit_clicked', {
        variant,
        pathname: window.location.pathname,
        ts: Date.now(),
      });
    },
    [trackEvent]
  );

  const trackNewsletterSuccess = useCallback(
    (variant: string) => {
      trackEvent('newsletter_subscribed_ok', {
        variant,
        pathname: window.location.pathname,
        ts: Date.now(),
      });
    },
    [trackEvent]
  );

  const trackNewsletterError = useCallback(
    (variant: string, errorCode: string) => {
      trackEvent('newsletter_subscribed_error', {
        variant,
        pathname: window.location.pathname,
        error_code: errorCode,
        ts: Date.now(),
      });
    },
    [trackEvent]
  );

  const trackNewsletterVerified = useCallback(() => {
    trackEvent('newsletter_verified_ok', {
      ts: Date.now(),
    });
  }, [trackEvent]);

  const trackNewsletterUnsubscribed = useCallback(() => {
    trackEvent('newsletter_unsubscribed_ok', {
      ts: Date.now(),
    });
  }, [trackEvent]);

  return {
    trackNewsletterView,
    trackNewsletterSubmit,
    trackNewsletterSuccess,
    trackNewsletterError,
    trackNewsletterVerified,
    trackNewsletterUnsubscribed,
  };
}

// Global gtag type declaration
declare global {
  interface Window {
    gtag?: (
      command: 'event',
      eventName: string,
      parameters: Record<string, any>
    ) => void;
  }
}
