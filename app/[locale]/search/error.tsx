"use client";

import ErrorBoundary from "../ErrorBoundary";

export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundary
      error={error}
      reset={reset}
      titleKey="searchTitle"
      descriptionKey="searchDescription"
    />
  );
}
