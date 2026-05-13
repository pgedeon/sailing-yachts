import { Skeleton } from "@/components/ui/skeleton";

export default function GlossaryLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-80 bg-muted animate-pulse rounded mt-2" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Alphabet nav */}
        <div className="flex flex-wrap gap-2 mb-8">
          {Array.from({ length: 26 }).map((_, i) => (
            <div key={i} className="h-8 w-8 bg-muted animate-pulse rounded" />
          ))}
        </div>

        {/* Term list */}
        <div className="space-y-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border-b pb-4 space-y-2">
              <div className="h-5 bg-muted animate-pulse rounded" style={{ width: `${30 + Math.random() * 30}%` }} />
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-muted animate-pulse rounded" />
                <div className="h-3 w-full bg-muted animate-pulse rounded" />
                <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
