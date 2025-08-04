import { Metadata } from 'next';

interface MetadataConfig {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
  tags?: string[];
}

export function generateMetadata(config: MetadataConfig): Metadata {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const {
    title,
    description = 'Filtered, in-depth tech content for developers, AI builders, and tech entrepreneurs',
    image = '/og-default.svg',
    url = baseUrl,
    type = 'website',
    publishedTime,
    modifiedTime,
    authors = ['SuperBear Blog'],
    section,
    tags = [],
  } = config;

  const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  return {
    title,
    description,
    authors: authors.map((name) => ({ name })),
    keywords: [
      'tech news',
      'developer news',
      'AI news',
      'startup news',
      ...(section ? [section] : []),
      ...tags,
    ],
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      title,
      description,
      type,
      url: fullUrl,
      siteName: 'SuperBear Blog',
      locale: 'en_US',
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(authors.length > 0 && type === 'article' && { authors }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags }),
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [
        {
          url: fullImageUrl,
          alt: title,
        },
      ],
      creator: '@superbear_blog', // Update with actual Twitter handle
      site: '@superbear_blog', // Update with actual Twitter handle
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

export function generateFallbackDescription(
  title: string,
  author?: string
): string {
  const baseDescription =
    'Stay updated with the latest in tech, AI, and developer tools.';

  if (author) {
    return `Read "${title}" by ${author}. ${baseDescription}`;
  }

  return `${title} - ${baseDescription}`;
}

export function generateSocialImage(): string {
  // In a real implementation, you might generate dynamic social images
  // For now, return the default image
  return '/og-default.svg';
}

export const DEFAULT_METADATA = {
  title: 'SuperBear Blog - Tech News for Developers',
  description:
    'Filtered, in-depth tech content for developers, AI builders, and tech entrepreneurs',
  image: '/og-default.svg',
  keywords: [
    'tech news',
    'developer news',
    'AI news',
    'machine learning',
    'developer tools',
    'startup news',
    'programming',
    'software development',
  ],
};
