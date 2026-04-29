import { pool } from "@/lib/db";
import {
  SITE_URL,
  buildSitemapXml,
  sitemapResponse,
  SitemapEntry,
} from "@/lib/sitemap";

// ISR: Revalidate guides sitemap every 6 hours
export const revalidate = 21600;

const LOCALES = ["en", "fr"] as const;

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT slug, COALESCE(published_at, created_at) AS published, COALESCE(updated_at, published_at, created_at) AS lastmod
       FROM articles
       WHERE is_published = true
       ORDER BY published_at DESC`
    );

    const pages = [
      // Guides hub page
      { path: "/guides", changefreq: "weekly", priority: "0.7" },
      // Individual guide pages
      ...result.rows.map(
        (row: { slug: string; published: Date; lastmod: Date }) => ({
          path: `/guides/${row.slug}`,
          lastmod: new Date(row.lastmod).toISOString(),
          changefreq: "monthly" as const,
          priority: "0.6",
        })
      ),
    ];

    // Generate entries for both locales
    const entries: SitemapEntry[] = pages.flatMap((page) =>
      LOCALES.map((locale) => ({
        loc: `${SITE_URL}/${locale}${page.path}`,
        lastmod: "lastmod" in page ? page.lastmod : undefined,
        changefreq: page.changefreq,
        priority: page.priority,
      }))
    );

    return sitemapResponse(buildSitemapXml(entries));
  } catch (error) {
    console.error("[sitemap-guides] Error:", error);

    // Return a minimal valid sitemap on error
    return sitemapResponse(
      buildSitemapXml(
        LOCALES.map((locale) => ({
          loc: `${SITE_URL}/${locale}/guides`,
          changefreq: "weekly",
          priority: "0.7",
        }))
      )
    );
  }
}
