import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Best Value Sailboats — Ranked by Specs-Per-Dollar",
  description:
    "Find the best value sailing yachts ranked by our proprietary value score. Compare specs, accommodation, and pricing to spot the smartest buys.",
  alternates: {
    canonical: getSiteUrl("/best-value"),
  },
};

const BEST_VALUE_CATEGORIES = [
  {
    slug: "40ft-cruisers",
    title: "Best Value 40ft Cruisers",
    icon: "💰",
    description:
      "Mid-size cruisers ranked by accommodation, build quality, and price-per-meter.",
    yachtCount: "10+",
  },
  {
    slug: "35ft-sailboats",
    title: "Best Value 35ft Sailboats",
    icon: "📊",
    description:
      "The most competitive segment in sailing — find the standouts.",
    yachtCount: "15+",
  },
  {
    slug: "family-cruisers-under-45ft",
    title: "Best Value Family Cruisers Under 45ft",
    icon: "👨‍👩‍👧‍👦",
    description:
      "Family-friendly sailboats ranked by cabins, berths, tankage, and price.",
    yachtCount: "20+",
  },
  {
    slug: "bluewater-value",
    title: "Best Value Bluewater Sailboats",
    icon: "🌊",
    description:
      "Ocean-ready yachts ranked by displacement-to-length, hull construction, and pricing.",
    yachtCount: "15+",
  },
];

export default function BestValueIndexPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-b from-emerald-50 to-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-4 text-5xl">🏆</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Best Value Sailboats
          </h1>
          <p className="text-lg text-gray-600 mb-4 max-w-3xl mx-auto">
            Our value score ranks sailing yachts by balancing accommodation,
            spec completeness, build data, and market pricing — so you can spot
            the standout deals at a glance.
          </p>
          <p className="text-sm text-gray-500">
            Rankings improve as more pricing and spec data becomes available
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {BEST_VALUE_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/best-value/${cat.slug}`}
                className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-emerald-200 transition group"
              >
                <div className="text-3xl mb-3">{cat.icon}</div>
                <h2 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-emerald-600 transition">
                  {cat.title}
                </h2>
                <p className="text-sm text-gray-600 mb-3">
                  {cat.description}
                </p>
                <span className="text-xs text-emerald-600 font-medium">
                  View {cat.yachtCount} yachts →
                </span>
              </Link>
            ))}
          </div>

          {/* Cross-link to /best pages */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">
              Prefer curated picks?{" "}
              <Link
                href="/best/40-foot-cruising-sailboats"
                className="text-blue-600 hover:underline"
              >
                Browse our best-of collections →
              </Link>
            </p>
          </div>

          {/* Methodology */}
          <div className="mt-12 max-w-2xl mx-auto text-center">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              About the Value Score
            </h2>
            <p className="text-sm text-gray-600">
              The value score (0–100) combines accommodation capacity (30 pts),
              space efficiency (20 pts), data completeness (15 pts), spec
              richness (15 pts), and price-per-meter (20 pts) to rank yachts
              that offer the most for your budget.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
