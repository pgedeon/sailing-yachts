import type { Metadata } from "next";
import { generateYachtsListMetadata, generateBreadcrumbJsonLd, generateCollectionPageJsonLd, generateItemListJsonLd, getSiteUrl } from "@/lib/seo";
import { Suspense } from "react";
import YachtsClient from "./YachtsClient";

// Removed force-dynamic - this page is a client component shell
// No need for ISR since it's entirely client-rendered

export const metadata: Metadata = generateYachtsListMetadata();

export default function YachtsPage() {
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
