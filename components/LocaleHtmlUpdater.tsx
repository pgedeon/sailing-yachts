"use client";

import { useEffect } from "react";

/**
 * Sets `document.documentElement.lang` to the correct locale.
 *
 * The root layout (`app/layout.tsx`) renders `<html lang="en">` statically
 * to avoid calling `cookies()`/`headers()`, which would force dynamic
 * rendering for the entire app. This component runs client-side to update
 * the lang attribute to the actual locale resolved from the URL segment.
 *
 * This is a harmless hydration mismatch: `suppressHydrationWarning` on the
 * `<html>` element tells React not to warn about the attribute difference.
 */
export default function LocaleHtmlUpdater({ locale }: { locale: string }) {
  useEffect(() => {
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return null; // Renders nothing
}
