import { unstable_cache } from "next/cache";
import { db, yachtModels, manufacturers } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { buildSafeQuery } from "@/lib/build-safe";

// ISR: Revalidate feed every hour
export const revalidate = 3600;

export const dynamic = "force-dynamic";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://info.sailboats.fr";

const FALLBACK_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Sailing Yacht Info</title>
    <description>Latest sailing yacht specifications and updates</description>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Sailing Yacht Info</generator>
    <item>
      <title>Building Database</title>
      <link>${SITE_URL}</link>
      <description>The sailing yacht database is currently building. Live data will appear here once deployment completes.</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <guid isPermaLink="true">${SITE_URL}</guid>
    </item>
  </channel>
</rss>`;

// Cache feed generation with tag for invalidation
async function getFeedItems() {
  return unstable_cache(
    async () => {
      const items = await buildSafeQuery(
        async () => {
          const yachts = await db
            .select({
              yacht: yachtModels,
              manufacturer: manufacturers.name,
            })
            .from(yachtModels)
            .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
            .orderBy(desc(yachtModels.createdAt))
            .limit(50);

          return yachts.map((row: any) => {
            const name = `${row.manufacturer || "Unknown"} ${row.yacht.modelName}`;
            const link = row.yacht.slug ? `${SITE_URL}/yachts/${row.yacht.slug}` : "";
            const desc =
              row.yacht.description ||
              `${name} — ${row.yacht.year} sailing yacht specifications.`;
            const pubDate = row.yacht.createdAt
              ? new Date(row.yacht.createdAt).toUTCString()
              : new Date().toUTCString();

            return `    <item>
      <title><![CDATA[${name} (${row.yacht.year})]]></title>
      <link>${link}</link>
      <description><![CDATA[${desc}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${link}</guid>
    </item>`;
          }).join("\n");
        },
        [] // fallback: empty array
      );

      return items;
    },
    ["feed-items"],
    { tags: ["yachts"], revalidate: 3600 }
  )();
}

export async function GET() {
  const items = await getFeedItems();
  
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Sailing Yacht Info</title>
    <description>Latest sailing yacht specifications and updates</description>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Sailing Yacht Info</generator>
    ${items.length > 0 ? items : `
    <item>
      <title>Building Database</title>
      <link>${SITE_URL}</link>
      <description>The sailing yacht database is currently building. Live data will appear here once deployment completes.</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <guid isPermaLink="true">${SITE_URL}</guid>
    </item>`}
  </channel>
</rss>`,
    {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
      },
    }
  );
}