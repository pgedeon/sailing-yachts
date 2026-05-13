"use client";

import ErrorBoundary from "../ErrorBoundary";

export default function ManufacturersError({
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
      titleKey="manufacturersTitle"
      descriptionKey="manufacturersDescription"
    />
  );
}
