"use client";

import { useEffect, useState, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────────────

interface FunnelStage {
  stage: string;
  label: string;
  sessions: number;
  conversionRate: number;
  dropOff: number;
  dropOffRate: number;
  overallConversionRate: number;
}

interface TimeBetweenStages {
  from: string;
  to: string;
  avgMinutes: number;
  medianMinutes: number;
  sampleSize: number;
}

interface DailyTrend {
  date: string;
  landing: number;
  search: number;
  detail: number;
  compare: number;
  lead: number;
}

interface BiggestDropOff {
  from: string;
  to: string;
  dropOffRate: number;
  dropOffSessions: number;
}

interface FunnelData {
  stages: FunnelStage[];
  totalSessions: number;
  period: { days: number };
  avgTimeBetweenStages: TimeBetweenStages[];
  biggestDropOff: BiggestDropOff;
  dailyTrend: DailyTrend[];
}

// ─── Helpers ──────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatMinutes(m: number): string {
  if (m < 1) return "< 1 min";
  if (m < 60) return `${Math.round(m)} min`;
  const hours = Math.floor(m / 60);
  const mins = Math.round(m % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

const STAGE_COLORS: Record<string, string> = {
  landing: "#3b82f6",
  search: "#f59e0b",
  detail: "#10b981",
  compare: "#8b5cf6",
  lead: "#ef4444",
};

const STAGE_ICONS: Record<string, string> = {
  landing: "🏠",
  search: "🔍",
  detail: "📋",
  compare: "⚖️",
  lead: "🎯",
};

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

// ─── Funnel Visual ──────────────────────────────────────────────

function FunnelVisual({ stages }: { stages: FunnelStage[] }) {
  if (stages.length === 0) return null;

  const maxSessions = stages[0]?.sessions || 1;

  return (
    <div className="space-y-2">
      {stages.map((stage, i) => {
        const widthPct = Math.max((stage.sessions / maxSessions) * 100, 8);
        const color = STAGE_COLORS[stage.stage] || "#6b7280";
        const icon = STAGE_ICONS[stage.stage] || "•";
        const isBiggestDrop = i > 0 && stage.dropOffRate > 0 &&
          stages.slice(1).every((s) => stage.dropOffRate >= s.dropOffRate);

        return (
          <div key={stage.stage} className="relative">
            {/* Stage row */}
            <div className="flex items-center gap-4">
              <div className="w-32 text-right">
                <span className="text-2xl">{icon}</span>
                <p className="text-sm font-semibold text-gray-800">{stage.label}</p>
              </div>

              {/* Funnel bar */}
              <div className="flex-1 relative">
                <div
                  className="relative h-14 rounded-lg flex items-center justify-between px-4 transition-all duration-500"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: color,
                    opacity: 0.9,
                    minWidth: "120px",
                  }}
                >
                  <span className="text-white font-bold text-lg">
                    {formatNumber(stage.sessions)}
                  </span>
                  <span className="text-white/80 text-xs">
                    sessions
                  </span>
                </div>

                {/* Drop-off indicator */}
                {i > 0 && stage.dropOff > 0 && (
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full flex items-center gap-2">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      isBiggestDrop
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {isBiggestDrop && <span title="Biggest drop-off">⚠️ </span>}
                      ↓ {stage.dropOffRate.toFixed(1)}%
                      <span className="text-gray-400 ml-1">({formatNumber(stage.dropOff)})</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Overall conversion */}
              <div className="w-24 text-right">
                <p className="text-xs text-gray-400">from landing</p>
                <p className="text-sm font-semibold" style={{ color }}>
                  {stage.overallConversionRate.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Conversion arrow between stages */}
            {i < stages.length - 1 && (
              <div className="flex items-center gap-4 ml-36 my-1">
                <div className="flex-1 border-t border-dashed border-gray-300" />
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {stage.conversionRate.toFixed(1)}% convert →
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Time Between Stages ──────────────────────────────────────────

function TimeAnalysis({ data }: { data: TimeBetweenStages[] }) {
  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">⏱️ Time Between Stages</h2>
      <p className="text-sm text-gray-500 mb-4">Average time users spend between each funnel stage</p>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={`${item.from}-${item.to}`} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">{item.from}</span>
              <span className="text-gray-400">→</span>
              <span className="text-sm font-medium text-gray-700">{item.to}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">
                  {item.sampleSize > 0 ? formatMinutes(item.avgMinutes) : "—"}
                </p>
                <p className="text-xs text-gray-400">average</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {item.sampleSize > 0 ? formatMinutes(item.medianMinutes) : "—"}
                </p>
                <p className="text-xs text-gray-400">median</p>
              </div>
              <div className="text-right w-16">
                <p className="text-xs text-gray-400">{item.sampleSize} users</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Daily Funnel Trend Chart ──────────────────────────────────────

function FunnelTrendChart({ data }: { data: DailyTrend[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        No trend data yet — tracking starts when users visit the site
      </div>
    );
  }

  const width = 700;
  const height = 220;
  const padX = 50;
  const padY = 20;
  const chartW = width - padX;
  const chartH = height - padY * 2;

  const maxVal = Math.max(...data.flatMap((d) => [d.landing, d.search, d.detail, d.compare, d.lead]), 1);

  const metrics = [
    { key: "landing" as const, label: "Landing", color: "#3b82f6" },
    { key: "search" as const, label: "Search", color: "#f59e0b" },
    { key: "detail" as const, label: "Detail", color: "#10b981" },
    { key: "compare" as const, label: "Compare", color: "#8b5cf6" },
    { key: "lead" as const, label: "Lead", color: "#ef4444" },
  ];

  function toPoints(key: keyof DailyTrend): string {
    return data
      .map((d, i) => {
        const x = padX + (i / Math.max(data.length - 1, 1)) * chartW;
        const y = padY + chartH - ((d[key] as number) / maxVal) * chartH;
        return `${x},${y}`;
      })
      .join(" ");
  }

  return (
    <div>
      <div className="flex gap-4 mb-3">
        {metrics.map((m) => (
          <div key={m.key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
            <span className="text-xs text-gray-500">{m.label}</span>
          </div>
        ))}
      </div>

      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
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

        {metrics.map((m) => (
          <polyline
            key={m.key}
            points={toPoints(m.key)}
            fill="none"
            stroke={m.color}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}

        {data
          .filter((_, i) => i % Math.max(1, Math.floor(data.length / 8)) === 0)
          .map((d) => {
            const idx = data.indexOf(d);
            const x = padX + (idx / Math.max(data.length - 1, 1)) * chartW;
            return (
              <text key={d.date} x={x} y={height - 2} textAnchor="middle" className="text-xs fill-gray-400">
                {d.date.slice(5)}
              </text>
            );
          })}
      </svg>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────

export default function FunnelDashboardClient() {
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(30);

  const fetchData = useCallback(async (days: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/funnel?days=${days}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load funnel data");
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
        <h3 className="font-semibold mb-2">Error loading funnel data</h3>
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

  const { stages, avgTimeBetweenStages, biggestDropOff, dailyTrend, totalSessions } = data;
  const landing = stages.find((s) => s.stage === "landing")?.sessions || 0;
  const lead = stages.find((s) => s.stage === "lead")?.sessions || 0;
  const overallConversion = landing > 0 ? ((lead / landing) * 100).toFixed(2) : "0.00";

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
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Sessions</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{formatNumber(totalSessions)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Leads Generated</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatNumber(lead)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Overall Conv. Rate</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{overallConversion}%</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Biggest Drop-off</p>
          <p className="text-sm font-bold text-amber-600 mt-1 capitalize">
            {biggestDropOff.from} → {biggestDropOff.to}
          </p>
          <p className="text-xs text-gray-400">{biggestDropOff.dropOffRate.toFixed(1)}% ({formatNumber(biggestDropOff.dropOffSessions)} sessions)</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Period</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{data.period.days}d</p>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Conversion Funnel</h2>
        {stages.length > 0 && stages[0].sessions > 0 ? (
          <FunnelVisual stages={stages} />
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400">
            No funnel data yet — tracking starts when users visit the site
          </div>
        )}
      </div>

      {/* Two-column: Time Analysis + Drop-off Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeAnalysis data={avgTimeBetweenStages} />

        {/* Drop-off Detail Table */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 Stage-by-Stage Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500 font-medium">Stage</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Sessions</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Conversion</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Drop-off</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Overall</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((stage) => (
                  <tr key={stage.stage} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 flex items-center gap-2">
                      <span>{STAGE_ICONS[stage.stage]}</span>
                      <span className="font-medium text-gray-800">{stage.label}</span>
                    </td>
                    <td className="text-right py-2 font-semibold text-gray-700">
                      {formatNumber(stage.sessions)}
                    </td>
                    <td className="text-right py-2 text-gray-600">
                      {stage.stage === "landing" ? "—" : `${stage.conversionRate.toFixed(1)}%`}
                    </td>
                    <td className="text-right py-2">
                      {stage.stage === "landing" ? (
                        "—"
                      ) : (
                        <span className={stage.dropOffRate > 50 ? "text-red-600 font-medium" : "text-gray-600"}>
                          {stage.dropOffRate.toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="text-right py-2 text-gray-600">
                      {stage.overallConversionRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Daily Trend Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📈 Daily Funnel Trend</h2>
        <FunnelTrendChart data={dailyTrend} />
      </div>

      {/* How It Works */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-3">💡 How Funnel Tracking Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl mb-1">🏠</div>
            <p className="font-medium text-blue-700">Landing</p>
            <p className="text-blue-600/70 text-xs">Any page entry</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🔍</div>
            <p className="font-medium text-blue-700">Search</p>
            <p className="text-blue-600/70 text-xs">Searched for yachts</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">📋</div>
            <p className="font-medium text-blue-700">Yacht Detail</p>
            <p className="text-blue-600/70 text-xs">Viewed yacht page</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">⚖️</div>
            <p className="font-medium text-blue-700">Compare</p>
            <p className="text-blue-600/70 text-xs">Compared 2+ yachts</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🎯</div>
            <p className="font-medium text-blue-700">Lead</p>
            <p className="text-blue-600/70 text-xs">Contact/inquiry sent</p>
          </div>
        </div>
        <p className="text-xs text-blue-600/60 mt-4">
          Data is derived from existing analytics events. Each stage counts unique sessions that triggered the corresponding event type within the selected period.
        </p>
      </div>
    </div>
  );
}
