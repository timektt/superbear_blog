import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail } from 'lucide-react';

export default function NewsletterIssueNotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center max-w-md mx-auto">
        <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-muted-foreground" />
        </div>

        <h1 className="text-2xl font-bold mb-4">Newsletter Issue Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The newsletter issue you're looking for doesn't exist or may have been
          removed.
        </p>

        <div className="space-y-4">
          <Button asChild>
            <Link href="/newsletter">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Newsletter
            </Link>
          </Button>

          <div className="text-sm text-muted-foreground">
            <p>
              Or{' '}
              <Link href="/" className="text-primary hover:underline">
                return to homepage
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
