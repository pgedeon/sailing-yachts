"use client";

import { useState, useEffect, useCallback } from "react";

interface VariantStats {
  variantId: string;
  variantName: string;
  impressions: number;
  conversions: number;
  clicks: number;
  conversionRate: number;
  clickRate: number;
  standardError: number;
  confidenceInterval95: [number, number];
}

interface SignificanceResult {
  isSignificant: boolean;
  pValue: number;
  confidenceLevel: number;
  winner: string | null;
  improvementPercent: number | null;
  recommendation: string;
}

interface ExperimentResult {
  experimentId: string;
  experimentName: string;
  description: string;
  isActive: boolean;
  startDate: string;
  totalImpressions: number;
  totalConversions: number;
  totalClicks: number;
  overallConversionRate: number;
  variants: VariantStats[];
  significance: SignificanceResult | null;
  daysRunning: number;
}

interface DashboardData {
  experiments: ExperimentResult[];
  totalEvents: number;
  activeExperiments: number;
}

type Period = "7d" | "30d" | "90d" | "all";

function formatPercent(v: number): string {
  return `${(v * 100).toFixed(2)}%`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Bar Chart Component ───
function BarChart({
  values,
  labels,
  colors,
  maxVal,
}: {
  values: number[];
  labels: string[];
  colors: string[];
  maxVal?: number;
}) {
  const max = maxVal ?? Math.max(...values, 1);
  return (
    <div className="space-y-2">
      {values.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-gray-600 w-28 truncate" title={labels[i]}>
            {labels[i]}
          </span>
          <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(1, (v / max) * 100)}%`,
                backgroundColor: colors[i % colors.length],
              }}
            />
            <span className="absolute right-2 top-0.5 text-xs font-medium text-gray-700">
              {v.toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Confidence Interval Visualization ───
function ConfidenceBar({ stat }: { stat: VariantStats }) {
  const [lo, hi] = stat.confidenceInterval95;
  const mid = stat.conversionRate;
  const range = Math.max(hi - lo, 0.001);
  const leftPct = (lo / Math.max(hi, 0.001)) * 100;
  const widthPct = (range / Math.max(hi, 0.001)) * 100;

  return (
    <div className="mt-1">
      <div className="relative h-6 bg-gray-100 rounded">
        <div
          className="absolute h-full bg-blue-200 rounded"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        />
        <div
          className="absolute h-full w-0.5 bg-blue-700"
          style={{ left: `${(mid / Math.max(hi, 0.001)) * 100}%`, top: 0, bottom: 0 }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-0.5">
        <span>{formatPercent(lo)}</span>
        <span className="font-medium text-gray-700">{formatPercent(mid)}</span>
        <span>{formatPercent(hi)}</span>
      </div>
    </div>
  );
}

// ─── Significance Badge ───
function SignificanceBadge({ sig }: { sig: SignificanceResult }) {
  if (sig.isSignificant) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        ✓ Significant (p={sig.pValue})
      </span>
    );
  }
  if (sig.pValue < 0.1) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
        ~ Approaching (p={sig.pValue})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
      Not significant (p={sig.pValue})
    </span>
  );
}

// ─── Experiment Card ───
function ExperimentCard({ experiment }: { experiment: ExperimentResult }) {
  const [expanded, setExpanded] = useState(false);
  const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div
        className="p-6 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {experiment.experimentName}
              </h3>
              {experiment.isActive ? (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                  Active
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  Paused
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-3">{experiment.description}</p>
            <div className="flex gap-6 text-sm text-gray-600">
              <span>
                <strong>{experiment.totalImpressions.toLocaleString()}</strong> impressions
              </span>
              <span>
                <strong>{experiment.totalConversions.toLocaleString()}</strong> conversions
              </span>
              <span>
                <strong>{formatPercent(experiment.overallConversionRate)}</strong> conv. rate
              </span>
              <span>
                <strong>{experiment.daysRunning}</strong> days running
              </span>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Significance quick view */}
        {experiment.significance && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <SignificanceBadge sig={experiment.significance} />
            {experiment.significance.winner && (
              <span className="ml-3 text-sm text-green-700 font-medium">
                Winner: {experiment.significance.winner}
                {experiment.significance.improvementPercent !== null && (
                  <span> (+{experiment.significance.improvementPercent}%)</span>
                )}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-6 pb-6 space-y-6 border-t border-gray-100 pt-4">
          {/* Variant Breakdown Table */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Variant Breakdown</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 text-gray-600 font-medium">Variant</th>
                    <th className="text-right py-2 pr-4 text-gray-600 font-medium">Impressions</th>
                    <th className="text-right py-2 pr-4 text-gray-600 font-medium">Conversions</th>
                    <th className="text-right py-2 pr-4 text-gray-600 font-medium">Conv. Rate</th>
                    <th className="text-right py-2 pr-4 text-gray-600 font-medium">Std Error</th>
                    <th className="text-left py-2 text-gray-600 font-medium">95% CI</th>
                  </tr>
                </thead>
                <tbody>
                  {experiment.variants.map((v, i) => (
                    <tr key={v.variantId} className="border-b border-gray-50">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: colors[i % colors.length] }}
                          />
                          <span className="font-medium text-gray-900">{v.variantName}</span>
                          {i === 0 && (
                            <span className="text-xs text-gray-400">(control)</span>
                          )}
                        </div>
                      </td>
                      <td className="text-right py-2 pr-4 text-gray-700">
                        {v.impressions.toLocaleString()}
                      </td>
                      <td className="text-right py-2 pr-4 text-gray-700">
                        {v.conversions.toLocaleString()}
                      </td>
                      <td className="text-right py-2 pr-4 font-medium text-gray-900">
                        {formatPercent(v.conversionRate)}
                      </td>
                      <td className="text-right py-2 pr-4 text-gray-500">
                        ±{formatPercent(v.standardError)}
                      </td>
                      <td className="py-2">
                        <ConfidenceBar stat={v} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Impressions Chart */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Traffic Distribution</h4>
            <BarChart
              values={experiment.variants.map((v) => v.impressions)}
              labels={experiment.variants.map((v) => v.variantName)}
              colors={colors}
            />
          </div>

          {/* Conversion Rate Comparison */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Conversion Rate Comparison</h4>
            <BarChart
              values={experiment.variants.map((v) => Math.round(v.conversionRate * 10000))}
              labels={experiment.variants.map((v) => v.variantName)}
              colors={colors}
            />
            <div className="mt-1 text-xs text-gray-400">Rate × 10000 for readability</div>
          </div>

          {/* Significance Details */}
          {experiment.significance && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Statistical Analysis</h4>
              <p className="text-sm text-gray-600">{experiment.significance.recommendation}</p>
              <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">P-value:</span>{" "}
                  <span className="font-medium">{experiment.significance.pValue}</span>
                </div>
                <div>
                  <span className="text-gray-500">Confidence:</span>{" "}
                  <span className="font-medium">
                    {experiment.significance.confidenceLevel > 0
                      ? `${experiment.significance.confidenceLevel.toFixed(1)}%`
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Winner:</span>{" "}
                  <span className="font-medium">
                    {experiment.significance.winner || "None yet"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-gray-400 flex gap-4">
            <span>ID: {experiment.experimentId}</span>
            <span>Started: {formatDate(experiment.startDate)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Significance Calculator ───
function SignificanceCalculator() {
  const [controlConversions, setControlConversions] = useState("");
  const [controlVisitors, setControlVisitors] = useState("");
  const [variantConversions, setVariantConversions] = useState("");
  const [variantVisitors, setVariantVisitors] = useState("");
  const [result, setResult] = useState<{
    pValue: number;
    isSignificant: boolean;
    controlRate: number;
    variantRate: number;
    improvement: number;
  } | null>(null);

  const calculate = useCallback(() => {
    const cc = parseInt(controlConversions) || 0;
    const cv = parseInt(controlVisitors) || 0;
    const vc = parseInt(variantConversions) || 0;
    const vv = parseInt(variantVisitors) || 0;

    if (cv === 0 || vv === 0) return;

    const p1 = cc / cv;
    const p2 = vc / vv;
    const pPooled = (cc + vc) / (cv + vv);
    const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / cv + 1 / vv));

    if (se === 0) return;

    const z = (p2 - p1) / se;

    // Normal CDF approximation
    const normalCDF = (x: number) => {
      const t = 1 / (1 + 0.2316419 * Math.abs(x));
      const d = 0.3989422804014327;
      const p =
        d * Math.exp((-x * x) / 2) * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.8212560 + t * 1.3302744))));
      return x >= 0 ? 1 - p : p;
    };

    const pValue = Math.round(2 * (1 - normalCDF(Math.abs(z))) * 10000) / 10000;
    const improvement = p1 > 0 ? Math.round(((p2 - p1) / p1) * 100) : 0;

    setResult({
      pValue,
      isSignificant: pValue < 0.05,
      controlRate: p1,
      variantRate: p2,
      improvement,
    });
  }, [controlConversions, controlVisitors, variantConversions, variantVisitors]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Statistical Significance Calculator
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Calculate if your test results are statistically significant using a two-proportion Z-test.
      </p>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Control</h3>
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Conversions"
              value={controlConversions}
              onChange={(e) => setControlConversions(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="number"
              placeholder="Visitors (impressions)"
              value={controlVisitors}
              onChange={(e) => setControlVisitors(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Variant</h3>
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Conversions"
              value={variantConversions}
              onChange={(e) => setVariantConversions(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="number"
              placeholder="Visitors (impressions)"
              value={variantVisitors}
              onChange={(e) => setVariantVisitors(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <button
        onClick={calculate}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium"
      >
        Calculate Significance
      </button>

      {result && (
        <div className="mt-4 p-4 rounded-lg bg-gray-50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Control rate:</span>{" "}
              <span className="font-medium">{formatPercent(result.controlRate)}</span>
            </div>
            <div>
              <span className="text-gray-500">Variant rate:</span>{" "}
              <span className="font-medium">{formatPercent(result.variantRate)}</span>
            </div>
            <div>
              <span className="text-gray-500">P-value:</span>{" "}
              <span className="font-medium">{result.pValue}</span>
            </div>
            <div>
              <span className="text-gray-500">Improvement:</span>{" "}
              <span className={`font-medium ${result.improvement >= 0 ? "text-green-600" : "text-red-600"}`}>
                {result.improvement >= 0 ? "+" : ""}
                {result.improvement}%
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            {result.isSignificant ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✓ Statistically significant at 95% confidence
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                Not statistically significant — continue running the test
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard Client ───
export default function AbTestingDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("all");

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/ab-testing?period=${period}`);
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [period]);

  const periods: { value: Period; label: string }[] = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
    { value: "all", label: "All Time" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">A/B Testing Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Manage experiments and track statistical significance
            </p>
          </div>
          <a
            href="/admin"
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition"
          >
            ← Back to Admin
          </a>
        </div>

        {/* Summary Cards */}
        {!loading && !error && data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="text-sm text-gray-500">Total Events</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {data.totalEvents.toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="text-sm text-gray-500">Active Experiments</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {data.activeExperiments}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="text-sm text-gray-500">Total Experiments</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {data.experiments.length}
              </div>
            </div>
          </div>
        )}

        {/* Period Selector */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-gray-500">Period:</span>
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                period === p.value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Error loading dashboard: {error}
          </div>
        )}

        {/* Experiment Cards */}
        {!loading && !error && data && (
          <div className="space-y-4 mb-8">
            {data.experiments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                No experiments found. Define experiments in lib/ab-testing.ts to get started.
              </div>
            ) : (
              data.experiments.map((exp) => (
                <ExperimentCard key={exp.experimentId} experiment={exp} />
              ))
            )}
          </div>
        )}

        {/* Significance Calculator */}
        <SignificanceCalculator />

        {/* How It Works */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">How A/B Testing Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-800 mb-1">1. Variant Assignment</h3>
              <p>
                Users are deterministically assigned to variants using FNV-1a hashing.
                The same user always sees the same variant.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-1">2. Event Tracking</h3>
              <p>
                Impressions, clicks, and conversions are logged via POST /api/ab/event.
                Events are aggregated per variant for analysis.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-1">3. Statistical Analysis</h3>
              <p>
                A two-proportion Z-test compares each variant against control.
                Significance is reached at p &lt; 0.05 (95% confidence).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
