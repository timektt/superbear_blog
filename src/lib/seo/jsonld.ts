/**
 * JSON-LD structured data utilities
 */

export function generateArticleJsonLd(article: any, baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.summary,
    url: `${baseUrl}/news/${article.slug}`,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Person',
      name: article.author?.name || 'SuperBear Blog',
    },
    publisher: {
      '@type': 'Organization',
      name: 'SuperBear Blog',
      url: baseUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/news/${article.slug}`,
    },
  };
}

export function generatePersonJsonLd(author: any, baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.displayName || author.name,
    description: author.bio,
    url: `${baseUrl}/authors/${author.slug}`,
  };
}

export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
