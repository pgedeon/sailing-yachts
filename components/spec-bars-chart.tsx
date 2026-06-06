"use client";

import React, { useMemo, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

interface SpecStats {
  min: number;
  max: number;
  avg: number;
  p25: number;
  p50: number;
  p75: number;
  count: number;
}

interface SizeClassStats {
  sizeClass: { min: number; max: number };
  count: number;
  specs: Record<string, SpecStats>;
}

interface SpecBarEntry {
  name: string;
  rawLabel: string;
  value: number;
  min: number;
  max: number;
  avg: number;
  p25: number;
  p50: number;
  p75: number;
  percentile: number;
  unit: string;
}

/** Color based on percentile within size class */
function getBarColor(percentile: number): string {
  if (percentile < 30) return "#3b82f6"; // below avg — blue
  if (percentile > 70) return "#10b981"; // above avg — green
  return "#6366f1"; // average — indigo
}

function getCategoryLabel(percentile: number, t: (key: string) => string): string {
  if (percentile < 30) return t("specBars.belowAverage");
  if (percentile > 70) return t("specBars.aboveAverage");
  return t("specBars.average");
}

interface SpecBarsChartProps {
  /** Yacht's own numeric spec values */
  yachtSpecs: {
    lengthOverall: number | null;
    beam: number | null;
    draft: number | null;
    displacement: number | null;
    ballast: number | null;
    sailAreaMain: number | null;
    engineHp: number | null;
  };
}

/** Map our spec keys to DB column names */
const SPEC_CONFIG: Array<{
  key: string;
  dbKey: string;
  unit: string;
  decimals?: number;
}> = [
  { key: "lengthOverall", dbKey: "length_overall", unit: "m", decimals: 2 },
  { key: "beam", dbKey: "beam", unit: "m", decimals: 2 },
  { key: "draft", dbKey: "draft", unit: "m", decimals: 2 },
  { key: "displacement", dbKey: "displacement", unit: "kg", decimals: 0 },
  { key: "ballast", dbKey: "ballast", unit: "kg", decimals: 0 },
  { key: "sailAreaMain", dbKey: "sail_area_main", unit: "m²", decimals: 1 },
  { key: "engineHp", dbKey: "engine_hp", unit: "hp", decimals: 0 },
];

export function SpecBarsChart({ yachtSpecs }: SpecBarsChartProps) {
  const t = useTranslations("YachtDetail");
  const [stats, setStats] = useState<SizeClassStats | null>(null);
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine LOA for API call
  const loa = yachtSpecs.lengthOverall;
  const [loaded, setLoaded] = useState(false);

  // Intersection observer for scroll animation
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Fetch size-class stats
  useEffect(() => {
    if (!loa || loaded) return;
    setLoaded(true);

    fetch(`/api/size-class-stats?loa=${loa}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setStats(data);
      })
      .catch(() => {
        // Silently fail — chart is non-critical
      });
  }, [loa, loaded]);

  // Build chart data
  const chartEntries = useMemo<SpecBarEntry[]>(() => {
    if (!stats) return [];

    const entries: SpecBarEntry[] = [];
    for (const cfg of SPEC_CONFIG) {
      const value = yachtSpecs[cfg.key as keyof typeof yachtSpecs] as number | null;
      if (value === null || value === undefined) continue;

      const specStats = stats.specs[cfg.dbKey];
      if (!specStats || specStats.count < 3) continue;

      // Calculate percentile: where this yacht sits in its size class
      const range = specStats.max - specStats.min;
      const percentile = range > 0
        ? Math.round(((value - specStats.min) / range) * 100)
        : 50;

      entries.push({
        name: t(`specBars.specs.${cfg.key}` as any),
        rawLabel: cfg.key,
        value,
        min: specStats.min,
        max: specStats.max,
        avg: specStats.avg,
        p25: specStats.p25,
        p50: specStats.p50,
        p75: specStats.p75,
        percentile,
        unit: cfg.unit,
      });
    }
    return entries;
  }, [stats, yachtSpecs, t]);

  if (!stats || chartEntries.length === 0) return null;

  return (
    <div ref={containerRef} className="spec-bars-section mt-8" data-testid="spec-bars-section">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-bold">{t("specBars.title")}</h2>
        <span className="text-xs text-muted-foreground">
          {t("specBars.sizeClass", {
            min: stats.sizeClass.min.toFixed(1),
            max: stats.sizeClass.max.toFixed(1),
            count: stats.count,
          })}
        </span>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {t("specBars.description", {
            sizeClassRange: `${stats.sizeClass.min.toFixed(1)}–${stats.sizeClass.max.toFixed(1)}m LOA`,
          })}
      </p>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#3b82f6]" />
          <span>{t("specBars.belowAverage")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#6366f1]" />
          <span>{t("specBars.average")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#10b981]" />
          <span>{t("specBars.aboveAverage")}</span>
        </div>
      </div>

      {/* Individual spec bars */}
      <div className="space-y-4">
        {chartEntries.map((entry) => {
          const range = entry.max - entry.min;
          // Normalized value position (0-100)
          const valuePos = range > 0 ? ((entry.value - entry.min) / range) * 100 : 50;
          const avgPos = range > 0 ? ((entry.avg - entry.min) / range) * 100 : 50;

          return (
            <div key={entry.rawLabel} className="spec-bar-item">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{entry.name}</span>
                <span className="text-sm font-semibold">
                  {entry.value.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })} {entry.unit}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({getCategoryLabel(entry.percentile, t)})
                  </span>
                </span>
              </div>
              <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                {/* Background range bar */}
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-2 bg-gray-200 rounded-full relative">
                    {/* P25-P75 range indicator */}
                    <div
                      className="absolute h-full bg-gray-300 rounded-full"
                      style={{
                        left: `${range > 0 ? ((entry.p25 - entry.min) / range) * 100 : 25}%`,
                        right: `${range > 0 ? 100 - ((entry.p75 - entry.min) / range) * 100 : 25}%`,
                      }}
                    />
                    {/* Average line */}
                    <div
                      className="absolute h-full w-0.5 bg-gray-500"
                      style={{ left: `${avgPos}%` }}
                    />
                  </div>
                </div>
                {/* Value marker — animated */}
                <div
                  className={`absolute top-0 h-full w-1.5 rounded-full transition-all duration-1000 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
                  style={{
                    left: visible ? `${Math.max(0, Math.min(valuePos - 1, 98))}%` : '0%',
                    backgroundColor: getBarColor(entry.percentile),
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                <span>{entry.min.toLocaleString()} {entry.unit}</span>
                <span>{t("specBars.avg")}: {entry.avg.toLocaleString()} {entry.unit}</span>
                <span>{entry.max.toLocaleString()} {entry.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Accessible data table */}
      <details className="mt-4">
        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
          {t("specBars.dataTableToggle")}
        </summary>
        <table className="mt-2 w-full text-xs border-collapse border border-border">
          <thead>
            <tr>
              <th className="border border-border px-2 py-1 bg-muted text-left">{t("specBars.table.spec")}</th>
              <th className="border border-border px-2 py-1 bg-muted text-left">{t("specBars.table.yachtValue")}</th>
              <th className="border border-border px-2 py-1 bg-muted text-left">{t("specBars.table.classMin")}</th>
              <th className="border border-border px-2 py-1 bg-muted text-left">{t("specBars.table.classAvg")}</th>
              <th className="border border-border px-2 py-1 bg-muted text-left">{t("specBars.table.classMax")}</th>
              <th className="border border-border px-2 py-1 bg-muted text-left">{t("specBars.table.percentile")}</th>
            </tr>
          </thead>
          <tbody>
            {chartEntries.map((entry) => (
              <tr key={entry.rawLabel}>
                <td className="border border-border px-2 py-1 font-medium">{entry.name}</td>
                <td className="border border-border px-2 py-1">{entry.value.toLocaleString()} {entry.unit}</td>
                <td className="border border-border px-2 py-1">{entry.min.toLocaleString()}</td>
                <td className="border border-border px-2 py-1">{entry.avg.toLocaleString()}</td>
                <td className="border border-border px-2 py-1">{entry.max.toLocaleString()}</td>
                <td className="border border-border px-2 py-1">{entry.percentile}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
