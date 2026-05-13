"use client";

import ErrorBoundary from "../ErrorBoundary";

export default function CompareError({
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
      titleKey="compareTitle"
      descriptionKey="compareDescription"
    />
  );
}
