'use client';

import { useState } from 'react';

interface NewsletterPanelProps {
  className?: string;
}

export default function NewsletterPanel({ className = '' }: NewsletterPanelProps) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; consent?: string }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});
    
    // Validation
    const newErrors: { email?: string; consent?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!consent) {
      newErrors.consent = 'You must agree to receive our newsletter';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // MVP: Console log submission (real API integration later)
      console.log('Newsletter subscription:', {
        email: email.trim(),
        consent,
        timestamp: new Date().toISOString(),
        source: 'magazine-homepage'
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form on success
      setEmail('');
      setConsent(false);
      
      // Show success message (could be replaced with toast notification)
      alert('Thank you for subscribing to our newsletter!');
      
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className={`bg-red-600 p-6 md:p-8 rounded-lg text-white ${className}`}
      data-testid="newsletter-panel"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          Stay Updated
        </h2>
        <p className="text-red-100 text-base md:text-lg leading-relaxed">
          Get the latest tech news, AI insights, and developer updates delivered straight to your inbox.
        </p>
      </div>

      {/* Newsletter Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div>
          <label 
            htmlFor="newsletter-email" 
            className="block text-sm font-medium mb-2"
          >
            Email Address
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className={`w-full px-4 py-3 rounded-md text-gray-900 placeholder-gray-500 border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 ${
              errors.email 
                ? 'border-red-300 bg-red-50' 
                : 'border-transparent bg-white hover:bg-gray-50'
            }`}
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-invalid={!!errors.email}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p 
              id="email-error" 
              className="mt-2 text-sm text-red-200"
              role="alert"
            >
              {errors.email}
            </p>
          )}
        </div>

        {/* Consent Checkbox */}
        <div>
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className={`mt-1 h-4 w-4 rounded border-2 text-red-600 focus:ring-2 focus:ring-red-300 focus:ring-offset-2 focus:ring-offset-red-600 ${
                errors.consent 
                  ? 'border-red-300' 
                  : 'border-white'
              }`}
              aria-describedby={errors.consent ? 'consent-error' : undefined}
              aria-invalid={!!errors.consent}
              disabled={isSubmitting}
            />
            <span className="text-sm text-red-100 leading-relaxed">
              I agree to receive the SuperBear Blog newsletter and understand I can unsubscribe at any time.
            </span>
          </label>
          {errors.consent && (
            <p 
              id="consent-error" 
              className="mt-2 text-sm text-red-200"
              role="alert"
            >
              {errors.consent}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-white text-red-600 font-semibold py-3 px-6 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 focus:ring-offset-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          aria-label={isSubmitting ? 'Subscribing to newsletter...' : 'Subscribe to newsletter'}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg 
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-red-600" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Subscribing...
            </span>
          ) : (
            'Subscribe Now'
          )}
        </button>
      </form>

      {/* Additional Info */}
      <div className="mt-4 pt-4 border-t border-red-500">
        <p className="text-xs text-red-200">
          Join 10,000+ developers, AI builders, and tech entrepreneurs who trust SuperBear Blog for curated tech insights.
        </p>
      </div>
    </div>
  );
}