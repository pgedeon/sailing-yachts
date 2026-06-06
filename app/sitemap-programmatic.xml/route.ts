import { unstable_cache } from "next/cache";
import {
  SITE_URL,
  buildSitemapXml,
  sitemapResponse,
  SitemapEntry,
} from "@/lib/sitemap";
import { USE_CASES } from "@/lib/use-case-landing";
import { SIZE_CATEGORIES } from "@/lib/size-categories";
import { getManufacturerSizeCombinations } from "@/lib/manufacturer-size-landing";
import { EDITORIAL_YEARS } from "@/lib/best-year-size-landing";

export const revalidate = 3600;

const LOCALES = ["en", "fr"] as const;

async function getProgrammaticEntries(): Promise<SitemapEntry[]> {
  return unstable_cache(
    async () => {
      const entries: SitemapEntry[] = [];
      const now = new Date().toISOString();

      // 1. Manufacturer + size category pages (/manufacturers/[slug]/[sizeCategory])
      try {
        const combos = await getManufacturerSizeCombinations();
        for (const combo of combos) {
          for (const locale of LOCALES) {
            entries.push({
              loc: `${SITE_URL}/${locale}/manufacturers/${combo.manufacturerSlug}/${combo.sizeCategory}`,
              lastmod: now,
              changefreq: "weekly",
              priority: "0.7",
            });
          }
        }
      } catch (err) {
        console.error("[sitemap-programmatic] manufacturer-size query failed:", err);
      }

      // 2. Size category hub pages (/yachts/by-size/[sizeCategory])
      for (const sc of SIZE_CATEGORIES) {
        for (const locale of LOCALES) {
          entries.push({
            loc: `${SITE_URL}/${locale}/yachts/by-size/${sc.slug}`,
            lastmod: now,
            changefreq: "weekly",
            priority: "0.7",
          });
        }
      }

      // 3. Use-case landing pages (/yachts/for/[useCase])
      for (const uc of USE_CASES) {
        for (const locale of LOCALES) {
          entries.push({
            loc: `${SITE_URL}/${locale}/yachts/for/${uc.slug}`,
            lastmod: now,
            changefreq: "weekly",
            priority: "0.7",
          });
        }
      }


      // 4. Best [year] [size] editorial pages (/yachts/best/[year]/[sizeCategory])
      for (const year of EDITORIAL_YEARS) {
        for (const sc of SIZE_CATEGORIES) {
          for (const locale of LOCALES) {
            entries.push({
              loc: `${SITE_URL}/${locale}/yachts/best/${year}/${sc.slug}`,
              lastmod: now,
              changefreq: "monthly",
              priority: "0.8",
            });
          }
        }
      }

      return entries;
    },
    ["sitemap-programmatic"],
    { tags: ["yachts", "manufacturers"], revalidate: 3600 }
  )();
}

export async function GET() {
  try {
    const entries = await getProgrammaticEntries();
    return sitemapResponse(buildSitemapXml(entries));
  } catch (error) {
    console.error("[sitemap-programmatic] Error:", error);
    return sitemapResponse(buildSitemapXml([]));
  }
}
