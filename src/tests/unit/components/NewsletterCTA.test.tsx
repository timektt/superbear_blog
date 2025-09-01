import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewsletterCTA } from '@/components/sections/NewsletterCTA';

// Mock fetch
global.fetch = jest.fn();

describe('NewsletterCTA', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders newsletter CTA with all elements', () => {
    render(<NewsletterCTA />);
    
    expect(screen.getByText('Stay Ahead of the Tech Curve')).toBeInTheDocument();
    expect(screen.getByText('Join thousands of developers, AI builders, and tech entrepreneurs who rely on our weekly newsletter for the latest insights and trends.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
  });

  it('shows benefits section', () => {
    render(<NewsletterCTA showStats={false} />);
    
    expect(screen.getByText('Weekly Tech Insights')).toBeInTheDocument();
    expect(screen.getByText('Breaking Updates')).toBeInTheDocument();
    expect(screen.getByText('Developer Community')).toBeInTheDocument();
  });

  it('shows testimonials when enabled', () => {
    render(<NewsletterCTA showTestimonials={true} />);
    
    expect(screen.getByText(/The best tech newsletter I've subscribed to/)).toBeInTheDocument();
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('Marcus Rodriguez')).toBeInTheDocument();
  });

  it('shows stats when enabled', () => {
    render(<NewsletterCTA showStats={true} />);
    
    expect(screen.getByText('10,000+')).toBeInTheDocument();
    expect(screen.getByText('Subscribers')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('Open Rate')).toBeInTheDocument();
  });

  it('validates email input', async () => {
    render(<NewsletterCTA />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const submitButton = screen.getByRole('button', { name: 'Subscribe' });
    
    // Try submitting with invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('submits form with valid email', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Check your email to confirm your subscription!' })
    });

    render(<NewsletterCTA />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const submitButton = screen.getByRole('button', { name: 'Subscribe' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          utm_source: 'homepage_cta',
          utm_campaign: 'newsletter_signup',
          variant: 'cta_section'
        }),
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Check your email to confirm your subscription!')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Email already subscribed' })
    });

    render(<NewsletterCTA />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const submitButton = screen.getByRole('button', { name: 'Subscribe' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email already subscribed')).toBeInTheDocument();
    });
  });

  it('applies different variants correctly', () => {
    const { rerender } = render(<NewsletterCTA variant="gradient" />);
    
    let container = screen.getByRole('region');
    expect(container.querySelector('.bg-gradient-to-br')).toBeInTheDocument();
    
    rerender(<NewsletterCTA variant="minimal" />);
    container = screen.getByRole('region');
    expect(container.querySelector('.border-border')).toBeInTheDocument();
  });

  it('disables form during submission', async () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(<NewsletterCTA />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const submitButton = screen.getByRole('button', { name: 'Subscribe' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    expect(emailInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });
});