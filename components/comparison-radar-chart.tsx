"use client";

import React, { useMemo } from "react";
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
 */
function buildChartData(
  yachts: YachtSpecData[],
  labels: Record<string, string>,
): ChartEntry[] {
  // Compute min/max per spec
  const ranges: Record<string, { min: number; max: number }> = {};
  for (const key of RADAR_SPEC_KEYS) {
    const values = yachts
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

  const chartData = useMemo(() => buildChartData(yachts, labels), [yachts, labels]);

  if (yachts.length < 2 || chartData.length < 3) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {t("radar.title")}
        </h3>
        <span className="text-xs text-gray-500">{t("radar.scaleNote")}</span>
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
            {yachts.map((yacht, i) => (
              <Radar
                key={yacht.id}
                name={`${yacht.manufacturer} ${yacht.modelName}`}
                dataKey={`yacht_${i}`}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
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
                    {row[`yacht_${i}`]}
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
