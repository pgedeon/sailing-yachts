import { Skeleton, SkeletonCard, SkeletonStat, SkeletonTableRow } from "@/components/ui/skeleton";

export default function YachtDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-12 bg-muted animate-pulse rounded" />
          <span className="text-muted-foreground">/</span>
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          <span className="text-muted-foreground">/</span>
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Header: manufacturer + model name */}
        <div className="flex items-start gap-4 mb-6">
          <div className="h-12 w-12 bg-muted animate-pulse rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-8 w-72 bg-muted animate-pulse rounded" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-9 bg-muted animate-pulse rounded-md" />
            <div className="h-9 w-9 bg-muted animate-pulse rounded-md" />
          </div>
        </div>

        {/* Image + specs grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Image area */}
          <div className="aspect-[4/3] bg-muted animate-pulse rounded-lg" />

          {/* Key specs */}
          <div className="space-y-4">
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonStat key={i} />
              ))}
            </div>
            <div className="h-px bg-border my-4" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Spec bars chart placeholder */}
        <div className="mb-8">
          <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between">
                  <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-12 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-3 bg-muted animate-pulse rounded-full" style={{ width: `${50 + Math.random() * 40}%` }} />
              </div>
            ))}
          </div>
        </div>

        {/* Full spec table */}
        <div className="mb-8">
          <div className="h-6 w-32 bg-muted animate-pulse rounded mb-4" />
          <div className="border rounded-lg divide-y">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonTableRow key={i} cells={2} />
            ))}
          </div>
        </div>

        {/* Similar yachts */}
        <div className="mb-8">
          <div className="h-6 w-40 bg-muted animate-pulse rounded mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} lines={3} imageAspectRatio="aspect-[16/10]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
