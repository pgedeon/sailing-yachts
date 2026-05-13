import { Skeleton } from "@/components/ui/skeleton";

export default function GlossaryDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-12 bg-muted animate-pulse rounded" />
          <span className="text-muted-foreground">/</span>
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          <span className="text-muted-foreground">/</span>
          <div className="h-4 w-28 bg-muted animate-pulse rounded" />
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Term title */}
        <div className="mb-6">
          <div className="h-9 w-48 bg-muted animate-pulse rounded mb-3" />
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
            <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
          </div>
        </div>

        {/* Definition */}
        <div className="space-y-3 mb-8 p-6 border rounded-lg bg-muted/30">
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
        </div>

        {/* Related terms */}
        <div>
          <div className="h-5 w-32 bg-muted animate-pulse rounded mb-3" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded-lg" style={{ width: `${60 + Math.random() * 60}px` }} />
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
