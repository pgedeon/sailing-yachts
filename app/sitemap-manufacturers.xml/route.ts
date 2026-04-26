import { unstable_cache } from "next/cache";
import { db, manufacturers, manufacturerSpotlights } from "@/lib/db";
import { slugify } from "@/lib/utils/slugify";
import { SITE_URL, buildSitemapXml, sitemapResponse, SitemapEntry } from "@/lib/sitemap";
import { eq } from "drizzle-orm";

export const revalidate = 3600;

async function getManufacturerEntries(): Promise<SitemapEntry[]> {
  return unstable_cache(
    async () => {
      const mfrs = await db
        .select({
          name: manufacturers.name,
        })
        .from(manufacturers);

      const manufacturerEntries: SitemapEntry[] = mfrs
        .filter((m: { name: string | null }) => m.name !== null)
        .map((m: { name: string | null }) => ({
          loc: `${SITE_URL}/manufacturers/${slugify(m.name!)}`,
          changefreq: "weekly" as const,
          priority: "0.6",
        }));

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
        .map((s: { manufacturerName: string | null }) => ({
          loc: `${SITE_URL}/manufacturers/${slugify(s.manufacturerName!)}/spotlight`,
          changefreq: "monthly" as const,
          priority: "0.7",
        }));

      return [...manufacturerEntries, ...spotlightEntries];
    },
    ["sitemap-manufacturers"],
    { tags: ["manufacturers", "manufacturer-spotlights"], revalidate: 3600 }
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
