interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: unknown;
  image: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  author: {
    name: string;
  };
  category: {
    name: string;
  };
}

interface StructuredDataProps {
  article: Article;
  url: string;
}

export default function StructuredData({ article, url }: StructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description:
      article.summary || `Read ${article.title} by ${article.author.name}`,
    image: article.image || '/og-default.svg',
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: article.author.name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'SuperBear Blog',
      logo: {
        '@type': 'ImageObject',
        url: '/og-default.svg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    articleSection: article.category.name,
    url: url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
