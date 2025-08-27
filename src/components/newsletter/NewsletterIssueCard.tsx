'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatDate } from '@/lib/utils/date';
import { Calendar, User } from 'lucide-react';

interface NewsletterIssueCardProps {
  issue: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    issueNumber: number;
    publishedAt: string;
    author: { name: string };
  };
}

export function NewsletterIssueCard({ issue }: NewsletterIssueCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <Link href={`/newsletter/${issue.slug}`} className="block">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="text-xs font-medium">
              Issue #{issue.issueNumber}
            </Badge>
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 mr-1" />
              <time dateTime={issue.publishedAt}>
                {formatDate(issue.publishedAt)}
              </time>
            </div>
          </div>
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {issue.title}
          </h3>
        </CardHeader>

        <CardContent className="pt-0">
          {issue.summary && (
            <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
              {issue.summary}
            </p>
          )}
          <div className="flex items-center text-xs text-muted-foreground">
            <User className="w-3 h-3 mr-1" />
            <span>By {issue.author.name}</span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
