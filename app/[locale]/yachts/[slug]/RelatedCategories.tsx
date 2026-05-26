"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Tag, Ruler, Compass } from "lucide-react";
import { getSizeCategoryForLoa } from "@/lib/size-categories";
import { slugify } from "@/lib/utils/slugify";
import {
  assignUseCaseTags,
  type YachtSpecForTags,
} from "@/lib/use-case-tags";
import { USE_CASES } from "@/lib/use-case-meta";

interface RelatedCategoriesProps {
  manufacturer: string;
  lengthOverall: number | string | null;
  displacement: number | string | null;
  sailAreaMain: number | string | null;
  beam: number | string | null;
  draft: number | string | null;
  ballast: number | string | null;
  hullMaterial: string | null;
  cabins: number | string | null;
  berths: number | string | null;
  rigType: string | null;
  keelType: string | null;
}

function parseNum(v: number | string | null): number | null {
  if (v == null) return null;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? null : n;
}

export function RelatedCategories({
  manufacturer,
  lengthOverall,
  displacement,
  sailAreaMain,
  beam,
  draft,
  ballast,
  hullMaterial,
  cabins,
  berths,
  rigType,
  keelType,
}: RelatedCategoriesProps) {
  const t = useTranslations("RelatedCategories");
  const locale = useLocale();
  const links: Array<{ href: string; label: string; icon: React.ReactNode }> = [];

  const loa = parseNum(lengthOverall);
  const mfrSlug = slugify(manufacturer);

  // 1. Manufacturer + size category page
  if (loa) {
    const sc = getSizeCategoryForLoa(loa);
    if (sc) {
      links.push({
        href: `/${locale}/manufacturers/${mfrSlug}/${sc.slug}`,
        label: locale === "fr" ? `${sc.labelFr} ${manufacturer}` : `${manufacturer} ${sc.labelEn}`,
        icon: <Tag className="w-4 h-4" />,
      });

      // 2. Size category hub page
      links.push({
        href: `/${locale}/yachts/by-size/${sc.slug}`,
        label: locale === "fr" ? sc.labelFr : sc.labelEn,
        icon: <Ruler className="w-4 h-4" />,
      });
    }
  }

  // 3. Use-case pages based on yacht specs
  const specForTags: YachtSpecForTags = {
    lengthOverall: loa,
    displacement: parseNum(displacement),
    sailAreaMain: parseNum(sailAreaMain),
    beam: parseNum(beam),
    draft: parseNum(draft),
    ballast: parseNum(ballast),
    cabins: parseNum(cabins),
    berths: parseNum(berths),
    rigType,
    keelType,
  };

  const useCaseTags = assignUseCaseTags(specForTags);
  for (const tag of useCaseTags) {
    const uc = USE_CASES.find((u) => u.id === tag);
    if (uc) {
      links.push({
        href: `/${locale}/yachts/for/${uc.slug}`,
        label: locale === "fr" ? uc.labelFr : uc.labelEn,
        icon: <Compass className="w-4 h-4" />,
      });
    }
  }

  if (links.length === 0) return null;

  return (
    <div className="related-categories-section mt-6 no-print">
      <h3 className="text-lg font-semibold text-foreground mb-3">
        {t("title")}
      </h3>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
