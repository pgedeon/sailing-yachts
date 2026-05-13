"use client";

import ErrorBoundary from "../../ErrorBoundary";

export default function CompareDetailError({
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
      titleKey="compareDetailTitle"
      descriptionKey="compareDetailDescription"
    />
  );
}
