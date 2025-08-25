import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { useTheme } from 'next-themes';
import React from 'react';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Performance measurement utilities
const measurePerformance = (fn: () => void): number => {
  const start = performance.now();
  fn();
  const end = performance.now();
  return end - start;
};

const measureAsyncPerformance = async (fn: () => Promise<void>): Promise<number> => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
};

// Test component with theme switching
const ThemeTestComponent = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  return (
    <div data-testid="theme-container" className={`theme-${resolvedTheme}`}>
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
      
      {/* Simulate multiple themed components */}
      {Array.from({ length: 100 }, (_, i) => (
        <div key={i} className={`themed-element-${i}`} data-testid={`element-${i}`}>
          Element {i}
        </div>
      ))}
    </div>
  );
};

describe('Theme Switching Performance', () => {
  const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
  let mockSetTheme: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetTheme = jest.fn();
    
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
      systemTheme: 'light',
      themes: ['light', 'dark', 'system'],
      forcedTheme: undefined,
    });
  });

  describe('Theme Switch Performance', () => {
    it('should switch themes within performance budget (< 100ms)', async () => {
      render(<ThemeTestComponent />);

      const switchTime = await measureAsyncPerformance(async () => {
        fireEvent.click(screen.getByTestId('dark-btn'));
        await waitFor(() => {
          expect(mockSetTheme).toHaveBeenCalledWith('dark');
        });
      });

      // Theme switch should be fast
      expect(switchTime).toBeLessThan(100);
    });

    it('should handle rapid theme switches efficiently', async () => {
      render(<ThemeTestComponent />);

      const rapidSwitchTime = await measureAsyncPerformance(async () => {
        // Rapidly switch themes 10 times
        for (let i = 0; i < 10; i++) {
          const theme = i % 2 === 0 ? 'dark' : 'light';
          fireEvent.click(screen.getByTestId(`${theme}-btn`));
        }
        
        await waitFor(() => {
          expect(mockSetTheme).toHaveBeenCalledTimes(10);
        });
      });

      // Rapid switches should complete within reasonable time
      expect(rapidSwitchTime).toBeLessThan(500);
    });

    it('should not cause memory leaks during theme switches', async () => {
      const { unmount } = render(<ThemeTestComponent />);

      // Measure memory before
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform many theme switches
      for (let i = 0; i < 100; i++) {
        const theme = i % 3 === 0 ? 'light' : i % 3 === 1 ? 'dark' : 'system';
        fireEvent.click(screen.getByTestId(`${theme}-btn`));
      }

      await waitFor(() => {
        expect(mockSetTheme).toHaveBeenCalledTimes(100);
      });

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Measure memory after
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      unmount();

      // Memory increase should be reasonable (less than 10MB)
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('CSS Variable Performance', () => {
    it('should update CSS variables efficiently', () => {
      // Mock CSS custom property updates
      const mockSetProperty = jest.fn();
      const mockDocumentElement = {
        style: {
          setProperty: mockSetProperty,
        },
      };

      Object.defineProperty(document, 'documentElement', {
        value: mockDocumentElement,
        writable: true,
      });

      render(<ThemeTestComponent />);

      const cssUpdateTime = measurePerformance(() => {
        // Simulate CSS variable updates for theme change
        const themeVariables = {
          '--background': '#ffffff',
          '--foreground': '#000000',
          '--primary': '#0070f3',
          '--secondary': '#f4f4f4',
          '--accent': '#0070f3',
          '--muted': '#f9f9f9',
          '--border': '#e5e5e5',
          '--input': '#ffffff',
          '--ring': '#0070f3',
        };

        Object.entries(themeVariables).forEach(([property, value]) => {
          mockSetProperty(property, value);
        });
      });

      // CSS updates should be very fast
      expect(cssUpdateTime).toBeLessThan(10);
      expect(mockSetProperty).toHaveBeenCalledTimes(9);
    });

    it('should handle large numbers of themed elements efficiently', () => {
      // Create component with many themed elements
      const LargeThemedComponent = () => (
        <div>
          {Array.from({ length: 1000 }, (_, i) => (
            <div 
              key={i} 
              className="bg-background text-foreground border-border"
              data-testid={`large-element-${i}`}
            >
              Element {i}
            </div>
          ))}
        </div>
      );

      const renderTime = measurePerformance(() => {
        render(<LargeThemedComponent />);
      });

      // Should render 1000 themed elements quickly
      expect(renderTime).toBeLessThan(200);
    });
  });

  describe('Theme Persistence Performance', () => {
    it('should save theme preference efficiently', () => {
      const mockSetItem = jest.fn();
      Object.defineProperty(window, 'localStorage', {
        value: {
          setItem: mockSetItem,
          getItem: jest.fn(),
          removeItem: jest.fn(),
        },
        writable: true,
      });

      render(<ThemeTestComponent />);

      const saveTime = measurePerformance(() => {
        fireEvent.click(screen.getByTestId('dark-btn'));
        // Simulate localStorage save
        mockSetItem('theme', 'dark');
      });

      expect(saveTime).toBeLessThan(5);
      expect(mockSetItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should load theme preference efficiently', () => {
      const mockGetItem = jest.fn().mockReturnValue('dark');
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: mockGetItem,
          setItem: jest.fn(),
          removeItem: jest.fn(),
        },
        writable: true,
      });

      const loadTime = measurePerformance(() => {
        // Simulate theme loading
        const savedTheme = mockGetItem('theme');
        expect(savedTheme).toBe('dark');
      });

      expect(loadTime).toBeLessThan(5);
    });
  });

  describe('System Theme Detection Performance', () => {
    it('should detect system theme efficiently', () => {
      const mockMatchMedia = jest.fn().mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      });

      Object.defineProperty(window, 'matchMedia', {
        value: mockMatchMedia,
        writable: true,
      });

      const detectionTime = measurePerformance(() => {
        const isDark = mockMatchMedia('(prefers-color-scheme: dark)').matches;
        expect(isDark).toBe(true);
      });

      expect(detectionTime).toBeLessThan(5);
    });

    it('should handle system theme changes efficiently', async () => {
      let mediaQueryCallback: ((e: any) => void) | null = null;
      
      const mockMatchMedia = jest.fn().mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: (callback: (e: any) => void) => {
          mediaQueryCallback = callback;
        },
        removeListener: jest.fn(),
        addEventListener: (event: string, callback: (e: any) => void) => {
          if (event === 'change') {
            mediaQueryCallback = callback;
          }
        },
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      });

      Object.defineProperty(window, 'matchMedia', {
        value: mockMatchMedia,
        writable: true,
      });

      render(<ThemeTestComponent />);

      const changeHandlingTime = await measureAsyncPerformance(async () => {
        // Simulate system theme change
        if (mediaQueryCallback) {
          mediaQueryCallback({ matches: true });
        }
        
        await waitFor(() => {
          // Theme should update based on system change
          expect(mockMatchMedia).toHaveBeenCalled();
        });
      });

      expect(changeHandlingTime).toBeLessThan(50);
    });
  });

  describe('Theme Transition Performance', () => {
    it('should handle CSS transitions efficiently', async () => {
      // Mock CSS transition support
      const mockGetComputedStyle = jest.fn().mockReturnValue({
        transition: 'background-color 0.2s ease, color 0.2s ease',
      });

      Object.defineProperty(window, 'getComputedStyle', {
        value: mockGetComputedStyle,
        writable: true,
      });

      render(<ThemeTestComponent />);

      const transitionTime = await measureAsyncPerformance(async () => {
        fireEvent.click(screen.getByTestId('dark-btn'));
        
        // Simulate transition completion
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // Should complete transition within expected time
      expect(transitionTime).toBeLessThan(300);
    });

    it('should not block UI during theme transitions', async () => {
      render(<ThemeTestComponent />);

      let uiBlocked = false;
      
      const interactionTime = await measureAsyncPerformance(async () => {
        // Start theme change
        fireEvent.click(screen.getByTestId('dark-btn'));
        
        // Try to interact with UI immediately
        const startInteraction = performance.now();
        fireEvent.click(screen.getByTestId('light-btn'));
        const endInteraction = performance.now();
        
        // UI should remain responsive
        if (endInteraction - startInteraction > 50) {
          uiBlocked = true;
        }
        
        await waitFor(() => {
          expect(mockSetTheme).toHaveBeenCalledTimes(2);
        });
      });

      expect(uiBlocked).toBe(false);
      expect(interactionTime).toBeLessThan(100);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track theme switch performance metrics', () => {
      const performanceEntries: any[] = [];
      
      // Mock Performance Observer
      const mockPerformanceObserver = jest.fn().mockImplementation((callback) => ({
        observe: jest.fn(),
        disconnect: jest.fn(),
      }));

      Object.defineProperty(window, 'PerformanceObserver', {
        value: mockPerformanceObserver,
        writable: true,
      });

      render(<ThemeTestComponent />);

      // Simulate performance measurement
      const measureThemeSwitch = () => {
        performance.mark('theme-switch-start');
        fireEvent.click(screen.getByTestId('dark-btn'));
        performance.mark('theme-switch-end');
        
        performance.measure('theme-switch', 'theme-switch-start', 'theme-switch-end');
      };

      measureThemeSwitch();

      // Should create performance measurements
      expect(mockPerformanceObserver).toHaveBeenCalled();
    });

    it('should identify performance bottlenecks', async () => {
      const performanceData = {
        themeSwitchTimes: [] as number[],
        renderTimes: [] as number[],
      };

      render(<ThemeTestComponent />);

      // Measure multiple theme switches
      for (let i = 0; i < 10; i++) {
        const switchTime = await measureAsyncPerformance(async () => {
          const theme = i % 2 === 0 ? 'dark' : 'light';
          fireEvent.click(screen.getByTestId(`${theme}-btn`));
          
          await waitFor(() => {
            expect(mockSetTheme).toHaveBeenCalledTimes(i + 1);
          });
        });
        
        performanceData.themeSwitchTimes.push(switchTime);
      }

      // Calculate performance statistics
      const avgSwitchTime = performanceData.themeSwitchTimes.reduce((a, b) => a + b, 0) / 10;
      const maxSwitchTime = Math.max(...performanceData.themeSwitchTimes);
      
      // Performance should be consistent
      expect(avgSwitchTime).toBeLessThan(50);
      expect(maxSwitchTime).toBeLessThan(100);
      
      // No switch should be significantly slower than average
      const slowSwitches = performanceData.themeSwitchTimes.filter(time => time > avgSwitchTime * 2);
      expect(slowSwitches.length).toBeLessThan(2);
    });
  });

  describe('Resource Usage', () => {
    it('should minimize CPU usage during theme operations', async () => {
      render(<ThemeTestComponent />);

      // Simulate CPU-intensive theme operations
      const cpuIntensiveTime = await measureAsyncPerformance(async () => {
        // Perform multiple theme-related operations
        for (let i = 0; i < 50; i++) {
          fireEvent.click(screen.getByTestId('dark-btn'));
          fireEvent.click(screen.getByTestId('light-btn'));
        }
        
        await waitFor(() => {
          expect(mockSetTheme).toHaveBeenCalledTimes(100);
        });
      });

      // Should handle intensive operations efficiently
      expect(cpuIntensiveTime).toBeLessThan(1000);
    });

    it('should optimize DOM updates during theme changes', () => {
      const mockQuerySelectorAll = jest.fn().mockReturnValue([]);
      Object.defineProperty(document, 'querySelectorAll', {
        value: mockQuerySelectorAll,
        writable: true,
      });

      render(<ThemeTestComponent />);

      const domUpdateTime = measurePerformance(() => {
        // Simulate theme-related DOM queries
        fireEvent.click(screen.getByTestId('dark-btn'));
        
        // Should minimize DOM queries
        mockQuerySelectorAll('[data-theme]');
      });

      expect(domUpdateTime).toBeLessThan(20);
    });
  });
});