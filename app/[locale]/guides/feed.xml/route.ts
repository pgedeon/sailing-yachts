import { getAllPublishedArticles } from "@/lib/articles";
import { getSiteUrl } from "@/lib/seo";

export const revalidate = 3600;

export async function GET() {
  const articles = await getAllPublishedArticles();
  const siteUrl = getSiteUrl();

  const items = articles
    .map((article) => {
      const pubDate = article.publishedAt
        ? new Date(article.publishedAt).toUTCString()
        : new Date(article.createdAt).toUTCString();
      const link = `${siteUrl}/guides/${article.slug}`;
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
    <title>Sailing Yacht Info - Guides</title>
    <description>Expert sailing guides, buying advice, and educational resources for yacht buyers and sailors.</description>
    <link>${siteUrl}/guides</link>
    <atom:link href="${siteUrl}/guides/feed.xml" rel="self" type="application/rss+xml" />
    <language>en</language>
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
