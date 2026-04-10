import type { Metadata } from "next";
import { generateCompareMetadata, generateBreadcrumbJsonLd, getSiteUrl } from "@/lib/seo";
import { CompareClient } from "./CompareClient";
import { shouldNoindexComparePage } from "@/lib/thin-page-governance";

// Removed force-dynamic - this page is a client component shell
// No need for ISR since it's entirely client-rendered

interface ComparePageParams {
  searchParams: Promise<{ ids?: string }>;
}

/**
 * Generate dynamic metadata for compare page.
 * The ?ids= version should be noindexed since canonical compare pages exist at /compare/slugA-vs-slugB.
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

  // Always noindex the ?ids= version since canonical compare pages exist
  return {
    ...baseMetadata,
    robots: shouldNoindexComparePage(initialIds)
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const initialIds = ids
    ? ids
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id))
    : [];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Compare Yachts" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CompareClient initialIds={initialIds} />
    </>
  );
}
