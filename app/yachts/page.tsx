import type { Metadata } from "next";
import { Suspense } from "react";
import YachtsClient from "./YachtsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse Sailing Yachts — All Models & Manufacturers",
  description:
    "Browse our complete database of sailing yachts. Filter by manufacturer, length, year, and more to find your ideal sailboat.",
  alternates: { canonical: "https://sailing-yachts.vercel.app/yachts" },
  openGraph: {
    title: "Browse Sailing Yachts",
    description:
      "Browse our complete database of sailing yachts. Filter by manufacturer, length, year, and more.",
    url: "https://sailing-yachts.vercel.app/yachts",
    siteName: "Sailing Yachts",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Browse Sailing Yachts",
    description:
      "Browse our complete database of sailing yachts. Filter by manufacturer, length, year, and more.",
  },
};

export default function YachtsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center">Loading yachts...</div>
      }
    >
      <YachtsClient />
    </Suspense>
  );
}
