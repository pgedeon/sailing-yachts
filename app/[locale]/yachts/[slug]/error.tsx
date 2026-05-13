"use client";

import ErrorBoundary from "../../ErrorBoundary";

export default function YachtDetailError({
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
      titleKey="yachtDetailTitle"
      descriptionKey="yachtDetailDescription"
      backHref="/yachts"
      backLabel="← Browse yachts"
    />
  );
}
