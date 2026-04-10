const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://info.sailboats.fr";

export const revalidate = 86400;

export async function GET() {
  const body = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/sitemap-yachts.xml
Sitemap: ${SITE_URL}/sitemap-manufacturers.xml
Sitemap: ${SITE_URL}/sitemap-compare.xml
Sitemap: ${SITE_URL}/sitemap-images.xml
Sitemap: ${SITE_URL}/sitemap-pages.xml

# Crawl-delay (polite crawling)
Crawl-delay: 1
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "s-maxage=86400, stale-while-revalidate",
    },
  });
}
