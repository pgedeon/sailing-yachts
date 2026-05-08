"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface YachtSpecData {
  id: number;
  manufacturer: string;
  modelName: string;
  lengthOverall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  ballast: number | null;
  sailAreaMain: number | null;
  engineHp: number | null;
}

interface ComparisonRadarChartProps {
  yachts: YachtSpecData[];
}

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

/** Numeric spec keys used in the radar chart */
const RADAR_SPEC_KEYS: (keyof YachtSpecData)[] = [
  "lengthOverall",
  "beam",
  "draft",
  "displacement",
  "ballast",
  "sailAreaMain",
  "engineHp",
];

interface ChartEntry {
  spec: string;
  [yachtKey: string]: string | number;
}

/**
 * Normalise a value to 0–100 within the min–max range across all yachts.
 * Returns 50 if min === max (all equal).
 */
function normalise(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.round(((value - min) / (max - min)) * 100);
}

/**
 * Build chart data: one entry per spec axis.
 * Each entry has { spec: translatedLabel, yacht_0: normalisedValue, … }.
 *
 * Visibility filtering: only visible yachts are used for min/max calculation,
 * so the scale adapts to the visible subset.
 */
function buildChartData(
  yachts: YachtSpecData[],
  labels: Record<string, string>,
  visibleIndices: Set<number>,
): ChartEntry[] {
  const visibleYachts = yachts.filter((_, i) => visibleIndices.has(i));

  // Compute min/max per spec across visible yachts only
  const ranges: Record<string, { min: number; max: number }> = {};
  for (const key of RADAR_SPEC_KEYS) {
    const values = visibleYachts
      .map((y) => y[key])
      .filter((v): v is number => v !== null && v !== undefined);
    if (values.length === 0) continue;
    ranges[key as string] = {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  return RADAR_SPEC_KEYS.filter((key) => key in ranges).map((key) => {
    const range = ranges[key as string]!;
    const entry: ChartEntry = {
      spec: labels[key as string] || (key as string),
    };
    yachts.forEach((yacht, i) => {
      if (!visibleIndices.has(i)) {
        entry[`yacht_${i}`] = 0;
        return;
      }
      const raw = yacht[key] as number | null | undefined;
      entry[`yacht_${i}`] =
        raw !== null && raw !== undefined
          ? normalise(raw, range.min, range.max)
          : 0;
    });
    return entry;
  });
}

export function ComparisonRadarChart({ yachts }: ComparisonRadarChartProps) {
  const t = useTranslations("Compare");

  // Visibility state: track which yachts are visible (all start visible)
  const [visibleSet, setVisibleSet] = useState<Set<number>>(
    () => new Set(yachts.map((_, i) => i)),
  );

  const toggleYacht = useCallback((index: number) => {
    setVisibleSet((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        // Don't allow hiding all yachts — must have at least 1 visible
        if (next.size <= 1) return prev;
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const labels = useMemo(
    () => ({
      lengthOverall: t("fields.lengthOverall"),
      beam: t("fields.beam"),
      draft: t("fields.draft"),
      displacement: t("fields.displacement"),
      ballast: t("fields.ballast"),
      sailAreaMain: t("fields.sailAreaMain"),
      engineHp: t("fields.engineHp"),
    }),
    [t],
  );

  const chartData = useMemo(
    () => buildChartData(yachts, labels, visibleSet),
    [yachts, labels, visibleSet],
  );

  if (yachts.length < 2 || chartData.length < 3) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {t("radar.title")}
        </h3>
        <span className="text-xs text-gray-500">{t("radar.scaleNote")}</span>
      </div>

      {/* Yacht toggle buttons */}
      <div className="flex flex-wrap gap-2 mb-3">
        {yachts.map((yacht, i) => {
          const isVisible = visibleSet.has(i);
          const color = CHART_COLORS[i % CHART_COLORS.length];
          return (
            <button
              key={yacht.id}
              onClick={() => toggleYacht(i)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                transition-all duration-200 border
                ${
                  isVisible
                    ? "border-transparent text-white shadow-sm"
                    : "border-gray-300 text-gray-500 bg-white hover:bg-gray-50"
                }
              `}
              style={
                isVisible
                  ? { backgroundColor: color, opacity: 1 }
                  : { opacity: 0.7 }
              }
              aria-pressed={isVisible}
              aria-label={`${isVisible ? t("radar.hide") : t("radar.show")} ${yacht.manufacturer} ${yacht.modelName}`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${isVisible ? "bg-white" : ""}`}
                style={!isVisible ? { backgroundColor: color } : undefined}
              />
              {yacht.manufacturer} {yacht.modelName}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <ResponsiveContainer width="100%" height={380}>
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="spec"
              tick={{ fontSize: 12, fill: "#6b7280" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickCount={5}
            />
            {yachts.map((yacht, i) => {
              const isVisible = visibleSet.has(i);
              return (
                <Radar
                  key={yacht.id}
                  name={`${yacht.manufacturer} ${yacht.modelName}`}
                  dataKey={`yacht_${i}`}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  fillOpacity={isVisible ? 0.15 : 0}
                  strokeWidth={isVisible ? 2 : 0}
                  strokeOpacity={isVisible ? 1 : 0}
                />
              );
            })}
            <Legend />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                fontSize: "13px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      {/* Accessible data table (screen readers) */}
      <details className="mt-3">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
          {t("radar.dataTableToggle")}
        </summary>
        <table className="mt-2 w-full text-xs border-collapse border border-gray-200">
          <thead>
            <tr>
              <th className="border border-gray-200 px-2 py-1 bg-gray-50 text-left">
                {t("table.spec")}
              </th>
              {yachts.map((y) => (
                <th
                  key={y.id}
                  className="border border-gray-200 px-2 py-1 bg-gray-50 text-left"
                >
                  {y.manufacturer} {y.modelName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chartData.map((row) => (
              <tr key={String(row.spec)}>
                <td className="border border-gray-200 px-2 py-1 font-medium">
                  {row.spec}
                </td>
                {yachts.map((_, i) => (
                  <td key={i} className="border border-gray-200 px-2 py-1">
                    {visibleSet.has(i) ? row[`yacht_${i}`] : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
