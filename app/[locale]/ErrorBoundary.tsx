"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { captureError } from "@/lib/sentry";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Translation key for the error title */
  titleKey?: string;
  /** Translation key for the error description */
  descriptionKey?: string;
  /** Label for the back link */
  backLabel?: string;
  /** URL for the back link */
  backHref?: string;
}

/**
 * Shared error boundary component used by all route-specific error.tsx files.
 * Logs errors to Sentry and shows a user-friendly recovery UI.
 */
export default function ErrorBoundary({
  error,
  reset,
  titleKey = "genericTitle",
  descriptionKey = "genericDescription",
  backLabel,
  backHref,
}: ErrorBoundaryProps) {
  const t = useTranslations("Errors");

  useEffect(() => {
    captureError(error, {
      errorDigest: error.digest || "unknown",
      errorBoundary: "route",
    });
  }, [error]);

  return (
    <div
      role="alert"
      className="min-h-[50vh] flex items-center justify-center px-4 py-12"
    >
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error icon */}
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center">
            <svg
              className="h-10 w-10 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
        </div>

        {/* Error message */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            {t(titleKey)}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t(descriptionKey)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
              />
            </svg>
            {t("tryAgain")}
          </button>

          {backHref && backLabel && (
            <a
              href={backHref}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {backLabel}
            </a>
          )}

          <a
            href="/"
            className="inline-flex items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("goHome")}
          </a>
        </div>

        {/* Error digest for debugging */}
        {error.digest && (
          <p className="text-xs text-muted-foreground/60">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
