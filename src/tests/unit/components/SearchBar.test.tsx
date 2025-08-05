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

// Mock the useDebounce hook to return value immediately for testing
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

  it('should work without callback props', () => {
    render(<SearchBar />);

    const input = screen.getByPlaceholderText('Search articles...');
    expect(input).toBeInTheDocument();
  });
});
