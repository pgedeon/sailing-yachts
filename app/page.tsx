import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sailing Yachts Database — Search & Compare Yacht Specs",
  description:
    "Comprehensive sailing yacht database. Search, compare specifications, and find the perfect sailboat from top manufacturers worldwide.",
  alternates: { canonical: "https://sailing-yachts.vercel.app" },
  openGraph: {
    title: "Sailing Yachts Database",
    description:
      "Search and compare sailing yacht specifications from top manufacturers worldwide.",
    url: "https://sailing-yachts.vercel.app",
    siteName: "Sailing Yachts",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sailing Yachts Database",
    description:
      "Search and compare sailing yacht specifications from top manufacturers worldwide.",
  },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Sailing Yachts Database",
    url: "https://sailing-yachts.vercel.app",
    description:
      "Comprehensive sailing yacht database with search and comparison tools.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://sailing-yachts.vercel.app/yachts?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold mb-6">Sailing Yachts Database</h1>
        <p className="mb-8 text-lg text-gray-700">
          Explore specifications of sailing yachts from top manufacturers.
        </p>
        <Link
          href="/yachts"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Browse Yachts
        </Link>
      </main>
    </>
  );
}
