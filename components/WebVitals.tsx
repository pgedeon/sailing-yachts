/**
 * Web Vitals component — injects client-side Core Web Vitals tracking.
 * Add to the root layout to track all page loads.
 */
"use client";

import { useEffect } from "react";
import { initWebVitals } from "@/lib/web-vitals";

export default function WebVitals(): null {
  useEffect(() => {
    initWebVitals();
  }, []);

  return null;
}
