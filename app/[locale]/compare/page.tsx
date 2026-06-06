import type { Metadata } from "next";
import { getTranslations , setRequestLocale } from "next-intl/server";
import { generateCompareMetadata, generateBreadcrumbJsonLd, getSiteUrl , buildLocaleAlternates } from "@/lib/seo";
import dynamic from "next/dynamic";
const CompareClient = dynamic(() => import("./CompareClient").then(m => ({ default: m.CompareClient })), { ssr: false, loading: () => null });
import { shouldNoindexComparePage } from "@/lib/thin-page-governance";

interface ComparePageParams {
  searchParams: Promise<{ ids?: string }>;
  params: { locale: string };
}

/**
 * Generate dynamic metadata for compare page.
 * The ?ids= version should be noindexed since canonical compare pages exist at /compare/slugA-vs-slugB.
 * The base /compare page should be indexed as the comparison tool landing page.
 */
export async function generateMetadata({ searchParams }: ComparePageParams): Promise<Metadata> {
  const { ids } = await searchParams;
  const initialIds = ids
    ? ids
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id))
    : [];

  const baseMetadata = generateCompareMetadata(initialIds);

  return {
    ...baseMetadata,
    alternates: buildLocaleAlternates("/compare"),
    robots: shouldNoindexComparePage(initialIds)
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default async function ComparePage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ ids?: string }>;
  params: { locale: string };
}) {
  const { ids } = await searchParams;
  const { locale } = params;
  // Enable static rendering for next-intl
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Compare" });

  const initialIds = ids
    ? ids
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id))
    : [];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: t("heading"), path: "/compare" },
  ], locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* SSR H1 for SEO */}
      <h1 className="sr-only">{t("heading")}</h1>
      <CompareClient initialIds={initialIds} />
    </>
  );
}
