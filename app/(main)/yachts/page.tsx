import type { Metadata } from "next";
import { generateYachtsListMetadata, generateBreadcrumbJsonLd, generateCollectionPageJsonLd, getSiteUrl } from "@/lib/seo";
import { Suspense } from "react";
import YachtsClient from "./YachtsClient";
import { shouldNoindexYachtsPage, generateYachtsPageCanonical } from "@/lib/thin-page-governance";

// Removed force-dynamic - this page is a client component shell
// No need for ISR since it's entirely client-rendered

interface YachtsPageParams {
  searchParams: Promise<{
    page?: string;
    'filters[manufacturers]'?: string[];
    'filters[rigType]'?: string;
    'filters[keelType]'?: string;
    'filters[hullMaterial]'?: string;
    'filters[lengthMin]'?: string;
    'filters[lengthMax]'?: string;
    'filters[displacementMin]'?: string;
    'filters[displacementMax]'?: string;
    'filters[cabinsMin]'?: string;
    'filters[cabinsMax]'?: string;
  }>;
}

/**
 * Generate dynamic metadata for yachts page based on search params.
 * Implements thin-page governance with canonical URLs and noindex rules.
 */
export async function generateMetadata({ searchParams }: YachtsPageParams): Promise<Metadata> {
  const params = await searchParams;

  const normalizedParams = {
    page: params.page,
    manufacturers: params['filters[manufacturers]'],
    rigType: params['filters[rigType]'],
    keelType: params['filters[keelType]'],
    hullMaterial: params['filters[hullMaterial]'],
    lengthMin: params['filters[lengthMin]'],
    lengthMax: params['filters[lengthMax]'],
    displacementMin: params['filters[displacementMin]'],
    displacementMax: params['filters[displacementMax]'],
    cabinsMin: params['filters[cabinsMin]'],
    cabinsMax: params['filters[cabinsMax]'],
  };

  const noindex = shouldNoindexYachtsPage(normalizedParams);
  const canonicalPath = generateYachtsPageCanonical(normalizedParams);
  const canonicalUrl = getSiteUrl(canonicalPath);

  const baseMetadata = generateYachtsListMetadata();

  return {
    ...baseMetadata,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default async function YachtsPage({ searchParams }: YachtsPageParams) {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Browse Yachts" },
  ]);

  const collectionJsonLd = generateCollectionPageJsonLd({
    name: "Browse Sailing Yachts",
    description: "Search and filter sailing yachts by manufacturer, length, year, and more.",
    url: getSiteUrl("/yachts"),
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-10">Loading...</div>}>
        <YachtsClient />
      </Suspense>
    </>
  );
}
