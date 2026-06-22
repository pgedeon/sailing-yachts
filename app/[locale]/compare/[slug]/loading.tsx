import { Skeleton, SkeletonStat, SkeletonTableRow } from "@/components/ui/skeleton";

export default function CompareDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-12 bg-muted animate-pulse rounded" />
          <span className="text-muted-foreground">/</span>
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          <span className="text-muted-foreground">/</span>
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Two yacht headers side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="aspect-[16/9] bg-muted animate-pulse rounded-lg" />
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <SkeletonStat key={j} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="mb-8">
          <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 p-4">
              <SkeletonTableRow cells={3} />
            </div>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="border-t p-4">
                <SkeletonTableRow cells={3} />
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart area */}
        <div className="mb-8">
          <div className="h-6 w-56 bg-muted animate-pulse rounded mb-4" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>

        {/* Radar chart area */}
        <div className="mb-8">
          <div className="h-6 w-40 bg-muted animate-pulse rounded mb-4" />
          <div className="h-80 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  );
}
