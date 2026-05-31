"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Calendar, Ruler } from "lucide-react";
import { localePath } from "@/lib/i18n-paths";

export interface YachtVariant {
  id: number;
  slug: string | null;
  modelName: string;
  year: number;
  lengthOverall: string | null;
  cabins: number | null;
  displacement: string | null;
}

interface VariantSelectorProps {
  variants: YachtVariant[];
  currentYear: number;
}

function toNum(v: string | number | null): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isNaN(n) ? null : n;
}

export default function VariantSelector({ variants, currentYear }: VariantSelectorProps) {
  const t = useTranslations("YachtDetail");
  const locale = useLocale();
  const params = useParams();
  const currentSlug = params.slug as string;

  if (!variants || variants.length === 0) return null;

  // Sort by year desc
  const sorted = [...variants].sort((a, b) => b.year - a.year);

  return (
    <div className="rounded-lg border bg-card p-4" data-testid="variant-selector">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
        <Calendar className="h-4 w-4" aria-hidden="true" />
        {t("yearVariants")}
      </h3>
      <div className="flex flex-wrap gap-2">
        {sorted.map((variant) => {
          const isCurrent = variant.slug === currentSlug;
          const loa = toNum(variant.lengthOverall);

          if (isCurrent) {
            return (
              <span
                key={variant.id}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
              >
                {variant.year}
                <span className="text-xs opacity-75">(current)</span>
              </span>
            );
          }

          return (
            <Link
              key={variant.id}
              href={localePath(locale, `/yachts/${variant.slug}`)}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {variant.year}
              {loa && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Ruler className="h-3 w-3" aria-hidden="true" />
                  {loa}m
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
