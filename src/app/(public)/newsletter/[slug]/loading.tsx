import { Skeleton } from '@/components/ui/skeleton';

export default function NewsletterIssueLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Skeleton className="h-8 w-32" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Header skeleton */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-2/3" />
          </div>

          {/* Action buttons skeleton */}
          <div className="flex gap-4 py-4 border-y">
            <Skeleton className="h-8 w-24" />
          </div>

          {/* Content skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* CTA skeleton */}
          <div className="bg-muted/50 rounded-lg p-6">
            <div className="flex gap-4">
              <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          {/* Recent issues skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
            <Skeleton className="h-8 w-full" />
          </div>

          {/* Subscription sidebar skeleton */}
          <div className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
