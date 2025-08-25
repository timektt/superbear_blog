import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search } from 'lucide-react';

export default function PodcastNotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center max-w-md mx-auto">
        <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Podcast Episode Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The podcast episode you're looking for doesn't exist or may have been removed.
        </p>
        
        <div className="space-y-4">
          <Button asChild>
            <Link href="/podcasts">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Podcasts
            </Link>
          </Button>
          
          <div className="text-sm text-muted-foreground">
            <p>
              Or <Link href="/" className="text-primary hover:underline">return to homepage</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}