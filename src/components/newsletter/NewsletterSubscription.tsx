'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsletterSubscriptionProps {
  variant?: 'inline' | 'modal' | 'sidebar';
  showBenefits?: boolean;
  onSuccess?: (email: string) => void;
}

export function NewsletterSubscription({ 
  variant = 'inline', 
  showBenefits = true,
  onSuccess 
}: NewsletterSubscriptionProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Check your email to confirm your subscription!');
        setEmail('');
        onSuccess?.(email);
      } else {
        setStatus('error');
        setMessage(data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    'Weekly curated tech insights',
    'AI & development updates',
    'Startup ecosystem news',
    'No spam, unsubscribe anytime'
  ];

  const containerClass = cn(
    'w-full',
    variant === 'modal' && 'max-w-md mx-auto',
    variant === 'sidebar' && 'max-w-sm'
  );

  const content = (
    <div className={containerClass}>
      {variant !== 'inline' && (
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Stay Updated</CardTitle>
          <p className="text-muted-foreground text-sm">
            Get the latest tech insights delivered to your inbox
          </p>
        </CardHeader>
      )}

      <CardContent className={variant === 'inline' ? 'p-0' : ''}>
        {variant === 'inline' && (
          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-2 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-primary" />
              Subscribe to our Newsletter
            </h3>
            <p className="text-muted-foreground text-sm">
              Get weekly curated tech insights and updates
            </p>
          </div>
        )}

        {showBenefits && (
          <div className="mb-4">
            <div className="grid grid-cols-1 gap-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || status === 'success'}
              className="flex-1"
              required
            />
            <Button 
              type="submit" 
              disabled={isLoading || status === 'success'}
              className="px-6"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : status === 'success' ? (
                <Check className="w-4 h-4" />
              ) : (
                'Subscribe'
              )}
            </Button>
          </div>

          {message && (
            <div className={cn(
              'flex items-center text-sm p-3 rounded-md',
              status === 'success' && 'bg-green-50 text-green-700 border border-green-200',
              status === 'error' && 'bg-red-50 text-red-700 border border-red-200'
            )}>
              {status === 'success' ? (
                <Check className="w-4 h-4 mr-2 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              )}
              {message}
            </div>
          )}
        </form>

        <p className="text-xs text-muted-foreground mt-3">
          By subscribing, you agree to our privacy policy. Unsubscribe at any time.
        </p>
      </CardContent>
    </div>
  );

  if (variant === 'inline') {
    return content;
  }

  return <Card className="border-0 shadow-lg">{content}</Card>;
}