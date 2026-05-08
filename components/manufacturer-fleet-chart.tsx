"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Legend,
  Cell,
} from "recharts";
import type { ManufacturerYachtCard } from "@/lib/manufacturers";

interface ManufacturerFleetChartProps {
  yachts: ManufacturerYachtCard[];
  manufacturerName: string;
}

const RIG_COLORS: Record<string, string> = {
  Sloop: "#3b82f6",
  Cutter: "#8b5cf6",
  Ketch: "#10b981",
  Yawl: "#f59e0b",
  "Schooner": "#ef4444",
  "Cutter (staysail)": "#ec4899",
  "Fractional Sloop": "#06b6d4",
  "Masthead Sloop": "#6366f1",
};

const DEFAULT_COLOR = "#94a3b8";

interface ChartDataPoint {
  name: string;
  loa: number;
  year: number;
  beam: number | null;
  displacement: number | null;
  cabins: number | null;
  rigType: string | null;
  slug: string | null;
  color: string;
}

function getRigColor(rigType: string | null): string {
  if (!rigType) return DEFAULT_COLOR;
  return RIG_COLORS[rigType] ?? DEFAULT_COLOR;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-white p-3 shadow-lg text-sm">
      <p className="font-semibold">{d.name}</p>
      <p className="text-muted-foreground">
        LOA: {d.loa.toFixed(1)} m · Year: {d.year}
      </p>
      {d.beam !== null && (
        <p className="text-muted-foreground">Beam: {d.beam.toFixed(1)} m</p>
      )}
      {d.displacement !== null && (
        <p className="text-muted-foreground">
          Displacement: {d.displacement.toLocaleString()} kg
        </p>
      )}
      {d.cabins !== null && (
        <p className="text-muted-foreground">Cabins: {d.cabins}</p>
      )}
      {d.rigType && (
        <p className="text-muted-foreground">Rig: {d.rigType}</p>
      )}
    </div>
  );
}

export default function ManufacturerFleetChart({
  yachts,
  manufacturerName,
}: ManufacturerFleetChartProps) {
  const t = useTranslations("Manufacturers.fleetChart");

  // Filter to yachts that have LOA data
  const chartData: ChartDataPoint[] = yachts
    .filter((y) => y.lengthOverall !== null)
    .map((y) => ({
      name: y.modelName,
      loa: y.lengthOverall!,
      year: y.year,
      beam: y.beam,
      displacement: y.displacement,
      cabins: y.cabins,
      rigType: y.rigType,
      slug: y.slug,
      color: getRigColor(y.rigType),
    }))
    .sort((a, b) => a.loa - b.loa);

  if (chartData.length < 2) {
    // Not enough data for a meaningful chart
    return null;
  }

  // Unique rig types for legend
  const rigTypes = [...new Set(chartData.map((d) => d.rigType).filter(Boolean))] as string[];

  const yearMin = Math.min(...chartData.map((d) => d.year));
  const yearMax = Math.max(...chartData.map((d) => d.year));

  return (
    <div className="mt-10 sm:mt-12">
      <h2 className="text-2xl font-bold">{t("heading", { name: manufacturerName })}</h2>
      <p className="mt-1 text-sm text-muted-foreground mb-4">
        {t("description")}
      </p>

      <div className="bg-white rounded-xl border border-border shadow-sm p-4 sm:p-6">
        <div className="w-full" style={{ height: Math.max(280, chartData.length * 18) }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="loa"
                name={t("axisLength")}
                unit=" m"
                tick={{ fontSize: 12 }}
                label={{
                  value: t("axisLength"),
                  position: "insideBottom",
                  offset: -5,
                  style: { fontSize: 12, fill: "#6b7280" },
                }}
              />
              <YAxis
                type="number"
                dataKey="year"
                name={t("axisYear")}
                domain={[yearMin - 1, yearMax + 1]}
                tick={{ fontSize: 12 }}
                label={{
                  value: t("axisYear"),
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  style: { fontSize: 12, fill: "#6b7280" },
                }}
              />
              <ZAxis
                type="number"
                dataKey="displacement"
                range={[60, 200]}
                name={t("axisDisplacement")}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter
                name={manufacturerName}
                data={chartData}
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} stroke={entry.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Rig type legend */}
        {rigTypes.length > 1 && (
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
            {rigTypes.map((rig) => (
              <span key={rig} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: getRigColor(rig) }}
                />
                {rig}
              </span>
            ))}
          </div>
        )}

        {/* Accessible data table */}
        <details className="mt-3">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            {t("dataTableToggle")}
          </summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left py-1 pr-4 font-medium text-gray-600">
                    {t("colModel")}
                  </th>
                  <th className="text-right py-1 px-2 font-medium text-gray-600">
                    {t("axisLength")} (m)
                  </th>
                  <th className="text-right py-1 px-2 font-medium text-gray-600">
                    {t("axisYear")}
                  </th>
                  <th className="text-right py-1 px-2 font-medium text-gray-600">
                    {t("colBeam")} (m)
                  </th>
                  <th className="text-right py-1 pl-2 font-medium text-gray-600">
                    {t("colRig")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((d) => (
                  <tr key={d.name}>
                    <td className="py-0.5 pr-4 text-gray-700">{d.name}</td>
                    <td className="py-0.5 px-2 text-right text-gray-700">
                      {d.loa.toFixed(1)}
                    </td>
                    <td className="py-0.5 px-2 text-right text-gray-700">
                      {d.year}
                    </td>
                    <td className="py-0.5 px-2 text-right text-gray-700">
                      {d.beam !== null ? d.beam.toFixed(1) : "—"}
                    </td>
                    <td className="py-0.5 pl-2 text-right text-gray-700">
                      {d.rigType ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  );
}

// Export color calculation for testing
export { getRigColor, RIG_COLORS, DEFAULT_COLOR };
export type { ChartDataPoint };
