import { unstable_cache } from "next/cache";
import { db, yachtModels } from "@/lib/db";
import { isNotNull } from "drizzle-orm";
import { SITE_URL, buildSitemapXml, sitemapResponse, SitemapEntry } from "@/lib/sitemap";

export const revalidate = 3600;

async function getCompareEntries(): Promise<SitemapEntry[]> {
  return unstable_cache(
    async () => {
      // Fetch top 50 yachts by ID for comparison pairs
      const topYachts = await db
        .select({ id: yachtModels.id, slug: yachtModels.slug })
        .from(yachtModels)
        .where(isNotNull(yachtModels.slug))
        .limit(50)
        .orderBy(yachtModels.id);

      const entries: SitemapEntry[] = [];

      for (let i = 0; i < topYachts.length; i++) {
        for (let j = i + 1; j < topYachts.length; j++) {
          const yachtA = topYachts[i];
          const yachtB = topYachts[j];

          if (yachtA.slug && yachtB.slug) {
            entries.push({
              loc: `${SITE_URL}/compare/${yachtA.slug}-vs-${yachtB.slug}`,
              changefreq: "monthly",
              priority: "0.5",
            });
          }
        }
      }

      return entries;
    },
    ["sitemap-compare"],
    { tags: ["yachts"], revalidate: 3600 }
  )();
}

export async function GET() {
  try {
    const entries = await getCompareEntries();
    return sitemapResponse(buildSitemapXml(entries));
  } catch (error) {
    console.error("[sitemap-compare] Error:", error);
    return sitemapResponse(buildSitemapXml([]));
  }
}
