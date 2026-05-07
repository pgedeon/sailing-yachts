"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DistributionBin } from "@/app/api/length-distribution/route";

interface LengthDistributionChartProps {
  /** Current filter range to highlight */
  filterMin?: number | null;
  filterMax?: number | null;
}

const HIGHLIGHT_COLOR = "#3b82f6"; // blue-500
const DEFAULT_COLOR = "#93c5fd"; // blue-300
const HOVER_COLOR = "#2563eb"; // blue-600

export default function LengthDistributionChart({
  filterMin,
  filterMax,
}: LengthDistributionChartProps) {
  const t = useTranslations("Yachts.distribution");
  const [data, setData] = useState<DistributionBin[] | null>(null);
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Lazy load via IntersectionObserver
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Fetch distribution data
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    fetch("/api/length-distribution")
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((json) => {
        if (!cancelled) setData(json.bins ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  // Determine which bins are highlighted by current filter
  const highlightSet = useMemo(() => {
    if (filterMin == null && filterMax == null) return null;
    const set = new Set<number>();
    const fMin = filterMin ?? 0;
    const fMax = filterMax ?? Infinity;
    // A bin is highlighted if it overlaps with the filter range
    if (data) {
      data.forEach((bin, i) => {
        if (bin.min < fMax && bin.max > fMin) {
          set.add(i);
        }
      });
    }
    return set.size > 0 ? set : null;
  }, [filterMin, filterMax, data]);

  // Chart data with color
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((bin, i) => ({
      ...bin,
      fill: highlightSet
        ? highlightSet.has(i)
          ? HIGHLIGHT_COLOR
          : "#e2e8f0"
        : DEFAULT_COLOR,
    }));
  }, [data, highlightSet]);

  if (error) return null;

  const maxCount = data ? Math.max(...data.map((b) => b.count)) : 0;

  return (
    <div ref={sectionRef} className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-lg font-semibold mb-1">{t("heading")}</h2>
      <p className="text-sm text-gray-500 mb-4">{t("description")}</p>

      {!data ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
          {t("loading")}
        </div>
      ) : data.length === 0 ? null : (
        <>
          <div className="w-full" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                  width={35}
                />
                <Tooltip
                  formatter={(value: any) => [
                    value,
                    t("tooltipCount"),
                  ]}
                  contentStyle={{ fontSize: 13 }}
                />
                <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={50}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.fill}
                      stroke="none"
                      style={{ cursor: "pointer" }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Accessible data table */}
          <details className="mt-3">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
              {t("dataTableToggle")}
            </summary>
            <table className="mt-2 w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left py-1 pr-4 font-medium text-gray-600">
                    {t("colRange")}
                  </th>
                  <th className="text-right py-1 font-medium text-gray-600">
                    {t("colCount")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((bin) => (
                  <tr key={bin.label}>
                    <td className="py-0.5 pr-4 text-gray-700">{bin.label}</td>
                    <td className="py-0.5 text-right text-gray-700">
                      {bin.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </div>
  );
}
