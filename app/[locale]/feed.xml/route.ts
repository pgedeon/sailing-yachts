import { unstable_cache } from "next/cache";
import { db, yachtModels, manufacturers } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { buildSafeQuery } from "@/lib/build-safe";
import { getTranslations } from "next-intl/server";

// ISR: Revalidate feed every hour
export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://info.sailboats.fr";

// French feed channel info
const CHANNEL_INFO: Record<string, { title: string; description: string }> = {
  en: {
    title: "Sailing Yacht Info",
    description: "Latest sailing yacht specifications and updates",
  },
  fr: {
    title: "Sailing Yacht Info — Voiliers",
    description: "Spécifications et actualités des voiliers",
  },
};

async function getFeedItems(locale: string) {
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
            const link = row.yacht.slug ? `${SITE_URL}/${locale}/yachts/${row.yacht.slug}` : "";
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
        []
      );
      return items;
    },
    [`feed-items-${locale}`],
    { tags: ["yachts"], revalidate: 3600 }
  )();
}

export async function GET(
  _request: Request,
  { params }: { params: { locale: string } }
) {
  const { locale } = params;
  const channelInfo = CHANNEL_INFO[locale] || CHANNEL_INFO.en;
  const items = await getFeedItems(locale);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${channelInfo.title}</title>
    <description>${channelInfo.description}</description>
    <link>${SITE_URL}/${locale}</link>
    <atom:link href="${SITE_URL}/${locale}/feed.xml" rel="self" type="application/rss+xml" />
    <language>${locale === "fr" ? "fr" : "en"}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Sailing Yacht Info</generator>
    ${items.length > 0 ? items : `
    <item>
      <title>${locale === "fr" ? "Base de données en construction" : "Building Database"}</title>
      <link>${SITE_URL}/${locale}</link>
      <description>${locale === "fr" ? "La base de données de voiliers est en cours de construction." : "The sailing yacht database is currently building."}</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <guid isPermaLink="true">${SITE_URL}/${locale}</guid>
    </item>`}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
    },
  });
}
