'use client';

// Client-side analytics tracking library (privacy-compliant)

export interface AnalyticsConfig {
  apiEndpoint: string;
  sessionId: string;
  articleId: string;
  enableScrollTracking: boolean;
  enableTimeTracking: boolean;
  enableLinkTracking: boolean;
  scrollMilestones: number[]; // Percentages: [25, 50, 75, 100]
  timeMilestones: number[]; // Seconds: [30, 60, 120, 300]
}

export class ArticleAnalytics {
  private config: AnalyticsConfig;
  private viewId: string | null = null;
  private startTime: number;
  private scrollMilestones: Set<number> = new Set();
  private timeMilestones: Set<number> = new Set();
  private isVisible: boolean = true;
  private timeOnPage: number = 0;
  private lastVisibilityChange: number;
  private maxScrollDepth: number = 0;
  private linkClickCount: number = 0;
  private socialShareCount: number = 0;

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.startTime = Date.now();
    this.lastVisibilityChange = this.startTime;
    
    this.init();
  }

  private async init(): Promise<void> {
    // Track initial page view
    await this.trackView();

    // Set up event listeners
    this.setupScrollTracking();
    this.setupTimeTracking();
    this.setupLinkTracking();
    this.setupVisibilityTracking();
    this.setupUnloadTracking();
  }

  // Track initial page view
  private async trackView(): Promise<void> {
    try {
      const viewData = {
        articleId: this.config.articleId,
        sessionId: this.config.sessionId,
        type: 'view',
        userAgent: navigator.userAgent,
        referrer: document.referrer || undefined,
        timestamp: new Date().toISOString(),
        metadata: {
          acceptLanguage: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          screenResolution: `${screen.width}x${screen.height}`,
          viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        },
      };

      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(viewData),
      });

      if (response.ok) {
        const result = await response.json();
        this.viewId = result.viewId;
      }
    } catch (error) {
      console.warn('Failed to track page view:', error);
    }
  }

  // Track interaction events
  private async trackInteraction(
    type: string,
    data: Record<string, any> = {}
  ): Promise<void> {
    if (!this.viewId) return;

    try {
      const interactionData = {
        articleId: this.config.articleId,
        sessionId: this.config.sessionId,
        viewId: this.viewId,
        type: 'interaction',
        interactionType: type,
        timestamp: new Date().toISOString(),
        timeFromStart: Date.now() - this.startTime,
        ...data,
      };

      await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interactionData),
      });
    } catch (error) {
      console.warn('Failed to track interaction:', error);
    }
  }

  // Set up scroll depth tracking
  private setupScrollTracking(): void {
    if (!this.config.enableScrollTracking) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrollPercentage = Math.round((scrollTop / documentHeight) * 100);

          // Update max scroll depth
          this.maxScrollDepth = Math.max(this.maxScrollDepth, scrollPercentage);

          // Check for milestone achievements
          this.config.scrollMilestones.forEach(milestone => {
            if (scrollPercentage >= milestone && !this.scrollMilestones.has(milestone)) {
              this.scrollMilestones.add(milestone);
              this.trackInteraction('SCROLL_MILESTONE', {
                scrollPosition: milestone,
              });
            }
          });

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // Set up time-based tracking
  private setupTimeTracking(): void {
    if (!this.config.enableTimeTracking) return;

    this.config.timeMilestones.forEach(milestone => {
      setTimeout(() => {
        if (this.isVisible && !this.timeMilestones.has(milestone)) {
          this.timeMilestones.add(milestone);
          this.trackInteraction('TIME_MILESTONE', {
            timeFromStart: milestone * 1000,
          });
        }
      }, milestone * 1000);
    });
  }

  // Set up link click tracking
  private setupLinkTracking(): void {
    if (!this.config.enableLinkTracking) return;

    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href) {
        this.linkClickCount++;
        
        // Determine link type
        let linkType = 'external';
        if (link.href.includes(window.location.hostname)) {
          linkType = 'internal';
        }

        this.trackInteraction('LINK_CLICK', {
          linkUrl: link.href,
          elementId: link.id || undefined,
          linkType,
        });
      }
    });
  }

  // Set up page visibility tracking
  private setupVisibilityTracking(): void {
    const handleVisibilityChange = () => {
      const now = Date.now();
      
      if (document.hidden) {
        // Page became hidden
        if (this.isVisible) {
          this.timeOnPage += now - this.lastVisibilityChange;
          this.isVisible = false;
        }
      } else {
        // Page became visible
        if (!this.isVisible) {
          this.lastVisibilityChange = now;
          this.isVisible = true;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  // Set up page unload tracking
  private setupUnloadTracking(): void {
    const handleUnload = () => {
      // Calculate final time on page
      const now = Date.now();
      if (this.isVisible) {
        this.timeOnPage += now - this.lastVisibilityChange;
      }

      // Send final analytics data
      const finalData = {
        timeOnPage: Math.round(this.timeOnPage / 1000), // Convert to seconds
        scrollDepth: this.maxScrollDepth,
        linksClicked: this.linkClickCount,
        socialShares: this.socialShareCount,
        bounced: this.timeOnPage < 10000 && this.maxScrollDepth < 25, // Less than 10s and 25% scroll
      };

      // Use sendBeacon for reliable delivery
      if (navigator.sendBeacon && this.viewId) {
        const updateData = {
          viewId: this.viewId,
          ...finalData,
        };

        navigator.sendBeacon(
          `${this.config.apiEndpoint}/update`,
          JSON.stringify(updateData)
        );
      }
    };

    // Handle various unload events
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    
    // Handle visibility change to hidden as potential exit
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        handleUnload();
      }
    });
  }

  // Public method to track social shares
  public trackSocialShare(platform: string, url?: string): void {
    this.socialShareCount++;
    this.trackInteraction('SOCIAL_SHARE', {
      socialPlatform: platform,
      linkUrl: url || window.location.href,
    });
  }

  // Public method to track newsletter signup
  public trackNewsletterSignup(): void {
    this.trackInteraction('NEWSLETTER_SIGNUP');
  }

  // Public method to track custom events
  public trackCustomEvent(eventType: string, data: Record<string, any> = {}): void {
    this.trackInteraction(eventType, data);
  }

  // Get current session stats
  public getSessionStats(): {
    timeOnPage: number;
    scrollDepth: number;
    linksClicked: number;
    socialShares: number;
  } {
    const now = Date.now();
    const currentTimeOnPage = this.isVisible 
      ? this.timeOnPage + (now - this.lastVisibilityChange)
      : this.timeOnPage;

    return {
      timeOnPage: Math.round(currentTimeOnPage / 1000),
      scrollDepth: this.maxScrollDepth,
      linksClicked: this.linkClickCount,
      socialShares: this.socialShareCount,
    };
  }
}

// Utility function to initialize analytics
export function initializeAnalytics(config: Partial<AnalyticsConfig>): ArticleAnalytics | null {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return null;

  // Check for Do Not Track
  if (navigator.doNotTrack === '1' || (window as any).doNotTrack === '1') {
    console.info('Analytics disabled due to Do Not Track setting');
    return null;
  }

  // Generate session ID if not provided
  const sessionId = config.sessionId || generateClientSessionId();

  const fullConfig: AnalyticsConfig = {
    apiEndpoint: '/api/analytics/track',
    sessionId,
    articleId: '',
    enableScrollTracking: true,
    enableTimeTracking: true,
    enableLinkTracking: true,
    scrollMilestones: [25, 50, 75, 100],
    timeMilestones: [30, 60, 120, 300], // 30s, 1m, 2m, 5m
    ...config,
  };

  // Validate required config
  if (!fullConfig.articleId) {
    console.warn('Analytics not initialized: articleId is required');
    return null;
  }

  return new ArticleAnalytics(fullConfig);
}

// Generate client-side session ID
function generateClientSessionId(): string {
  // Use a combination of timestamp and random values
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `${timestamp}-${random}`;
}

// React hook for analytics
export function useArticleAnalytics(articleId: string, config?: Partial<AnalyticsConfig>) {
  const analytics = initializeAnalytics({
    articleId,
    ...config,
  });

  return {
    analytics,
    trackSocialShare: (platform: string, url?: string) => analytics?.trackSocialShare(platform, url),
    trackNewsletterSignup: () => analytics?.trackNewsletterSignup(),
    trackCustomEvent: (eventType: string, data?: Record<string, any>) => analytics?.trackCustomEvent(eventType, data),
    getSessionStats: () => analytics?.getSessionStats(),
  };
}