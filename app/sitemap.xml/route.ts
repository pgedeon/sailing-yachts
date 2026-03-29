import { db, yachtModels } from "@/lib/db";
import { sql } from "drizzle-orm";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sailing-yachts.vercel.app";

export async function GET() {
  // Fetch all yacht slugs for dynamic URLs
  const yachts: Array<{ slug: string | null; updatedAt: Date | null }> = await db
    .select({
      slug: yachtModels.slug,
      updatedAt: yachtModels.updatedAt,
    })
    .from(yachtModels);

  const staticPages = [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/yachts", changefreq: "daily", priority: "0.9" },
    { path: "/compare", changefreq: "weekly", priority: "0.7" },
  ];

  const urls = [
    ...staticPages.map((p) => `    <url>
      <loc>${SITE_URL}${p.path}</loc>
      <changefreq>${p.changefreq}</changefreq>
      <priority>${p.priority}</priority>
    </url>`),
    ...yachts
      .filter((y: { slug: string | null; updatedAt: Date | null }) => y.slug)
      .map((y: { slug: string | null; updatedAt: Date | null }) => {
        const lastmod = y.updatedAt
          ? `<lastmod>${new Date(y.updatedAt).toISOString()}</lastmod>`
          : "";
        return `    <url>
      <loc>${SITE_URL}/yachts/${y.slug}</loc>
      ${lastmod}
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`;
      }),
  ].join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
