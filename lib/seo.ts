/**
 * SEO utilities for generating dynamic meta tags, Open Graph data,
 * and JSON-LD structured data across the Sailing Yachts app.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sailing-yachts.vercel.app";
const SITE_NAME = "Sailing Yachts Database";

export function getSiteUrl(path = ""): string {
  return `${SITE_URL}${path}`;
}

/* ------------------------------------------------------------------ */
/*  JSON-LD Structured Data                                           */
/* ------------------------------------------------------------------ */

export interface JsonLdWebsite {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  description: string;
  potentialAction: {
    "@type": "SearchAction";
    target: string;
    "query-input": string;
  };
}

export function generateWebsiteJsonLd(): JsonLdWebsite {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Comprehensive database of sailing yacht specifications with advanced search and comparison tools.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/yachts?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export interface JsonLdProduct {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  description: string;
  url: string;
  brand: {
    "@type": "Brand";
    name: string;
  };
  image?: string;
  additionalProperty: Array<{
    "@type": "PropertyValue";
    name: string;
    value: string | number;
    unitCode?: string;
  }>;
}

export function generateYachtJsonLd(yacht: {
  manufacturer: string;
  modelName: string;
  year: number;
  slug: string;
  description?: string | null;
  lengthOverall?: number | null;
  beam?: number | null;
  draft?: number | null;
  displacement?: number | null;
  hullMaterial?: string | null;
  rigType?: string | null;
  cabins?: number | null;
  primaryImage?: string;
}): JsonLdProduct {
  const props: JsonLdProduct["additionalProperty"] = [];

  if (yacht.lengthOverall) props.push({ "@type": "PropertyValue", name: "Length Overall", value: yacht.lengthOverall, unitCode: "MTR" });
  if (yacht.beam) props.push({ "@type": "PropertyValue", name: "Beam", value: yacht.beam, unitCode: "MTR" });
  if (yacht.draft) props.push({ "@type": "PropertyValue", name: "Draft", value: yacht.draft, unitCode: "MTR" });
  if (yacht.displacement) props.push({ "@type": "PropertyValue", name: "Displacement", value: yacht.displacement, unitCode: "KGM" });
  if (yacht.hullMaterial) props.push({ "@type": "PropertyValue", name: "Hull Material", value: yacht.hullMaterial });
  if (yacht.rigType) props.push({ "@type": "PropertyValue", name: "Rig Type", value: yacht.rigType });
  if (yacht.cabins) props.push({ "@type": "PropertyValue", name: "Cabins", value: yacht.cabins });

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${yacht.manufacturer} ${yacht.modelName} (${yacht.year})`,
    description: yacht.description || `${yacht.manufacturer} ${yacht.modelName} sailing yacht specifications and details.`,
    url: getSiteUrl(`/yachts/${yacht.slug}`),
    brand: {
      "@type": "Brand",
      name: yacht.manufacturer,
    },
    image: yacht.primaryImage,
    additionalProperty: props,
  };
}

export interface JsonLdBreadcrumb {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string;
  }>;
}

export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; path?: string }>
): JsonLdBreadcrumb {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      ...(item.path ? { item: getSiteUrl(item.path) } : {}),
    })),
  };
}

/* ------------------------------------------------------------------ */
/*  Page-level metadata helpers                                       */
/* ------------------------------------------------------------------ */

import type { Metadata } from "next";

export function generateYachtPageMetadata(yacht: {
  manufacturer: string;
  modelName: string;
  year: number;
  slug: string;
  description?: string | null;
  lengthOverall?: number | null;
  primaryImage?: string;
}): Metadata {
  const title = `${yacht.manufacturer} ${yacht.modelName} (${yacht.year})`;
  const desc =
    yacht.description ||
    `${yacht.manufacturer} ${yacht.modelName} sailing yacht — detailed specs, dimensions, sail plan and accommodation. ${yacht.lengthOverall ? `${yacht.lengthOverall}m LOA.` : ""}`;

  return {
    title,
    description: desc,
    keywords: [
      yacht.manufacturer,
      yacht.modelName,
      `${yacht.manufacturer} ${yacht.modelName}`,
      "sailing yacht specs",
      "yacht dimensions",
      `${yacht.year} yacht`,
    ],
    openGraph: {
      title,
      description: desc,
      url: getSiteUrl(`/yachts/${yacht.slug}`),
      type: "website",
      siteName: SITE_NAME,
      ...(yacht.primaryImage ? { images: [{ url: yacht.primaryImage }] } : {}),
    },
    twitter: {
      card: yacht.primaryImage ? "summary_large_image" : "summary",
      title,
      description: desc,
      ...(yacht.primaryImage ? { images: [yacht.primaryImage] } : {}),
    },
    alternates: {
      canonical: getSiteUrl(`/yachts/${yacht.slug}`),
    },
  };
}

export function generateYachtsListMetadata(page = 1): Metadata {
  const title = page > 1 ? `Browse Yachts (Page ${page})` : "Browse Sailing Yachts";
  const desc =
    "Search and filter sailing yachts by manufacturer, length, year, and more. Compare specs side by side.";

  return {
    title,
    description: desc,
    keywords: [
      "browse sailing yachts",
      "yacht database",
      "sailboat search",
      "filter yachts",
      "boat specs",
    ],
    openGraph: {
      title,
      description: desc,
      url: getSiteUrl("/yachts"),
      type: "website",
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary",
      title,
      description: desc,
    },
    alternates: {
      canonical: getSiteUrl("/yachts"),
    },
  };
}

export function generateCompareMetadata(ids: number[]): Metadata {
  const title = ids.length > 0 ? `Compare ${ids.length} Yachts` : "Compare Yachts Side by Side";
  const desc =
    ids.length > 0
      ? `Compare ${ids.length} sailing yachts side by side — dimensions, sail plan, accommodation, and more.`
      : "Select sailing yachts to compare specifications, dimensions, and features side by side.";

  return {
    title,
    description: desc,
    keywords: [
      "compare yachts",
      "yacht comparison",
      "sailboat comparison tool",
      "boat specs comparison",
    ],
    openGraph: {
      title,
      description: desc,
      url: getSiteUrl("/compare"),
      type: "website",
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary",
      title,
      description: desc,
    },
    alternates: {
      canonical: getSiteUrl("/compare"),
    },
  };
}
