import { pool } from "@/lib/db";
import {
  SITE_URL,
  buildSitemapXml,
  sitemapResponse,
  SitemapEntry,
} from "@/lib/sitemap";

// ISR: Revalidate guides sitemap every 6 hours
export const revalidate = 21600;

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT slug, COALESCE(published_at, created_at) AS published, COALESCE(updated_at, published_at, created_at) AS lastmod
       FROM articles
       WHERE is_published = true
       ORDER BY published_at DESC`
    );

    const entries: SitemapEntry[] = [
      // Guides hub page
      {
        loc: `${SITE_URL}/guides`,
        changefreq: "weekly",
        priority: "0.7",
      },
      // Individual guide pages
      ...result.rows.map(
        (row: { slug: string; published: Date; lastmod: Date }) => ({
          loc: `${SITE_URL}/guides/${row.slug}`,
          lastmod: new Date(row.lastmod).toISOString(),
          changefreq: "monthly" as const,
          priority: "0.6",
        })
      ),
    ];

    return sitemapResponse(buildSitemapXml(entries));
  } catch (error) {
    console.error("[sitemap-guides] Error:", error);

    // Return a minimal valid sitemap on error
    return sitemapResponse(
      buildSitemapXml([
        {
          loc: `${SITE_URL}/guides`,
          changefreq: "weekly",
          priority: "0.7",
        },
      ])
    );
  }
}
