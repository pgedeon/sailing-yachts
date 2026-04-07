/**
 * SEO utilities for generating dynamic meta tags, Open Graph data,
 * and JSON-LD structured data across the Sailing Yachts app.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sailing-yachts.vercel.app";
const SITE_NAME = "Sailing Yachts Database";

export function getSiteUrl(path = ""): string {
  return `${SITE_URL}${path}`;
}

export function buildOgImageUrl(params: {
  title: string;
  description?: string | null;
  length?: number | string | null;
}): string {
  const searchParams = new URLSearchParams();
  searchParams.set("title", params.title);

  if (params.description) {
    searchParams.set("description", params.description);
  }

  if (params.length !== null && params.length !== undefined && params.length !== "") {
    const length =
      typeof params.length === "number"
        ? `${params.length.toFixed(1)}m LOA`
        : params.length;
    searchParams.set("length", length);
  }

  return getSiteUrl(`/api/og?${searchParams.toString()}`);
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
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: number;
    reviewCount: number;
    bestRating: number;
    worstRating: number;
  };
  review?: Array<{
    "@type": "Review";
    author: { "@type": "Person"; name: string };
    datePublished?: string;
    reviewRating: { "@type": "Rating"; ratingValue: number; bestRating: number; worstRating: number };
    reviewBody?: string;
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
  reviews?: Array<{
    rating: number;
    summary?: string | null;
    authorName?: string | null;
    reviewDate?: Date | null;
  }> | null;
}): JsonLdProduct {
  const props: JsonLdProduct["additionalProperty"] = [];

  if (yacht.lengthOverall) props.push({ "@type": "PropertyValue", name: "Length Overall", value: yacht.lengthOverall, unitCode: "MTR" });
  if (yacht.beam) props.push({ "@type": "PropertyValue", name: "Beam", value: yacht.beam, unitCode: "MTR" });
  if (yacht.draft) props.push({ "@type": "PropertyValue", name: "Draft", value: yacht.draft, unitCode: "MTR" });
  if (yacht.displacement) props.push({ "@type": "PropertyValue", name: "Displacement", value: yacht.displacement, unitCode: "KGM" });
  if (yacht.hullMaterial) props.push({ "@type": "PropertyValue", name: "Hull Material", value: yacht.hullMaterial });
  if (yacht.rigType) props.push({ "@type": "PropertyValue", name: "Rig Type", value: yacht.rigType });
  if (yacht.cabins) props.push({ "@type": "PropertyValue", name: "Cabins", value: yacht.cabins });

  const result: JsonLdProduct = {
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

  // Add AggregateRating and Review entries if reviews exist
  if (yacht.reviews && yacht.reviews.length > 0) {
    const ratings = yacht.reviews
      .map((r) => r.rating)
      .filter((r) => r > 0);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0;

    if (avgRating > 0) {
      result.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: avgRating,
        reviewCount: ratings.length,
        bestRating: 10,
        worstRating: 1,
      };

      result.review = yacht.reviews
        .filter((r) => r.rating > 0)
        .map((r) => ({
          "@type": "Review" as const,
          author: {
            "@type": "Person" as const,
            name: r.authorName || "Anonymous",
          },
          ...(r.reviewDate
            ? { datePublished: r.reviewDate.toISOString().split("T")[0] }
            : {}),
          reviewRating: {
            "@type": "Rating" as const,
            ratingValue: r.rating,
            bestRating: 10,
            worstRating: 1,
          },
          ...(r.summary ? { reviewBody: r.summary } : {}),
        }));
    }
  }

  return result;
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
/*  CollectionPage Structured Data                                      */
/* ------------------------------------------------------------------ */

export interface JsonLdCollectionPage {
  "@context": "https://schema.org";
  "@type": "CollectionPage";
  name: string;
  description: string;
  url: string;
  numberOfItems?: number;
}

export function generateCollectionPageJsonLd(params: {
  name: string;
  description: string;
  url: string;
  itemCount?: number;
}): JsonLdCollectionPage {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: params.name,
    description: params.description,
    url: params.url,
    numberOfItems: params.itemCount,
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
  const ogImage =
    yacht.primaryImage ||
    buildOgImageUrl({
      title: yacht.modelName,
      description: yacht.manufacturer,
      length: yacht.lengthOverall,
    });

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
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${yacht.manufacturer} ${yacht.modelName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [ogImage],
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

/* ------------------------------------------------------------------ */
/*  FAQ Structured Data                                               */
/* ------------------------------------------------------------------ */

export interface JsonLdFAQ {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

export function generateFaqJsonLd(yacht: {
  manufacturer: string;
  modelName: string;
  displacement?: number | null;
  lengthOverall?: number | null;
  draft?: number | null;
  cabins?: number | null;
  beam?: number | null;
}): JsonLdFAQ | null {
  const fullName = `${yacht.manufacturer} ${yacht.modelName}`;
  const questions: JsonLdFAQ["mainEntity"] = [];

  if (yacht.displacement) {
    questions.push({
      "@type": "Question",
      name: `How much does ${fullName} weigh?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `The ${fullName} has a displacement of ${yacht.displacement.toLocaleString()} kg (${(yacht.displacement * 2.20462).toLocaleString(undefined, {maximumFractionDigits: 0})} lbs).`,
      },
    });
  }

  if (yacht.lengthOverall) {
    questions.push({
      "@type": "Question",
      name: `How long is ${fullName}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `The ${fullName} has a length overall (LOA) of ${yacht.lengthOverall} m (${(yacht.lengthOverall * 3.28084).toFixed(1)} ft).`,
      },
    });
  }

  if (yacht.draft) {
    questions.push({
      "@type": "Question",
      name: `What is the draft of ${fullName}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `The ${fullName} has a draft of ${yacht.draft} m (${(yacht.draft * 3.28084).toFixed(1)} ft).`,
      },
    });
  }

  if (yacht.cabins) {
    questions.push({
      "@type": "Question",
      name: `How many cabins does ${fullName} have?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `The ${fullName} has ${yacht.cabins} cabin${yacht.cabins > 1 ? "s" : ""}.`,
      },
    });
  }

  if (questions.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions,
  };
}

/* ------------------------------------------------------------------ */
/*  SiteNavigationElement Structured Data                             */
/* ------------------------------------------------------------------ */

export function generateSiteNavigationJsonLd(navItems: Array<{name: string; path: string}>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Site Navigation",
    itemListElement: navItems.map((item, idx) => ({
      "@type": "SiteNavigationElement",
      position: idx + 1,
      name: item.name,
      url: getSiteUrl(item.path),
    })),
  };
}
