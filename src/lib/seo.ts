import { Metadata } from 'next';

/**
 * Enhanced SEO utilities for generating meta tags, Open Graph, and structured data
 */

export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'blog';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  authorUrl?: string;
  section?: string;
  tags?: string[];
  locale?: string;
  siteName?: string;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

export interface ArticleSEO extends SEOData {
  type: 'article';
  content?: string;
  wordCount?: number;
  readingTime?: number;
  category?: string;
  series?: string;
}

export interface WebsiteSEO extends SEOData {
  type: 'website';
  organization?: {
    name: string;
    logo: string;
    url: string;
    sameAs?: string[];
  };
}

export function pageTitle(title: string, includeBase = true): string {
  if (includeBase) {
    return `${title} | SuperBear Blog`;
  }
  return title;
}

export function pageDescription(description: string): string {
  return description.length > 160 ? `${description.substring(0, 157)}...` : description;
}

export function ogImage(url?: string, title?: string): string {
  if (url) return url;
  
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  if (title) {
    // In a real app, you might generate dynamic OG images
    return `${baseUrl}/og-default.svg`;
  }
  return `${baseUrl}/og-default.svg`;
}

export function generateMetaTags(seo: SEOData): Metadata {
  const {
    title,
    description,
    keywords = [],
    image,
    url,
    type = 'website',
    publishedTime,
    modifiedTime,
    author,
    authorUrl,
    section,
    tags = [],
    locale = 'en_US',
    siteName = 'SuperBear',
    canonical,
    noindex = false,
    nofollow = false,
  } = seo;

  const robots = [];
  if (noindex) robots.push('noindex');
  if (nofollow) robots.push('nofollow');
  if (!noindex && !nofollow) robots.push('index', 'follow');

  return {
    title,
    description,
    keywords: keywords.join(', '),
    alternates: {
      canonical: canonical || url,
    },
    openGraph: {
      title,
      description,
      type,
      url,
      siteName,
      locale,
      images: image ? [{
        url: image,
        width: 1200,
        height: 630,
        alt: title,
      }] : [],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { 
        authors: authorUrl ? [{ name: author, url: authorUrl }] : [author] 
      }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
      creator: author ? `@${author.replace(/\s+/g, '').toLowerCase()}` : undefined,
    },
    robots: {
      index: !noindex,
      follow: !nofollow,
      nocache: false,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function generateArticleStructuredData(seo: ArticleSEO): object {
  const {
    title,
    description,
    image,
    url,
    publishedTime,
    modifiedTime,
    author,
    authorUrl,
    content,
    wordCount,
    readingTime,
    category,
    tags = [],
  } = seo;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': url,
    headline: title,
    description,
    image: image ? {
      '@type': 'ImageObject',
      url: image,
      width: 1200,
      height: 630,
    } : undefined,
    url,
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: {
      '@type': 'Person',
      name: author,
      ...(authorUrl && { url: authorUrl }),
    },
    publisher: {
      '@type': 'Organization',
      name: 'SuperBear',
      logo: {
        '@type': 'ImageObject',
        url: '/logo.png',
        width: 200,
        height: 60,
      },
      url: 'https://superbear.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    ...(content && { articleBody: content }),
    ...(wordCount && { wordCount }),
    ...(readingTime && { 
      timeRequired: `PT${readingTime}M`,
      estimatedReadingTime: `${readingTime} minutes`,
    }),
    ...(category && { articleSection: category }),
    ...(tags.length > 0 && { keywords: tags.join(', ') }),
    inLanguage: 'en-US',
    isAccessibleForFree: true,
  };
}

export function generateWebsiteStructuredData(seo: WebsiteSEO): object {
  const {
    title,
    description,
    url,
    organization = {
      name: 'SuperBear',
      logo: '/logo.png',
      url: 'https://superbear.com',
    },
  } = seo;

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${url}#website`,
    name: title,
    description,
    url,
    publisher: {
      '@type': 'Organization',
      '@id': `${organization.url}#organization`,
      name: organization.name,
      logo: {
        '@type': 'ImageObject',
        url: organization.logo,
      },
      url: organization.url,
      ...(organization.sameAs && { sameAs: organization.sameAs }),
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en-US',
  };
}

export function generateBreadcrumbStructuredData(
  breadcrumbs: Array<{ name: string; url: string }>
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

export function generateOrganizationStructuredData(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://superbear.com#organization',
    name: 'SuperBear',
    description: 'A CMS-based tech news platform focused on delivering filtered, in-depth content for developers, AI builders, and tech entrepreneurs.',
    url: 'https://superbear.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://superbear.com/logo.png',
      width: 200,
      height: 60,
    },
    sameAs: [
      'https://twitter.com/superbear',
      'https://github.com/superbear',
      'https://linkedin.com/company/superbear',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'hello@superbear.com',
    },
    foundingDate: '2024',
    knowsAbout: [
      'Artificial Intelligence',
      'Machine Learning',
      'Software Development',
      'Technology News',
      'Startup Ecosystem',
      'Developer Tools',
    ],
  };
}

export function createListPageMetadata(
  title: string,
  description: string,
  path: string
): Metadata {
  const fullTitle = pageTitle(title);
  const fullDescription = pageDescription(description);
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const url = `${baseUrl}${path}`;
  const imageUrl = ogImage();

  return {
    title: fullTitle,
    description: fullDescription,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      type: 'website',
      url,
      siteName: 'SuperBear Blog',
      locale: 'en_US',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [
        {
          url: imageUrl,
          alt: title,
        },
      ],
      creator: '@superbear_blog',
      site: '@superbear_blog',
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function createSearchPageMetadata(query?: string): Metadata {
  const title = query ? `Search results for "${query}"` : 'Search';
  const description = query 
    ? `Find articles about ${query} on SuperBear Blog`
    : 'Search for tech news, AI updates, developer tools, and startup insights';
  
  return createListPageMetadata(title, description, `/search${query ? `?q=${encodeURIComponent(query)}` : ''}`);
}

export function createTagPageMetadata(tagName: string): Metadata {
  const title = `#${tagName}`;
  const description = `Articles tagged with ${tagName} - Latest tech news and insights`;
  
  return createListPageMetadata(title, description, `/tag/${tagName}`);
}

/**
 * Generate canonical URL with proper formatting
 */
export function generateCanonicalUrl(path: string, baseUrl?: string): string {
  const base = baseUrl || 'https://superbear.com';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Extract reading time from content
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Generate social media sharing URLs
 */
export function generateSharingUrls(url: string, title: string, description?: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || '');
  
  return {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    hackernews: `https://news.ycombinator.com/submitlink?u=${encodedUrl}&t=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
  };
}