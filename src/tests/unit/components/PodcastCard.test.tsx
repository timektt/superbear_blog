import { render, screen } from '@testing-library/react';
import { PodcastCard } from '@/components/podcast/PodcastCard';

const mockPodcast = {
  id: '1',
  title: 'Test Podcast Episode',
  slug: 'test-podcast-episode',
  description: 'This is a test podcast episode description',
  coverImage: 'https://example.com/cover.jpg',
  duration: 1800, // 30 minutes
  episodeNumber: 5,
  publishedAt: '2024-01-15T10:00:00Z',
  author: { name: 'John Doe' },
  category: { name: 'Technology', slug: 'technology' },
};

describe('PodcastCard', () => {
  it('renders podcast information correctly', () => {
    render(<PodcastCard podcast={mockPodcast} />);

    expect(screen.getByText('Test Podcast Episode')).toBeInTheDocument();
    expect(screen.getByText('Episode 5')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('By John Doe')).toBeInTheDocument();
    expect(screen.getByText('30:00')).toBeInTheDocument();
  });

  it('renders without optional fields', () => {
    const minimalPodcast = {
      ...mockPodcast,
      description: null,
      coverImage: null,
      duration: null,
      episodeNumber: null,
      category: undefined,
    };

    render(<PodcastCard podcast={minimalPodcast} />);

    expect(screen.getByText('Test Podcast Episode')).toBeInTheDocument();
    expect(screen.getByText('By John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Episode')).not.toBeInTheDocument();
    expect(screen.queryByText('Technology')).not.toBeInTheDocument();
  });

  it('uses placeholder image when coverImage is null', () => {
    const podcastWithoutImage = {
      ...mockPodcast,
      coverImage: null,
    };

    render(<PodcastCard podcast={podcastWithoutImage} />);

    const image = screen.getByAltText('Test Podcast Episode cover');
    expect(image).toHaveAttribute(
      'src',
      expect.stringContaining('placeholder-image.svg')
    );
  });

  it('creates correct link to podcast detail page', () => {
    render(<PodcastCard podcast={mockPodcast} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/podcasts/test-podcast-episode');
  });

  it('applies hover effects with correct classes', () => {
    render(<PodcastCard podcast={mockPodcast} />);

    const card = screen.getByRole('link').closest('.group');
    expect(card).toHaveClass(
      'group',
      'hover:shadow-lg',
      'transition-all',
      'duration-200'
    );
  });

  it('formats date correctly', () => {
    render(<PodcastCard podcast={mockPodcast} />);

    const dateElement = screen.getByText('Jan 15, 2024');
    expect(dateElement).toBeInTheDocument();
  });

  it('truncates long descriptions with line-clamp', () => {
    const longDescriptionPodcast = {
      ...mockPodcast,
      description:
        'This is a very long description that should be truncated after three lines to prevent the card from becoming too tall and maintain consistent layout across the podcast grid.',
    };

    render(<PodcastCard podcast={longDescriptionPodcast} />);

    const description = screen.getByText(longDescriptionPodcast.description);
    expect(description).toHaveClass('line-clamp-3');
  });
});
