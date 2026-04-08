import { LANDING_PAGES } from "@/data/landing-pages";
import type { LandingPageDefinition } from "@/data/landing-pages";
import { SITE_URL, buildSitemapXml, sitemapResponse, SitemapEntry } from "@/lib/sitemap";

export const revalidate = 86400;

export async function GET() {
  const entries: SitemapEntry[] = [
    { loc: `${SITE_URL}/`, changefreq: "daily", priority: "1.0" },
    { loc: `${SITE_URL}/yachts`, changefreq: "daily", priority: "0.9" },
    { loc: `${SITE_URL}/manufacturers`, changefreq: "weekly", priority: "0.8" },
    { loc: `${SITE_URL}/compare`, changefreq: "weekly", priority: "0.7" },
    { loc: `${SITE_URL}/search`, changefreq: "monthly", priority: "0.6" },
    { loc: `${SITE_URL}/favorites`, changefreq: "monthly", priority: "0.4" },
    // Landing pages from /best/[slug]
    ...LANDING_PAGES.map((lp: LandingPageDefinition) => ({
      loc: `${SITE_URL}/best/${lp.slug}`,
      changefreq: "weekly" as const,
      priority: "0.8",
    })),
  ];

  return sitemapResponse(buildSitemapXml(entries));
}
