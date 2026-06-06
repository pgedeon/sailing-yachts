"use client";

import { useEffect, useState, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────────────

interface AnalyticsSummary {
  totalPageViews: number;
  uniqueSessions: number;
  totalSearches: number;
  totalComparisons: number;
  totalYachtViews: number;
  avgSessionLength: number;
  bounceRate: number;
}

interface TrendDataPoint {
  date: string;
  count: number;
}

interface PopularYacht {
  yachtModelId: number;
  modelName: string;
  manufacturerName: string;
  viewCount: number;
}

interface PopularSearch {
  query: string;
  count: number;
  resultCount: number | null;
  lastSearched: string;
}

interface ComparisonPattern {
  yachtIds: number[];
  yachtNames: string[];
  count: number;
}

interface PageViewBreakdown {
  page: string;
  views: number;
  uniqueViews: number;
}

interface TopReferrer {
  referrer: string;
  count: number;
}

interface EventCount {
  eventType: string;
  count: number;
}

interface AnalyticsData {
  summary: AnalyticsSummary;
  trends: {
    pageViews: TrendDataPoint[];
    searches: TrendDataPoint[];
    comparisons: TrendDataPoint[];
    yachtViews: TrendDataPoint[];
  };
  popularYachts: PopularYacht[];
  popularSearches: PopularSearch[];
  comparisons: ComparisonPattern[];
  pageBreakdown: PageViewBreakdown[];
  topReferrers: TopReferrer[];
  eventCounts: EventCount[];
  period: { days: number };
}

// ─── Helpers ──────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function truncateUrl(url: string, max = 50): string {
  if (url.length <= max) return url;
  return url.slice(0, max - 3) + "...";
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// ─── Simple SVG Chart Components ──────────────────────────────────

function MiniSparkline({ data, color = "#3b82f6", height = 40 }: { data: TrendDataPoint[]; color?: string; height?: number }) {
  if (data.length < 2) return <span className="text-gray-400 text-sm">No data yet</span>;

  const values = data.map((d) => d.count);
  const max = Math.max(...values, 1);
  const width = 200;
  const padding = 2;

  const points = values
    .map((v, i) => {
      const x = padding + (i / (values.length - 1)) * (width - padding * 2);
      const y = height - padding - (v / max) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg width={width} height={height} className="inline-block">
      <polygon points={areaPoints} fill={color} opacity={0.15} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

function BarChart({ data, maxBars = 15, height = 200, color = "#3b82f6" }: {
  data: { label: string; value: number }[];
  maxBars?: number;
  height?: number;
  color?: string;
}) {
  if (data.length === 0)
    return (
      <div className="flex items-center justify-center text-gray-400" style={{ height }}>
        No data yet — tracking starts when users visit the site
      </div>
    );

  const bars = data.slice(0, maxBars);
  const max = Math.max(...bars.map((b) => b.value), 1);
  const barWidth = Math.max(8, Math.min(40, 600 / bars.length - 4));

  return (
    <div className="flex items-end gap-1 justify-center" style={{ height }}>
      {bars.map((bar, i) => {
        const barHeight = Math.max(2, (bar.value / max) * (height - 40));
        return (
          <div key={i} className="flex flex-col items-center gap-1" title={`${bar.label}: ${bar.value}`}>
            <span className="text-xs text-gray-500">{formatNumber(bar.value)}</span>
            <div
              style={{
                width: barWidth,
                height: barHeight,
                backgroundColor: color,
                borderRadius: 3,
                minWidth: 8,
              }}
            />
            <span
              className="text-xs text-gray-400 truncate"
              style={{ maxWidth: barWidth + 8, writingMode: bars.length > 10 ? "vertical-rl" : undefined }}
            >
              {bar.label.length > 6 ? bar.label.slice(0, 5) + "…" : bar.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Period Selector ──────────────────────────────────────────────

function PeriodSelector({ value, onChange }: { value: number; onChange: (d: number) => void }) {
  const periods = [
    { days: 7, label: "7 days" },
    { days: 14, label: "14 days" },
    { days: 30, label: "30 days" },
    { days: 90, label: "90 days" },
  ];

  return (
    <div className="flex gap-2">
      {periods.map((p) => (
        <button
          key={p.days}
          onClick={() => onChange(p.days)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            value === p.days
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(30);

  const fetchData = useCallback(async (days: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
        <h3 className="font-semibold mb-2">Error loading analytics</h3>
        <p>{error}</p>
        <button
          onClick={() => fetchData(period)}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { summary, trends, popularYachts, popularSearches, comparisons, pageBreakdown, topReferrers, eventCounts } = data;

  return (
    <div className="space-y-8">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <PeriodSelector value={period} onChange={setPeriod} />
        <button
          onClick={() => fetchData(period)}
          className="px-4 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard
          title="Page Views"
          value={summary.totalPageViews}
          sparkline={trends.pageViews}
          color="#3b82f6"
        />
        <SummaryCard
          title="Unique Sessions"
          value={summary.uniqueSessions}
          color="#8b5cf6"
        />
        <SummaryCard
          title="Yacht Views"
          value={summary.totalYachtViews}
          sparkline={trends.yachtViews}
          color="#10b981"
        />
        <SummaryCard
          title="Searches"
          value={summary.totalSearches}
          sparkline={trends.searches}
          color="#f59e0b"
        />
        <SummaryCard
          title="Comparisons"
          value={summary.totalComparisons}
          sparkline={trends.comparisons}
          color="#ef4444"
        />
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Trends</h2>
        {trends.pageViews.length > 0 ? (
          <div className="space-y-4">
            <TrendMultiChart trends={trends} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400">
            No trend data yet — tracking starts when users visit the site
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Yachts */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Popular Yachts</h2>
          {popularYachts.length > 0 ? (
            <div className="space-y-3">
              {popularYachts.map((yacht, i) => (
                <div key={yacht.yachtModelId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i < 3 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {i + 1}
                    </span>
                    <div>
                      <a
                        href={`/yachts/${yacht.modelName.toLowerCase().replace(/\s+/g, "-")}`}
                        className="text-sm font-medium text-gray-800 hover:text-blue-600"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {yacht.modelName}
                      </a>
                      <p className="text-xs text-gray-400">{yacht.manufacturerName}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    {formatNumber(yacht.viewCount)} views
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No yacht views recorded yet</p>
          )}
        </div>

        {/* Popular Searches */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Popular Searches</h2>
          {popularSearches.length > 0 ? (
            <div className="space-y-3">
              {popularSearches.map((search, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <span className="text-sm font-medium text-gray-800">&ldquo;{search.query}&rdquo;</span>
                      {search.resultCount !== null && (
                        <p className="text-xs text-gray-400">
                          {search.resultCount} results
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    {formatNumber(search.count)}×
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No searches recorded yet</p>
          )}
        </div>

        {/* Comparison Patterns */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Comparisons</h2>
          {comparisons.length > 0 ? (
            <div className="space-y-3">
              {comparisons.map((comp, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700">
                      {comp.yachtNames.length > 0
                        ? comp.yachtNames.join(" vs ")
                        : `${comp.yachtIds.length} yachts`}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    {comp.count}×
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No comparisons recorded yet</p>
          )}
        </div>

        {/* Page Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Page Views Breakdown</h2>
          {pageBreakdown.length > 0 ? (
            <div className="space-y-2">
              {pageBreakdown.slice(0, 12).map((page, i) => {
                const maxViews = pageBreakdown[0]?.views || 1;
                const pct = (page.views / maxViews) * 100;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-36 truncate" title={page.page}>
                      {truncateUrl(page.page, 24)}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 relative overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 font-medium w-12 text-right">
                      {formatNumber(page.views)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No page views recorded yet</p>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Counts */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Event Distribution</h2>
          {eventCounts.length > 0 ? (
            <div className="space-y-2">
              {eventCounts.map((ec, i) => {
                const maxCount = eventCounts[0]?.count || 1;
                const pct = (ec.count / maxCount) * 100;
                const colors: Record<string, string> = {
                  page_view: "bg-blue-500",
                  yacht_view: "bg-green-500",
                  search: "bg-amber-500",
                  compare: "bg-red-500",
                  manufacturer_view: "bg-purple-500",
                  guide_view: "bg-teal-500",
                  cta_click: "bg-orange-500",
                  share: "bg-pink-500",
                  filter_use: "bg-indigo-500",
                  rating: "bg-yellow-500",
                };
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-32">
                      {ec.eventType.replace(/_/g, " ")}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 relative overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors[ec.eventType] || "bg-gray-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 font-medium w-12 text-right">
                      {formatNumber(ec.count)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No events recorded yet</p>
          )}
        </div>

        {/* Top Referrers */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Referrers</h2>
          {topReferrers.length > 0 ? (
            <div className="space-y-3">
              {topReferrers.map((ref, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 truncate max-w-[70%]" title={ref.referrer}>
                    {extractDomain(ref.referrer)}
                  </span>
                  <span className="text-sm font-semibold text-gray-600">
                    {formatNumber(ref.count)} visits
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No referrer data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────

function SummaryCard({
  title,
  value,
  sparkline,
  color,
}: {
  title: string;
  value: number;
  sparkline?: TrendDataPoint[];
  color: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{formatNumber(value)}</p>
      {sparkline && sparkline.length > 1 && (
        <div className="mt-2">
          <MiniSparkline data={sparkline} color={color} />
        </div>
      )}
    </div>
  );
}

function TrendMultiChart({
  trends,
}: {
  trends: AnalyticsData["trends"];
}) {
  // Merge all dates and create a unified chart
  const allDates = new Set<string>();
  for (const key of ["pageViews", "searches", "comparisons", "yachtViews"] as const) {
    trends[key].forEach((d) => allDates.add(d.date));
  }

  const sortedDates = [...allDates].sort();
  if (sortedDates.length === 0) return null;

  const maxVal = Math.max(
    ...trends.pageViews.map((d) => d.count),
    ...trends.searches.map((d) => d.count),
    ...trends.comparisons.map((d) => d.count),
    ...trends.yachtViews.map((d) => d.count),
    1,
  );

  const height = 200;
  const width = 700;
  const padX = 50;
  const padY = 20;
  const chartW = width - padX;
  const chartH = height - padY * 2;

  function toPoints(data: TrendDataPoint[]): string {
    return sortedDates
      .map((date, i) => {
        const point = data.find((d) => d.date === date);
        const count = point?.count || 0;
        const x = padX + (i / Math.max(sortedDates.length - 1, 1)) * chartW;
        const y = padY + chartH - (count / maxVal) * chartH;
        return `${x},${y}`;
      })
      .join(" ");
  }

  const legend = [
    { label: "Page Views", color: "#3b82f6", key: "pageViews" as const },
    { label: "Yacht Views", color: "#10b981", key: "yachtViews" as const },
    { label: "Searches", color: "#f59e0b", key: "searches" as const },
    { label: "Comparisons", color: "#ef4444", key: "comparisons" as const },
  ];

  return (
    <div>
      {/* Legend */}
      <div className="flex gap-4 mb-3">
        {legend.map((item) => (
          <div key={item.key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>

      {/* SVG Chart */}
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = padY + chartH * (1 - pct);
          const val = Math.round(maxVal * pct);
          return (
            <g key={pct}>
              <line x1={padX} y1={y} x2={width} y2={y} stroke="#f3f4f6" strokeWidth={1} />
              <text x={padX - 5} y={y + 4} textAnchor="end" className="text-xs fill-gray-400">
                {formatNumber(val)}
              </text>
            </g>
          );
        })}

        {/* Lines */}
        {legend.map((item) => (
          <polyline
            key={item.key}
            points={toPoints(trends[item.key])}
            fill="none"
            stroke={item.color}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}

        {/* X-axis labels (every Nth date) */}
        {sortedDates
          .filter((_, i) => i % Math.max(1, Math.floor(sortedDates.length / 8)) === 0)
          .map((date, i, arr) => {
            const idx = sortedDates.indexOf(date);
            const x = padX + (idx / Math.max(sortedDates.length - 1, 1)) * chartW;
            return (
              <text key={date} x={x} y={height - 2} textAnchor="middle" className="text-xs fill-gray-400">
                {date.slice(5)}
              </text>
            );
          })}
      </svg>
    </div>
  );
}
