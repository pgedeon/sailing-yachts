/**
 * SEO utilities for generating dynamic meta tags, Open Graph data,
 * and JSON-LD structured data across the Sailing Yacht Info app.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://info.sailboats.fr";
const SITE_NAME = "Sailing Yacht Info";

export function getSiteUrl(path = ""): string {
  return `${SITE_URL}${path}`;
}

/**
 * Build locale-aware alternate URLs for hreflang tags.
 * Given a path like "/yachts/beneteau-first-27", returns:
 * { canonical: "/en/yachts/beneteau-first-27", languages: { en: "/en/...", fr: "/fr/..." } }
 * If path already starts with /en or /fr, strips it first.
 */
export function buildLocaleAlternates(pathWithoutLocale: string): {
  canonical: string;
  languages: Record<string, string>;
} {
  const clean = pathWithoutLocale.replace(/^\/(en|fr)/, "");
  const path = clean.startsWith("/") ? clean : "/" + clean;
  return {
    canonical: getSiteUrl(`/en${path}`),
    languages: {
      en: getSiteUrl(`/en${path}`),
      fr: getSiteUrl(`/fr${path}`),
    },
  };
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

const SITE_DESCRIPTIONS: Record<string, string> = {
  en: "Comprehensive database of sailing yacht specifications with advanced search and comparison tools.",
  fr: "Base de données complète de spécifications de voiliers avec recherche avancée et outils de comparaison.",
};

export function generateWebsiteJsonLd(locale = "en"): JsonLdWebsite {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${SITE_URL}/${locale}`,
    description: SITE_DESCRIPTIONS[locale] || SITE_DESCRIPTIONS.en,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/${locale}/yachts?q={search_term_string}`,
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
}, locale = "en"): JsonLdProduct {
  // Localized property names
  const propNames: Record<string, Record<string, string>> = {
    loa: { en: "Length Overall", fr: "Longueur hors tout" },
    beam: { en: "Beam", fr: "Bau" },
    draft: { en: "Draft", fr: "Tirant d\'eau" },
    displacement: { en: "Displacement", fr: "Déplacement" },
    hullMaterial: { en: "Hull Material", fr: "Matériau de coque" },
    rigType: { en: "Rig Type", fr: "Type de gréement" },
    cabins: { en: "Cabins", fr: "Cabines" },
  };

  const descFallbacks: Record<string, string> = {
    en: "sailing yacht specifications and details",
    fr: "spécifications et détails du voilier",
  };

  const props: JsonLdProduct["additionalProperty"] = [];

  if (yacht.lengthOverall) props.push({ "@type": "PropertyValue", name: propNames.loa[locale] || propNames.loa.en, value: yacht.lengthOverall, unitCode: "MTR" });
  if (yacht.beam) props.push({ "@type": "PropertyValue", name: propNames.beam[locale] || propNames.beam.en, value: yacht.beam, unitCode: "MTR" });
  if (yacht.draft) props.push({ "@type": "PropertyValue", name: propNames.draft[locale] || propNames.draft.en, value: yacht.draft, unitCode: "MTR" });
  if (yacht.displacement) props.push({ "@type": "PropertyValue", name: propNames.displacement[locale] || propNames.displacement.en, value: yacht.displacement, unitCode: "KGM" });
  if (yacht.hullMaterial) props.push({ "@type": "PropertyValue", name: propNames.hullMaterial[locale] || propNames.hullMaterial.en, value: yacht.hullMaterial });
  if (yacht.rigType) props.push({ "@type": "PropertyValue", name: propNames.rigType[locale] || propNames.rigType.en, value: yacht.rigType });
  if (yacht.cabins) props.push({ "@type": "PropertyValue", name: propNames.cabins[locale] || propNames.cabins.en, value: yacht.cabins });

  const result: JsonLdProduct = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${yacht.manufacturer} ${yacht.modelName} (${yacht.year})`,
    description: yacht.description || `${yacht.manufacturer} ${yacht.modelName} ${descFallbacks[locale] || descFallbacks.en}.`,
    url: getSiteUrl(`/${locale}/yachts/${yacht.slug}`),
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
  items: Array<{ name: string; path?: string }>,
  locale?: string
): JsonLdBreadcrumb {
  const localePrefix = locale ? `/${locale}` : "";
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      ...(item.path ? { item: getSiteUrl(`${localePrefix}${item.path}`) } : {}),
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


/* ------------------------------------------------------------------ */
/*  LocalBusiness Structured Data (Partner Offers)                    */
/* ------------------------------------------------------------------ */

export interface JsonLdLocalBusiness {
  "@context": "https://schema.org";
  "@type": "LocalBusiness";
  name: string;
  description: string;
  url: string;
  address?: {
    "@type": "PostalAddress";
    addressLocality?: string;
    addressCountry?: string;
  };
  contactPoint?: {
    "@type": "ContactPoint";
    email?: string;
    telephone?: string;
    contactType: string;
  };
  openingHoursSpecification?: Array<{
    "@type": "OpeningHoursSpecification";
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }>;
}

export function generateLocalBusinessJsonLd(params: {
  name: string;
  description: string;
  url: string;
  address?: {
    city?: string;
    country?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
  };
  openingHours?: Array<{
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }>;
}): JsonLdLocalBusiness {
  const result: JsonLdLocalBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: params.name,
    description: params.description,
    url: params.url,
  };

  if (params.address) {
    result.address = {
      "@type": "PostalAddress",
      ...(params.address.city ? { addressLocality: params.address.city } : {}),
      ...(params.address.country ? { addressCountry: params.address.country } : {}),
    };
  }

  if (params.contact) {
    result.contactPoint = {
      "@type": "ContactPoint",
      contactType: "sales",
      ...(params.contact.email ? { email: params.contact.email } : {}),
      ...(params.contact.phone ? { telephone: params.contact.phone } : {}),
    };
  }

  if (params.openingHours && params.openingHours.length > 0) {
    result.openingHoursSpecification = params.openingHours.map((oh) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: oh.dayOfWeek,
      opens: oh.opens,
      closes: oh.closes,
    }));
  }

  return result;
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
}, locale = "en"): Metadata {
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
      url: getSiteUrl(`/${locale}/yachts/${yacht.slug}`),
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
  const title = page > 1 ? `Browse Yachts (Page ${page})` : "Browse Sailing Yachts — Specs, Dimensions & Comparison";
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
}, locale = "en"): JsonLdFAQ | null {
  const fullName = `${yacht.manufacturer} ${yacht.modelName}`;
  const questions: JsonLdFAQ["mainEntity"] = [];

  // French templates
  const templates: Record<string, {
    weightQ: (n: string) => string;
    weightA: (n: string, kg: string, lbs: string) => string;
    lengthQ: (n: string) => string;
    lengthA: (n: string, m: string, ft: string) => string;
    draftQ: (n: string) => string;
    draftA: (n: string, m: string, ft: string) => string;
    cabinsQ: (n: string) => string;
    cabinsA: (n: string, c: number) => string;
  }> = {
    en: {
      weightQ: (n) => `How much does ${n} weigh?`,
      weightA: (n, kg, lbs) => `The ${n} has a displacement of ${kg} kg (${lbs} lbs).`,
      lengthQ: (n) => `How long is ${n}?`,
      lengthA: (n, m, ft) => `The ${n} has a length overall (LOA) of ${m} m (${ft} ft).`,
      draftQ: (n) => `What is the draft of ${n}?`,
      draftA: (n, m, ft) => `The ${n} has a draft of ${m} m (${ft} ft).`,
      cabinsQ: (n) => `How many cabins does ${n} have?`,
      cabinsA: (n, c) => `The ${n} has ${c} cabin${c > 1 ? "s" : ""}.`,
    },
    fr: {
      weightQ: (n) => `Combien pèse le ${n} ?`,
      weightA: (n, kg, lbs) => `Le ${n} a un déplacement de ${kg} kg (${lbs} lbs).`,
      lengthQ: (n) => `Quelle est la longueur du ${n} ?`,
      lengthA: (n, m, ft) => `Le ${n} a une longueur hors tout (LOA) de ${m} m (${ft} ft).`,
      draftQ: (n) => `Quel est le tirant d'eau du ${n} ?`,
      draftA: (n, m, ft) => `Le ${n} a un tirant d'eau de ${m} m (${ft} ft).`,
      cabinsQ: (n) => `Combien de cabines possède le ${n} ?`,
      cabinsA: (n, c) => `Le ${n} possède ${c} cabine${c > 1 ? "s" : ""}.`,
    },
  };

  const t = templates[locale] || templates.en;

  if (yacht.displacement) {
    const kg = yacht.displacement.toLocaleString();
    const lbs = (yacht.displacement * 2.20462).toLocaleString(undefined, {maximumFractionDigits: 0});
    questions.push({
      "@type": "Question",
      name: t.weightQ(fullName),
      acceptedAnswer: { "@type": "Answer", text: t.weightA(fullName, kg, lbs) },
    });
  }

  if (yacht.lengthOverall) {
    const m = String(yacht.lengthOverall);
    const ft = (yacht.lengthOverall * 3.28084).toFixed(1);
    questions.push({
      "@type": "Question",
      name: t.lengthQ(fullName),
      acceptedAnswer: { "@type": "Answer", text: t.lengthA(fullName, m, ft) },
    });
  }

  if (yacht.draft) {
    const m = String(yacht.draft);
    const ft = (yacht.draft * 3.28084).toFixed(1);
    questions.push({
      "@type": "Question",
      name: t.draftQ(fullName),
      acceptedAnswer: { "@type": "Answer", text: t.draftA(fullName, m, ft) },
    });
  }

  if (yacht.cabins) {
    questions.push({
      "@type": "Question",
      name: t.cabinsQ(fullName),
      acceptedAnswer: { "@type": "Answer", text: t.cabinsA(fullName, yacht.cabins) },
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

/* ------------------------------------------------------------------ */
/*  ImageObject Structured Data                                       */
/* ------------------------------------------------------------------ */

export interface JsonLdImageObject {
  "@context": "https://schema.org";
  "@type": "ImageObject";
  contentUrl: string;
  name?: string;
  description?: string;
  width?: number;
  height?: number;
  creditText?: string;
}

export function generateImageObjectJsonLd(params: {
  url: string;
  name?: string;
  description?: string;
  width?: number;
  height?: number;
  creditText?: string;
}): JsonLdImageObject {
  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    contentUrl: params.url,
    ...(params.name ? { name: params.name } : {}),
    ...(params.description ? { description: params.description } : {}),
    ...(params.width ? { width: params.width } : {}),
    ...(params.height ? { height: params.height } : {}),
    ...(params.creditText ? { creditText: params.creditText } : {}),
  };
}

/* ------------------------------------------------------------------ */
/*  ItemList for browse/list pages                                    */
/* ------------------------------------------------------------------ */

export interface JsonLdItemList {
  "@context": "https://schema.org";
  "@type": "ItemList";
  name: string;
  description?: string;
  numberOfItems?: number;
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    url: string;
  }>;
}

export function generateItemListJsonLd(params: {
  name: string;
  description?: string;
  items: Array<{ name: string; url: string }>;
}): JsonLdItemList {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: params.name,
    ...(params.description ? { description: params.description } : {}),
    numberOfItems: params.items.length,
    itemListElement: params.items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      url: item.url.startsWith("http") ? item.url : getSiteUrl(item.url),
    })),
  };
}

/* ------------------------------------------------------------------ */
/*  VideoObject for video media assets (P10.8)                       */
/* ------------------------------------------------------------------ */

export interface JsonLdVideoObject {
  "@context": "https://schema.org";
  "@type": "VideoObject";
  name: string;
  description?: string;
  thumbnailUrl?: string;
  contentUrl?: string;
  embedUrl?: string;
  uploadDate?: string;
  duration?: string;
}

export function generateVideoObjectJsonLd(params: {
  name: string;
  description?: string;
  thumbnailUrl?: string;
  contentUrl?: string;
  embedUrl?: string;
  uploadDate?: string;
  duration?: string;
}): JsonLdVideoObject {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: params.name,
    ...(params.description ? { description: params.description } : {}),
    ...(params.thumbnailUrl ? { thumbnailUrl: params.thumbnailUrl } : {}),
    ...(params.contentUrl ? { contentUrl: params.contentUrl } : {}),
    ...(params.embedUrl ? { embedUrl: params.embedUrl } : {}),
    ...(params.uploadDate ? { uploadDate: params.uploadDate } : {}),
    ...(params.duration ? { duration: params.duration } : {}),
  };
}

/* ------------------------------------------------------------------ */
/*  DigitalDocument for brochures/deck plans (P10.8)                 */
/* ------------------------------------------------------------------ */

export interface JsonLdDigitalDocument {
  "@context": "https://schema.org";
  "@type": "DigitalDocument";
  name: string;
  description?: string;
  url?: string;
  encodingFormat?: string;
}

export function generateDigitalDocumentJsonLd(params: {
  name: string;
  description?: string;
  url?: string;
  encodingFormat?: string;
}): JsonLdDigitalDocument {
  return {
    "@context": "https://schema.org",
    "@type": "DigitalDocument",
    name: params.name,
    ...(params.description ? { description: params.description } : {}),
    ...(params.url ? { url: params.url } : {}),
    ...(params.encodingFormat ? { encodingFormat: params.encodingFormat } : {}),
  };
}
