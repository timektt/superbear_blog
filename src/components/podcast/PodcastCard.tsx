'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatDuration } from '@/lib/utils/time';
import { formatDate } from '@/lib/utils/date';

interface PodcastCardProps {
  podcast: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    coverImage: string | null;
    duration: number | null;
    episodeNumber: number | null;
    publishedAt: string;
    author: { name: string };
    category?: { name: string; slug: string };
  };
}

export function PodcastCard({ podcast }: PodcastCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      <Link href={`/podcasts/${podcast.slug}`} className="block">
        <div className="relative aspect-square">
          <Image
            src={podcast.coverImage || '/placeholder-image.svg'}
            alt={`${podcast.title} cover`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {podcast.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm">
              {formatDuration(podcast.duration)}
            </div>
          )}
        </div>
        
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between mb-2">
            {podcast.episodeNumber && (
              <Badge variant="secondary" className="text-xs">
                Episode {podcast.episodeNumber}
              </Badge>
            )}
            {podcast.category && (
              <Badge variant="outline" className="text-xs">
                {podcast.category.name}
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {podcast.title}
          </h3>
        </CardHeader>
        
        <CardContent className="pt-0">
          {podcast.description && (
            <p className="text-muted-foreground text-sm line-clamp-3 mb-3">
              {podcast.description}
            </p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>By {podcast.author.name}</span>
            <time dateTime={podcast.publishedAt}>
              {formatDate(podcast.publishedAt)}
            </time>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}