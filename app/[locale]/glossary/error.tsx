"use client";

import ErrorBoundary from "../ErrorBoundary";

export default function GlossaryError({
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
      titleKey="glossaryTitle"
      descriptionKey="glossaryDescription"
    />
  );
}
