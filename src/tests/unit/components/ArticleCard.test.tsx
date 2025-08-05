import { render, screen } from '@testing-library/react';
import ArticleCard from '@/components/ui/ArticleCard';

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

jest.mock('@/components/ui/OptimizedImage', () => {
  return function MockOptimizedImage({ src, alt, ...props }: unknown) {
    return <img src={src} alt={alt} {...props} />;
  };
});

const mockArticle = {
  id: '1',
  title: 'Test Article',
  slug: 'test-article',
  summary: 'This is a test article summary',
  image: 'https://res.cloudinary.com/test/image/upload/v1/test.jpg',
  publishedAt: new Date('2024-01-01T10:00:00Z'),
  author: {
    id: '1',
    name: 'John Doe',
    avatar: 'https://res.cloudinary.com/test/image/upload/v1/author.jpg',
  },
  category: {
    id: '1',
    name: 'Development',
    slug: 'development',
  },
  tags: [
    { id: '1', name: 'React', slug: 'react' },
    { id: '2', name: 'Testing', slug: 'testing' },
  ],
};

describe('ArticleCard', () => {
  it('should render article information correctly', () => {
    render(<ArticleCard article={mockArticle} />);

    expect(screen.getByText('Test Article')).toBeInTheDocument();
    expect(
      screen.getByText('This is a test article summary')
    ).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Development')).toBeInTheDocument();
  });

  it('should render article image with correct alt text', () => {
    render(<ArticleCard article={mockArticle} />);

    const image = screen.getByAltText('Cover image for Test Article');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining('test.jpg'));
  });

  it('should render tags', () => {
    render(<ArticleCard article={mockArticle} />);

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Testing')).toBeInTheDocument();
  });

  it('should render published date', () => {
    render(<ArticleCard article={mockArticle} />);

    expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
  });

  it('should have correct link to article', () => {
    render(<ArticleCard article={mockArticle} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/news/test-article');
  });

  it('should render without image when image is null', () => {
    const articleWithoutImage = { ...mockArticle, image: null };
    render(<ArticleCard article={articleWithoutImage} />);

    expect(screen.queryByAltText('Test Article')).not.toBeInTheDocument();
    expect(screen.getByText('Test Article')).toBeInTheDocument();
  });

  it('should render without summary when summary is null', () => {
    const articleWithoutSummary = { ...mockArticle, summary: null };
    render(<ArticleCard article={articleWithoutSummary} />);

    expect(
      screen.queryByText('This is a test article summary')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Test Article')).toBeInTheDocument();
  });

  it('should render without tags when tags array is empty', () => {
    const articleWithoutTags = { ...mockArticle, tags: [] };
    render(<ArticleCard article={articleWithoutTags} />);

    expect(screen.queryByText('React')).not.toBeInTheDocument();
    expect(screen.queryByText('Testing')).not.toBeInTheDocument();
    expect(screen.getByText('Test Article')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<ArticleCard article={mockArticle} />);

    const article = screen.getByRole('article');
    expect(article).toBeInTheDocument();

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Test Article');

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Test Article')
    );
  });

  it('should handle long titles gracefully', () => {
    const articleWithLongTitle = {
      ...mockArticle,
      title:
        'This is a very long article title that should be handled gracefully by the component without breaking the layout or causing overflow issues',
    };

    render(<ArticleCard article={articleWithLongTitle} />);

    const title = screen.getByText(articleWithLongTitle.title);
    expect(title).toBeInTheDocument();
  });
});
