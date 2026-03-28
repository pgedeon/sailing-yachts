import type { Metadata } from "next";
import { CompareClient } from "./CompareClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compare Sailing Yachts — Side-by-Side Specs",
  description:
    "Compare sailing yacht specifications side-by-side. Analyze dimensions, sail plans, accommodation, and performance data for up to 4 yachts.",
  alternates: { canonical: "https://sailing-yachts.vercel.app/compare" },
  openGraph: {
    title: "Compare Sailing Yachts",
    description:
      "Compare sailing yacht specifications side-by-side. Dimensions, sail plans, accommodation, and performance data.",
    url: "https://sailing-yachts.vercel.app/compare",
    siteName: "Sailing Yachts",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Compare Sailing Yachts",
    description:
      "Compare sailing yacht specifications side-by-side.",
  },
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: { ids?: string };
}) {
  const idsParam = searchParams.ids;
  const initialIds = idsParam
    ? idsParam
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id))
    : [];
  return <CompareClient initialIds={initialIds} />;
}
