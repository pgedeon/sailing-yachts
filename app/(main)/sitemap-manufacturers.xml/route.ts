import { unstable_cache } from "next/cache";
import { db, manufacturers } from "@/lib/db";
import { slugify } from "@/lib/utils/slugify";
import { SITE_URL, buildSitemapXml, sitemapResponse, SitemapEntry } from "@/lib/sitemap";

export const revalidate = 3600;

async function getManufacturerEntries(): Promise<SitemapEntry[]> {
  return unstable_cache(
    async () => {
      const mfrs = await db
        .select({
          name: manufacturers.name,
        })
        .from(manufacturers);

      return mfrs
        .filter((m: { name: string | null }) => m.name !== null)
        .map((m: { name: string | null }) => ({
          loc: `${SITE_URL}/manufacturers/${slugify(m.name!)}`,
          changefreq: "weekly" as const,
          priority: "0.6",
        }));
    },
    ["sitemap-manufacturers"],
    { tags: ["manufacturers"], revalidate: 3600 }
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
