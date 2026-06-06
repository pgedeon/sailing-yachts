import type { Metadata } from "next";
import { generateBreadcrumbJsonLd, generateCollectionPageJsonLd, getSiteUrl , buildLocaleAlternates, buildOgImageUrl } from "@/lib/seo";
import { Suspense } from "react";
import dynamic from "next/dynamic";
const YachtsClient = dynamic(() => import("./YachtsClient"), { ssr: false, loading: () => null });
import { shouldNoindexYachtsPage, generateYachtsPageCanonical } from "@/lib/thin-page-governance";
import { getYachtsListing, getFilterOptions, type YachtsListingResult, type FilterOptions } from "@/lib/yachts";
import { getTranslations , setRequestLocale } from "next-intl/server";

// Revalidate every 60 minutes — yacht list doesn't change frequently
export const revalidate = 3600;

interface YachtsPageParams {
  params: { locale: string };
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
export async function generateMetadata({ params, searchParams }: YachtsPageParams): Promise<Metadata> {
  const { locale } = params;
  // Enable static rendering for next-intl
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "Yachts" });

  const normalizedParams = {
    page: sp.page,
    manufacturers: sp['filters[manufacturers]'],
    rigType: sp['filters[rigType]'],
    keelType: sp['filters[keelType]'],
    hullMaterial: sp['filters[hullMaterial]'],
    lengthMin: sp['filters[lengthMin]'],
    lengthMax: sp['filters[lengthMax]'],
    displacementMin: sp['filters[displacementMin]'],
    displacementMax: sp['filters[displacementMax]'],
    cabinsMin: sp['filters[cabinsMin]'],
    cabinsMax: sp['filters[cabinsMax]'],
  };

  const noindex = shouldNoindexYachtsPage(normalizedParams);
  const canonicalPath = generateYachtsPageCanonical(normalizedParams);
  const canonicalUrl = getSiteUrl(canonicalPath);

  const ogImage = buildOgImageUrl({ type: "default", title: t("meta.title"), description: t("meta.description") });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
      url: canonicalUrl,
      type: "website",
      siteName: "Sailing Yacht Info",
      images: [{ url: ogImage, width: 1200, height: 630, alt: t("meta.title") }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: t("meta.title"),
      description: t("meta.description"),
      images: [ogImage],
    },
    alternates: buildLocaleAlternates("/yachts"),
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default async function YachtsPage({ params, searchParams }: YachtsPageParams) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "Yachts" });

  // Fetch default listing data server-side for SEO
  // Only pre-fetch for the default (no-filter) view — filtered views use client-side fetching
  const sp = await searchParams;
  const hasFilters = Object.keys(sp).some(k => k.startsWith('filters['));
  const page = parseInt(sp.page || '1', 10);

  let initialData: YachtsListingResult | null = null;
  let filterOptions: FilterOptions | null = null;

  if (!hasFilters) {
    try {
      [initialData, filterOptions] = await Promise.all([
        getYachtsListing(page, 20),
        getFilterOptions(),
      ]);
    } catch (e) {
      // Graceful degradation — client will fetch via API
      console.error('SSR data fetch failed for /yachts:', e);
    }
  }

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: t("heading"), path: "/yachts" },
  ], locale);

  const collectionJsonLd = generateCollectionPageJsonLd({
    name: t("meta.title"),
    description: t("meta.description"),
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
        <YachtsClient
          initialData={initialData}
          filterOptions={filterOptions}
        />
      </Suspense>
    </>
  );
}
