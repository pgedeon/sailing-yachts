import type { Metadata } from "next";
import { generateBreadcrumbJsonLd, getSiteUrl } from "@/lib/seo";
import dynamic from "next/dynamic";
const SearchClient = dynamic(() => import("./SearchClient").then(m => ({ default: m.SearchClient })), { ssr: false, loading: () => null });
import { shouldNoindexSearchPage } from "@/lib/thin-page-governance";

/**
 * Search page metadata.
 * Search results pages should be noindexed for user-specific queries,
 * but the base /search page itself can be indexed.
 */
export const metadata: Metadata = {
  title: "Search Yachts — Sailing Yacht Info",
  description:
    "Search sailing yachts by manufacturer, model name, rig type, keel type, and more. Find the perfect sailboat with our comprehensive database.",
  alternates: {
    canonical: "/search",
  },
  openGraph: {
    title: "Search Sailing Yacht Info",
    description:
      "Search and find sailing yachts by manufacturer, model, and specifications.",
  },
  robots: shouldNoindexSearchPage()
    ? { index: false, follow: false }
    : { index: true, follow: true },
};

export default function SearchPage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Search" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SearchClient />
    </>
  );
}
