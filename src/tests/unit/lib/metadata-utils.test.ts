import {
  generateArticleMetadata,
  generateSiteMetadata,
} from '@/lib/metadata-utils';

describe('metadata-utils', () => {
  describe('generateArticleMetadata', () => {
    const mockArticle = {
      id: '1',
      title: 'Test Article',
      slug: 'test-article',
      summary: 'This is a test article summary',
      content: { type: 'doc', content: [] },
      image: 'https://res.cloudinary.com/test/image/upload/v1/test.jpg',
      status: 'PUBLISHED' as const,
      publishedAt: new Date('2024-01-01T10:00:00Z'),
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z'),
      author: {
        name: 'John Doe',
        avatar: 'https://res.cloudinary.com/test/image/upload/v1/author.jpg',
      },
      category: {
        name: 'Development',
        slug: 'development',
      },
      tags: [
        { name: 'React', slug: 'react' },
        { name: 'Testing', slug: 'testing' },
      ],
    };

    it('should generate complete metadata for article with image', () => {
      const metadata = generateArticleMetadata(mockArticle);

      expect(metadata).toEqual({
        title: 'Test Article | SuperBear Blog',
        description: 'This is a test article summary',
        keywords:
          'React, Testing, Development, tech news, AI, development tools',
        authors: [{ name: 'John Doe' }],
        openGraph: {
          title: 'Test Article',
          description: 'This is a test article summary',
          type: 'article',
          url: 'https://superbear.blog/news/test-article',
          images: [
            {
              url: 'https://res.cloudinary.com/test/image/upload/v1/test.jpg',
              width: 1200,
              height: 630,
              alt: 'Test Article',
            },
          ],
          publishedTime: '2024-01-01T10:00:00.000Z',
          authors: ['John Doe'],
          tags: ['React', 'Testing'],
        },
        twitter: {
          card: 'summary_large_image',
          title: 'Test Article',
          description: 'This is a test article summary',
          images: ['https://res.cloudinary.com/test/image/upload/v1/test.jpg'],
          creator: '@superbear_blog',
        },
      });
    });

    it('should use default image when article has no image', () => {
      const articleWithoutImage = { ...mockArticle, image: null };
      const metadata = generateArticleMetadata(articleWithoutImage);

      expect(metadata.openGraph.images).toEqual([
        {
          url: 'https://superbear.blog/og-default.svg',
          width: 1200,
          height: 630,
          alt: 'Test Article',
        },
      ]);
      expect(metadata.twitter.images).toEqual([
        'https://superbear.blog/og-default.svg',
      ]);
    });

    it('should handle article without summary', () => {
      const articleWithoutSummary = { ...mockArticle, summary: null };
      const metadata = generateArticleMetadata(articleWithoutSummary);

      expect(metadata.description).toBe(
        'Read the latest tech news and insights on SuperBear Blog'
      );
      expect(metadata.openGraph.description).toBe(
        'Read the latest tech news and insights on SuperBear Blog'
      );
      expect(metadata.twitter.description).toBe(
        'Read the latest tech news and insights on SuperBear Blog'
      );
    });

    it('should handle article without tags', () => {
      const articleWithoutTags = { ...mockArticle, tags: [] };
      const metadata = generateArticleMetadata(articleWithoutTags);

      expect(metadata.keywords).toBe(
        'Development, tech news, AI, development tools'
      );
      expect(metadata.openGraph.tags).toEqual([]);
    });
  });

  describe('generateSiteMetadata', () => {
    it('should generate default site metadata', () => {
      const metadata = generateSiteMetadata();

      expect(metadata).toEqual({
        title: {
          default: 'SuperBear Blog | Tech News & Insights',
          template: '%s | SuperBear Blog',
        },
        description:
          'Curated tech news, AI insights, and development tools for developers, AI builders, and tech entrepreneurs.',
        keywords:
          'tech news, AI, development tools, startup news, programming, software development',
        authors: [{ name: 'SuperBear Blog', url: 'https://superbear.blog' }],
        creator: 'SuperBear Blog',
        publisher: 'SuperBear Blog',
        robots: {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
        openGraph: {
          type: 'website',
          locale: 'en_US',
          url: 'https://superbear.blog',
          siteName: 'SuperBear Blog',
          title: 'SuperBear Blog | Tech News & Insights',
          description:
            'Curated tech news, AI insights, and development tools for developers, AI builders, and tech entrepreneurs.',
          images: [
            {
              url: 'https://superbear.blog/og-default.svg',
              width: 1200,
              height: 630,
              alt: 'SuperBear Blog',
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title: 'SuperBear Blog | Tech News & Insights',
          description:
            'Curated tech news, AI insights, and development tools for developers, AI builders, and tech entrepreneurs.',
          images: ['https://superbear.blog/og-default.svg'],
          creator: '@superbear_blog',
        },
        verification: {
          google: 'your-google-verification-code',
        },
      });
    });

    it('should generate custom metadata with overrides', () => {
      const customMetadata = generateSiteMetadata({
        title: 'Custom Title',
        description: 'Custom description',
      });

      expect(customMetadata.title).toEqual({
        default: 'Custom Title',
        template: '%s | SuperBear Blog',
      });
      expect(customMetadata.description).toBe('Custom description');
      expect(customMetadata.openGraph.title).toBe('Custom Title');
      expect(customMetadata.openGraph.description).toBe('Custom description');
      expect(customMetadata.twitter.title).toBe('Custom Title');
      expect(customMetadata.twitter.description).toBe('Custom description');
    });
  });
});
