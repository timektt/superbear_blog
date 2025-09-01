'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, AlertCircle, Mail, Users, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsletterCTAProps {
  className?: string;
  variant?: 'default' | 'gradient' | 'minimal';
  showTestimonials?: boolean;
  showStats?: boolean;
}

export function NewsletterCTA({
  className,
  variant = 'gradient',
  showTestimonials = true,
  showStats = true,
}: NewsletterCTAProps) {
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
        body: JSON.stringify({ 
          email,
          utm_source: 'homepage_cta',
          utm_campaign: 'newsletter_signup',
          variant: 'cta_section'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Check your email to confirm your subscription!');
        setEmail('');
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
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Weekly Tech Insights',
      description: 'Curated AI, dev tools, and startup news'
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Breaking Updates',
      description: 'First to know about major tech developments'
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: 'Developer Community',
      description: 'Join 10,000+ tech professionals'
    }
  ];

  const testimonials = [
    {
      quote: "The best tech newsletter I've subscribed to. Always relevant and insightful.",
      author: "Sarah Chen",
      role: "Senior Developer at TechCorp"
    },
    {
      quote: "SuperBear's weekly digest keeps me ahead of the curve in AI developments.",
      author: "Marcus Rodriguez",
      role: "AI Researcher"
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Subscribers' },
    { number: '95%', label: 'Open Rate' },
    { number: '4.8/5', label: 'Rating' }
  ];

  return (
    <section className={cn('py-16 lg:py-24', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn(
          'relative overflow-hidden rounded-3xl p-8 lg:p-12',
          variant === 'gradient' && 'bg-gradient-to-br from-primary/10 via-primary/5 to-background',
          variant === 'default' && 'bg-muted/30',
          variant === 'minimal' && 'bg-background border border-border'
        )}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div 
              className="absolute inset-0 bg-repeat" 
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}
            />
          </div>

          <div className="relative z-10">
            <div className="text-center mb-12">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                <Mail className="w-8 h-8 text-primary" />
              </div>

              {/* Headline */}
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Stay Ahead of the Tech Curve
              </h2>
              
              {/* Subheadline */}
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Join thousands of developers, AI builders, and tech entrepreneurs who rely on our weekly newsletter for the latest insights and trends.
              </p>

              {/* Stats */}
              {showStats && (
                <div className="flex justify-center items-center gap-8 mb-8">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl font-bold text-primary">{stat.number}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Newsletter Form */}
            <div className="max-w-md mx-auto mb-12">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || status === 'success'}
                    className="flex-1 h-12 text-base bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/50"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || status === 'success'}
                    className="h-12 px-8 text-base font-semibold"
                    size="lg"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : status === 'success' ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      'Subscribe'
                    )}
                  </Button>
                </div>

                {message && (
                  <div
                    className={cn(
                      'flex items-center text-sm p-3 rounded-lg',
                      status === 'success' &&
                        'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
                      status === 'error' &&
                        'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                    )}
                  >
                    {status === 'success' ? (
                      <Check className="w-4 h-4 mr-2 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    )}
                    {message}
                  </div>
                )}
              </form>

              <p className="text-xs text-muted-foreground text-center mt-4">
                No spam, ever. Unsubscribe with one click. Read our{' '}
                <a href="/privacy" className="text-primary hover:underline">
                  privacy policy
                </a>
                .
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4 text-primary">
                    {benefit.icon}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>

            {/* Testimonials */}
            {showTestimonials && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="bg-background/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
                    <blockquote className="text-foreground mb-4">
                      "{testimonial.quote}"
                    </blockquote>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-semibold text-primary">
                          {testimonial.author.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-sm">{testimonial.author}</div>
                        <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}