import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { useTheme } from 'next-themes';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Test components
const AccessibleThemeComponent = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <div>
      <h1>Theme Settings</h1>
      <div role="group" aria-labelledby="theme-group-label">
        <h2 id="theme-group-label">Choose Theme</h2>
        <button
          onClick={() => setTheme('light')}
          aria-pressed={theme === 'light'}
          aria-describedby="light-theme-desc"
        >
          Light Theme
        </button>
        <div id="light-theme-desc" className="sr-only">
          Switch to light color scheme
        </div>
        
        <button
          onClick={() => setTheme('dark')}
          aria-pressed={theme === 'dark'}
          aria-describedby="dark-theme-desc"
        >
          Dark Theme
        </button>
        <div id="dark-theme-desc" className="sr-only">
          Switch to dark color scheme
        </div>
        
        <button
          onClick={() => setTheme('system')}
          aria-pressed={theme === 'system'}
          aria-describedby="system-theme-desc"
        >
          System Theme
        </button>
        <div id="system-theme-desc" className="sr-only">
          Use system color scheme preference
        </div>
      </div>
    </div>
  );
};

const AccessibleSearchComponent = () => {
  return (
    <div>
      <form role="search" aria-label="Search articles">
        <label htmlFor="search-input">Search</label>
        <input
          id="search-input"
          type="search"
          placeholder="Enter search terms..."
          aria-describedby="search-help"
        />
        <div id="search-help" className="sr-only">
          Search through articles, categories, and tags
        </div>
        <button type="submit" aria-describedby="search-button-desc">
          Search
        </button>
        <div id="search-button-desc" className="sr-only">
          Submit search query
        </div>
      </form>
      
      <div role="region" aria-label="Search filters">
        <h2>Filters</h2>
        <fieldset>
          <legend>Category</legend>
          <select aria-label="Filter by category">
            <option value="">All Categories</option>
            <option value="ai">AI</option>
            <option value="devtools">DevTools</option>
          </select>
        </fieldset>
        
        <fieldset>
          <legend>Date Range</legend>
          <label htmlFor="start-date">Start Date</label>
          <input
            id="start-date"
            type="date"
            aria-describedby="date-help"
          />
          <label htmlFor="end-date">End Date</label>
          <input
            id="end-date"
            type="date"
            aria-describedby="date-help"
          />
          <div id="date-help" className="sr-only">
            Filter articles by publication date range
          </div>
        </fieldset>
      </div>
    </div>
  );
};

const AccessibleNavigationComponent = () => {
  return (
    <div>
      <nav aria-label="Main navigation">
        <ul>
          <li><a href="/" aria-current="page">Home</a></li>
          <li><a href="/news">News</a></li>
          <li><a href="/ai">AI</a></li>
          <li><a href="/devtools">DevTools</a></li>
        </ul>
      </nav>
      
      <nav aria-label="Breadcrumb">
        <ol>
          <li><a href="/">Home</a></li>
          <li><a href="/news">News</a></li>
          <li aria-current="page">Article Title</li>
        </ol>
      </nav>
      
      <main>
        <h1>Main Content</h1>
        <p>Article content goes here...</p>
      </main>
      
      <aside aria-label="Related articles">
        <h2>Related Articles</h2>
        <ul>
          <li><a href="/article-1">Related Article 1</a></li>
          <li><a href="/article-2">Related Article 2</a></li>
        </ul>
      </aside>
    </div>
  );
};

describe('Keyboard Navigation Accessibility', () => {
  const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: jest.fn(),
      resolvedTheme: 'light',
      systemTheme: 'light',
      themes: ['light', 'dark', 'system'],
      forcedTheme: undefined,
    });
  });

  describe('Theme Controls Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<AccessibleThemeComponent />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation through theme buttons', async () => {
      render(<AccessibleThemeComponent />);
      
      const lightButton = screen.getByRole('button', { name: /light theme/i });
      const darkButton = screen.getByRole('button', { name: /dark theme/i });
      const systemButton = screen.getByRole('button', { name: /system theme/i });

      // Tab to first button
      await user.tab();
      expect(lightButton).toHaveFocus();

      // Tab to second button
      await user.tab();
      expect(darkButton).toHaveFocus();

      // Tab to third button
      await user.tab();
      expect(systemButton).toHaveFocus();

      // Shift+Tab back
      await user.tab({ shift: true });
      expect(darkButton).toHaveFocus();
    });

    it('should activate theme buttons with keyboard', async () => {
      const mockSetTheme = jest.fn();
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        systemTheme: 'light',
        themes: ['light', 'dark', 'system'],
        forcedTheme: undefined,
      });

      render(<AccessibleThemeComponent />);
      
      const darkButton = screen.getByRole('button', { name: /dark theme/i });
      
      // Focus and activate with Enter
      darkButton.focus();
      await user.keyboard('{Enter}');
      expect(mockSetTheme).toHaveBeenCalledWith('dark');

      // Focus and activate with Space
      await user.keyboard(' ');
      expect(mockSetTheme).toHaveBeenCalledTimes(2);
    });

    it('should have proper ARIA attributes', () => {
      render(<AccessibleThemeComponent />);
      
      const lightButton = screen.getByRole('button', { name: /light theme/i });
      const darkButton = screen.getByRole('button', { name: /dark theme/i });
      
      // Should have aria-pressed attributes
      expect(lightButton).toHaveAttribute('aria-pressed', 'true');
      expect(darkButton).toHaveAttribute('aria-pressed', 'false');
      
      // Should have aria-describedby
      expect(lightButton).toHaveAttribute('aria-describedby', 'light-theme-desc');
      expect(darkButton).toHaveAttribute('aria-describedby', 'dark-theme-desc');
    });

    it('should announce theme changes to screen readers', async () => {
      const mockSetTheme = jest.fn();
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
        systemTheme: 'light',
        themes: ['light', 'dark', 'system'],
        forcedTheme: undefined,
      });

      render(<AccessibleThemeComponent />);
      
      const darkButton = screen.getByRole('button', { name: /dark theme/i });
      
      // Should have screen reader description
      const description = screen.getByText('Switch to dark color scheme');
      expect(description).toHaveClass('sr-only');
      expect(description).toBeInTheDocument();
    });
  });

  describe('Search Interface Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<AccessibleSearchComponent />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation through search form', async () => {
      render(<AccessibleSearchComponent />);
      
      const searchInput = screen.getByLabelText(/search/i);
      const searchButton = screen.getByRole('button', { name: /search/i });
      const categorySelect = screen.getByLabelText(/filter by category/i);

      // Tab through form elements
      await user.tab();
      expect(searchInput).toHaveFocus();

      await user.tab();
      expect(searchButton).toHaveFocus();

      await user.tab();
      expect(categorySelect).toHaveFocus();
    });

    it('should handle form submission with keyboard', async () => {
      render(<AccessibleSearchComponent />);
      
      const searchInput = screen.getByLabelText(/search/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      // Type in search input
      await user.type(searchInput, 'artificial intelligence');
      expect(searchInput).toHaveValue('artificial intelligence');

      // Submit with Enter key
      await user.keyboard('{Enter}');
      
      // Or focus button and activate
      searchButton.focus();
      await user.keyboard('{Enter}');
    });

    it('should have proper form labels and descriptions', () => {
      render(<AccessibleSearchComponent />);
      
      const searchInput = screen.getByLabelText(/search/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      
      // Should have proper labels
      expect(searchInput).toHaveAttribute('id', 'search-input');
      expect(startDateInput).toHaveAttribute('id', 'start-date');
      
      // Should have descriptions
      expect(searchInput).toHaveAttribute('aria-describedby', 'search-help');
    });

    it('should group related form controls', () => {
      render(<AccessibleSearchComponent />);
      
      // Should have fieldsets with legends
      const categoryFieldset = screen.getByRole('group', { name: /category/i });
      const dateFieldset = screen.getByRole('group', { name: /date range/i });
      
      expect(categoryFieldset).toBeInTheDocument();
      expect(dateFieldset).toBeInTheDocument();
    });
  });

  describe('Navigation Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<AccessibleNavigationComponent />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation through nav links', async () => {
      render(<AccessibleNavigationComponent />);
      
      const homeLink = screen.getByRole('link', { name: /home/i });
      const newsLink = screen.getByRole('link', { name: /news/i });
      const aiLink = screen.getByRole('link', { name: /ai/i });

      // Tab through navigation links
      await user.tab();
      expect(homeLink).toHaveFocus();

      await user.tab();
      expect(newsLink).toHaveFocus();

      await user.tab();
      expect(aiLink).toHaveFocus();
    });

    it('should have proper navigation landmarks', () => {
      render(<AccessibleNavigationComponent />);
      
      // Should have navigation landmarks
      const mainNav = screen.getByRole('navigation', { name: /main navigation/i });
      const breadcrumbNav = screen.getByRole('navigation', { name: /breadcrumb/i });
      
      expect(mainNav).toBeInTheDocument();
      expect(breadcrumbNav).toBeInTheDocument();
      
      // Should have main content landmark
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      
      // Should have complementary landmark
      const aside = screen.getByRole('complementary', { name: /related articles/i });
      expect(aside).toBeInTheDocument();
    });

    it('should indicate current page in navigation', () => {
      render(<AccessibleNavigationComponent />);
      
      const currentPageLink = screen.getByRole('link', { current: 'page' });
      expect(currentPageLink).toHaveAttribute('aria-current', 'page');
      
      const currentBreadcrumb = screen.getByText('Article Title');
      expect(currentBreadcrumb).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Focus Management', () => {
    it('should maintain logical focus order', async () => {
      render(
        <div>
          <button>First Button</button>
          <input type="text" placeholder="Text Input" />
          <select>
            <option>Option 1</option>
          </select>
          <a href="#link">Link</a>
          <button>Last Button</button>
        </div>
      );

      const firstButton = screen.getByRole('button', { name: /first button/i });
      const textInput = screen.getByRole('textbox');
      const select = screen.getByRole('combobox');
      const link = screen.getByRole('link');
      const lastButton = screen.getByRole('button', { name: /last button/i });

      // Tab through elements in order
      await user.tab();
      expect(firstButton).toHaveFocus();

      await user.tab();
      expect(textInput).toHaveFocus();

      await user.tab();
      expect(select).toHaveFocus();

      await user.tab();
      expect(link).toHaveFocus();

      await user.tab();
      expect(lastButton).toHaveFocus();

      // Shift+Tab back through elements
      await user.tab({ shift: true });
      expect(link).toHaveFocus();

      await user.tab({ shift: true });
      expect(select).toHaveFocus();
    });

    it('should skip hidden elements in tab order', async () => {
      render(
        <div>
          <button>Visible Button</button>
          <button style={{ display: 'none' }}>Hidden Button</button>
          <button aria-hidden="true">Aria Hidden Button</button>
          <button>Another Visible Button</button>
        </div>
      );

      const visibleButton = screen.getByRole('button', { name: /visible button/i });
      const anotherButton = screen.getByRole('button', { name: /another visible button/i });

      await user.tab();
      expect(visibleButton).toHaveFocus();

      await user.tab();
      expect(anotherButton).toHaveFocus();
    });

    it('should handle focus trapping in modals', async () => {
      const ModalComponent = () => {
        const [isOpen, setIsOpen] = React.useState(false);
        
        return (
          <div>
            <button onClick={() => setIsOpen(true)}>Open Modal</button>
            {isOpen && (
              <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <h2 id="modal-title">Modal Title</h2>
                <button>First Modal Button</button>
                <button>Second Modal Button</button>
                <button onClick={() => setIsOpen(false)}>Close Modal</button>
              </div>
            )}
          </div>
        );
      };

      render(<ModalComponent />);

      const openButton = screen.getByRole('button', { name: /open modal/i });
      await user.click(openButton);

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();

      const firstModalButton = screen.getByRole('button', { name: /first modal button/i });
      const secondModalButton = screen.getByRole('button', { name: /second modal button/i });
      const closeButton = screen.getByRole('button', { name: /close modal/i });

      // Focus should be trapped within modal
      await user.tab();
      expect(firstModalButton).toHaveFocus();

      await user.tab();
      expect(secondModalButton).toHaveFocus();

      await user.tab();
      expect(closeButton).toHaveFocus();

      // Should wrap back to first element
      await user.tab();
      expect(firstModalButton).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide meaningful text alternatives', () => {
      render(
        <div>
          <img src="chart.png" alt="Sales increased by 25% this quarter" />
          <button aria-label="Close dialog">×</button>
          <div aria-label="Loading content" role="status">
            <span aria-hidden="true">⏳</span>
          </div>
        </div>
      );

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Sales increased by 25% this quarter');

      const closeButton = screen.getByRole('button', { name: /close dialog/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close dialog');

      const loadingStatus = screen.getByRole('status');
      expect(loadingStatus).toHaveAttribute('aria-label', 'Loading content');
    });

    it('should announce dynamic content changes', () => {
      const DynamicComponent = () => {
        const [message, setMessage] = React.useState('');
        
        return (
          <div>
            <button onClick={() => setMessage('Form submitted successfully!')}>
              Submit Form
            </button>
            <div role="status" aria-live="polite">
              {message}
            </div>
          </div>
        );
      };

      render(<DynamicComponent />);

      const submitButton = screen.getByRole('button', { name: /submit form/i });
      const statusRegion = screen.getByRole('status');

      fireEvent.click(submitButton);

      expect(statusRegion).toHaveTextContent('Form submitted successfully!');
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should provide context for form errors', () => {
      render(
        <form>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            aria-describedby="email-error"
            aria-invalid="true"
          />
          <div id="email-error" role="alert">
            Please enter a valid email address
          </div>
        </form>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const errorMessage = screen.getByRole('alert');

      expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      expect(errorMessage).toHaveTextContent('Please enter a valid email address');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should support standard keyboard shortcuts', async () => {
      const ShortcutComponent = () => {
        const [searchFocused, setSearchFocused] = React.useState(false);
        
        React.useEffect(() => {
          const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
              e.preventDefault();
              setSearchFocused(true);
            }
          };
          
          document.addEventListener('keydown', handleKeyDown);
          return () => document.removeEventListener('keydown', handleKeyDown);
        }, []);
        
        return (
          <div>
            <input
              type="search"
              placeholder="Press / to focus search"
              ref={(input) => {
                if (searchFocused && input) {
                  input.focus();
                  setSearchFocused(false);
                }
              }}
            />
          </div>
        );
      };

      render(<ShortcutComponent />);

      const searchInput = screen.getByRole('searchbox');

      // Press / key to focus search
      await user.keyboard('/');
      expect(searchInput).toHaveFocus();
    });

    it('should handle escape key to close overlays', async () => {
      const OverlayComponent = () => {
        const [isOpen, setIsOpen] = React.useState(true);
        
        React.useEffect(() => {
          const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            }
          };
          
          document.addEventListener('keydown', handleKeyDown);
          return () => document.removeEventListener('keydown', handleKeyDown);
        }, []);
        
        return (
          <div>
            {isOpen && (
              <div role="dialog" aria-modal="true">
                <p>Press Escape to close</p>
              </div>
            )}
          </div>
        );
      };

      render(<OverlayComponent />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(dialog).not.toBeInTheDocument();
    });
  });
});