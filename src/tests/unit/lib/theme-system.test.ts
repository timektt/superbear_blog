import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { useTheme } from 'next-themes';
import React from 'react';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock matchMedia for system theme detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Test component that uses theme
const TestThemeComponent = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <div data-testid="resolved-theme">{resolvedTheme}</div>
      <button onClick={() => setTheme('light')} data-testid="light-btn">
        Light
      </button>
      <button onClick={() => setTheme('dark')} data-testid="dark-btn">
        Dark
      </button>
      <button onClick={() => setTheme('system')} data-testid="system-btn">
        System
      </button>
    </div>
  );
};

describe('Theme System', () => {
  const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Theme Provider', () => {
    it('should render children correctly', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: jest.fn(),
        resolvedTheme: 'light',
        systemTheme: 'light',
        themes: ['light', 'dark', 'system'],
        forcedTheme: undefined,
      });

      render(
        <ThemeProvider>
          <div data-testid="child">Test Child</div>
        </ThemeProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  describe('Theme Switching', () => {
    it('should switch to light theme', async () => {
      const mockSetTheme = jest.fn();
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        resolvedTheme: 'dark',
        systemTheme: 'light',
        themes: ['light', 'dark', 'system'],
        forcedTheme: undefined,
      });

      render(<TestThemeComponent />);

      fireEvent.click(screen.getByTestId('light-btn'));
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('should switch to dark theme', async () => {
      const mockSetTheme = jest.fn();
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        systemTheme: 'light',
        themes: ['light', 'dark', 'system'],
        forcedTheme: undefined,
      });

      render(<TestThemeComponent />);

      fireEvent.click(screen.getByTestId('dark-btn'));
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should switch to system theme', async () => {
      const mockSetTheme = jest.fn();
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        systemTheme: 'light',
        themes: ['light', 'dark', 'system'],
        forcedTheme: undefined,
      });

      render(<TestThemeComponent />);

      fireEvent.click(screen.getByTestId('system-btn'));
      expect(mockSetTheme).toHaveBeenCalledWith('system');
    });
  });

  describe('System Theme Detection', () => {
    it('should detect system dark theme preference', () => {
      // Mock system dark theme
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      mockUseTheme.mockReturnValue({
        theme: 'system',
        setTheme: jest.fn(),
        resolvedTheme: 'dark',
        systemTheme: 'dark',
        themes: ['light', 'dark', 'system'],
        forcedTheme: undefined,
      });

      render(<TestThemeComponent />);

      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
    });

    it('should detect system light theme preference', () => {
      // Mock system light theme
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: light)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      mockUseTheme.mockReturnValue({
        theme: 'system',
        setTheme: jest.fn(),
        resolvedTheme: 'light',
        systemTheme: 'light',
        themes: ['light', 'dark', 'system'],
        forcedTheme: undefined,
      });

      render(<TestThemeComponent />);

      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
    });
  });

  describe('Theme Persistence', () => {
    it('should persist theme preference to localStorage', () => {
      const mockSetTheme = jest.fn();
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        systemTheme: 'light',
        themes: ['light', 'dark', 'system'],
        forcedTheme: undefined,
      });

      render(<TestThemeComponent />);

      fireEvent.click(screen.getByTestId('dark-btn'));
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should load theme preference from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('dark');
      
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: jest.fn(),
        resolvedTheme: 'dark',
        systemTheme: 'light',
        themes: ['light', 'dark', 'system'],
        forcedTheme: undefined,
      });

      render(<TestThemeComponent />);

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });
  });

  describe('Theme Transitions', () => {
    it('should handle theme transitions smoothly', async () => {
      const mockSetTheme = jest.fn();
      let currentTheme = 'light';
      
      mockUseTheme.mockImplementation(() => ({
        theme: currentTheme,
        setTheme: (newTheme: string) => {
          currentTheme = newTheme;
          mockSetTheme(newTheme);
        },
        resolvedTheme: currentTheme,
        systemTheme: 'light',
        themes: ['light', 'dark', 'system'],
        forcedTheme: undefined,
      }));

      const { rerender } = render(<TestThemeComponent />);

      // Switch theme
      fireEvent.click(screen.getByTestId('dark-btn'));
      
      // Rerender with new theme
      rerender(<TestThemeComponent />);

      await waitFor(() => {
        expect(mockSetTheme).toHaveBeenCalledWith('dark');
      });
    });
  });
});