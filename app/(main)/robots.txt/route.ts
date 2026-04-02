const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sailing-yachts.vercel.app";

export async function GET() {
  const body = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml

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
