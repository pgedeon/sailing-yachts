"use client";

import { useEffect, useState, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────────────

type SizeSegment = "under-30ft" | "30-35ft" | "35-40ft" | "40-45ft" | "45-50ft" | "over-50ft";
type PriceTier = "budget" | "mid-range" | "premium" | "luxury" | "unknown";

interface ManufacturerPosition {
  manufacturerId: number;
  manufacturerName: string;
  country: string | null;
  logoUrl: string | null;
  fleetSize: number;
  avgLength: number;
  minLength: number;
  maxLength: number;
  sizeSegments: Record<SizeSegment, number>;
  priceTier: PriceTier;
  avgPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  avgCompleteness: number;
  featureDensity: number;
  positioningScore: number;
  breadthScore: number;
  depthScore: number;
}

interface SegmentCoverage {
  segment: SizeSegment;
  label: string;
  rangeLabel: string;
  manufacturerCount: number;
  yachtCount: number;
  manufacturers: { name: string; count: number }[];
}

interface PricePositioning {
  tier: PriceTier;
  label: string;
  rangeLabel: string;
  manufacturerCount: number;
  avgFleetSize: number;
}

interface PositioningQuadrant {
  manufacturerId: number;
  manufacturerName: string;
  breadthScore: number;
  depthScore: number;
  quadrant: "specialist" | "generalist" | "niche" | "dominant";
}

interface CompetitiveMatrix {
  manufacturers: ManufacturerPosition[];
  segmentCoverage: SegmentCoverage[];
  pricePositioning: PricePositioning[];
  quadrants: PositioningQuadrant[];
  totalManufacturers: number;
  totalYachts: number;
  mostDiverse: string | null;
  largestFleet: string | null;
  premiumLeader: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatPrice(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
  return `€${n.toLocaleString()}`;
}

const TIER_COLORS: Record<PriceTier, string> = {
  budget: "#22c55e",
  "mid-range": "#3b82f6",
  premium: "#f59e0b",
  luxury: "#ef4444",
  unknown: "#9ca3af",
};

const SEGMENT_COLORS: Record<SizeSegment, string> = {
  "under-30ft": "#6ee7b7",
  "30-35ft": "#3b82f6",
  "35-40ft": "#8b5cf6",
  "40-45ft": "#f59e0b",
  "45-50ft": "#ef4444",
  "over-50ft": "#ec4899",
};

const QUADRANT_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  dominant: { bg: "bg-green-100", text: "text-green-800", icon: "👑" },
  generalist: { bg: "bg-blue-100", text: "text-blue-800", icon: "🌐" },
  specialist: { bg: "bg-purple-100", text: "text-purple-800", icon: "🎯" },
  niche: { bg: "bg-gray-100", text: "text-gray-800", icon: "🔬" },
};

// ─── Segment Coverage Heatmap ──────────────────────────────────────

function SegmentHeatmap({ manufacturers }: { manufacturers: ManufacturerPosition[] }) {
  const segments: SizeSegment[] = ["under-30ft", "30-35ft", "35-40ft", "40-45ft", "45-50ft", "over-50ft"];
  const segmentLabels: Record<SizeSegment, string> = {
    "under-30ft": "<30ft", "30-35ft": "30-35", "35-40ft": "35-40",
    "40-45ft": "40-45", "45-50ft": "45-50", "over-50ft": "50+",
  };

  const maxCount = Math.max(
    ...manufacturers.flatMap((m) => segments.map((s) => m.sizeSegments[s])),
    1
  );

  function getOpacity(count: number): number {
    if (count === 0) return 0.05;
    return 0.2 + (count / maxCount) * 0.8;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-2 px-2 text-gray-500 font-medium sticky left-0 bg-white min-w-[140px]">
              Manufacturer
            </th>
            {segments.map((s) => (
              <th key={s} className="text-center py-2 px-1 text-gray-500 font-medium whitespace-nowrap">
                {segmentLabels[s]}
              </th>
            ))}
            <th className="text-center py-2 px-2 text-gray-500 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {manufacturers.map((m) => (
            <tr key={m.manufacturerId} className="border-b border-gray-50 hover:bg-gray-50/50">
              <td className="py-1.5 px-2 font-medium text-gray-800 sticky left-0 bg-white">
                {m.manufacturerName}
              </td>
              {segments.map((s) => {
                const count = m.sizeSegments[s];
                return (
                  <td key={s} className="text-center py-1.5 px-1">
                    <div
                      className="mx-auto rounded text-xs font-medium flex items-center justify-center h-8 min-w-[32px]"
                      style={{
                        backgroundColor: `rgba(59, 130, 246, ${getOpacity(count)})`,
                        color: count > 0 ? "white" : "#d1d5db",
                      }}
                    >
                      {count > 0 ? count : "·"}
                    </div>
                  </td>
                );
              })}
              <td className="text-center py-1.5 px-2 font-semibold text-gray-700">
                {m.fleetSize}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Positioning Scatter Plot ──────────────────────────────────────

function PositioningScatter({ quadrants }: { quadrants: PositioningQuadrant[] }) {
  if (quadrants.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No positioning data available
      </div>
    );
  }

  const width = 600;
  const height = 400;
  const padX = 50;
  const padY = 40;
  const chartW = width - padX - 20;
  const chartH = height - padY * 2;

  const QUADRANT_COLORS: Record<string, string> = {
    dominant: "#22c55e",
    generalist: "#3b82f6",
    specialist: "#8b5cf6",
    niche: "#9ca3af",
  };

  return (
    <div>
      <div className="flex gap-4 mb-3">
        {Object.entries(QUADRANT_STYLES).map(([key, style]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: QUADRANT_COLORS[key] }} />
            <span className="text-xs text-gray-500 capitalize">{key}</span>
          </div>
        ))}
      </div>

      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Quadrant backgrounds */}
        <rect x={padX} y={padY} width={chartW / 2} height={chartH / 2} fill="#f0fdf4" opacity={0.5} />
        <rect x={padX + chartW / 2} y={padY} width={chartW / 2} height={chartH / 2} fill="#eff6ff" opacity={0.5} />
        <rect x={padX} y={padY + chartH / 2} width={chartW / 2} height={chartH / 2} fill="#f3f4f6" opacity={0.5} />
        <rect x={padX + chartW / 2} y={padY + chartH / 2} width={chartW / 2} height={chartH / 2} fill="#faf5ff" opacity={0.5} />

        {/* Quadrant labels */}
        <text x={padX + chartW * 0.25} y={padY + 16} textAnchor="middle" className="text-xs fill-green-400 font-medium">
          Niche
        </text>
        <text x={padX + chartW * 0.75} y={padY + 16} textAnchor="middle" className="text-xs fill-blue-400 font-medium">
          Generalist
        </text>
        <text x={padX + chartW * 0.25} y={padY + chartH - 4} textAnchor="middle" className="text-xs fill-purple-400 font-medium">
          Specialist
        </text>
        <text x={padX + chartW * 0.75} y={padY + chartH - 4} textAnchor="middle" className="text-xs fill-green-500 font-medium">
          Dominant
        </text>

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((v) => {
          const x = padX + (v / 100) * chartW;
          const y = padY + chartH - (v / 100) * chartH;
          return (
            <g key={v}>
              <line x1={x} y1={padY} x2={x} y2={padY + chartH} stroke="#e5e7eb" strokeWidth={0.5} />
              <line x1={padX} y1={y} x2={padX + chartW} y2={y} stroke="#e5e7eb" strokeWidth={0.5} />
              <text x={padX - 5} y={y + 4} textAnchor="end" className="text-xs fill-gray-400">{v}</text>
              <text x={x} y={height - 5} textAnchor="middle" className="text-xs fill-gray-400">{v}</text>
            </g>
          );
        })}

        {/* Center lines */}
        <line x1={padX + chartW / 2} y1={padY} x2={padX + chartW / 2} y2={padY + chartH} stroke="#9ca3af" strokeWidth={1} strokeDasharray="4,4" />
        <line x1={padX} y1={padY + chartH / 2} x2={padX + chartW} y2={padY + chartH / 2} stroke="#9ca3af" strokeWidth={1} strokeDasharray="4,4" />

        {/* Data points */}
        {quadrants.map((q) => {
          const x = padX + (q.breadthScore / 100) * chartW;
          const y = padY + chartH - (q.depthScore / 100) * chartH;
          const color = QUADRANT_COLORS[q.quadrant] || "#6b7280";
          return (
            <g key={q.manufacturerId}>
              <circle cx={x} cy={y} r={6} fill={color} opacity={0.8} />
              <text x={x + 8} y={y + 4} className="text-xs fill-gray-700">{q.manufacturerName}</text>
            </g>
          );
        })}

        {/* Axis labels */}
        <text x={padX + chartW / 2} y={height + 5} textAnchor="middle" className="text-xs fill-gray-500 font-medium">
          Breadth Score (segment coverage) →
        </text>
        <text x={8} y={padY + chartH / 2} textAnchor="middle" className="text-xs fill-gray-500 font-medium"
          transform={`rotate(-90, 8, ${padY + chartH / 2})`}>
          Depth Score (models per segment) →
        </text>
      </svg>
    </div>
  );
}

// ─── Price Tier Distribution ──────────────────────────────────────

function PriceTierChart({ data }: { data: PricePositioning[] }) {
  const total = data.reduce((sum, d) => sum + d.manufacturerCount, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400">
        No price data available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((tier) => {
        const pct = total > 0 ? (tier.manufacturerCount / total) * 100 : 0;
        return (
          <div key={tier.tier} className="flex items-center gap-3">
            <div className="w-24 text-sm font-medium text-gray-700">{tier.label}</div>
            <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full flex items-center px-3 text-white text-xs font-medium transition-all duration-500"
                style={{
                  width: `${Math.max(pct, 2)}%`,
                  backgroundColor: TIER_COLORS[tier.tier],
                }}
              >
                {pct >= 8 ? `${tier.manufacturerCount} manufacturers` : ""}
              </div>
            </div>
            <div className="w-20 text-right text-xs text-gray-500">
              {tier.rangeLabel}
            </div>
            <div className="w-16 text-right text-xs text-gray-400">
              {pct.toFixed(0)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Segment Coverage Bars ──────────────────────────────────────

function SegmentCoverageBars({ data }: { data: SegmentCoverage[] }) {
  const maxYachts = Math.max(...data.map((d) => d.yachtCount), 1);

  return (
    <div className="space-y-3">
      {data.map((seg) => {
        const pct = (seg.yachtCount / maxYachts) * 100;
        return (
          <div key={seg.segment} className="flex items-center gap-3">
            <div className="w-24 text-sm font-medium text-gray-700">{seg.label}</div>
            <div className="flex-1">
              <div className="h-7 bg-gray-100 rounded overflow-hidden">
                <div
                  className="h-full rounded flex items-center px-3 text-white text-xs font-medium transition-all duration-500"
                  style={{
                    width: `${Math.max(pct, 3)}%`,
                    backgroundColor: SEGMENT_COLORS[seg.segment],
                  }}
                >
                  {seg.yachtCount} yachts ({seg.manufacturerCount} mfrs)
                </div>
              </div>
            </div>
            <div className="w-16 text-right text-xs text-gray-500">{seg.rangeLabel}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Manufacturer Table ──────────────────────────────────────────

function ManufacturerTable({ manufacturers }: { manufacturers: ManufacturerPosition[] }) {
  const [sortKey, setSortKey] = useState<keyof ManufacturerPosition>("fleetSize");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = [...manufacturers].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }
    return sortAsc
      ? String(aVal ?? "").localeCompare(String(bVal ?? ""))
      : String(bVal ?? "").localeCompare(String(aVal ?? ""));
  });

  const handleSort = (key: keyof ManufacturerPosition) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ col }: { col: keyof ManufacturerPosition }) => (
    <span className={`ml-1 text-xs ${sortKey === col ? "text-blue-600" : "text-gray-300"}`}>
      {sortKey === col ? (sortAsc ? "↑" : "↓") : "↕"}
    </span>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-2 text-gray-500 font-medium cursor-pointer" onClick={() => handleSort("manufacturerName")}>
              Manufacturer <SortIcon col="manufacturerName" />
            </th>
            <th className="text-right py-2 px-2 text-gray-500 font-medium cursor-pointer" onClick={() => handleSort("fleetSize")}>
              Fleet <SortIcon col="fleetSize" />
            </th>
            <th className="text-right py-2 px-2 text-gray-500 font-medium cursor-pointer" onClick={() => handleSort("avgLength")}>
              Avg Length <SortIcon col="avgLength" />
            </th>
            <th className="text-center py-2 px-2 text-gray-500 font-medium cursor-pointer" onClick={() => handleSort("priceTier")}>
              Price Tier <SortIcon col="priceTier" />
            </th>
            <th className="text-right py-2 px-2 text-gray-500 font-medium cursor-pointer" onClick={() => handleSort("avgPrice")}>
              Avg Price <SortIcon col="avgPrice" />
            </th>
            <th className="text-right py-2 px-2 text-gray-500 font-medium cursor-pointer" onClick={() => handleSort("breadthScore")}>
              Breadth <SortIcon col="breadthScore" />
            </th>
            <th className="text-right py-2 px-2 text-gray-500 font-medium cursor-pointer" onClick={() => handleSort("depthScore")}>
              Depth <SortIcon col="depthScore" />
            </th>
            <th className="text-right py-2 px-2 text-gray-500 font-medium cursor-pointer" onClick={() => handleSort("featureDensity")}>
              Features <SortIcon col="featureDensity" />
            </th>
            <th className="text-right py-2 px-2 text-gray-500 font-medium cursor-pointer" onClick={() => handleSort("positioningScore")}>
              Score <SortIcon col="positioningScore" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((m) => (
            <tr key={m.manufacturerId} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-2 px-2 font-medium text-gray-800">{m.manufacturerName}</td>
              <td className="text-right py-2 px-2 text-gray-700">{m.fleetSize}</td>
              <td className="text-right py-2 px-2 text-gray-600">{m.avgLength}&apos;</td>
              <td className="text-center py-2 px-2">
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: TIER_COLORS[m.priceTier] }}
                >
                  {m.priceTier}
                </span>
              </td>
              <td className="text-right py-2 px-2 text-gray-600">{formatPrice(m.avgPrice)}</td>
              <td className="text-right py-2 px-2">
                <span className={`font-medium ${m.breadthScore >= 60 ? "text-green-600" : m.breadthScore >= 30 ? "text-amber-600" : "text-gray-500"}`}>
                  {m.breadthScore}
                </span>
              </td>
              <td className="text-right py-2 px-2">
                <span className={`font-medium ${m.depthScore >= 60 ? "text-green-600" : m.depthScore >= 30 ? "text-amber-600" : "text-gray-500"}`}>
                  {m.depthScore}
                </span>
              </td>
              <td className="text-right py-2 px-2 text-gray-600">{m.featureDensity}/16</td>
              <td className="text-right py-2 px-2">
                <span className="font-bold text-blue-600">{m.positioningScore}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────

export default function CompetitivePositioningClient() {
  const [data, setData] = useState<CompetitiveMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/competitive-positioning");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load competitive data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        <h3 className="font-semibold mb-2">Error loading competitive data</h3>
        <p>{error}</p>
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

  const { manufacturers, segmentCoverage, pricePositioning, quadrants } = data;

  // Quadrant summary
  const quadrantCounts = quadrants.reduce<Record<string, number>>((acc, q) => {
    acc[q.quadrant] = (acc[q.quadrant] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Refresh */}
      <div className="flex justify-end">
        <button
          onClick={fetchData}
          className="px-4 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Manufacturers</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{data.totalManufacturers}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Yachts</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{formatNumber(data.totalYachts)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Largest Fleet</p>
          <p className="text-sm font-bold text-green-600 mt-1">{data.largestFleet || "—"}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Most Diverse</p>
          <p className="text-sm font-bold text-purple-600 mt-1">{data.mostDiverse || "—"}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Premium Leader</p>
          <p className="text-sm font-bold text-amber-600 mt-1">{data.premiumLeader || "—"}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Quadrants</p>
          <div className="flex gap-2 mt-1 flex-wrap">
            {Object.entries(quadrantCounts).map(([q, count]) => (
              <span key={q} className={`px-1.5 py-0.5 rounded text-xs font-medium ${QUADRANT_STYLES[q]?.bg} ${QUADRANT_STYLES[q]?.text}`}>
                {QUADRANT_STYLES[q]?.icon} {count}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Two-column: Scatter + Price */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Positioning Scatter */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 Positioning Matrix</h2>
          <p className="text-xs text-gray-500 mb-4">Breadth (segment coverage) vs Depth (models per segment)</p>
          <PositioningScatter quadrants={quadrants} />
        </div>

        {/* Price Positioning */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">💰 Price Positioning</h2>
          <p className="text-xs text-gray-500 mb-4">Manufacturer distribution across price tiers</p>
          <PriceTierChart data={pricePositioning} />
        </div>
      </div>

      {/* Segment Coverage */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📏 Size Segment Coverage</h2>
        <p className="text-xs text-gray-500 mb-4">Yacht distribution across size categories</p>
        <SegmentCoverageBars data={segmentCoverage} />
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🗺️ Manufacturer × Segment Heatmap</h2>
        <p className="text-xs text-gray-500 mb-4">Number of models per manufacturer per size segment</p>
        <SegmentHeatmap manufacturers={manufacturers} />
      </div>

      {/* Full Manufacturer Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🏢 Manufacturer Rankings</h2>
        <p className="text-xs text-gray-500 mb-4">Click column headers to sort</p>
        <ManufacturerTable manufacturers={manufacturers} />
      </div>

      {/* Methodology */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-3">📐 Scoring Methodology</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-blue-700">Breadth Score (0–100)</p>
            <p className="text-blue-600/70 text-xs">Percentage of size segments with at least 1 model. 6 segments total.</p>
          </div>
          <div>
            <p className="font-medium text-blue-700">Depth Score (0–100)</p>
            <p className="text-blue-600/70 text-xs">Average models per covered segment, normalized (5+ models = 100).</p>
          </div>
          <div>
            <p className="font-medium text-blue-700">Positioning Score (0–100)</p>
            <p className="text-blue-600/70 text-xs">Weighted: 30% breadth + 30% depth + 20% fleet size + 10% completeness + 10% features.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {Object.entries(QUADRANT_STYLES).map(([key, style]) => (
            <div key={key} className={`px-3 py-2 rounded ${style.bg}`}>
              <span className="text-lg">{style.icon}</span>
              <span className={`font-medium ml-1 ${style.text} capitalize`}>{key}</span>
              <p className="text-xs text-gray-600 mt-0.5">
                {key === "dominant" && "High breadth + high depth"}
                {key === "generalist" && "High breadth + low depth"}
                {key === "specialist" && "Low breadth + high depth"}
                {key === "niche" && "Low breadth + low depth"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
