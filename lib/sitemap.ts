/**
 * Shared sitemap utilities for generating XML sitemap entries.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://info.sailboats.fr";

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
  /** Image extensions for image sitemap */
  images?: Array<{
    loc: string;
    caption?: string;
    title?: string;
  }>;
}

export function buildUrl(entry: SitemapEntry): string {
  const lastmod = entry.lastmod
    ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>`
    : "";
  const changefreq = entry.changefreq
    ? `<changefreq>${escapeXml(entry.changefreq)}</changefreq>`
    : "";
  const priority = entry.priority
    ? `<priority>${escapeXml(entry.priority)}</priority>`
    : "";

  const imageTags = entry.images
    ? entry.images
        .map(
          (img) =>
            `    <image:image>
      <image:loc>${escapeXml(img.loc)}</image:loc>${
              img.caption
                ? `\n      <image:caption>${escapeXml(img.caption)}</image:caption>`
                : ""
            }${
              img.title
                ? `\n      <image:title>${escapeXml(img.title)}</image:title>`
                : ""
            }
    </image:image>`
        )
        .join("\n")
    : "";

  return `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    ${lastmod}${changefreq}${priority}${imageTags ? "\n" + imageTags : ""}
  </url>`;
}

export function buildSitemapXml(entries: SitemapEntry[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.map(buildUrl).join("\n")}
</urlset>`;
}

export function buildSitemapIndexXml(
  sitemaps: Array<{ loc: string; lastmod?: string }>
): string {
  const entries = sitemaps
    .map(
      (s) =>
        `  <sitemap>
    <loc>${escapeXml(s.loc)}</loc>${
          s.lastmod ? `\n    <lastmod>${escapeXml(s.lastmod)}</lastmod>` : ""
        }
  </sitemap>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
}

export function sitemapResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
