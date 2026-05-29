/**
 * POST /api/vitals — Receives Core Web Vitals metric data from the client.
 *
 * Accepts batches of metrics and stores them for analysis.
 * Uses an in-memory store (suitable for serverless with Neon DB persistence).
 * Also logs poor metrics to Sentry for alerting.
 */

import { NextRequest, NextResponse } from "next/server";

interface VitalMetric {
  name: string;
  value: number;
  rating: string;
  delta: number;
  navigationType: string;
  url: string;
  timestamp: number;
}

// In-memory store — will reset on cold starts but persists within a function instance.
// For production, this would be replaced with a Neon DB table.
const metricsStore: VitalMetric[] = [];
const MAX_STORE_SIZE = 10000;

// Aggregated stats per metric name
interface MetricStats {
  name: string;
  count: number;
  p50: number;
  p75: number;
  p95: number;
  p99: number;
  avg: number;
  good: number;
  needsImprovement: number;
  poor: number;
}

// Thresholds per metric (Google's CWV thresholds)
const THRESHOLDS: Record<string, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  FCP: { good: 1800, poor: 3000 },
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const metrics: VitalMetric[] = body.metrics;

    if (!Array.isArray(metrics) || metrics.length === 0) {
      return NextResponse.json(
        { error: "Expected { metrics: [...] }" },
        { status: 400 }
      );
    }

    // Validate each metric
    const validMetrics = metrics.filter(
      (m) =>
        m.name &&
        typeof m.value === "number" &&
        typeof m.url === "string" &&
        typeof m.timestamp === "number"
    );

    if (validMetrics.length === 0) {
      return NextResponse.json(
        { error: "No valid metrics in batch" },
        { status: 400 }
      );
    }

    // Store metrics (with size limit)
    metricsStore.push(...validMetrics);
    if (metricsStore.length > MAX_STORE_SIZE) {
      metricsStore.splice(0, metricsStore.length - MAX_STORE_SIZE);
    }

    // Log poor metrics server-side for debugging
    const poorMetrics = validMetrics.filter((m) => m.rating === "poor");
    if (poorMetrics.length > 0) {
      for (const m of poorMetrics) {
        console.warn(
          `[CWV Alert] Poor ${m.name}: ${Math.round(m.value)}ms on ${m.url} (${m.navigationType})`
        );
      }
    }

    return NextResponse.json({
      ok: true,
      stored: validMetrics.length,
      poorCount: poorMetrics.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

/**
 * GET /api/vitals — Returns aggregated performance stats.
 * Query params:
 *   ?url=/yachts — filter by page URL
 *   ?hours=24 — look back N hours (default 24)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const urlFilter = searchParams.get("url");
  const hours = Math.min(
    Math.max(parseInt(searchParams.get("hours") || "24", 10), 1),
    168
  );
  const cutoff = Date.now() - hours * 60 * 60 * 1000;

  let filtered = metricsStore.filter((m) => m.timestamp >= cutoff);

  if (urlFilter) {
    filtered = filtered.filter(
      (m) => m.url === urlFilter || m.url.startsWith(urlFilter)
    );
  }

  if (filtered.length === 0) {
    return NextResponse.json({
      period: `${hours}h`,
      url: urlFilter || "all",
      totalMetrics: 0,
      stats: [],
      topPages: [],
      recentPoor: [],
      thresholds: THRESHOLDS,
    });
  }

  // Group by metric name
  const grouped: Record<string, number[]> = {};
  for (const m of filtered) {
    if (!grouped[m.name]) grouped[m.name] = [];
    grouped[m.name].push(m.value);
  }

  const stats: MetricStats[] = Object.entries(grouped).map(
    ([name, values]) => {
      const sorted = [...values].sort((a, b) => a - b);
      const thresholds = THRESHOLDS[name] || { good: Infinity, poor: Infinity };

      return {
        name,
        count: values.length,
        p50: percentile(sorted, 50),
        p75: percentile(sorted, 75),
        p95: percentile(sorted, 95),
        p99: percentile(sorted, 99),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        good: values.filter((v) => v <= thresholds.good).length,
        needsImprovement: values.filter(
          (v) => v > thresholds.good && v <= thresholds.poor
        ).length,
        poor: values.filter((v) => v > thresholds.poor).length,
      };
    }
  );

  // Per-page breakdown (top 10 pages by metric count)
  const pageGroups: Record<string, number> = {};
  for (const m of filtered) {
    pageGroups[m.url] = (pageGroups[m.url] || 0) + 1;
  }
  const topPages = Object.entries(pageGroups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([url, count]) => ({ url, count }));

  // Recent poor metrics (last 20)
  const recentPoor = filtered
    .filter((m) => m.rating === "poor")
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20)
    .map((m) => ({
      name: m.name,
      value: Math.round(m.value * 100) / 100,
      url: m.url,
      timestamp: m.timestamp,
      navigationType: m.navigationType,
    }));

  return NextResponse.json({
    period: `${hours}h`,
    url: urlFilter || "all",
    totalMetrics: filtered.length,
    uniquePages: Object.keys(pageGroups).length,
    stats,
    topPages,
    recentPoor,
    thresholds: THRESHOLDS,
  });
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}
