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
    id: string;
    name: string;
    bio?: string | null;
    avatar?: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  tags?: {
    id: string;
    name: string;
    slug: string;
  }[];
}

interface StructuredDataProps {
  article: Article;
  url: string;
}

export default function StructuredData({ article, url }: StructuredDataProps) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  // Main Article structured data
  const articleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': url,
    headline: article.title,
    description:
      article.summary || `Read ${article.title} by ${article.author.name}`,
    image: {
      '@type': 'ImageObject',
      url: article.image || `${baseUrl}/og-default.svg`,
      width: 1200,
      height: 630,
    },
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: {
      '@type': 'Person',
      '@id': `${baseUrl}/author/${article.author.id}`,
      name: article.author.name,
      description: article.author.bio,
      image: article.author.avatar,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
      name: 'SuperBear Blog',
      description:
        'Tech news platform for developers, AI builders, and tech entrepreneurs',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        '@id': `${baseUrl}/#logo`,
        url: `${baseUrl}/og-default.svg`,
        width: 600,
        height: 60,
      },
      sameAs: [
        // Add social media profiles here when available
      ],
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    articleSection: article.category.name,
    about: {
      '@type': 'Thing',
      name: article.category.name,
    },
    keywords:
      article.tags?.map((tag) => tag.name).join(', ') || article.category.name,
    url: url,
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${baseUrl}/#website`,
      name: 'SuperBear Blog',
      url: baseUrl,
    },
    inLanguage: 'en-US',
    copyrightYear: new Date(
      article.publishedAt || article.updatedAt
    ).getFullYear(),
    copyrightHolder: {
      '@id': `${baseUrl}/#organization`,
    },
  };

  // Website structured data
  const websiteStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    name: 'SuperBear Blog',
    description:
      'Tech news platform delivering filtered, in-depth content for developers, AI builders, and tech entrepreneurs',
    url: baseUrl,
    publisher: {
      '@id': `${baseUrl}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/news?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en-US',
  };

  // Organization structured data
  const organizationStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'SuperBear Blog',
    description:
      'Tech news platform for developers, AI builders, and tech entrepreneurs',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      '@id': `${baseUrl}/#logo`,
      url: `${baseUrl}/og-default.svg`,
      width: 600,
      height: 60,
    },
    foundingDate: '2024',
    knowsAbout: [
      'Artificial Intelligence',
      'Machine Learning',
      'Software Development',
      'Developer Tools',
      'Tech Startups',
      'Programming',
      'Technology News',
    ],
    sameAs: [
      // Add social media profiles here when available
    ],
  };

  // BreadcrumbList structured data
  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'News',
        item: `${baseUrl}/news`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.category.name,
        item: `${baseUrl}/news?category=${article.category.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: article.title,
        item: url,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData),
        }}
      />
    </>
  );
}
