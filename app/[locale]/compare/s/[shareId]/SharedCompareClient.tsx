"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import dynamic from "next/dynamic";
import { localePath } from "@/lib/i18n-paths";

const ComparisonRadarChart = dynamic(
  () => import("@/components/comparison-radar-chart").then((m) => ({ default: m.ComparisonRadarChart })),
  { ssr: false, loading: () => null }
);
const ComparisonBarCharts = dynamic(
  () => import("@/components/comparison-bar-charts").then((m) => ({ default: m.ComparisonBarCharts })),
  { ssr: false, loading: () => null }
);

interface Yacht {
  id: number;
  manufacturer: string;
  modelName: string;
  year: number | null;
  slug: string | null;
  lengthOverall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  ballast: number | null;
  sailAreaMain: number | null;
  rigType: string | null;
  keelType: string | null;
  hullMaterial: string | null;
  cabins: number | null;
  berths: number | null;
  heads: number | null;
  maxOccupancy: number | null;
  engineHp: number | null;
  engineType: string | null;
  fuelCapacity: number | null;
  waterCapacity: number | null;
  designNotes: string | null;
}

interface SharedCompareClientProps {
  shareId: string;
  yachtIds: number[];
  title: string | null;
  viewCount: number;
  createdAt: string;
}

const YACHT_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-400", dot: "bg-blue-500" },
  { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-400", dot: "bg-emerald-500" },
  { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-400", dot: "bg-amber-500" },
  { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-400", dot: "bg-purple-500" },
];

const SPEC_GROUPS_CONFIG = [
  {
    groupKey: "dimensions",
    fields: [
      { key: "lengthOverall", labelKey: "lengthOverall", unit: "m" },
      { key: "beam", labelKey: "beam", unit: "m" },
      { key: "draft", labelKey: "draft", unit: "m" },
      { key: "displacement", labelKey: "displacement", unit: "kg" },
      { key: "ballast", labelKey: "ballast", unit: "kg" },
    ],
  },
  {
    groupKey: "riggingSails",
    fields: [
      { key: "sailAreaMain", labelKey: "sailAreaMain", unit: "m²" },
      { key: "rigType", labelKey: "rigType" },
    ],
  },
  {
    groupKey: "construction",
    fields: [
      { key: "keelType", labelKey: "keelType" },
      { key: "hullMaterial", labelKey: "hullMaterial" },
    ],
  },
  {
    groupKey: "accommodation",
    fields: [
      { key: "cabins", labelKey: "cabins" },
      { key: "berths", labelKey: "berths" },
      { key: "heads", labelKey: "heads" },
      { key: "maxOccupancy", labelKey: "maxOccupancy" },
    ],
  },
  {
    groupKey: "technical",
    fields: [
      { key: "engineHp", labelKey: "engineHp" },
      { key: "engineType", labelKey: "engineType" },
      { key: "fuelCapacity", labelKey: "fuel", unit: "L" },
      { key: "waterCapacity", labelKey: "water", unit: "L" },
    ],
  },
] as const;

export function SharedCompareClient({
  shareId,
  yachtIds,
  title,
  viewCount,
  createdAt,
}: SharedCompareClientProps) {
  const locale = useLocale();
  const t = useTranslations("Compare");

  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const SPEC_GROUPS = useMemo(
    () =>
      SPEC_GROUPS_CONFIG.map((cfg) => ({
        group: t(`groups.${cfg.groupKey}`),
        fields: cfg.fields.map((f: any) => ({
          key: f.key,
          label: t(`fields.${f.labelKey}`),
          unit: f.unit,
        })),
      })),
    [t]
  );

  // Fetch yacht data
  useEffect(() => {
    if (yachtIds.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/compare?ids=${yachtIds.join(",")}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to fetch"))))
      .then((data) => {
        setYachts(data.yachts || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [yachtIds]);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/compare/s/${shareId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatValue = (value: number | string | null | undefined, unit?: string) => {
    if (value === null || value === undefined) return "—";
    const suffix = unit ? ` ${unit}` : "";
    if (typeof value === "number") {
      return `${Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
    }
    return String(value);
  };

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {title || t("sharedComparison.title")}
            </h1>
            <p className="mt-1 text-gray-500 text-sm">
              {t("sharedComparison.subtitle", { count: yachtIds.length })}
              {viewCount > 0 && (
                <span className="ml-2 text-gray-400">
                  · {t("sharedComparison.views", { count: viewCount })}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{t("copied")}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span>{t("share")}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Share badge */}
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-lg text-sm text-sky-700">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span>{t("sharedComparison.shareUrl")}</span>
          <code className="px-1.5 py-0.5 bg-white rounded text-xs font-mono text-sky-800">
            /compare/s/{shareId}
          </code>
        </div>
      </div>

      {/* Yacht Cards */}
      <div
        className={`grid gap-3 mb-8 ${
          yachts.length <= 2
            ? "grid-cols-1 md:grid-cols-2"
            : yachts.length === 3
              ? "grid-cols-1 md:grid-cols-3"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {yachts.map((yacht, i) => {
          const color = YACHT_COLORS[i % YACHT_COLORS.length];
          return (
            <Link
              key={yacht.id}
              href={localePath(locale, `/yachts/${yacht.slug}`)}
              className={`rounded-xl border-2 p-4 transition-all hover:shadow-md ${color.border} ${color.bg}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${color.dot} flex-shrink-0`} />
                <div>
                  <div className={`font-semibold ${color.text}`}>{yacht.manufacturer}</div>
                  <div className="text-gray-800 font-medium">{yacht.modelName}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {yacht.year ?? "—"} · {yacht.lengthOverall ? `${yacht.lengthOverall}m` : "—"} LOA
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
          <p className="mt-3 text-gray-500 text-sm">{t("loading")}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 text-center text-red-700 bg-red-50 rounded-lg mb-4 text-sm">{error}</div>
      )}

      {/* Comparison Table */}
      {yachts.length >= 2 && !loading && (
        <div className="border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40 sticky left-0 bg-gray-50 z-10">
                    {t("table.spec")}
                  </th>
                  {yachts.map((yacht, i) => (
                    <th key={yacht.id} className="px-5 py-3 text-left min-w-[160px]">
                      <Link
                        href={localePath(locale, `/yachts/${yacht.slug}`)}
                        className="hover:underline"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${YACHT_COLORS[i]?.dot}`} />
                          <span className="font-semibold text-gray-800">
                            {yacht.manufacturer} {yacht.modelName}
                          </span>
                        </span>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {SPEC_GROUPS.map((group) => (
                  <React.Fragment key={group.group}>
                    <tr className="bg-slate-50">
                      <td
                        colSpan={yachts.length + 1}
                        className="px-5 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider"
                      >
                        {group.group}
                      </td>
                    </tr>
                    {group.fields.map((field) => (
                      <tr key={field.key} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 text-gray-600 font-medium whitespace-nowrap sticky left-0 bg-white z-10">
                          {field.label}
                          {field.unit && (
                            <span className="text-gray-500 ml-1 text-xs">({field.unit})</span>
                          )}
                        </td>
                        {yachts.map((yacht) => {
                          const value = yacht[field.key as keyof Yacht] as any;
                          return (
                            <td key={yacht.id} className="px-5 py-3 whitespace-nowrap text-gray-700">
                              {formatValue(value, field.unit)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}

                {yachts.some((y) => y.designNotes) && (
                  <>
                    <tr className="bg-slate-50">
                      <td
                        colSpan={yachts.length + 1}
                        className="px-5 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider"
                      >
                        {t("groups.notes")}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-gray-600 font-medium whitespace-nowrap sticky left-0 bg-white z-10">
                        {t("table.designNotes")}
                      </td>
                      {yachts.map((yacht) => (
                        <td key={yacht.id} className="px-5 py-3 text-gray-700 text-sm max-w-xs">
                          {yacht.designNotes || "—"}
                        </td>
                      ))}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Radar Chart */}
      {yachts.length >= 2 && !loading && (
        <div className="mt-8">
          <ComparisonRadarChart yachts={yachts} />
        </div>
      )}

      {/* Bar Charts */}
      {yachts.length >= 2 && !loading && (
        <div className="mt-8">
          <ComparisonBarCharts yachts={yachts} />
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href={localePath(locale, "/compare")}
          className="text-blue-600 hover:underline text-sm"
        >
          ← {t("sharedComparison.createOwn")}
        </Link>
        <p className="text-xs text-gray-400">
          {t("sharedComparison.sharedOn", {
            date: new Date(createdAt).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          })}
        </p>
      </div>
    </div>
  );
}
