import { getAllPublishedArticles } from "@/lib/articles";
import { getSiteUrl } from "@/lib/seo";

export const revalidate = 3600;

const CHANNEL_INFO: Record<string, { title: string; description: string }> = {
  en: {
    title: "Sailing Yacht Info - Guides",
    description:
      "Expert sailing guides, buying advice, and educational resources for yacht buyers and sailors.",
  },
  fr: {
    title: "Sailing Yacht Info — Guides",
    description:
      "Guides experts, conseils d'achat et ressources éducatives pour les acheteurs de yachts et marins.",
  },
};

export async function GET(_request: Request, props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const { locale } = params;
  const articles = await getAllPublishedArticles();
  const siteUrl = getSiteUrl();
  const channelInfo = CHANNEL_INFO[locale] || CHANNEL_INFO.en;

  const items = articles
    .map((article) => {
      const pubDate = article.publishedAt
        ? new Date(article.publishedAt).toUTCString()
        : new Date(article.createdAt).toUTCString();
      const link = `${siteUrl}/${locale}/guides/${article.slug}`;
      return `    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${article.excerpt || ""}]]></description>
      ${article.author ? `<author>${article.author}</author>` : ""}
      <pubDate>${pubDate}</pubDate>
      ${article.category ? `<category>${article.category}</category>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${channelInfo.title}</title>
    <description>${channelInfo.description}</description>
    <link>${siteUrl}/${locale}/guides</link>
    <atom:link href="${siteUrl}/${locale}/guides/feed.xml" rel="self" type="application/rss+xml" />
    <language>${locale === "fr" ? "fr" : "en"}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Sailing Yacht Info</generator>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
