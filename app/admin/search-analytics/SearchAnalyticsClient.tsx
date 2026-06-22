"use client";

import { useEffect, useState, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────────────

interface SearchAnalyticsSummary {
  totalSearches: number;
  uniqueQueries: number;
  zeroResultSearches: number;
  zeroResultRate: number;
  avgResultCount: number;
  topSearchHour: number;
  searchesWithFilters: number;
}

interface TopQuery {
  query: string;
  count: number;
  avgResultCount: number;
  zeroResultCount: number;
  lastSearchedAt: string;
  hasIntentPage: boolean;
  intentPageSlug: string | null;
}

interface ZeroResultQuery {
  query: string;
  count: number;
  lastSearchedAt: string;
  similarQueries: string[];
  suggestedIntentPage: string | null;
}

interface FilterUsageItem {
  filterKey: string;
  filterLabel: string;
  count: number;
  percentage: number;
  topValues: { value: string; count: number }[];
}

interface FilterCombination {
  filters: string[];
  count: number;
  avgResultCount: number;
}

interface DailySearchTrend {
  date: string;
  totalSearches: number;
  uniqueQueries: number;
  zeroResultRate: number;
}

interface ContentGap {
  query: string;
  searchCount: number;
  avgResultCount: number;
  existingIntentSlug: string | null;
  suggestedAction: "create_intent" | "improve_matching" | "monitor";
  priority: "high" | "medium" | "low";
}

interface SearchAnalyticsData {
  summary: SearchAnalyticsSummary;
  topQueries: TopQuery[];
  zeroResultQueries: ZeroResultQuery[];
  filterUsage: FilterUsageItem[];
  filterCombinations: FilterCombination[];
  dailyTrend: DailySearchTrend[];
  contentGaps: ContentGap[];
  period: { days: number };
}

// ─── Helpers ──────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

const PERIOD_OPTIONS = [
  { value: 7, label: "7 Days" },
  { value: 30, label: "30 Days" },
  { value: 90, label: "90 Days" },
  { value: 365, label: "1 Year" },
];

const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

const ACTION_LABELS: Record<string, string> = {
  create_intent: "Create Intent Page",
  improve_matching: "Improve Matching",
  monitor: "Monitor",
};

// ─── Chart Components ────────────────────────────────────────────

function SimpleBarChart({
  data,
  maxValue,
  color = "#3b82f6",
}: {
  data: { label: string; value: number; extra?: string }[];
  maxValue: number;
  color?: string;
}) {
  const maxBarWidth = 100;
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <div
            className="w-32 text-sm text-gray-700 truncate shrink-0"
            title={item.label}
          >
            {item.label}
          </div>
          <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{
                width: `${Math.max((item.value / maxValue) * maxBarWidth, 2)}%`,
                backgroundColor: color,
              }}
            >
              {item.value > 0 && (
                <span className="text-xs text-white font-medium">
                  {formatNumber(item.value)}
                </span>
              )}
            </div>
          </div>
          {item.extra && (
            <span className="text-xs text-gray-500 w-20 text-right">
              {item.extra}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function MiniLineChart({ data, dataKey, color = "#3b82f6" }: { data: DailySearchTrend[]; dataKey: keyof DailySearchTrend; color?: string }) {
  if (data.length === 0) return <div className="text-gray-400 text-sm">No data</div>;

  const values = data.map((d) => Number(d[dataKey]));
  const maxVal = Math.max(...values, 1);
  const width = 600;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 20, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = values
    .map((v, i) => {
      const x = padding.left + (i / Math.max(values.length - 1, 1)) * chartW;
      const y = padding.top + chartH - (v / maxVal) * chartH;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = [
    `${padding.left},${padding.top + chartH}`,
    ...values.map((v, i) => {
      const x = padding.left + (i / Math.max(values.length - 1, 1)) * chartW;
      const y = padding.top + chartH - (v / maxVal) * chartH;
      return `${x},${y}`;
    }),
    `${padding.left + chartW},${padding.top + chartH}`,
  ].join(" ");

  // Show every Nth date label
  const step = Math.max(Math.floor(data.length / 8), 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxWidth: width }}>
      <polygon points={areaPoints} fill={color} opacity={0.1} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Y-axis labels */}
      <text x={padding.left - 5} y={padding.top + 4} textAnchor="end" className="text-[9px] fill-gray-400">
        {formatNumber(maxVal)}
      </text>
      <text x={padding.left - 5} y={padding.top + chartH} textAnchor="end" className="text-[9px] fill-gray-400">
        0
      </text>
      {/* X-axis labels */}
      {data.map(
        (d, i) =>
          i % step === 0 && (
            <text
              key={i}
              x={padding.left + (i / Math.max(data.length - 1, 1)) * chartW}
              y={height - 2}
              textAnchor="middle"
              className="text-[9px] fill-gray-400"
            >
              {formatDate(d.date)}
            </text>
          ),
      )}
    </svg>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────

type TabId = "overview" | "queries" | "zero-results" | "filters" | "gaps";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "queries", label: "Top Queries", icon: "🔍" },
  { id: "zero-results", label: "Zero Results", icon: "🚫" },
  { id: "filters", label: "Filters", icon: "🎛️" },
  { id: "gaps", label: "Content Gaps", icon: "💡" },
];

// ─── Main Component ──────────────────────────────────────────────

export default function SearchAnalyticsClient() {
  const [data, setData] = useState<SearchAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(30);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const fetchData = useCallback(async (days: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/search-analytics?days=${days}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  const handlePeriodChange = (days: number) => {
    setPeriod(days);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4" />
          <p>Loading search analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold">Error Loading Data</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button
          onClick={() => fetchData(period)}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      {/* Period Selector */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-gray-600">Period:</span>
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handlePeriodChange(opt.value)}
            className={`px-3 py-1.5 text-sm rounded-md transition ${
              period === opt.value
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab data={data} />
      )}
      {activeTab === "queries" && (
        <QueriesTab queries={data.topQueries} />
      )}
      {activeTab === "zero-results" && (
        <ZeroResultsTab queries={data.zeroResultQueries} />
      )}
      {activeTab === "filters" && (
        <FiltersTab
          filterUsage={data.filterUsage}
          combinations={data.filterCombinations}
        />
      )}
      {activeTab === "gaps" && (
        <ContentGapsTab gaps={data.contentGaps} />
      )}

      {/* Refresh */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={() => fetchData(period)}
          disabled={loading}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────

function OverviewTab({ data }: { data: SearchAnalyticsData }) {
  const { summary, dailyTrend, topQueries, contentGaps } = data;

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Searches"
          value={formatNumber(summary.totalSearches)}
          icon="🔍"
          color="blue"
        />
        <StatCard
          label="Unique Queries"
          value={formatNumber(summary.uniqueQueries)}
          icon="📝"
          color="green"
        />
        <StatCard
          label="Zero-Result Rate"
          value={`${summary.zeroResultRate}%`}
          icon="🚫"
          color="orange"
        />
        <StatCard
          label="Avg Results"
          value={formatNumber(summary.avgResultCount)}
          icon="📊"
          color="purple"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Peak Search Hour</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {summary.topSearchHour}:00
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Zero-Result Searches</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {formatNumber(summary.zeroResultSearches)}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Searches with Filters</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {formatNumber(summary.searchesWithFilters)}
          </div>
        </div>
      </div>

      {/* Daily Trend Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📈 Daily Search Volume
        </h3>
        <MiniLineChart data={dailyTrend} dataKey="totalSearches" color="#3b82f6" />
      </div>

      {/* Zero-Result Rate Trend */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📉 Zero-Result Rate Over Time
        </h3>
        <MiniLineChart data={dailyTrend} dataKey="zeroResultRate" color="#ef4444" />
      </div>

      {/* Quick: Top 5 Queries */}
      {topQueries.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🔝 Top 5 Search Queries
          </h3>
          <SimpleBarChart
            data={topQueries.slice(0, 5).map((q) => ({
              label: q.query,
              value: q.count,
              extra: `${q.avgResultCount} avg results`,
            }))}
            maxValue={topQueries[0]?.count || 1}
            color="#3b82f6"
          />
        </div>
      )}

      {/* Quick: Content Gaps */}
      {contentGaps.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            💡 Top Content Gaps
          </h3>
          <div className="space-y-3">
            {contentGaps.slice(0, 5).map((gap, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[gap.priority]}`}
                  >
                    {gap.priority}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    &ldquo;{gap.query}&rdquo;
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    {gap.searchCount} searches · {gap.avgResultCount} avg results
                  </div>
                  <div className="text-xs text-blue-600">
                    {ACTION_LABELS[gap.suggestedAction]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Queries Tab ─────────────────────────────────────────────────

function QueriesTab({ queries }: { queries: TopQuery[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? queries : queries.slice(0, 15);

  if (queries.length === 0) {
    return <EmptyState message="No search queries recorded yet." />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Query
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                Count
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                Avg Results
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                Zero Results
              </th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">
                Intent Page
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                Last Searched
              </th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((q, i) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                  {q.query}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {formatNumber(q.count)}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {q.avgResultCount}
                </td>
                <td className="px-4 py-3 text-right">
                  {q.zeroResultCount > 0 ? (
                    <span className="text-red-600 font-medium">
                      {q.zeroResultCount}
                    </span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {q.hasIntentPage ? (
                    <a
                      href={`/search-intent/${q.intentPageSlug}`}
                      className="text-blue-600 hover:underline text-xs"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View ↗
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs">None</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-gray-500 text-xs">
                  {formatDate(q.lastSearchedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {queries.length > 15 && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            {showAll
              ? "Show less"
              : `Show all ${queries.length} queries`}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Zero Results Tab ────────────────────────────────────────────

function ZeroResultsTab({ queries }: { queries: ZeroResultQuery[] }) {
  if (queries.length === 0) {
    return (
      <EmptyState message="No zero-result searches recorded. Great job!" />
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          💡 <strong>Tip:</strong> These searches returned no results. Consider creating search intent pages for popular queries to capture this traffic.
        </p>
      </div>

      <div className="space-y-4">
        {queries.map((q, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">
                  &ldquo;{q.query}&rdquo;
                </h4>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-red-600 font-medium">
                    {q.count} zero-result searches
                  </span>
                  <span className="text-xs text-gray-500">
                    Last: {formatDate(q.lastSearchedAt)}
                  </span>
                </div>
              </div>
              {q.suggestedIntentPage ? (
                <a
                  href={`/search-intent/${q.suggestedIntentPage}`}
                  className="px-3 py-1.5 bg-green-100 text-green-800 text-sm rounded-md hover:bg-green-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Intent Page ↗
                </a>
              ) : (
                <span className="px-3 py-1.5 bg-orange-100 text-orange-800 text-sm rounded-md">
                  No Intent Page
                </span>
              )}
            </div>

            {q.similarQueries.length > 0 && (
              <div className="mt-3">
                <span className="text-xs text-gray-500">Similar queries:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {q.similarQueries.map((sq, j) => (
                    <span
                      key={j}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {sq}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Filters Tab ─────────────────────────────────────────────────

function FiltersTab({
  filterUsage,
  combinations,
}: {
  filterUsage: FilterUsageItem[];
  combinations: FilterCombination[];
}) {
  return (
    <div className="space-y-8">
      {/* Filter Usage */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🎛️ Filter Usage
        </h3>
        {filterUsage.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No filter usage data recorded yet.
          </p>
        ) : (
          <div className="space-y-6">
            {filterUsage.map((f, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-900">
                      {f.filterLabel}
                    </span>
                    <span className="text-gray-500 text-sm ml-2">
                      ({f.count} uses · {f.percentage}%)
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {f.topValues.map((v, j) => (
                    <span
                      key={j}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-800 text-xs rounded-full"
                    >
                      {v.value}
                      <span className="text-blue-500">({v.count})</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Combinations */}
      {combinations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🔗 Popular Filter Combinations
          </h3>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Filters
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    Uses
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    Avg Results
                  </th>
                </tr>
              </thead>
              <tbody>
                {combinations.map((c, i) => (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.filters.map((f, j) => (
                          <span
                            key={j}
                            className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {c.count}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {c.avgResultCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Content Gaps Tab ─────────────────────────────────────────────

function ContentGapsTab({ gaps }: { gaps: ContentGap[] }) {
  if (gaps.length === 0) {
    return (
      <EmptyState message="No content gaps detected. All searches are well-served!" />
    );
  }

  const highGaps = gaps.filter((g) => g.priority === "high");
  const medGaps = gaps.filter((g) => g.priority === "medium");

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">
          💡 <strong>Content gaps</strong> are frequent searches that yield few or no results. Creating intent pages for these queries can significantly improve SEO and user satisfaction.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Gaps</div>
          <div className="text-2xl font-bold text-gray-900">{gaps.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-red-200 p-4">
          <div className="text-sm text-red-600">High Priority</div>
          <div className="text-2xl font-bold text-red-700">
            {highGaps.length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-yellow-200 p-4">
          <div className="text-sm text-yellow-600">Medium Priority</div>
          <div className="text-2xl font-bold text-yellow-700">
            {medGaps.length}
          </div>
        </div>
      </div>

      {/* Gaps Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Priority
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Query
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                Searches
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                Avg Results
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Action
              </th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">
                Intent Page
              </th>
            </tr>
          </thead>
          <tbody>
            {gaps.map((gap, i) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[gap.priority]}`}
                  >
                    {gap.priority}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  &ldquo;{gap.query}&rdquo;
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {gap.searchCount}
                </td>
                <td className="px-4 py-3 text-right">
                  {gap.avgResultCount === 0 ? (
                    <span className="text-red-600 font-medium">0</span>
                  ) : (
                    <span className="text-gray-700">{gap.avgResultCount}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {ACTION_LABELS[gap.suggestedAction]}
                </td>
                <td className="px-4 py-3 text-center">
                  {gap.existingIntentSlug ? (
                    <a
                      href={`/search-intent/${gap.existingIntentSlug}`}
                      className="text-blue-600 hover:underline text-xs"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View ↗
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Shared Components ───────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50",
    green: "border-green-200 bg-green-50",
    orange: "border-orange-200 bg-orange-50",
    purple: "border-purple-200 bg-purple-50",
  };

  return (
    <div className={`rounded-lg border p-4 ${colorMap[color] || "border-gray-200 bg-white"}`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-600 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <div className="text-4xl mb-3">📭</div>
      <p className="text-gray-500">{message}</p>
    </div>
  );
}
