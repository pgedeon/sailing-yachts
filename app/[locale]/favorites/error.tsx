"use client";

import ErrorBoundary from "../ErrorBoundary";

export default function FavoritesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorBoundary
      error={error}
      reset={reset}
      titleKey="favoritesTitle"
      descriptionKey="favoritesDescription"
      backHref="/"
      backLabel="← Home"
    />
  );
}
