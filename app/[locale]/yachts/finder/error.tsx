"use client";

import ErrorBoundary from "../../ErrorBoundary";

export default function FinderError({
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
      titleKey="finderTitle"
      descriptionKey="finderDescription"
    />
  );
}
