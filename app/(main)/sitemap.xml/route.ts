import { unstable_cache } from "next/cache";
import { db, yachtModels, manufacturers } from "@/lib/db";
import { isNotNull } from "drizzle-orm";
import { slugify } from "@/lib/utils/slugify";
import { pool } from "@/lib/db";

// ISR: Revalidate sitemap every hour
export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sailing-yachts.vercel.app";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

function buildUrl(entry: SitemapEntry): string {
  const lastmod = entry.lastmod
    ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>`
    : "";
  const changefreq = entry.changefreq
    ? `<changefreq>${escapeXml(entry.changefreq)}</changefreq>`
    : "";
  const priority = entry.priority
    ? `<priority>${escapeXml(entry.priority)}</priority>`
    : "";

  return `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    ${lastmod}${changefreq}${priority}
  </url>`;
}

// Cache sitemap entries with tags for invalidation
async function getSitemapEntries(): Promise<SitemapEntry[]> {
  return unstable_cache(
    async () => {
      // Fetch yacht slugs with updatedAt
      const yachts: Array<{ slug: string | null; updatedAt: Date | null }> =
        await db
          .select({
            slug: yachtModels.slug,
            updatedAt: yachtModels.updatedAt,
          })
          .from(yachtModels);

      // Fetch manufacturers
      const mfrs: Array<{ id: number | null; name: string | null }> =
        await db.select({ id: manufacturers.id, name: manufacturers.name }).from(manufacturers);

      const entries: SitemapEntry[] = [
        // Static pages
        { loc: `${SITE_URL}/`, changefreq: "daily", priority: "1.0" },
        { loc: `${SITE_URL}/yachts`, changefreq: "daily", priority: "0.9" },
        { loc: `${SITE_URL}/manufacturers`, changefreq: "weekly", priority: "0.8" },
        { loc: `${SITE_URL}/compare`, changefreq: "weekly", priority: "0.7" },
      ];

      // Dynamic yacht pages
      for (const y of yachts) {
        if (y.slug) {
          entries.push({
            loc: `${SITE_URL}/yachts/${y.slug}`,
            lastmod: y.updatedAt ? new Date(y.updatedAt).toISOString() : undefined,
            changefreq: "weekly",
            priority: "0.8",
          });
        }
      }

      // Dynamic manufacturer pages
      for (const m of mfrs) {
        if (m.name) {
          const slug = slugify(m.name);
          entries.push({
            loc: `${SITE_URL}/manufacturers/${slug}`,
            changefreq: "weekly",
            priority: "0.6",
          });
        }
      }

      // Canonical comparison pages (subset of popular pairs)
      // We limit to top yachts by ID to keep sitemap manageable
      const topYachtIds = await pool.query(
        `SELECT id, slug FROM yacht_models WHERE id <= 50 ORDER BY id`
      );
      
      const topYachts = topYachtIds.rows as Array<{ id: number; slug: string }>;
      
      // Generate comparison pairs for top 50 yachts
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
    ["sitemap-entries"],
    { tags: ["yachts", "manufacturers"], revalidate: 3600 }
  )();
}

export async function GET() {
  try {
    const entries = await getSitemapEntries();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(buildUrl).join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("[sitemap] Error generating sitemap:", error);

    // Return a minimal valid sitemap even on error
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new Response(fallback, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "no-cache",
      },
    });
  }
}
