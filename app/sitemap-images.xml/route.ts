import { unstable_cache } from "next/cache";
import { db, yachtModels, images } from "@/lib/db";
import { isNotNull, eq, and } from "drizzle-orm";
import { SITE_URL, buildSitemapXml, sitemapResponse, SitemapEntry } from "@/lib/sitemap";

export const revalidate = 3600;

const LOCALES = ["en", "fr"] as const;

async function getImageEntries(): Promise<SitemapEntry[]> {
  return unstable_cache(
    async () => {
      // Join yachts with their PRIMARY images only for image sitemap
      const rows = await db
        .select({
          yachtSlug: yachtModels.slug,
          yachtName: yachtModels.modelName,
          imageUrl: images.url,
          altText: images.altText,
          updatedAt: yachtModels.updatedAt,
        })
        .from(yachtModels)
        .innerJoin(
          images,
          and(
            eq(images.yachtModelId, yachtModels.id),
            eq(images.isPrimary, true)
          )
        )
        .where(isNotNull(yachtModels.slug))
        .orderBy(yachtModels.id);

      // Build entries for both locales — one primary image per yacht
      const entries: SitemapEntry[] = [];
      for (const row of rows) {
        if (!row.yachtSlug) continue;

        const imageTitle = row.altText || row.yachtName || undefined;
        const lastmod = row.updatedAt
          ? new Date(row.updatedAt).toISOString()
          : undefined;

        for (const locale of LOCALES) {
          entries.push({
            loc: `${SITE_URL}/${locale}/yachts/${row.yachtSlug}`,
            lastmod,
            changefreq: "weekly",
            priority: "0.7",
            images: [
              {
                loc: row.imageUrl,
                caption: imageTitle,
                title: imageTitle,
              },
            ],
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
