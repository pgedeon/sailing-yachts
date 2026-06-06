"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/analytics-tracker";

/**
 * Automatically tracks page views on route changes.
 * Include once in the root layout.
 */
export default function AnalyticsPageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip admin and API routes
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;

    // Small delay to ensure page is loaded
    const timer = setTimeout(() => {
      try {
        trackPageView({ page: pathname });
      } catch {
        // Silently fail — analytics should never break UX
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
