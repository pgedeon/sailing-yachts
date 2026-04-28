"use client";

import { useTranslations } from "next-intl";
import { Scale } from "lucide-react";

/**
 * Manufacturer Comparisons - Internal Linking Module
 *
 * Shows "Compare with other yachts from this manufacturer" section.
 * This encourages deeper exploration and comparison within the same manufacturer.
 */

interface ManufacturerComparisonsProps {
  manufacturerName: string;
  yachts: Array<{ id: number; slug: string | null; modelName: string }>;
}

export function ManufacturerComparisons({
  manufacturerName,
  yachts,
}: ManufacturerComparisonsProps) {
  const t = useTranslations("Manufacturers");

  // Only show if there are at least 2 yachts to compare
  const comparableYachts = yachts.filter((y) => y.slug);
  if (comparableYachts.length < 2) return null;

  // Pick up to 3 yacht pairs to suggest comparisons
  const comparisonPairs = [];
  for (let i = 0; i < comparableYachts.length - 1 && comparisonPairs.length < 3; i++) {
    const yachtA = comparableYachts[i];
    const yachtB = comparableYachts[i + 1];
    comparisonPairs.push({ yachtA, yachtB });
  }

  if (comparisonPairs.length === 0) return null;

  return (
    <section className="mt-10 sm:mt-12 bg-gradient-to-r from-amber-50 via-white to-orange-50 border border-amber-200 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Scale className="h-5 w-5 text-amber-700" aria-hidden="true" />
        <h2 className="text-lg sm:text-xl font-bold text-amber-900">
          {t("comparisons.title", { name: manufacturerName })}
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {t("comparisons.subtitle")}
      </p>

      <div className="space-y-3">
        {comparisonPairs.map(({ yachtA, yachtB }, idx) => (
          <a
            key={idx}
            href={`/compare?ids=${yachtA.id},${yachtB.id}`}
            className="block p-3 rounded-lg border border-amber-100 bg-white/80 hover:bg-white hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-medium">
                <span>{yachtA.modelName}</span>
                <span className="text-amber-600">{t("comparisons.vs")}</span>
                <span>{yachtB.modelName}</span>
              </div>
              <div className="text-sm text-amber-600">{t("comparisons.compare")}</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
