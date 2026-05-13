import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="h-8 w-36 bg-muted animate-pulse rounded" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search input */}
        <div className="h-12 bg-muted animate-pulse rounded-lg mb-6" />

        {/* Suggestions area */}
        <div className="space-y-2 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>

        {/* Popular searches */}
        <div className="mb-8">
          <div className="h-5 w-32 bg-muted animate-pulse rounded mb-3" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded-full" style={{ width: `${60 + Math.random() * 60}px` }} />
            ))}
          </div>
        </div>

        {/* Results grid */}
        <div>
          <div className="h-5 w-28 bg-muted animate-pulse rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} lines={3} imageAspectRatio="aspect-[16/10]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
