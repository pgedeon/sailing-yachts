import { unstable_cache } from "next/cache";
import { db, manufacturers, manufacturerSpotlights, yachtModels } from "@/lib/db";
import { slugify } from "@/lib/utils/slugify";
import { SITE_URL, buildSitemapXml, sitemapResponse, SitemapEntry } from "@/lib/sitemap";
import { eq, sql, max } from "drizzle-orm";

export const revalidate = 3600;

const LOCALES = ["en", "fr"] as const;

async function getManufacturerEntries(): Promise<SitemapEntry[]> {
  return unstable_cache(
    async () => {
      // Get lastmod per manufacturer based on their most recently updated yacht
      const lastModRows = await db
        .select({
          manufacturerId: manufacturers.id,
          lastmod: sql<string>`COALESCE(MAX(${yachtModels.updatedAt}), ${manufacturers.createdAt})`,
        })
        .from(manufacturers)
        .leftJoin(yachtModels, eq(yachtModels.manufacturerId, manufacturers.id))
        .groupBy(manufacturers.id);

      const lastModMap = new Map<number, string>();
      for (const row of lastModRows) {
        lastModMap.set(
          row.manufacturerId,
          new Date(row.lastmod).toISOString()
        );
      }

      const mfrs = await db
        .select({
          id: manufacturers.id,
          name: manufacturers.name,
        })
        .from(manufacturers);

      const manufacturerEntries: SitemapEntry[] = mfrs
        .filter((m: { name: string | null }) => m.name !== null)
        .flatMap((m: { id: number; name: string | null }) =>
          LOCALES.map((locale) => ({
            loc: `${SITE_URL}/${locale}/manufacturers/${slugify(m.name!)}`,
            lastmod: lastModMap.get(m.id),
            changefreq: "weekly" as const,
            priority: "0.6",
          }))
        );

      // Add spotlight pages
      const spotlights = await db
        .select({
          manufacturerName: manufacturers.name,
        })
        .from(manufacturerSpotlights)
        .innerJoin(manufacturers, eq(manufacturerSpotlights.manufacturerId, manufacturers.id))
        .where(eq(manufacturerSpotlights.isPublished, true));

      const spotlightEntries: SitemapEntry[] = spotlights
        .filter((s: { manufacturerName: string | null }) => s.manufacturerName !== null)
        .flatMap((s: { manufacturerName: string | null }) =>
          LOCALES.map((locale) => ({
            loc: `${SITE_URL}/${locale}/manufacturers/${slugify(s.manufacturerName!)}/spotlight`,
            changefreq: "monthly" as const,
            priority: "0.7",
          }))
        );

      return [...manufacturerEntries, ...spotlightEntries];
    },
    ["sitemap-manufacturers"],
    { tags: ["manufacturers", "manufacturer-spotlights", "yachts"], revalidate: 3600 }
  )();
}

export async function GET() {
  try {
    const entries = await getManufacturerEntries();
    return sitemapResponse(buildSitemapXml(entries));
  } catch (error) {
    console.error("[sitemap-manufacturers] Error:", error);
    return sitemapResponse(buildSitemapXml([]));
  }
}
