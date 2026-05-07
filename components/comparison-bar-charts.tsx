"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/** Shared spec data shape — matches what canonical and CompareClient provide */
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

interface ComparisonBarChartsProps {
  yachts: YachtSpecData[];
}

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

import { displacementLengthRatio, sailAreaDisplacementRatio, ballastRatio } from "@/lib/yacht-ratios";

// ---------- Chart data builders ----------

type RawSpecKey = keyof Pick<
  YachtSpecData,
  "lengthOverall" | "beam" | "draft" | "displacement" | "sailAreaMain" | "engineHp"
>;

interface SpecBarDef {
  key: RawSpecKey;
  labelKey: string;
  unit: string;
}

const SPEC_BARS: SpecBarDef[] = [
  { key: "lengthOverall", labelKey: "lengthOverall", unit: "m" },
  { key: "beam", labelKey: "beam", unit: "m" },
  { key: "draft", labelKey: "draft", unit: "m" },
  { key: "displacement", labelKey: "displacement", unit: "kg" },
  { key: "sailAreaMain", labelKey: "sailAreaMain", unit: "m²" },
  { key: "engineHp", labelKey: "engineHp", unit: "HP" },
];

interface RatioDef {
  key: string;
  labelKey: string;
  unit: string;
  compute: (y: YachtSpecData) => number | null;
}

function buildRatioDefs(): RatioDef[] {
  return [
    {
      key: "dlRatio",
      labelKey: "dlRatio",
      unit: "",
      compute: (y) => displacementLengthRatio(y.displacement, y.lengthOverall),
    },
    {
      key: "saDRatio",
      labelKey: "saDRatio",
      unit: "",
      compute: (y) => sailAreaDisplacementRatio(y.sailAreaMain, y.displacement),
    },
    {
      key: "ballastPct",
      labelKey: "ballastPct",
      unit: "%",
      compute: (y) => ballastRatio(y.ballast, y.displacement),
    },
  ];
}

function buildBarChartData(
  yachts: YachtSpecData[],
  specs: SpecBarDef[],
  labels: Record<string, string>,
): { spec: string; [k: string]: string | number }[] {
  return specs
    .map((spec) => {
      const values = yachts.map((y) => y[spec.key] as number | null);
      // Skip if no yacht has a value for this spec
      if (values.every((v) => v === null || v === undefined)) return null;
      const entry: Record<string, string | number> = {
        spec: labels[spec.key] || spec.key,
      };
      yachts.forEach((y, i) => {
        const raw = y[spec.key] as number | null;
        entry[`yacht_${i}`] = raw ?? 0;
      });
      return entry;
    })
    .filter(Boolean) as { spec: string; [k: string]: string | number }[];
}

function buildRatioChartData(
  yachts: YachtSpecData[],
  ratios: RatioDef[],
  labels: Record<string, string>,
): { spec: string; [k: string]: string | number }[] {
  return ratios
    .map((ratio) => {
      const values = yachts.map(ratio.compute);
      if (values.every((v) => v === null || v === undefined)) return null;
      const entry: Record<string, string | number> = {
        spec: labels[ratio.key] || ratio.key,
      };
      yachts.forEach((_, i) => {
        entry[`yacht_${i}`] = values[i] ?? 0;
      });
      return entry;
    })
    .filter(Boolean) as { spec: string; [k: string]: string | number }[];
}

function formatBarTooltipValue(value: unknown): string {
  if (typeof value !== "number") return String(value ?? "");
  if (Math.abs(value) >= 1000) return value.toLocaleString();
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}

export function ComparisonBarCharts({ yachts }: ComparisonBarChartsProps) {
  const t = useTranslations("Compare");

  const specLabels = useMemo(
    () =>
      Object.fromEntries(
        SPEC_BARS.map((s) => [s.key, t(`fields.${s.labelKey}`)]),
      ),
    [t],
  );

  const ratioLabels = useMemo(
    () => ({
      dlRatio: t("barCharts.ratioDL"),
      saDRatio: t("barCharts.ratioSAD"),
      ballastPct: t("barCharts.ratioBallast"),
    }),
    [t],
  );

  const ratios = useMemo(() => buildRatioDefs(), []);
  const specChartData = useMemo(
    () => buildBarChartData(yachts, SPEC_BARS, specLabels),
    [yachts, specLabels],
  );
  const ratioChartData = useMemo(
    () => buildRatioChartData(yachts, ratios, ratioLabels),
    [yachts, ratios, ratioLabels],
  );

  if (yachts.length < 2) return null;
  // Need at least some data
  if (specChartData.length === 0 && ratioChartData.length === 0) return null;

  const yachtNames = yachts.map((y) => `${y.manufacturer} ${y.modelName}`);

  return (
    <div className="w-full space-y-8">
      {/* Spec comparison bar chart */}
      {specChartData.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("barCharts.specTitle")}
            </h3>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={specChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="spec"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip
                  formatter={formatBarTooltipValue as any}
                  contentStyle={{
                    borderRadius: "8px",
                    fontSize: "13px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend />
                {yachts.map((yacht, i) => (
                  <Bar
                    key={yacht.id}
                    dataKey={`yacht_${i}`}
                    name={yachtNames[i]}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Accessible data table for specs */}
          <details className="mt-3">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
              {t("barCharts.dataTableToggle")}
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
                {specChartData.map((row) => (
                  <tr key={String(row.spec)}>
                    <td className="border border-gray-200 px-2 py-1 font-medium">
                      {row.spec}
                    </td>
                    {yachts.map((_, i) => (
                      <td key={i} className="border border-gray-200 px-2 py-1">
                        {row[`yacht_${i}`] as number}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      )}

      {/* Performance ratios bar chart */}
      {ratioChartData.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("barCharts.ratioTitle")}
            </h3>
            <span className="text-xs text-gray-500">
              {t("barCharts.ratioNote")}
            </span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ratioChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="spec"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip
                  formatter={formatBarTooltipValue as any}
                  contentStyle={{
                    borderRadius: "8px",
                    fontSize: "13px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend />
                {yachts.map((yacht, i) => (
                  <Bar
                    key={yacht.id}
                    dataKey={`yacht_${i}`}
                    name={yachtNames[i]}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ratio explanations */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-500">
            <div className="bg-gray-50 rounded-lg p-2">
              <strong className="text-gray-700">{t("barCharts.ratioDL")}</strong>:{" "}
              {t("barCharts.ratioDLExplain")}
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <strong className="text-gray-700">{t("barCharts.ratioSAD")}</strong>:{" "}
              {t("barCharts.ratioSADExplain")}
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <strong className="text-gray-700">{t("barCharts.ratioBallast")}</strong>:{" "}
              {t("barCharts.ratioBallastExplain")}
            </div>
          </div>

          {/* Accessible data table for ratios */}
          <details className="mt-3">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
              {t("barCharts.dataTableToggle")}
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
                {ratioChartData.map((row) => (
                  <tr key={String(row.spec)}>
                    <td className="border border-gray-200 px-2 py-1 font-medium">
                      {row.spec}
                    </td>
                    {yachts.map((_, i) => (
                      <td key={i} className="border border-gray-200 px-2 py-1">
                        {row[`yacht_${i}`] as number}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      )}
    </div>
  );
}
