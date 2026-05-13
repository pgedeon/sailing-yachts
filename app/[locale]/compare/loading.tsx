import { Skeleton, SkeletonTableRow } from "@/components/ui/skeleton";

export default function CompareLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-72 bg-muted animate-pulse rounded mt-2" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search inputs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 h-12 bg-muted animate-pulse rounded-lg" />
          <div className="h-12 w-12 bg-muted animate-pulse rounded-lg shrink-0 flex items-center justify-center">
            <span className="text-muted-foreground text-lg font-bold">vs</span>
          </div>
          <div className="flex-1 h-12 bg-muted animate-pulse rounded-lg" />
        </div>

        {/* Saved comparisons */}
        <div className="mb-8">
          <div className="h-5 w-40 bg-muted animate-pulse rounded mb-3" />
          <div className="flex gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 w-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>

        {/* Comparison table placeholder */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 p-4">
            <div className="flex gap-4">
              <div className="flex-1 h-4 bg-muted animate-pulse rounded" />
              <div className="w-32 h-4 bg-muted animate-pulse rounded" />
              <div className="w-32 h-4 bg-muted animate-pulse rounded" />
            </div>
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="border-t p-4">
              <SkeletonTableRow cells={3} />
            </div>
          ))}
        </div>

        {/* Radar chart placeholder */}
        <div className="mt-8">
          <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
          <div className="h-80 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  );
}
