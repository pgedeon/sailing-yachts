export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-gray-100 rounded-lg h-12 w-3/4 mx-auto mb-4" />
      <div className="bg-gray-100 rounded-lg h-6 w-1/2 mx-auto mb-8" />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar skeleton */}
        <div className="lg:w-64 flex-shrink-0 space-y-4">
          <div className="bg-gray-100 rounded-lg h-48" />
          <div className="bg-gray-100 rounded-lg h-40" />
        </div>

        {/* Grid skeleton */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg h-48" />
          ))}
        </div>
      </div>
    </div>
  );
}
