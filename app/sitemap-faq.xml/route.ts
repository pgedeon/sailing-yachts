import { getAllManufacturerSlugs } from "@/lib/faq-generation";
import { SIZE_CATEGORIES } from "@/lib/size-categories";
import { SITE_URL, buildSitemapXml, sitemapResponse, SitemapEntry } from "@/lib/sitemap";

export const revalidate = 86400;

const LOCALES = ["en", "fr"] as const;

export async function GET() {
  const lastmod = new Date().toISOString().split("T")[0];
  const entries: SitemapEntry[] = [];

  // General FAQ pages
  for (const locale of LOCALES) {
    entries.push({
      loc: `${SITE_URL}/${locale}/faq`,
      lastmod,
      changefreq: "weekly",
      priority: "0.7",
    });
  }

  // Manufacturer FAQ pages
  const mfrSlugs = await getAllManufacturerSlugs();
  for (const slug of mfrSlugs) {
    for (const locale of LOCALES) {
      entries.push({
        loc: `${SITE_URL}/${locale}/faq/${slug}`,
        lastmod,
        changefreq: "weekly",
        priority: "0.6",
      });
    }
  }

  // Size category FAQ pages
  for (const cat of SIZE_CATEGORIES) {
    for (const locale of LOCALES) {
      entries.push({
        loc: `${SITE_URL}/${locale}/faq/size/${cat.slug}`,
        lastmod,
        changefreq: "weekly",
        priority: "0.6",
      });
    }
  }

  const xml = buildSitemapXml(entries);
  return sitemapResponse(xml);
}
