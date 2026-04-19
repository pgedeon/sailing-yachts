import * as Sentry from "@sentry/nextjs";

/**
 * Capture an error in Sentry with optional context tags.
 * Safe to call even if Sentry is not configured (DSN missing).
 */
export function captureError(error: unknown, context?: Record<string, string>) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  if (error instanceof Error) {
    Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureMessage(
      `Non-Error thrown: ${String(error)}`,
      "error"
    );
  }
}

/**
 * Capture a database query error with query context.
 */
export function captureDbError(error: unknown, query?: string) {
  captureError(error, {
    type: "database",
    ...(query ? { query: query.substring(0, 200) } : {}),
  });
}

/**
 * Capture an API route error with request context.
 */
export function captureApiError(
  error: unknown,
  method?: string,
  path?: string
) {
  captureError(error, {
    type: "api",
    ...(method ? { method } : {}),
    ...(path ? { path } : {}),
  });
}

/**
 * Add a breadcrumb for tracing.
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, string>
) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
  });
}
