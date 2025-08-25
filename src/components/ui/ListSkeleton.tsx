export default function ListSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex gap-4 py-4 border-b border-border last:border-b-0 animate-pulse"
        >
          {/* Thumbnail skeleton */}
          <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-lg"></div>
          
          {/* Content skeleton */}
          <div className="flex-1 min-w-0">
            {/* Category badge skeleton */}
            <div className="w-20 h-5 bg-muted rounded mb-2"></div>
            
            {/* Title skeleton */}
            <div className="space-y-2 mb-3">
              <div className="h-5 bg-muted rounded w-full"></div>
              <div className="h-5 bg-muted rounded w-3/4"></div>
            </div>
            
            {/* Snippet skeleton */}
            <div className="space-y-2 mb-3">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
            
            {/* Meta skeleton */}
            <div className="flex items-center space-x-2">
              <div className="h-3 bg-muted rounded w-20"></div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
              <div className="h-3 bg-muted rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}