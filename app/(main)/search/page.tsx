import type { Metadata } from "next";
import { generateBreadcrumbJsonLd, getSiteUrl } from "@/lib/seo";
import { SearchClient } from "./SearchClient";
import { shouldNoindexSearchPage } from "@/lib/thin-page-governance";

// Removed force-dynamic - this page is a client component shell
// No need for ISR since it's entirely client-rendered

/**
 * Search page metadata.
 * Search results pages should be noindexed (user-specific queries).
 */
export const metadata: Metadata = {
  title: "Search Yachts — Sailing Yachts Database",
  description:
    "Search sailing yachts by manufacturer, model name, rig type, keel type, and more. Find the perfect sailboat with our comprehensive database.",
  openGraph: {
    title: "Search Sailing Yachts",
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
