"use client";

import ErrorBoundary from "../../ErrorBoundary";

export default function ManufacturerDetailError({
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
      titleKey="manufacturerDetailTitle"
      descriptionKey="manufacturerDetailDescription"
    />
  );
}
