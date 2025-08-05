import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '@/components/ui/SearchBar';

// Mock Next.js hooks
const mockPush = jest.fn();
const mockGet = jest.fn(() => '');
const mockToString = jest.fn(() => '');

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockGet,
    toString: mockToString,
  }),
}));

// Mock the useDebounce hook to return value immediately
jest.mock('@/lib/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

describe('SearchBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render search input with placeholder', () => {
    render(<SearchBar />);

    const input = screen.getByPlaceholderText('Search articles...');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'search');
  });

  it('should have proper accessibility attributes', () => {
    render(<SearchBar />);

    const input = screen.getByPlaceholderText('Search articles...');
    expect(input).toHaveAttribute('aria-label', 'Search articles');
    expect(input).toHaveAttribute('role', 'searchbox');
  });

  it('should call onSearch when provided', async () => {
    const mockOnSearch = jest.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText('Search articles...');
    await user.type(input, 'React');

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('React');
    });
  });

  it('should show clear button when there is text', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText('Search articles...');

    // Initially no clear button
    expect(
      screen.queryByRole('button', { name: /clear/i })
    ).not.toBeInTheDocument();

    await user.type(input, 'React');

    // Clear button should appear
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /clear/i })
      ).toBeInTheDocument();
    });
  });

  it('should clear search when clear button is clicked', async () => {
    const mockOnClear = jest.fn();
    const user = userEvent.setup();

    render(<SearchBar onClear={mockOnClear} />);

    const input = screen.getByPlaceholderText('Search articles...');
    await user.type(input, 'React');

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /clear/i })
      ).toBeInTheDocument();
    });

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(mockOnClear).toHaveBeenCalled();
    expect(input).toHaveValue('');
  });

  it('should handle controlled value prop', () => {
    render(<SearchBar value="Initial value" />);

    const input = screen.getByPlaceholderText('Search articles...');
    expect(input).toHaveValue('Initial value');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<SearchBar disabled />);

    const input = screen.getByPlaceholderText('Search articles...');
    expect(input).toBeDisabled();
  });

  it('should show loading state', () => {
    render(<SearchBar loading />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('should handle Enter key press', async () => {
    const mockOnSearch = jest.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText('Search articles...');
    await user.type(input, 'React');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('React');
    });
  });

  it('should handle Escape key to clear search', async () => {
    const mockOnClear = jest.fn();
    const user = userEvent.setup();

    render(<SearchBar onClear={mockOnClear} />);

    const input = screen.getByPlaceholderText('Search articles...');
    await user.type(input, 'React');
    await user.keyboard('{Escape}');

    expect(mockOnClear).toHaveBeenCalled();
    expect(input).toHaveValue('');
  });

  it('should work without callback props', () => {
    render(<SearchBar />);

    const input = screen.getByPlaceholderText('Search articles...');
    expect(input).toBeInTheDocument();
  });
});
