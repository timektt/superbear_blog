import { Skeleton } from '@/components/ui/skeleton';

export default function NewsletterLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero section skeleton */}
      <div className="text-center mb-12">
        <Skeleton className="w-16 h-16 mx-auto mb-6 rounded-full" />
        <Skeleton className="h-10 w-64 mx-auto mb-4" />
        <Skeleton className="h-6 w-96 mx-auto mb-8" />
      </div>

      {/* Subscription section skeleton */}
      <div className="max-w-2xl mx-auto mb-16">
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center mb-4">
            <Skeleton className="w-5 h-5 mr-2" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/5" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>

      {/* Archive section skeleton */}
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <Skeleton className="w-6 h-6 mr-3" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Newsletter grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-3/4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}