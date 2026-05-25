"use client";

import { useEffect } from "react";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error("Size category page error:", error);
  }, [error]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Something went wrong
      </h2>
      <p className="text-gray-600 mb-6">
        We couldn&apos;t load the yachts for this size category. Please try again.
      </p>
      <a
        href="/yachts"
        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Browse All Yachts
      </a>
    </div>
  );
}
