import { Skeleton, SkeletonCard, SkeletonStat } from "@/components/ui/skeleton";

export default function ManufacturerDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-12 bg-muted animate-pulse rounded" />
          <span className="text-muted-foreground">/</span>
          <div className="h-4 w-28 bg-muted animate-pulse rounded" />
          <span className="text-muted-foreground">/</span>
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Manufacturer header */}
        <div className="flex items-start gap-6 mb-8">
          <div className="h-20 w-20 bg-muted animate-pulse rounded-xl shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-8 w-56 bg-muted animate-pulse rounded" />
            <div className="flex gap-4">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-28 bg-muted animate-pulse rounded" />
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </div>
            <div className="space-y-1.5 pt-2">
              <div className="h-3 w-full bg-muted animate-pulse rounded" />
              <div className="h-3 w-full bg-muted animate-pulse rounded" />
              <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>

        {/* Fleet chart */}
        <div className="mb-8">
          <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>

        {/* Yacht lineup */}
        <div className="mb-8">
          <div className="h-6 w-36 bg-muted animate-pulse rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} lines={3} imageAspectRatio="aspect-16/10" />
            ))}
          </div>
        </div>

        {/* Related manufacturers */}
        <div>
          <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 border rounded-lg p-3">
                <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
