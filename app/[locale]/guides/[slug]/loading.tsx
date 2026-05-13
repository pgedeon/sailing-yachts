import { Skeleton, SkeletonTableRow } from "@/components/ui/skeleton";

export default function GuideDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-12 bg-muted animate-pulse rounded" />
          <span className="text-muted-foreground">/</span>
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          <span className="text-muted-foreground">/</span>
          <div className="h-4 w-40 bg-muted animate-pulse rounded" />
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Title + meta */}
        <div className="mb-8">
          <div className="h-9 w-3/4 bg-muted animate-pulse rounded mb-3" />
          <div className="flex items-center gap-4">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
          </div>
        </div>

        {/* Hero image */}
        <div className="aspect-[2/1] bg-muted animate-pulse rounded-lg mb-8" />

        {/* Content paragraphs */}
        <div className="space-y-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-full bg-muted animate-pulse rounded" />
              <div className="h-3 w-full bg-muted animate-pulse rounded" />
              <div className="h-3 w-full bg-muted animate-pulse rounded" />
              <div
                className="h-3 bg-muted animate-pulse rounded"
                style={{ width: `${60 + Math.random() * 35}%` }}
              />
            </div>
          ))}
        </div>

        {/* Related guides */}
        <div className="mt-12 pt-8 border-t">
          <div className="h-6 w-36 bg-muted animate-pulse rounded mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-2">
                <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-3 w-full bg-muted animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
