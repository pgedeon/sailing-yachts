import { SkeletonCard, SkeletonFilterSection } from "@/components/ui/skeleton";

export default function YachtsLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded mt-2" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar filters */}
          <aside className="w-full lg:w-64 shrink-0 space-y-6">
            <SkeletonFilterSection options={8} />
            <SkeletonFilterSection options={5} />
            <SkeletonFilterSection options={4} />
            <SkeletonFilterSection options={3} />
            <SkeletonFilterSection options={6} />
          </aside>

          {/* Main content */}
          <div className="flex-1 space-y-4">
            {/* Top bar — sort + count */}
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-9 w-40 bg-muted animate-pulse rounded" />
            </div>

            {/* Yacht cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <SkeletonCard key={i} lines={4} hasImage imageAspectRatio="aspect-[16/10]" />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2 pt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-9 bg-muted animate-pulse rounded-md"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
