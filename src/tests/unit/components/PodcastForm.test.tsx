import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PodcastForm } from '@/components/admin/PodcastForm';

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

// Mock fetch
global.fetch = jest.fn();

const mockCategories = [
  { id: '1', name: 'Technology', slug: 'technology' },
  { id: '2', name: 'Business', slug: 'business' },
];

const mockTags = [
  { id: '1', name: 'AI', slug: 'ai' },
  { id: '2', name: 'Startup', slug: 'startup' },
];

const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();

describe('PodcastForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/admin/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ categories: mockCategories }),
        });
      }
      if (url.includes('/api/admin/tags')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ tags: mockTags }),
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
    render(<PodcastForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByText('Create New Podcast Episode')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Enter podcast title')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('podcast-episode-slug')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('https://example.com/audio.mp3')
    ).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders edit form with existing data', async () => {
    const existingPodcast = {
      id: '1',
      title: 'Existing Podcast',
      slug: 'existing-podcast',
      description: 'Existing description',
      audioUrl: 'https://example.com/existing.mp3',
      duration: 1800,
      episodeNumber: 5,
      status: 'PUBLISHED',
    };

    render(
      <PodcastForm
        podcast={existingPodcast}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Edit Podcast Episode')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Podcast')).toBeInTheDocument();
    expect(screen.getByDisplayValue('existing-podcast')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('https://example.com/existing.mp3')
    ).toBeInTheDocument();
    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<PodcastForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Slug is required')).toBeInTheDocument();
      expect(screen.getByText('Valid audio URL required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('generates slug automatically when title is entered', async () => {
    render(<PodcastForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const titleInput = screen.getByPlaceholderText('Enter podcast title');
    fireEvent.change(titleInput, { target: { value: 'New Podcast Episode' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/slugs',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'New Podcast Episode',
            type: 'podcast',
          }),
        })
      );
    });
  });

  it('handles form submission with valid data', async () => {
    render(<PodcastForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Fill in required fields
    fireEvent.change(screen.getByPlaceholderText('Enter podcast title'), {
      target: { value: 'Test Podcast' },
    });
    fireEvent.change(screen.getByPlaceholderText('podcast-episode-slug'), {
      target: { value: 'test-podcast' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('https://example.com/audio.mp3'),
      {
        target: { value: 'https://example.com/test.mp3' },
      }
    );

    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Podcast',
          slug: 'test-podcast',
          audioUrl: 'https://example.com/test.mp3',
        })
      );
    });
  });

  it('handles tag selection', async () => {
    render(<PodcastForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByText('AI')).toBeInTheDocument();
      expect(screen.getByText('Startup')).toBeInTheDocument();
    });

    // Click on AI tag
    fireEvent.click(screen.getByText('AI'));

    // Fill required fields and submit
    fireEvent.change(screen.getByPlaceholderText('Enter podcast title'), {
      target: { value: 'Test Podcast' },
    });
    fireEvent.change(screen.getByPlaceholderText('podcast-episode-slug'), {
      target: { value: 'test-podcast' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('https://example.com/audio.mp3'),
      {
        target: { value: 'https://example.com/test.mp3' },
      }
    );

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          tagIds: ['1'],
        })
      );
    });
  });

  it('handles cancel button click', () => {
    render(<PodcastForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <PodcastForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    );

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });

  it('validates slug format', async () => {
    render(<PodcastForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    fireEvent.change(screen.getByPlaceholderText('podcast-episode-slug'), {
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

  it('handles episode and season number inputs', async () => {
    render(<PodcastForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    fireEvent.change(screen.getByPlaceholderText('1'), {
      target: { value: '5' },
    });

    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText('Enter podcast title'), {
      target: { value: 'Test Podcast' },
    });
    fireEvent.change(screen.getByPlaceholderText('podcast-episode-slug'), {
      target: { value: 'test-podcast' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('https://example.com/audio.mp3'),
      {
        target: { value: 'https://example.com/test.mp3' },
      }
    );

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          episodeNumber: 5,
        })
      );
    });
  });

  it('shows publish date field when status is PUBLISHED', async () => {
    render(<PodcastForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Change status to PUBLISHED
    const statusSelect = screen.getByDisplayValue('Draft');
    fireEvent.change(statusSelect, { target: { value: 'PUBLISHED' } });

    await waitFor(() => {
      expect(screen.getByText('Publish Date')).toBeInTheDocument();
    });
  });
});
