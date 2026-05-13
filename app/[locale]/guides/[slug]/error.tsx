"use client";

import ErrorBoundary from "../../ErrorBoundary";

export default function GuideDetailError({
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
      titleKey="guideDetailTitle"
      descriptionKey="guideDetailDescription"
    />
  );
}
