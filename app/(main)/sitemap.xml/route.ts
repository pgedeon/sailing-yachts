import { unstable_cache } from "next/cache";
import { db, yachtModels, manufacturers } from "@/lib/db";
import { isNotNull, sql } from "drizzle-orm";
import {
  SITE_URL,
  buildSitemapIndexXml,
  sitemapResponse,
} from "@/lib/sitemap";

// ISR: Revalidate sitemap index every hour
export const revalidate = 3600;

async function getLastMod(): Promise<string> {
  const result = await db
    .select({ maxUpdate: sql<string>`COALESCE(MAX(${yachtModels.updatedAt}), NOW())` })
    .from(yachtModels);
  return new Date(result[0]?.maxUpdate || Date.now()).toISOString();
}

export async function GET() {
  try {
    const lastmod = await getLastMod();

    const sitemaps = [
      { loc: `${SITE_URL}/sitemap-pages.xml`, lastmod },
      { loc: `${SITE_URL}/sitemap-yachts.xml`, lastmod },
      { loc: `${SITE_URL}/sitemap-manufacturers.xml`, lastmod },
      { loc: `${SITE_URL}/sitemap-compare.xml`, lastmod },
      { loc: `${SITE_URL}/sitemap-images.xml`, lastmod },
    ];

    const xml = buildSitemapIndexXml(sitemaps);
    return sitemapResponse(xml);
  } catch (error) {
    console.error("[sitemap-index] Error:", error);

    // Return a minimal valid sitemap index on error
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-pages.xml</loc>
  </sitemap>
</sitemapindex>`;

    return new Response(fallback, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "no-cache",
      },
    });
  }
}
