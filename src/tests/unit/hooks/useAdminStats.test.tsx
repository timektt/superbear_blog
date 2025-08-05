import { renderHook, waitFor } from '@testing-library/react';
import { useAdminStats } from '@/lib/hooks/useAdminStats';

// Mock fetch
global.fetch = jest.fn();

describe('useAdminStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch admin stats successfully', async () => {
    const mockStats = {
      articles: {
        total: 10,
        byStatus: {
          DRAFT: 3,
          PUBLISHED: 5,
          ARCHIVED: 2,
        },
        recentlyCreated: 2,
        recentlyPublished: 1,
      },
      categories: [
        {
          id: '1',
          name: 'AI & ML',
          slug: 'ai-ml',
          articleCount: 3,
        },
      ],
      authors: [
        {
          id: '1',
          name: 'John Doe',
          articleCount: 5,
        },
      ],
      activity: {
        articlesCreatedLast7Days: 2,
        articlesPublishedLast7Days: 1,
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats,
    });

    const { result } = renderHook(() => useAdminStats());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.stats).toBe(null);
    expect(result.current.error).toBe(null);

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.error).toBe(null);
    expect(fetch).toHaveBeenCalledWith('/api/admin/stats');
  });

  it('should handle fetch errors', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useAdminStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toBe(null);
    expect(result.current.error).toBe('Failed to fetch admin statistics');
  });

  it('should handle network errors', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAdminStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toBe(null);
    expect(result.current.error).toBe('Network error');
  });

  it('should provide refetch functionality', async () => {
    const mockStats = {
      articles: {
        total: 5,
        byStatus: { DRAFT: 2, PUBLISHED: 3, ARCHIVED: 0 },
        recentlyCreated: 1,
        recentlyPublished: 1,
      },
      categories: [],
      authors: [],
      activity: {
        articlesCreatedLast7Days: 1,
        articlesPublishedLast7Days: 1,
      },
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockStats,
    });

    const { result } = renderHook(() => useAdminStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear the mock to test refetch
    (fetch as jest.Mock).mockClear();

    // Call refetch
    await result.current.refetch();

    expect(fetch).toHaveBeenCalledWith('/api/admin/stats');
  });
});
