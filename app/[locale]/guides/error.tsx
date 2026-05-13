"use client";

import ErrorBoundary from "../ErrorBoundary";

export default function GuidesError({
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
      titleKey="guidesTitle"
      descriptionKey="guidesDescription"
    />
  );
}
