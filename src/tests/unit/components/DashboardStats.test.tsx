import { render, screen } from '@testing-library/react';
import DashboardStats from '@/components/admin/DashboardStats';
import { useAdminStats } from '@/lib/hooks/useAdminStats';

// Mock the useAdminStats hook
jest.mock('@/lib/hooks/useAdminStats');

const mockUseAdminStats = useAdminStats as jest.MockedFunction<
  typeof useAdminStats
>;

describe('DashboardStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state', () => {
    mockUseAdminStats.mockReturnValue({
      stats: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<DashboardStats />);

    // Check for loading indicators (animated pulse elements)
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should display error state', () => {
    mockUseAdminStats.mockReturnValue({
      stats: null,
      loading: false,
      error: 'Failed to fetch statistics',
      refetch: jest.fn(),
    });

    render(<DashboardStats />);

    expect(screen.getByText('Error loading statistics')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch statistics')).toBeInTheDocument();
  });

  it('should display statistics when loaded', () => {
    const mockStats = {
      articles: {
        total: 15,
        byStatus: {
          DRAFT: 5,
          PUBLISHED: 8,
          ARCHIVED: 2,
        },
        recentlyCreated: 3,
        recentlyPublished: 2,
      },
      categories: [
        {
          id: '1',
          name: 'AI & Machine Learning',
          slug: 'ai-ml',
          articleCount: 4,
        },
        {
          id: '2',
          name: 'DevTools',
          slug: 'devtools',
          articleCount: 3,
        },
      ],
      authors: [
        {
          id: '1',
          name: 'John Doe',
          articleCount: 8,
        },
        {
          id: '2',
          name: 'Jane Smith',
          articleCount: 7,
        },
      ],
      activity: {
        articlesCreatedLast7Days: 3,
        articlesPublishedLast7Days: 2,
      },
    };

    mockUseAdminStats.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DashboardStats />);

    // Check main statistics cards
    expect(screen.getByText('Total Articles')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.getByText('Drafts')).toBeInTheDocument();
    expect(screen.getByText('Archived')).toBeInTheDocument();

    // Check that the main statistics are displayed
    const totalArticlesCard = screen
      .getByText('Total Articles')
      .closest('.bg-white');
    const publishedCard = screen.getByText('Published').closest('.bg-white');
    const draftsCard = screen.getByText('Drafts').closest('.bg-white');
    const archivedCard = screen.getByText('Archived').closest('.bg-white');

    expect(totalArticlesCard).toHaveTextContent('15');
    expect(publishedCard).toHaveTextContent('8');
    expect(draftsCard).toHaveTextContent('5');
    expect(archivedCard).toHaveTextContent('2');

    // Check recent activity
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Articles created (7 days)')).toBeInTheDocument();
    expect(screen.getByText('Articles published (7 days)')).toBeInTheDocument();

    // Check top categories
    expect(screen.getByText('Top Categories')).toBeInTheDocument();
    expect(screen.getByText('AI & Machine Learning')).toBeInTheDocument();
    expect(screen.getByText('DevTools')).toBeInTheDocument();

    // Check top authors
    expect(screen.getByText('Top Authors')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('8 articles')).toBeInTheDocument();
    expect(screen.getByText('7 articles')).toBeInTheDocument();
  });

  it('should display empty state messages when no data', () => {
    const mockStats = {
      articles: {
        total: 0,
        byStatus: {
          DRAFT: 0,
          PUBLISHED: 0,
          ARCHIVED: 0,
        },
        recentlyCreated: 0,
        recentlyPublished: 0,
      },
      categories: [],
      authors: [],
      activity: {
        articlesCreatedLast7Days: 0,
        articlesPublishedLast7Days: 0,
      },
    };

    mockUseAdminStats.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DashboardStats />);

    // Check that zero values are displayed (multiple zeros expected)
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);

    // Check empty state messages
    expect(screen.getByText('No categories yet')).toBeInTheDocument();
    expect(screen.getByText('No authors yet')).toBeInTheDocument();
  });

  it('should handle partial data correctly', () => {
    const mockStats = {
      articles: {
        total: 3,
        byStatus: {
          DRAFT: 1,
          PUBLISHED: 2,
          ARCHIVED: 0,
        },
        recentlyCreated: 1,
        recentlyPublished: 1,
      },
      categories: [
        {
          id: '1',
          name: 'AI & ML',
          slug: 'ai-ml',
          articleCount: 2,
        },
      ],
      authors: [
        {
          id: '1',
          name: 'Author One',
          articleCount: 3,
        },
      ],
      activity: {
        articlesCreatedLast7Days: 1,
        articlesPublishedLast7Days: 1,
      },
    };

    mockUseAdminStats.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DashboardStats />);

    // Check that single items are displayed correctly
    expect(screen.getByText('AI & ML')).toBeInTheDocument();
    expect(screen.getByText('Author One')).toBeInTheDocument();
    expect(screen.getByText('3 articles')).toBeInTheDocument();
  });
});
