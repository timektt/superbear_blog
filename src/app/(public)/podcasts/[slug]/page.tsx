import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AudioPlayer } from '@/components/podcast/AudioPlayer';
import { PodcastCard } from '@/components/podcast/PodcastCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils/date';
import { formatDuration } from '@/lib/utils/time';
import { Calendar, User, Clock, ArrowLeft, Share2 } from 'lucide-react';

interface PodcastPageProps {
  params: {
    slug: string;
  };
}

async function getPodcast(slug: string) {
  const response = await fetch(
    `${process.env.NEXTAUTH_URL}/api/podcasts/${slug}`,
    {
      next: { revalidate: 300 },
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function getRelatedPodcasts(categoryId?: string, currentId?: string) {
  const params = new URLSearchParams();
  if (categoryId) params.set('category', categoryId);
  params.set('limit', '3');

  const response = await fetch(
    `${process.env.NEXTAUTH_URL}/api/podcasts?${params}`,
    {
      next: { revalidate: 300 },
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return (data.podcasts || []).filter((p: any) => p.id !== currentId);
}

export async function generateMetadata({
  params,
}: PodcastPageProps): Promise<Metadata> {
  const podcast = await getPodcast(params.slug);

  if (!podcast) {
    return {
      title: 'Podcast Not Found',
    };
  }

  return {
    title: `${podcast.title} | SuperBear Blog`,
    description:
      podcast.description ||
      podcast.summary ||
      `Listen to ${podcast.title} on SuperBear Blog`,
    openGraph: {
      title: podcast.title,
      description: podcast.description || podcast.summary,
      type: 'article',
      images: podcast.coverImage ? [podcast.coverImage] : [],
      audio: podcast.audioUrl ? [podcast.audioUrl] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: podcast.title,
      description: podcast.description || podcast.summary,
      images: podcast.coverImage ? [podcast.coverImage] : [],
    },
  };
}

export async function generateStaticParams() {
  // In a real app, you'd fetch all published podcast slugs
  return [];
}

export default async function PodcastPage({ params }: PodcastPageProps) {
  const [podcast, relatedPodcasts] = await Promise.all([
    getPodcast(params.slug),
    getPodcast(params.slug).then((p) =>
      p ? getRelatedPodcasts(p.category?.id, p.id) : []
    ),
  ]);

  if (!podcast) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: podcast.title,
    description: podcast.description || podcast.summary,
    url: `${process.env.NEXTAUTH_URL}/podcasts/${podcast.slug}`,
    datePublished: podcast.publishedAt,
    duration: podcast.duration ? `PT${podcast.duration}S` : undefined,
    episodeNumber: podcast.episodeNumber,
    partOfSeries: {
      '@type': 'PodcastSeries',
      name: 'SuperBear Blog Podcast',
    },
    author: {
      '@type': 'Person',
      name: podcast.author.name,
    },
    associatedMedia: {
      '@type': 'MediaObject',
      contentUrl: podcast.audioUrl,
      encodingFormat: 'audio/mpeg',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/podcasts">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Podcasts
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {podcast.episodeNumber && (
                  <Badge variant="secondary">
                    Episode {podcast.episodeNumber}
                  </Badge>
                )}
                {podcast.category && (
                  <Badge variant="outline">{podcast.category.name}</Badge>
                )}
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <time dateTime={podcast.publishedAt}>
                    {formatDate(podcast.publishedAt)}
                  </time>
                </div>
                {podcast.duration && (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatDuration(podcast.duration)}
                  </div>
                )}
              </div>

              <h1 className="text-3xl font-bold leading-tight">
                {podcast.title}
              </h1>

              <div className="flex items-center text-muted-foreground">
                <User className="w-4 h-4 mr-2" />
                <span>By {podcast.author.name}</span>
              </div>
            </header>

            <AudioPlayer
              audioUrl={podcast.audioUrl}
              title={podcast.title}
              duration={podcast.duration}
            />

            {podcast.summary && (
              <div className="prose prose-gray max-w-none">
                <h2 className="text-xl font-semibold mb-3">Summary</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {podcast.summary}
                </p>
              </div>
            )}

            {podcast.description && (
              <div className="prose prose-gray max-w-none">
                <h2 className="text-xl font-semibold mb-3">Show Notes</h2>
                <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {podcast.description}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 pt-4 border-t">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share Episode
              </Button>
            </div>
          </div>

          <aside className="space-y-6">
            {podcast.coverImage && (
              <div className="aspect-square relative rounded-lg overflow-hidden">
                <Image
                  src={podcast.coverImage}
                  alt={`${podcast.title} cover`}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {podcast.tags && podcast.tags.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {podcast.tags.map((tag: any) => (
                    <Badge key={tag.id} variant="secondary" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {relatedPodcasts.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4">Related Episodes</h3>
                <div className="space-y-4">
                  {relatedPodcasts.slice(0, 3).map((relatedPodcast: any) => (
                    <div
                      key={relatedPodcast.id}
                      className="border rounded-lg p-3"
                    >
                      <Link
                        href={`/podcasts/${relatedPodcast.slug}`}
                        className="block hover:bg-muted/50 transition-colors -m-3 p-3 rounded-lg"
                      >
                        <div className="flex gap-3">
                          {relatedPodcast.coverImage && (
                            <div className="w-16 h-16 relative rounded overflow-hidden flex-shrink-0">
                              <Image
                                src={relatedPodcast.coverImage}
                                alt={relatedPodcast.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-sm line-clamp-2 mb-1">
                              {relatedPodcast.title}
                            </h4>
                            <div className="text-xs text-muted-foreground">
                              {relatedPodcast.episodeNumber && (
                                <span>
                                  Episode {relatedPodcast.episodeNumber}
                                </span>
                              )}
                              {relatedPodcast.duration && (
                                <span className="ml-2">
                                  {formatDuration(relatedPodcast.duration)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </article>
    </>
  );
}
