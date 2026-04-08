import { unstable_cache } from "next/cache";
import { db, yachtModels } from "@/lib/db";
import { isNotNull } from "drizzle-orm";
import { SITE_URL, buildSitemapXml, sitemapResponse, SitemapEntry } from "@/lib/sitemap";

export const revalidate = 3600;

async function getYachtEntries(): Promise<SitemapEntry[]> {
  return unstable_cache(
    async () => {
      const yachts: Array<{ slug: string | null; updatedAt: Date | null }> =
        await db
          .select({
            slug: yachtModels.slug,
            updatedAt: yachtModels.updatedAt,
          })
          .from(yachtModels)
          .where(isNotNull(yachtModels.slug));

      return yachts.map((y: { slug: string | null; updatedAt: Date | null }) => ({
        loc: `${SITE_URL}/yachts/${y.slug}`,
        lastmod: y.updatedAt ? new Date(y.updatedAt).toISOString() : undefined,
        changefreq: "weekly" as const,
        priority: "0.8",
      }));
    },
    ["sitemap-yachts"],
    { tags: ["yachts"], revalidate: 3600 }
  )();
}

export async function GET() {
  try {
    const entries = await getYachtEntries();
    return sitemapResponse(buildSitemapXml(entries));
  } catch (error) {
    console.error("[sitemap-yachts] Error:", error);
    return sitemapResponse(buildSitemapXml([]));
  }
}
