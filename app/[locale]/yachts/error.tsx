"use client";

import ErrorBoundary from "../ErrorBoundary";

export default function YachtsError({
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
      titleKey="yachtsTitle"
      descriptionKey="yachtsDescription"
      backHref="/"
      backLabel="← Home"
    />
  );
}
