import { render, screen } from '@testing-library/react';
import { NewsletterIssueCard } from '@/components/newsletter/NewsletterIssueCard';

const mockIssue = {
  id: '1',
  title: 'Weekly Tech Roundup',
  slug: 'weekly-tech-roundup-issue-5',
  summary:
    'This week we cover the latest in AI, blockchain, and startup funding rounds.',
  issueNumber: 5,
  publishedAt: '2024-01-15T10:00:00Z',
  author: { name: 'Jane Smith' },
};

describe('NewsletterIssueCard', () => {
  it('renders newsletter issue information correctly', () => {
    render(<NewsletterIssueCard issue={mockIssue} />);

    expect(screen.getByText('Weekly Tech Roundup')).toBeInTheDocument();
    expect(screen.getByText('Issue #5')).toBeInTheDocument();
    expect(screen.getByText('By Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    expect(screen.getByText(mockIssue.summary)).toBeInTheDocument();
  });

  it('renders without optional summary', () => {
    const issueWithoutSummary = {
      ...mockIssue,
      summary: null,
    };

    render(<NewsletterIssueCard issue={issueWithoutSummary} />);

    expect(screen.getByText('Weekly Tech Roundup')).toBeInTheDocument();
    expect(screen.getByText('Issue #5')).toBeInTheDocument();
    expect(screen.getByText('By Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText(mockIssue.summary)).not.toBeInTheDocument();
  });

  it('creates correct link to newsletter issue page', () => {
    render(<NewsletterIssueCard issue={mockIssue} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      '/newsletter/weekly-tech-roundup-issue-5'
    );
  });

  it('applies hover effects with correct classes', () => {
    render(<NewsletterIssueCard issue={mockIssue} />);

    const card = screen.getByRole('link').closest('.group');
    expect(card).toHaveClass(
      'group',
      'hover:shadow-lg',
      'transition-all',
      'duration-200'
    );
  });

  it('displays calendar and user icons', () => {
    render(<NewsletterIssueCard issue={mockIssue} />);

    // Check for icon containers (Lucide icons render as SVGs)
    const calendarIcon =
      screen.getByText('Jan 15, 2024').previousElementSibling;
    const userIcon = screen.getByText('By Jane Smith').previousElementSibling;

    expect(calendarIcon).toBeInTheDocument();
    expect(userIcon).toBeInTheDocument();
  });

  it('formats issue number correctly', () => {
    const highNumberIssue = {
      ...mockIssue,
      issueNumber: 123,
    };

    render(<NewsletterIssueCard issue={highNumberIssue} />);

    expect(screen.getByText('Issue #123')).toBeInTheDocument();
  });

  it('truncates long titles with line-clamp', () => {
    const longTitleIssue = {
      ...mockIssue,
      title:
        'This is a very long newsletter title that should be truncated after two lines to maintain consistent card layout',
    };

    render(<NewsletterIssueCard issue={longTitleIssue} />);

    const title = screen.getByText(longTitleIssue.title);
    expect(title).toHaveClass('line-clamp-2');
  });

  it('truncates long summaries with line-clamp', () => {
    const longSummaryIssue = {
      ...mockIssue,
      summary:
        'This is a very long summary that should be truncated after three lines to prevent the card from becoming too tall and maintain consistent layout across the newsletter archive grid.',
    };

    render(<NewsletterIssueCard issue={longSummaryIssue} />);

    const summary = screen.getByText(longSummaryIssue.summary);
    expect(summary).toHaveClass('line-clamp-3');
  });

  it('applies correct styling classes', () => {
    render(<NewsletterIssueCard issue={mockIssue} />);

    const issueNumber = screen.getByText('Issue #5');
    expect(issueNumber).toHaveClass('text-xs', 'font-medium');

    const title = screen.getByText('Weekly Tech Roundup');
    expect(title).toHaveClass(
      'font-semibold',
      'text-lg',
      'group-hover:text-primary'
    );
  });

  it('handles different date formats correctly', () => {
    const differentDateIssue = {
      ...mockIssue,
      publishedAt: '2023-12-25T15:30:00Z',
    };

    render(<NewsletterIssueCard issue={differentDateIssue} />);

    expect(screen.getByText('Dec 25, 2023')).toBeInTheDocument();
  });
});
