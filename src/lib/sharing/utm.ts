/**
 * UTM parameter utilities for social sharing
 */

export function addUtmParams(
  url: string,
  source: string,
  medium = 'social'
): string {
  const urlObj = new URL(url);
  urlObj.searchParams.set('utm_source', source);
  urlObj.searchParams.set('utm_medium', medium);
  urlObj.searchParams.set('utm_campaign', 'article_share');
  return urlObj.toString();
}

export function generateShareUrls(articleUrl: string, title: string) {
  const encodedUrl = encodeURIComponent(articleUrl);
  const encodedTitle = encodeURIComponent(title);

  return {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
  };
}
