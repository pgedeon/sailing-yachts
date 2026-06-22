"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { localePath } from "@/lib/i18n-paths";
import type { ManufacturerCompareStats } from "@/lib/manufacturer-compare";
import ManufacturerLogo from "@/components/manufacturer-logo";
import { getCountryFlag } from "@/lib/utils/country-flags";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  Flag,
  Ruler,
  Ship,
  Weight,
} from "lucide-react";

interface ManufacturerCompareClientProps {
  data: { mfrA: ManufacturerCompareStats; mfrB: ManufacturerCompareStats };
  locale: string;
}

function formatNullable(value: number | null, suffix = ""): string {
  return value !== null ? `${value}${suffix}` : "—";
}

function ComparisonRow({
  label,
  icon: Icon,
  valueA,
  valueB,
  highlight = "none",
}: {
  label: string;
  icon: React.ElementType;
  valueA: string;
  valueB: string;
  highlight?: "a" | "b" | "none";
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center py-3 border-b border-border/50 last:border-b-0">
      <div
        className={`text-right font-medium ${highlight === "a" ? "text-green-700 dark:text-green-400" : ""}`}
      >
        {valueA}
      </div>
      <div className="flex items-center gap-2 text-muted-foreground text-sm justify-center">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <div
        className={`text-left font-medium ${highlight === "b" ? "text-green-700 dark:text-green-400" : ""}`}
      >
        {valueB}
      </div>
    </div>
  );
}

export function ManufacturerCompareClient({
  data,
  locale,
}: ManufacturerCompareClientProps) {
  const t = useTranslations("ManufacturerCompare");
  const { mfrA, mfrB } = data;

  // Determine which manufacturer has "better" stats for highlighting
  const fleetHighlight = mfrA.yachtCount > mfrB.yachtCount ? "a" : mfrB.yachtCount > mfrA.yachtCount ? "b" : "none";

  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {mfrA.name} <span className="text-muted-foreground">vs</span>{" "}
          {mfrB.name}
        </h1>
        <p className="text-muted-foreground">
          {t("subtitle", { a: mfrA.name, b: mfrB.name })}
        </p>
      </div>

      {/* Side-by-side cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {[mfrA, mfrB].map((mfr, idx) => (
          <div
            key={mfr.id}
            className="rounded-xl border border-border bg-white dark:bg-gray-900 p-6 shadow-sm"
          >
            <div className="flex items-center gap-4 mb-4">
              <ManufacturerLogo
                name={mfr.name}
                logoUrl={mfr.logoUrl}
                size={48}
              />
              <div>
                <h2 className="text-xl font-bold">{mfr.name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {mfr.country && (
                    <span>
                      {getCountryFlag(mfr.country)} {mfr.country}
                    </span>
                  )}
                  {mfr.foundedYear && (
                    <span>
                      · {t("founded")} {mfr.foundedYear}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {mfr.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {mfr.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-muted-foreground text-xs mb-1">
                  {t("fleetSize")}
                </div>
                <div className="font-bold text-lg">{mfr.yachtCount}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-muted-foreground text-xs mb-1">
                  {t("yearRange")}
                </div>
                <div className="font-bold">
                  {mfr.minYear && mfr.maxYear
                    ? `${mfr.minYear}–${mfr.maxYear}`
                    : "—"}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-muted-foreground text-xs mb-1">
                  {t("lengthRange")}
                </div>
                <div className="font-bold">
                  {mfr.minLength && mfr.maxLength
                    ? `${mfr.minLength}–${mfr.maxLength}m`
                    : "—"}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-muted-foreground text-xs mb-1">
                  {t("avgLength")}
                </div>
                <div className="font-bold">
                  {mfr.avgLength ? `${mfr.avgLength.toFixed(1)}m` : "—"}
                </div>
              </div>
            </div>

            {mfr.websiteUrl && (
              <a
                href={mfr.websiteUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                {t("visitWebsite")}
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="rounded-xl border border-border bg-white dark:bg-gray-900 p-6 shadow-sm mb-10">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" aria-hidden="true" />
          {t("statsComparison")}
        </h2>

        <ComparisonRow
          label={t("fleetSize")}
          icon={Ship}
          valueA={String(mfrA.yachtCount)}
          valueB={String(mfrB.yachtCount)}
          highlight={fleetHighlight}
        />
        <ComparisonRow
          label={t("yearRange")}
          icon={Calendar}
          valueA={
            mfrA.minYear && mfrA.maxYear
              ? `${mfrA.minYear}–${mfrA.maxYear}`
              : "—"
          }
          valueB={
            mfrB.minYear && mfrB.maxYear
              ? `${mfrB.minYear}–${mfrB.maxYear}`
              : "—"
          }
        />
        <ComparisonRow
          label={t("lengthRange")}
          icon={Ruler}
          valueA={
            mfrA.minLength && mfrA.maxLength
              ? `${mfrA.minLength}–${mfrA.maxLength}m`
              : "—"
          }
          valueB={
            mfrB.minLength && mfrB.maxLength
              ? `${mfrB.minLength}–${mfrB.maxLength}m`
              : "—"
          }
        />
        <ComparisonRow
          label={t("avgLength")}
          icon={Ruler}
          valueA={mfrA.avgLength ? `${mfrA.avgLength.toFixed(1)}m` : "—"}
          valueB={mfrB.avgLength ? `${mfrB.avgLength.toFixed(1)}m` : "—"}
        />
        <ComparisonRow
          label={t("displacementRange")}
          icon={Weight}
          valueA={formatNullable(mfrA.minDisplacement) !== "—" && mfrA.maxDisplacement ? `${mfrA.minDisplacement}–${mfrA.maxDisplacement}kg` : "—"}
          valueB={formatNullable(mfrB.minDisplacement) !== "—" && mfrB.maxDisplacement ? `${mfrB.minDisplacement}–${mfrB.maxDisplacement}kg` : "—"}
        />
        <ComparisonRow
          label={t("cabinsRange")}
          icon={Ship}
          valueA={formatNullable(mfrA.minCabins) !== "—" && mfrA.maxCabins ? `${mfrA.minCabins}–${mfrA.maxCabins}` : "—"}
          valueB={formatNullable(mfrB.minCabins) !== "—" && mfrB.maxCabins ? `${mfrB.minCabins}–${mfrB.maxCabins}` : "—"}
        />
        <ComparisonRow
          label={t("country")}
          icon={Flag}
          valueA={mfrA.country ? `${getCountryFlag(mfrA.country)} ${mfrA.country}` : "—"}
          valueB={mfrB.country ? `${getCountryFlag(mfrB.country)} ${mfrB.country}` : "—"}
        />
        <ComparisonRow
          label={t("founded")}
          icon={Calendar}
          valueA={mfrA.foundedYear ? String(mfrA.foundedYear) : "—"}
          valueB={mfrB.foundedYear ? String(mfrB.foundedYear) : "—"}
        />
      </div>

      {/* Popular models */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {[mfrA, mfrB].map((mfr) => (
          <div
            key={mfr.id}
            className="rounded-xl border border-border bg-white dark:bg-gray-900 p-6 shadow-sm"
          >
            <h3 className="text-lg font-bold mb-4">
              {t("popularModels", { name: mfr.name })}
            </h3>
            {mfr.popularModels.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noModels")}</p>
            ) : (
              <ul className="space-y-2">
                {mfr.popularModels.map((model) => (
                  <li key={model.id}>
                    <Link
                      href={localePath(
                        locale,
                        `/yachts/${model.slug}`,
                      )}
                      className="flex items-center justify-between rounded-lg p-3 bg-muted/30 hover:bg-muted/60 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-sm">
                          {model.modelName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {model.year}
                          {model.lengthOverall
                            ? ` · ${model.lengthOverall}m`
                            : ""}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* CTA links */}
      <div className="text-center">
        <Link
          href={localePath(locale, "/manufacturers")}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          ← {t("allManufacturers")}
        </Link>
      </div>
    </>
  );
}
