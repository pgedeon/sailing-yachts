"use client";

import ErrorBoundary from "../ErrorBoundary";

export default function AccountError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorBoundary
      error={error}
      reset={reset}
      titleKey="accountTitle"
      descriptionKey="accountDescription"
      backHref="/"
      backLabel="← Home"
    />
  );
}
