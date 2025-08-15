'use client';

import { getCookie, setCookie } from 'cookies-next';

export type ABTestVariant = 'A' | 'B';

export interface ABTestConfig {
  testName: string;
  variants: {
    A: {
      copy: {
        heading: string;
        subheading: string;
        cta: string;
      };
      ctaColor: string;
    };
    B: {
      copy: {
        heading: string;
        subheading: string;
        cta: string;
      };
      ctaColor: string;
    };
  };
}

const NEWSLETTER_AB_TEST: ABTestConfig = {
  testName: 'newsletter_v1',
  variants: {
    A: {
      copy: {
        heading: 'AI & Dev news in 5 minutes. Every Friday.',
        subheading: 'Join {{count}}+ developers. No noise, just signal.',
        cta: 'Subscribe',
      },
      ctaColor: 'bg-blue-600 hover:bg-blue-700',
    },
    B: {
      copy: {
        heading: 'Stay ahead in AI & Development.',
        subheading: '{{count}}+ developers trust our weekly insights.',
        cta: 'Get Weekly Updates',
      },
      ctaColor: 'bg-green-600 hover:bg-green-700',
    },
  },
};

export function getABTestVariant(): ABTestVariant {
  if (typeof window === 'undefined') {
    return 'A'; // Default for SSR
  }

  const cookieName = `ab_group`;
  let variant = getCookie(cookieName) as ABTestVariant;

  if (!variant || !['A', 'B'].includes(variant)) {
    // Assign random variant (50/50 split)
    variant = Math.random() < 0.5 ? 'A' : 'B';
    
    // Set cookie for 14 days
    setCookie(cookieName, variant, {
      maxAge: 14 * 24 * 60 * 60, // 14 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return variant;
}

export function getABTestConfig(variant: ABTestVariant) {
  return NEWSLETTER_AB_TEST.variants[variant];
}

export function formatABTestCopy(text: string, subscriberCount: number): string {
  return text.replace('{{count}}', subscriberCount.toLocaleString());
}

// Analytics helper for A/B test results
export function trackABTestAssignment(variant: ABTestVariant) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'ab_test_assignment', {
      test_name: NEWSLETTER_AB_TEST.testName,
      variant,
      timestamp: Date.now(),
    });
  }
}