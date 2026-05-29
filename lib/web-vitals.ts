/**
 * Web Vitals reporter for Core Web Vitals tracking.
 * Collects LCP, INP, CLS, TTFB, FCP metrics using the web-vitals library (v5)
 * and reports them to /api/vitals for server-side logging.
 * Also sends metrics to Sentry for long-term tracking and alerting.
 */

import { onLCP, onINP, onCLS, onTTFB, onFCP, type Metric } from "web-vitals";

interface VitalReport {
  name: string;
  value: number;
  rating: string;
  delta: number;
  navigationType: string;
  url: string;
  timestamp: number;
}

const vitalsQueue: VitalReport[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function queueVital(metric: Metric): void {
  vitalsQueue.push({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    navigationType: metric.navigationType || "unknown",
    url: typeof window !== "undefined" ? window.location.pathname : "/",
    timestamp: Date.now(),
  });

  // Send to Sentry immediately for each metric (lightweight)
  sendToSentry(metric);

  // Batch send to /api/vitals — flush after 2 seconds of inactivity
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushVitals, 2000);
}

/**
 * Send individual CWV metric to Sentry as a custom event.
 * This enables long-term tracking, dashboards, and alerting in Sentry.
 */
function sendToSentry(metric: Metric): void {
  try {
    // Dynamic import to avoid bundling Sentry in non-Sentry environments
    const Sentry = require("@sentry/nextjs");
    Sentry.addBreadcrumb({
      category: "web-vital",
      message: `${metric.name}: ${metric.rating} (${Math.round(metric.value)}ms)`,
      level: metric.rating === "poor" ? "warning" : "info",
      data: {
        metricName: metric.name,
        value: Math.round(metric.value * 100) / 100,
        rating: metric.rating,
        delta: Math.round(metric.delta * 100) / 100,
        navigationType: metric.navigationType || "unknown",
        url: typeof window !== "undefined" ? window.location.pathname : "/",
      },
    });

    // For poor metrics, also capture as a custom event for alerting
    if (metric.rating === "poor") {
      Sentry.captureMessage(`Poor Web Vital: ${metric.name} = ${Math.round(metric.value)}ms on ${typeof window !== "undefined" ? window.location.pathname : "/"}`, {
        level: "warning",
        tags: {
          "web-vital": metric.name,
          rating: "poor",
        },
        extra: {
          value: metric.value,
          delta: metric.delta,
          navigationType: metric.navigationType,
        },
      });
    }
  } catch {
    // Sentry not available — silently skip
  }
}

async function flushVitals(): Promise<void> {
  if (vitalsQueue.length === 0) return;

  const batch = vitalsQueue.splice(0, vitalsQueue.length);

  try {
    const payload = JSON.stringify({ metrics: batch });
    // Use sendBeacon for reliability on page unload
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      const sent = navigator.sendBeacon("/api/vitals", blob);
      if (!sent) {
        await fetch("/api/vitals", {
          method: "POST",
          body: payload,
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        });
      }
    } else {
      await fetch("/api/vitals", {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      });
    }
  } catch {
    // Silently fail — vitals reporting should never break the user experience
  }
}

export function initWebVitals(): void {
  if (typeof window === "undefined") return;

  // Report Core Web Vitals (v5 uses INP instead of FID)
  onLCP(queueVital);
  onINP(queueVital);
  onCLS(queueVital);
  onTTFB(queueVital);
  onFCP(queueVital);

  // Flush any remaining vitals on page unload
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushVitals();
    }
  });
}
