import { Skeleton } from "@/components/ui/skeleton";

export default function BestYearSizeLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb skeleton */}
      <div className="py-3 flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Hero skeleton */}
      <div className="py-12 text-center space-y-4">
        <Skeleton className="h-6 w-36 mx-auto" />
        <Skeleton className="h-10 w-96 mx-auto" />
        <Skeleton className="h-5 w-[500px] mx-auto" />
        <Skeleton className="h-5 w-[500px] mx-auto" />
        <Skeleton className="h-8 w-48 mx-auto rounded-full" />
      </div>

      {/* Content skeleton */}
      <div className="py-8 flex flex-col lg:flex-row gap-8">
        <div className="lg:w-64 shrink-0 space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-36 w-full rounded-lg" />
        </div>
        <div className="flex-1 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
