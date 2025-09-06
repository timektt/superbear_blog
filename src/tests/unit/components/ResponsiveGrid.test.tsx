import { render, screen } from '@testing-library/react';
import Container, { Grid, Flex, Section, TouchTarget } from '@/components/ui/Container';

describe('Responsive Grid System', () => {
  describe('Container Component', () => {
    it('renders with default xl size and md padding', () => {
      render(
        <Container data-testid="container">
          <div>Test content</div>
        </Container>
      );
      
      const container = screen.getByTestId('container');
      expect(container).toHaveClass('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8');
    });

    it('renders with custom size and padding', () => {
      render(
        <Container size="lg" padding="lg" data-testid="container">
          <div>Test content</div>
        </Container>
      );
      
      const container = screen.getByTestId('container');
      expect(container).toHaveClass('max-w-6xl', 'px-6', 'sm:px-8', 'lg:px-12');
    });

    it('renders with custom element type', () => {
      render(
        <Container as="main" data-testid="container">
          <div>Test content</div>
        </Container>
      );
      
      const container = screen.getByTestId('container');
      expect(container.tagName).toBe('MAIN');
    });
  });

  describe('Grid Component', () => {
    it('renders with default grid classes', () => {
      render(
        <Grid data-testid="grid">
          <div>Item 1</div>
          <div>Item 2</div>
        </Grid>
      );
      
      const grid = screen.getByTestId('grid');
      expect(grid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-4', 'md:gap-6');
    });

    it('renders with custom column configuration', () => {
      render(
        <Grid 
          cols={{ default: 2, md: 3, lg: 4 }}
          gap="lg"
          data-testid="grid"
        >
          <div>Item 1</div>
          <div>Item 2</div>
        </Grid>
      );
      
      const grid = screen.getByTestId('grid');
      expect(grid).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4', 'gap-6', 'md:gap-8');
    });
  });

  describe('Flex Component', () => {
    it('renders with default flex classes', () => {
      render(
        <Flex data-testid="flex">
          <div>Item 1</div>
          <div>Item 2</div>
        </Flex>
      );
      
      const flex = screen.getByTestId('flex');
      expect(flex).toHaveClass('flex', 'items-start', 'justify-start', 'gap-4', 'md:gap-6');
    });

    it('renders with responsive direction changes', () => {
      render(
        <Flex 
          direction={{ default: 'col', md: 'row' }}
          align="center"
          justify="between"
          data-testid="flex"
        >
          <div>Item 1</div>
          <div>Item 2</div>
        </Flex>
      );
      
      const flex = screen.getByTestId('flex');
      expect(flex).toHaveClass('flex', 'flex-col', 'md:flex-row', 'items-center', 'justify-between');
    });
  });

  describe('Section Component', () => {
    it('renders with default padding', () => {
      render(
        <Section data-testid="section">
          <div>Content</div>
        </Section>
      );
      
      const section = screen.getByTestId('section');
      expect(section).toHaveClass('py-8', 'md:py-12');
    });

    it('renders with custom padding and background', () => {
      render(
        <Section padding="lg" background="muted" data-testid="section">
          <div>Content</div>
        </Section>
      );
      
      const section = screen.getByTestId('section');
      expect(section).toHaveClass('py-12', 'md:py-16', 'bg-muted/50');
    });
  });

  describe('TouchTarget Component', () => {
    it('renders with minimum touch target size', () => {
      render(
        <TouchTarget data-testid="touch-target">
          <button>Click me</button>
        </TouchTarget>
      );
      
      const touchTarget = screen.getByTestId('touch-target');
      expect(touchTarget).toHaveClass('min-h-[44px]', 'min-w-[44px]', 'flex', 'items-center', 'justify-center', 'touch-manipulation');
    });

    it('renders with large touch target size', () => {
      render(
        <TouchTarget size="lg" data-testid="touch-target">
          <button>Click me</button>
        </TouchTarget>
      );
      
      const touchTarget = screen.getByTestId('touch-target');
      expect(touchTarget).toHaveClass('min-h-[48px]', 'min-w-[48px]');
    });
  });

  describe('Responsive Behavior', () => {
    it('applies correct classes for magazine layout requirements', () => {
      // Test Hero Mosaic responsive layout
      render(
        <Container size="xl" padding="md" data-testid="hero-container">
          <Flex
            direction={{ default: 'col', md: 'row' }}
            gap="lg"
            align="start"
            data-testid="hero-flex"
          >
            <div className="w-full md:w-2/5">Newsletter</div>
            <div className="w-full md:w-3/5">Featured</div>
          </Flex>
        </Container>
      );
      
      const container = screen.getByTestId('hero-container');
      const flex = screen.getByTestId('hero-flex');
      
      expect(container).toHaveClass('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8');
      expect(flex).toHaveClass('flex', 'flex-col', 'md:flex-row', 'gap-6', 'md:gap-8', 'items-start');
    });

    it('applies correct classes for category exploration grid', () => {
      render(
        <Grid
          cols={{ default: 2, md: 3, lg: 4 }}
          gap="md"
          data-testid="category-grid"
        >
          <TouchTarget size="lg" data-testid="category-card">
            <div>Category 1</div>
          </TouchTarget>
          <TouchTarget size="lg" data-testid="category-card">
            <div>Category 2</div>
          </TouchTarget>
        </Grid>
      );
      
      const grid = screen.getByTestId('category-grid');
      const touchTargets = screen.getAllByTestId('category-card');
      
      expect(grid).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4', 'gap-4', 'md:gap-6');
      touchTargets.forEach(target => {
        expect(target).toHaveClass('min-h-[48px]', 'min-w-[48px]', 'touch-manipulation');
      });
    });
  });

  describe('Accessibility Features', () => {
    it('ensures minimum touch target sizes are met', () => {
      render(
        <TouchTarget data-testid="touch-target">
          <button>Accessible button</button>
        </TouchTarget>
      );
      
      const touchTarget = screen.getByTestId('touch-target');
      expect(touchTarget).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    });

    it('applies touch-manipulation for better mobile performance', () => {
      render(
        <TouchTarget data-testid="touch-target">
          <button>Mobile optimized</button>
        </TouchTarget>
      );
      
      const touchTarget = screen.getByTestId('touch-target');
      expect(touchTarget).toHaveClass('touch-manipulation');
    });
  });

  describe('Custom Classes and Composition', () => {
    it('allows custom classes to be added', () => {
      render(
        <Container className="custom-class" data-testid="container">
          <div>Content</div>
        </Container>
      );
      
      const container = screen.getByTestId('container');
      expect(container).toHaveClass('custom-class', 'max-w-7xl', 'mx-auto');
    });

    it('composes multiple components correctly', () => {
      render(
        <Section padding="lg" data-testid="section">
          <Container size="xl" data-testid="container">
            <Grid cols={{ default: 1, md: 2 }} data-testid="grid">
              <TouchTarget data-testid="touch-1">
                <div>Item 1</div>
              </TouchTarget>
              <TouchTarget data-testid="touch-2">
                <div>Item 2</div>
              </TouchTarget>
            </Grid>
          </Container>
        </Section>
      );
      
      const section = screen.getByTestId('section');
      const container = screen.getByTestId('container');
      const grid = screen.getByTestId('grid');
      
      expect(section).toHaveClass('py-12', 'md:py-16');
      expect(container).toHaveClass('max-w-7xl', 'mx-auto');
      expect(grid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2');
    });
  });
});