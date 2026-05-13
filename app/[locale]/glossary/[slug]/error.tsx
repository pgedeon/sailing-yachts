"use client";

import ErrorBoundary from "../../ErrorBoundary";

export default function GlossaryDetailError({
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
      titleKey="glossaryDetailTitle"
      descriptionKey="glossaryDetailDescription"
    />
  );
}
