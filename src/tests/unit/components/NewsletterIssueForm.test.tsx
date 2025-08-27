import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewsletterIssueForm } from '@/components/admin/NewsletterIssueForm';

// Mock dependencies
jest.mock('@/lib/hooks/useToast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/components/editor/Editor', () => ({
  Editor: ({ onChange, placeholder }: any) => (
    <textarea
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      data-testid="editor"
    />
  ),
}));

// Mock fetch
global.fetch = jest.fn();

const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();

describe('NewsletterIssueForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/admin/newsletter/issues/next-number')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ nextNumber: 6 }),
        });
      }
      if (url.includes('/api/admin/slugs')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ slug: 'generated-slug' }),
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('renders create form correctly', async () => {
    render(
      <NewsletterIssueForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    await waitFor(() => {
      expect(
        screen.getByText('Create Newsletter Issue #6')
      ).toBeInTheDocument();
    });

    expect(
      screen.getByPlaceholderText('Enter newsletter title')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('newsletter-issue-slug')
    ).toBeInTheDocument();
    expect(screen.getByTestId('editor')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders edit form with existing data', async () => {
    const existingIssue = {
      id: '1',
      title: 'Existing Newsletter',
      slug: 'existing-newsletter',
      summary: 'Existing summary',
      content: { type: 'doc', content: [] },
      status: 'PUBLISHED',
      issueNumber: 5,
    };

    render(
      <NewsletterIssueForm
        issue={existingIssue}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Edit Newsletter Issue #5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Newsletter')).toBeInTheDocument();
    expect(screen.getByDisplayValue('existing-newsletter')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing summary')).toBeInTheDocument();
    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <NewsletterIssueForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Slug is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('generates slug automatically when title is entered', async () => {
    render(
      <NewsletterIssueForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    const titleInput = screen.getByPlaceholderText('Enter newsletter title');
    fireEvent.change(titleInput, { target: { value: 'New Newsletter Issue' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/slugs',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'New Newsletter Issue',
            type: 'newsletter',
          }),
        })
      );
    });
  });

  it('handles form submission with valid data', async () => {
    render(
      <NewsletterIssueForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    // Fill in required fields
    fireEvent.change(screen.getByPlaceholderText('Enter newsletter title'), {
      target: { value: 'Test Newsletter' },
    });
    fireEvent.change(screen.getByPlaceholderText('newsletter-issue-slug'), {
      target: { value: 'test-newsletter' },
    });
    fireEvent.change(screen.getByTestId('editor'), {
      target: { value: 'Test content' },
    });

    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Newsletter',
          slug: 'test-newsletter',
          content: 'Test content',
        })
      );
    });
  });

  it('handles summary character limit', () => {
    render(
      <NewsletterIssueForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    const summaryTextarea = screen.getByPlaceholderText(
      'Brief newsletter summary (max 500 characters)'
    );
    const testSummary = 'A'.repeat(100);

    fireEvent.change(summaryTextarea, { target: { value: testSummary } });

    expect(screen.getByText('100/500 characters')).toBeInTheDocument();
  });

  it('shows publish now button for draft status', async () => {
    render(
      <NewsletterIssueForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    await waitFor(() => {
      expect(screen.getByText('Publish Now')).toBeInTheDocument();
    });
  });

  it('shows send to subscribers button for published issues', async () => {
    const publishedIssue = {
      id: '1',
      title: 'Published Newsletter',
      slug: 'published-newsletter',
      status: 'PUBLISHED',
      issueNumber: 5,
      sentAt: null,
    };

    render(
      <NewsletterIssueForm
        issue={publishedIssue}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Send to Subscribers')).toBeInTheDocument();
  });

  it('handles publish now button click', async () => {
    render(
      <NewsletterIssueForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    await waitFor(() => {
      const publishButton = screen.getByText('Publish Now');
      fireEvent.click(publishButton);
    });

    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText('Enter newsletter title'), {
      target: { value: 'Test Newsletter' },
    });
    fireEvent.change(screen.getByPlaceholderText('newsletter-issue-slug'), {
      target: { value: 'test-newsletter' },
    });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PUBLISHED',
          publishedAt: expect.any(Date),
        })
      );
    });
  });

  it('handles cancel button click', () => {
    render(
      <NewsletterIssueForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <NewsletterIssueForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    );

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });

  it('validates slug format', async () => {
    render(
      <NewsletterIssueForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    fireEvent.change(screen.getByPlaceholderText('newsletter-issue-slug'), {
      target: { value: 'Invalid Slug With Spaces' },
    });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Slug must contain only lowercase letters, numbers, and hyphens'
        )
      ).toBeInTheDocument();
    });
  });

  it('shows publish date field when status is PUBLISHED', async () => {
    render(
      <NewsletterIssueForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    // Change status to PUBLISHED
    const statusSelect = screen.getByDisplayValue('Draft');
    fireEvent.change(statusSelect, { target: { value: 'PUBLISHED' } });

    await waitFor(() => {
      expect(screen.getByText('Publish Date')).toBeInTheDocument();
    });
  });

  it('shows issue information card', async () => {
    const issueWithDates = {
      id: '1',
      title: 'Test Newsletter',
      slug: 'test-newsletter',
      status: 'PUBLISHED',
      issueNumber: 5,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-02T10:00:00Z',
      sentAt: '2024-01-03T10:00:00Z',
    };

    render(
      <NewsletterIssueForm
        issue={issueWithDates}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Issue Information')).toBeInTheDocument();
    expect(screen.getByText('#5')).toBeInTheDocument();
    expect(screen.getByText('1/1/2024')).toBeInTheDocument();
    expect(screen.getByText('1/2/2024')).toBeInTheDocument();
    expect(screen.getByText('1/3/2024')).toBeInTheDocument();
  });

  it('shows preview button for published issues', async () => {
    const publishedIssue = {
      id: '1',
      title: 'Published Newsletter',
      slug: 'published-newsletter',
      status: 'PUBLISHED',
      issueNumber: 5,
    };

    render(
      <NewsletterIssueForm
        issue={publishedIssue}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Preview Newsletter')).toBeInTheDocument();
  });
});
