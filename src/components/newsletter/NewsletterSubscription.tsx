'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { usePathname } from 'next/navigation';
import { Mail, Shield, Sparkles, Check } from 'lucide-react';
import { useToast } from '@/lib/hooks/useToast';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { getABTestVariant, getABTestConfig, formatABTestCopy, trackABTestAssignment } from '@/lib/ab-test';
import newsletterContent from '@/locales/en/newsletter.json';

interface NewsletterSubscriptionProps {
  source?: string;
  className?: string;
  variant?: 'card' | 'compact' | 'sidebar';
  showPreferences?: boolean;
  utmSource?: string;
  utmCampaign?: string;
}

interface SubscriberStats {
  count: number;
  loading: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewsletterSubscription({
  source = 'website',
  className = '',
  variant = 'card',
  showPreferences = false,
  utmSource,
  utmCampaign,
}: NewsletterSubscriptionProps) {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Anti-spam honeypot
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriberStats, setSubscriberStats] = useState<SubscriberStats>({ count: 10000, loading: true });
  const [isPending, startTransition] = useTransition();
  
  const pathname = usePathname();
  const { showSuccess, showError } = useToast();
  const {
    trackNewsletterView,
    trackNewsletterSubmit,
    trackNewsletterSuccess,
    trackNewsletterError,
  } = useAnalytics();

  // A/B Test
  const abVariant = getABTestVariant();
  const abConfig = getABTestConfig(abVariant);

  // Fetch subscriber count
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/newsletter/stats');
        if (response.ok) {
          const data = await response.json();
          setSubscriberStats({ count: data.active || 10000, loading: false });
        } else {
          setSubscriberStats({ count: 10000, loading: false });
        }
      } catch {
        setSubscriberStats({ count: 10000, loading: false });
      }
    };

    fetchStats();
  }, []);

  // Track view on mount
  useEffect(() => {
    trackNewsletterView(variant);
    trackABTestAssignment(abVariant);
  }, [variant, trackNewsletterView, abVariant]);

  // Email validation with debounce
  useEffect(() => {
    if (email && !EMAIL_REGEX.test(email)) {
      setError(newsletterContent.errors.invalid_email);
    } else {
      setError(null);
    }
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Anti-spam: Check honeypot
    if (honeypot) {
      console.warn('Spam attempt detected');
      return;
    }

    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      setError(newsletterContent.errors.invalid_email);
      trackNewsletterError(variant, '400');
      return;
    }

    trackNewsletterSubmit(variant);
    setIsLoading(true);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            variant,
            utm_source: utmSource,
            utm_campaign: utmCampaign,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setIsSubscribed(true);
          setEmail('');
          trackNewsletterSuccess(variant);
          showSuccess(
            newsletterContent.success_title,
            newsletterContent.success_message
          );
        } else {
          let errorMessage = newsletterContent.errors.server_error;
          let errorCode = '500';

          switch (response.status) {
            case 400:
              errorMessage = newsletterContent.errors.invalid_email;
              errorCode = '400';
              break;
            case 409:
              errorMessage = newsletterContent.errors.already_subscribed;
              errorCode = '409';
              break;
            case 429:
              errorMessage = newsletterContent.errors.rate_limit;
              errorCode = '429';
              break;
          }

          setError(errorMessage);
          trackNewsletterError(variant, errorCode);
          showError(errorMessage);
        }
      } catch (error) {
        const errorMessage = newsletterContent.errors.server_error;
        setError(errorMessage);
        trackNewsletterError(variant, '500');
        showError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    });
  };

  const getSubscriberText = () => {
    if (subscriberStats.loading) {
      return newsletterContent.subheading_fallback;
    }
    
    if (subscriberStats.count < 1000) {
      return newsletterContent.subheading_fallback;
    }
    
    return formatABTestCopy(abConfig.copy.subheading, subscriberStats.count);
  };

  // Success state
  if (isSubscribed) {
    return (
      <div className={`newsletter-success ${className}`} role="status" aria-live="polite">
        <div className={`${
          variant === 'compact' ? 'p-4' : 'p-6'
        } bg-green-50/70 dark:bg-green-900/20 backdrop-blur-sm rounded-2xl border border-green-200/50 dark:border-green-800/50 ring-1 ring-green-100/50 dark:ring-green-900/50`}>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Check className={`${variant === 'compact' ? 'h-5 w-5' : 'h-6 w-6'} text-green-600 dark:text-green-400`} />
            </div>
            <div>
              <h3 className={`${variant === 'compact' ? 'text-sm' : 'text-base'} font-semibold text-green-800 dark:text-green-200`}>
                {newsletterContent.success_title}
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                {newsletterContent.success_message}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compact variant for hero section
  if (variant === 'compact') {
    return (
      <div className={`newsletter-compact ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
            {newsletterContent.badges.weekly_briefing}
          </span>
        </div>
        
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {abConfig.copy.heading}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {getSubscriberText()}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Honeypot field */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />
          
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="newsletter-email-compact" className="sr-only">
                {newsletterContent.placeholder}
              </label>
              <input
                id="newsletter-email-compact"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={newsletterContent.placeholder}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
                disabled={isLoading || isPending}
                required
                aria-describedby={error ? 'email-error-compact' : undefined}
              />
              {error && (
                <p id="email-error-compact" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">
                  {error}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || isPending || !!error}
              className={`px-6 py-2 font-medium text-white ${abConfig.ctaColor} disabled:bg-gray-400 rounded-lg transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 disabled:hover:scale-100`}
            >
              {isLoading || isPending ? newsletterContent.cta_loading : abConfig.copy.cta}
            </button>
          </div>
        </form>

        <div className="flex items-center gap-2 mt-3">
          <Shield className="h-3 w-3 text-gray-500" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {newsletterContent.trust_line}
          </p>
        </div>
      </div>
    );
  }

  // Sidebar variant
  if (variant === 'sidebar') {
    return (
      <div className={`newsletter-sidebar bg-card/70 backdrop-blur-sm p-4 rounded-2xl border border-border/50 ring-1 ring-border/50 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Newsletter
          </h3>
        </div>
        
        <div className="space-y-2 mb-4">
          {Object.values(newsletterContent.benefits).map((benefit, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-xs text-gray-600 dark:text-gray-300">{benefit}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Honeypot field */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />
          
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={isLoading || isPending}
            required
            aria-describedby={error ? 'email-error-sidebar' : undefined}
          />
          {error && (
            <p id="email-error-sidebar" className="text-xs text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading || isPending || !!error}
            className={`w-full px-4 py-2 text-sm font-medium text-white ${abConfig.ctaColor} disabled:bg-gray-400 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            {isLoading || isPending ? newsletterContent.cta_loading : abConfig.copy.cta}
          </button>
        </form>

        <div className="flex items-center gap-1 mt-3">
          <Shield className="h-3 w-3 text-gray-500" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {newsletterContent.trust_line}
          </p>
        </div>
      </div>
    );
  }

  // Card variant (default)
  return (
    <div className={`newsletter-card bg-card/70 backdrop-blur-sm p-6 rounded-2xl border border-border/50 ring-1 ring-border/50 ${className}`}>
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {abConfig.copy.heading}
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          {getSubscriberText()}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot field */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          style={{ display: 'none' }}
          tabIndex={-1}
          autoComplete="off"
        />
        
        <div>
          <label htmlFor="newsletter-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={newsletterContent.placeholder}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
            disabled={isLoading || isPending}
            required
            aria-describedby={error ? 'email-error' : undefined}
          />
          {error && (
            <p id="email-error" className="text-sm text-red-600 dark:text-red-400 mt-2" role="alert">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || isPending || !!error}
          className={`w-full px-6 py-3 text-white ${abConfig.ctaColor} disabled:bg-gray-400 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 disabled:hover:scale-100`}
        >
          {isLoading || isPending ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {newsletterContent.cta_loading}
            </span>
          ) : (
            abConfig.copy.cta
          )}
        </button>
      </form>

      <div className="flex items-center justify-center gap-2 mt-4">
        <Shield className="h-4 w-4 text-gray-500" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {newsletterContent.trust_line}
        </p>
      </div>

      {/* Benefits */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 gap-3">
          {Object.values(newsletterContent.benefits).map((benefit, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{benefit}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}