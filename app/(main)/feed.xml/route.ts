import { unstable_cache } from "next/cache";
import { db, yachtModels, manufacturers } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

// ISR: Revalidate feed every hour
export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sailing-yachts.vercel.app";

// Cache feed generation with tag for invalidation
async function getFeedItems() {
  return unstable_cache(
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
    ["feed-items"],
    { tags: ["yachts"], revalidate: 3600 }
  )();
}

export async function GET() {
  const items = await getFeedItems();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Sailing Yachts Database</title>
    <link>${SITE_URL}</link>
    <description>Latest sailing yacht specifications added to the database</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
