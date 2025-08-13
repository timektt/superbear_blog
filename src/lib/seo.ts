import { Metadata } from 'next';

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