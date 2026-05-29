"use client";

import { useEffect, useState, useCallback } from "react";

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

interface PageInfo {
  url: string;
  count: number;
}

interface PoorMetric {
  name: string;
  value: number;
  url: string;
  timestamp: number;
  navigationType: string;
}

interface VitalsData {
  period: string;
  url: string;
  totalMetrics: number;
  uniquePages: number;
  stats: MetricStats[];
  topPages: PageInfo[];
  recentPoor: PoorMetric[];
  thresholds: Record<string, { good: number; poor: number }>;
}

// Unit display for each metric
function metricUnit(name: string): string {
  if (name === "CLS") return "";
  return "ms";
}

function formatValue(name: string, value: number): string {
  if (name === "CLS") return value.toFixed(3);
  return Math.round(value).toLocaleString();
}

function ratingBadge(rating: "good" | "needsImprovement" | "poor"): {
  label: string;
  className: string;
} {
  switch (rating) {
    case "good":
      return { label: "Good", className: "bg-green-100 text-green-800" };
    case "needsImprovement":
      return {
        label: "Needs Improvement",
        className: "bg-yellow-100 text-yellow-800",
      };
    case "poor":
      return { label: "Poor", className: "bg-red-100 text-red-800" };
  }
}

function getOverallRating(
  stat: MetricStats,
  thresholds: Record<string, { good: number; poor: number }>
): "good" | "needsImprovement" | "poor" {
  const t = thresholds[stat.name];
  if (!t) return "good";
  if (stat.p75 <= t.good) return "good";
  if (stat.p75 <= t.poor) return "needsImprovement";
  return "poor";
}

export default function VitalsDashboard() {
  const [data, setData] = useState<VitalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hours, setHours] = useState(24);
  const [urlFilter, setUrlFilter] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ hours: String(hours) });
      if (urlFilter) params.set("url", urlFilter);
      const res = await fetch(`/api/vitals?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch vitals");
    } finally {
      setLoading(false);
    }
  }, [hours, urlFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-medium">Error loading vitals</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button
          onClick={fetchData}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const coreMetrics = ["LCP", "INP", "CLS"];
  const otherMetrics = ["TTFB", "FCP"];
  const coreStats = data.stats.filter((s) => coreMetrics.includes(s.name));
  const otherStats = data.stats.filter((s) => otherMetrics.includes(s.name));

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Period</label>
            <select
              value={hours}
              onChange={(e) => {
                setHours(Number(e.target.value));
                setLoading(true);
              }}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            >
              <option value={1}>Last 1 hour</option>
              <option value={6}>Last 6 hours</option>
              <option value={24}>Last 24 hours</option>
              <option value={72}>Last 3 days</option>
              <option value={168}>Last 7 days</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">
              Filter by URL
            </label>
            <input
              type="text"
              value={urlFilter}
              onChange={(e) => setUrlFilter(e.target.value)}
              placeholder="/yachts, /compare, etc."
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh (30s)
            </label>
            <button
              onClick={() => {
                setLoading(true);
                fetchData();
              }}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-500">
          {data.totalMetrics.toLocaleString()} metrics from{" "}
          {data.uniquePages} pages ({data.period})
        </div>
      </div>

      {/* Core Web Vitals */}
      {coreStats.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Core Web Vitals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coreStats.map((stat) => {
              const rating = getOverallRating(stat, data.thresholds);
              const badge = ratingBadge(rating);
              const total = stat.good + stat.needsImprovement + stat.poor;
              const goodPct = total > 0 ? Math.round((stat.good / total) * 100) : 0;

              return (
                <div
                  key={stat.name}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-2xl font-bold text-gray-900">
                        {stat.name}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        {stat.name === "LCP"
                          ? "Largest Contentful Paint"
                          : stat.name === "INP"
                            ? "Interaction to Next Paint"
                            : "Cumulative Layout Shift"}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    {formatValue(stat.name, stat.p75)}
                    <span className="text-lg text-gray-500">
                      {metricUnit(stat.name)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">p75 ({stat.count} samples)</p>

                  {/* Distribution bar */}
                  {total > 0 && (
                    <div className="mb-4">
                      <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
                        <div
                          className="bg-green-500"
                          style={{ width: `${(stat.good / total) * 100}%` }}
                        />
                        <div
                          className="bg-yellow-400"
                          style={{
                            width: `${(stat.needsImprovement / total) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-red-500"
                          style={{ width: `${(stat.poor / total) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{goodPct}% good</span>
                        <span>
                          {total > 0
                            ? Math.round((stat.poor / total) * 100)
                            : 0}
                          % poor
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Percentile table */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs text-gray-500">p50</div>
                      <div className="text-sm font-medium">
                        {formatValue(stat.name, stat.p50)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">p95</div>
                      <div className="text-sm font-medium">
                        {formatValue(stat.name, stat.p95)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">avg</div>
                      <div className="text-sm font-medium">
                        {formatValue(stat.name, stat.avg)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Other Metrics */}
      {otherStats.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Other Performance Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherStats.map((stat) => {
              const rating = getOverallRating(stat, data.thresholds);
              const badge = ratingBadge(rating);
              const total = stat.good + stat.needsImprovement + stat.poor;

              return (
                <div
                  key={stat.name}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xl font-bold">{stat.name}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {stat.name === "TTFB"
                          ? "Time to First Byte"
                          : "First Contentful Paint"}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {formatValue(stat.name, stat.p75)}
                    <span className="text-lg text-gray-500">ms</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    p75 ({stat.count} samples)
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-center text-sm">
                    <div>
                      <div className="text-xs text-gray-500">p50</div>
                      <div className="font-medium">
                        {formatValue(stat.name, stat.p50)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">p95</div>
                      <div className="font-medium">
                        {formatValue(stat.name, stat.p95)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Good</div>
                      <div className="font-medium text-green-600">
                        {stat.good}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Poor</div>
                      <div className="font-medium text-red-600">
                        {stat.poor}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No data state */}
      {data.stats.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            No metrics collected yet
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Core Web Vitals data will appear here once visitors interact with the
            site. Metrics are collected client-side using the web-vitals library
            and sent to /api/vitals.
          </p>
          <p className="text-gray-400 text-sm mt-4">
            Data is stored in-memory and resets on cold starts. For persistent
            storage, consider connecting to a Neon DB table.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        {data.topPages.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Top Pages by Metric Count
            </h3>
            <div className="space-y-2">
              {data.topPages.map((page) => (
                <div
                  key={page.url}
                  className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50"
                >
                  <span className="text-sm font-mono text-gray-700 truncate max-w-[300px]">
                    {page.url}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {page.count} metrics
                    </span>
                    <button
                      onClick={() => setUrlFilter(page.url)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      filter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Poor Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Recent Poor Metrics
          </h3>
          {data.recentPoor.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No poor metrics recorded in this period — looking good! ✅
            </p>
          ) : (
            <div className="space-y-2">
              {data.recentPoor.map((m, i) => (
                <div
                  key={`${m.name}-${m.url}-${m.timestamp}-${i}`}
                  className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-md"
                >
                  <div>
                    <span className="text-sm font-semibold text-red-700">
                      {m.name}
                    </span>
                    <span className="text-sm text-gray-600 ml-2">
                      {formatValue(m.name, m.value)}
                      {metricUnit(m.name)}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      on {m.url}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(m.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Thresholds Reference */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Google&apos;s CWV Thresholds
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-gray-600">Metric</th>
                <th className="text-center py-2 px-3">
                  <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                    Good
                  </span>
                </th>
                <th className="text-center py-2 px-3">
                  <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">
                    Needs Improvement
                  </span>
                </th>
                <th className="text-center py-2 px-3">
                  <span className="inline-block px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs">
                    Poor
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.thresholds).map(([name, t]) => (
                <tr key={name} className="border-b border-gray-100">
                  <td className="py-2 px-3 font-medium">{name}</td>
                  <td className="py-2 px-3 text-center text-green-700">
                    ≤ {formatValue(name, t.good)}
                    {metricUnit(name)}
                  </td>
                  <td className="py-2 px-3 text-center text-yellow-700">
                    {formatValue(name, t.good)}
                    {metricUnit(name)} – {formatValue(name, t.poor)}
                    {metricUnit(name)}
                  </td>
                  <td className="py-2 px-3 text-center text-red-700">
                    &gt; {formatValue(name, t.poor)}
                    {metricUnit(name)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
