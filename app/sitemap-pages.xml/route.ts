import { LANDING_PAGES } from "@/data/landing-pages";
import type { LandingPageDefinition } from "@/data/landing-pages";
import { SITE_URL, buildSitemapXml, sitemapResponse, SitemapEntry } from "@/lib/sitemap";

export const revalidate = 86400;

const LOCALES = ["en", "fr"] as const;

export async function GET() {
  // Use current deploy time as lastmod for static pages
  const deployDate = new Date().toISOString().split("T")[0];

  const pages = [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/yachts", changefreq: "daily", priority: "0.9" },
    { path: "/manufacturers", changefreq: "weekly", priority: "0.8" },
    { path: "/guides", changefreq: "weekly", priority: "0.8" },
    { path: "/glossary", changefreq: "monthly", priority: "0.6" },
    { path: "/compare", changefreq: "weekly", priority: "0.7" },
    { path: "/search", changefreq: "monthly", priority: "0.6" },
    { path: "/favorites", changefreq: "monthly", priority: "0.4" },
    { path: "/faq", changefreq: "weekly", priority: "0.7" },
    // Landing pages from /best/[slug]
    ...LANDING_PAGES.map((lp: LandingPageDefinition) => ({
      path: `/best/${lp.slug}`,
      changefreq: "weekly" as const,
      priority: "0.8",
    })),
  ];

  // Generate entries for both locales
  const entries: SitemapEntry[] = pages.flatMap((page) =>
    LOCALES.map((locale) => ({
      loc: `${SITE_URL}/${locale}${page.path === "/" ? "" : page.path}`,
      lastmod: deployDate,
      changefreq: page.changefreq,
      priority: page.priority,
    }))
  );

  return sitemapResponse(buildSitemapXml(entries));
}
