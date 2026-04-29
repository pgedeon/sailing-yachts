import { unstable_cache } from "next/cache";
import { db, yachtModels, images } from "@/lib/db";
import { isNotNull, eq, sql } from "drizzle-orm";
import { SITE_URL, buildSitemapXml, sitemapResponse, SitemapEntry } from "@/lib/sitemap";

export const revalidate = 3600;

const LOCALES = ["en", "fr"] as const;

async function getImageEntries(): Promise<SitemapEntry[]> {
  return unstable_cache(
    async () => {
      // Join yachts with their images to build the image sitemap
      const rows = await db
        .select({
          yachtSlug: yachtModels.slug,
          imageUrl: images.url,
          caption: images.caption,
          altText: images.altText,
        })
        .from(yachtModels)
        .innerJoin(images, eq(images.yachtModelId, yachtModels.id))
        .where(isNotNull(yachtModels.slug))
        .orderBy(yachtModels.id);

      // Group by yacht slug
      const yachtImageMap = new Map<
        string,
        Array<{ loc: string; caption?: string; title?: string }>
      >();

      for (const row of rows) {
        if (!row.yachtSlug) continue;
        const slug = row.yachtSlug;

        if (!yachtImageMap.has(slug)) {
          yachtImageMap.set(slug, []);
        }

        yachtImageMap.get(slug)!.push({
          loc: row.imageUrl,
          caption: row.caption || row.altText || undefined,
          title: row.altText || undefined,
        });
      }

      // Build entries for both locales, limiting to 10 images per yacht
      const entries: SitemapEntry[] = [];
      for (const [slug, imgs] of yachtImageMap) {
        for (const locale of LOCALES) {
          entries.push({
            loc: `${SITE_URL}/${locale}/yachts/${slug}`,
            changefreq: "weekly",
            priority: "0.7",
            images: imgs.slice(0, 10),
          });
        }
      }

      return entries;
    },
    ["sitemap-images"],
    { tags: ["yachts"], revalidate: 3600 }
  )();
}

export async function GET() {
  try {
    const entries = await getImageEntries();
    return sitemapResponse(buildSitemapXml(entries));
  } catch (error) {
    console.error("[sitemap-images] Error:", error);
    return sitemapResponse(buildSitemapXml([]));
  }
}
