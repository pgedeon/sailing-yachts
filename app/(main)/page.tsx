import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import NewsletterSignup from "@/components/NewsletterSignup";
import { PersonalizedRecommendations } from "@/components/PersonalizedRecommendations";
import { db, yachtModels, manufacturers } from "@/lib/db";
import { desc, sql } from "drizzle-orm";
import { generateWebsiteJsonLd, generateFaqJsonLd, getSiteUrl } from "@/lib/seo";
import { getSiteStats, formatYachtPhrase, formatYachtCountFAQ } from "@/lib/site-stats";
import { buildSafeQuery } from "@/lib/build-safe";

// ISR: Revalidate homepage cache every hour
export const revalidate = 3600;

const FALLBACK_YACHTS: any[] = [];
const FALLBACK_MANUFACTURERS: any[] = [];

// Cache featured yachts query with tag for invalidation
async function getFeaturedYachts() {
  return unstable_cache(
    async () => {
      return buildSafeQuery(
        async () => {
          return db
            .select({
              id: yachtModels.id,
              modelName: yachtModels.modelName,
              slug: yachtModels.slug,
              year: yachtModels.year,
              lengthOverall: yachtModels.lengthOverall,
              manufacturer: manufacturers.name,
            })
            .from(yachtModels)
            .leftJoin(manufacturers, sql`${yachtModels.manufacturerId} = ${manufacturers.id}`)
            .orderBy(desc(yachtModels.createdAt))
            .limit(6);
        },
        FALLBACK_YACHTS
      );
    },
    ["featured-yachts"],
    { tags: ["yachts"], revalidate: 3600 }
  )();
}

// Cache top manufacturers query with tag for invalidation
async function getTopManufacturers() {
  return unstable_cache(
    async () => {
      return buildSafeQuery(
        async () => {
          return db
            .select({
              name: manufacturers.name,
              country: manufacturers.country,
              yachtCount: sql<number>`count(${yachtModels.id})`.as("yacht_count"),
            })
            .from(manufacturers)
            .leftJoin(yachtModels, sql`${manufacturers.id} = ${yachtModels.manufacturerId}`)
            .groupBy(manufacturers.id, manufacturers.name, manufacturers.country)
            .orderBy(desc(sql`count(${yachtModels.id})`))
            .limit(8);
        },
        FALLBACK_MANUFACTURERS
      );
    },
    ["top-manufacturers"],
    { tags: ["manufacturers"], revalidate: 3600 }
  )();
}

// Generate metadata with live yacht count
export async function generateMetadata(): Promise<Metadata> {
  const stats = await getSiteStats();
  const yachtPhrase = formatYachtPhrase(stats);

  return {
    title: "Sailing Yacht Info — Specs, Dimensions & Comparison Tool",
    description:
      `Comprehensive database of sailing yacht specifications. Search ${yachtPhrase} by length, year, manufacturer. Compare dimensions, sail plans, and accommodation. Free to use.`,
    keywords: [
      "sailing yacht specs",
      "sailboat dimensions",
      "yacht comparison",
      "boat specifications database",
      "sailboat database",
      "yacht LOA",
      "sail area displacement",
      "sailing yacht database",
      "compare yachts",
      "boat specs",
    ],
    openGraph: {
      title: "Sailing Yacht Info — Specs, Dimensions & Comparison Tool",
      description:
        `Search ${yachtPhrase} by manufacturer, length, year. Compare specs side by side. Free database for sailors and buyers.`,
      url: getSiteUrl("/"),
      type: "website",
      siteName: "Sailing Yacht Info",
      images: [{ url: getSiteUrl("/api/og?title=Sailing%20Yacht%20Info&description=Specs%2C%20Dimensions%20%26%20Comparison"), width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Sailing Yacht Info — Specs & Comparison Tool",
      description: `Search ${yachtPhrase}. Compare dimensions, sail plans, accommodation. Free.`,
    },
    alternates: {
      canonical: getSiteUrl("/"),
      languages: { en: getSiteUrl("/"), fr: "https://sailboats.fr" },
    },
  };
}

export default async function Home() {
  const [featuredYachts, topManufacturers, stats] = await Promise.all([
    getFeaturedYachts(),
    getTopManufacturers(),
    getSiteStats(),
  ]);
  const yachtPhrase = formatYachtPhrase(stats);

  const FAQ_ITEMS = [
    { q: "How many yachts are in the database?", a: formatYachtCountFAQ(stats) },
    { q: "Can I compare yachts side by side?", a: "Yes! Select up to 4 yachts from the browse page and click Compare to see specs side by side — length, displacement, sail area, cabins, and more." },
    { q: "Is the database free to use?", a: "Yes, the Sailing Yacht Info is completely free for personal use and for organizations with annual revenue under $100,000." },
    { q: "Where does the data come from?", a: "Specifications are sourced from manufacturer brochures, official documentation, and verified owner contributions." },
  ];

  const jsonLd = generateWebsiteJsonLd();
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-sky-50 to-white py-16 sm:py-24 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Sailing Yacht Specs & Comparison
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Search <strong>{yachtPhrase}</strong> by manufacturer, length, year. Compare dimensions,
              sail plans, and accommodation. Free database for sailors, buyers, and brokers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/yachts"
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200"
              >
                Browse Yachts
              </Link>
              <Link
                href="/compare"
                className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition"
              >
                Compare Side by Side
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Links by Size */}
        <section className="py-12 px-4 bg-white border-b">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Browse by Size</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: "Under 25ft", min: 0, max: 25 },
                { label: "25–30ft", min: 25, max: 30 },
                { label: "30–35ft", min: 30, max: 35 },
                { label: "35–40ft", min: 35, max: 40 },
                { label: "40–50ft", min: 40, max: 50 },
                { label: "50ft+", min: 50, max: 999 },
              ].map(({ label, min, max }) => (
                <Link
                  key={label}
                  href={`/yachts?minLength=${min}&maxLength=${max}`}
                  className="px-5 py-2 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-full text-sm font-medium transition"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Yachts */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Latest Yachts Added</h2>
                <p className="text-gray-600 mt-1">Recently added models with full specifications</p>
              </div>
              <Link href="/yachts" className="text-blue-600 hover:underline font-medium text-sm">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:cols-2 lg:grid-cols-3 gap-6">
              {featuredYachts.length > 0 ? (
                featuredYachts.map((yacht: any) => (
                  <Link
                    key={yacht.id}
                    href={`/yachts/${yacht.slug}`}
                    className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-blue-200 transition"
                  >
                    <div className="text-sm text-gray-500 mb-1">{yacht.manufacturer || "Unknown"}</div>
                    <h3 className="font-semibold text-gray-900 text-lg">{yacht.modelName}</h3>
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                      {yacht.year && <span>{yacht.year}</span>}
                      {yacht.lengthOverall && <span>{Number(yacht.lengthOverall).toFixed(1)}m LOA</span>}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <div className="text-gray-500">Building yacht database...</div>
                  <div className="text-sm text-gray-400 mt-1">Featured yachts will appear here once deployment completes.</div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Top Manufacturers */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Popular Manufacturers</h2>
                <p className="text-gray-600 mt-1">Browse yachts by builder</p>
              </div>
              <Link href="/manufacturers" className="text-blue-600 hover:underline font-medium text-sm">
                All manufacturers →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {topManufacturers.length > 0 ? (
                topManufacturers.map((mfr: any) => (
                  <Link
                    key={mfr.name}
                    href={`/manufacturers/${mfr.name?.toLowerCase().replace(/\s+/g, "-")}`}
                    className="block bg-gray-50 rounded-lg p-4 hover:bg-blue-50 transition border border-gray-100"
                  >
                    <div className="font-semibold text-gray-900">{mfr.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {mfr.yachtCount} model{mfr.yachtCount !== 1 ? "s" : ""}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <div className="text-gray-500">Building manufacturer database...</div>
                  <div className="text-sm text-gray-400 mt-1">Popular manufacturers will appear here once deployment completes.</div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Personalized Recommendations (P9.6) */}
        <PersonalizedRecommendations />
        {/* Features / Benefits */}
        <section className="py-16 px-4 bg-sky-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Why Use Sailing Yacht Info?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-white text-2xl">🔍</div>
                <h3 className="font-semibold text-gray-900 mb-2">Detailed Specs</h3>
                <p className="text-gray-600 text-sm">LOA, beam, draft, displacement, sail area, rig type, cabins, berths, and more.</p>
              </div>
              <div className="text-center">
                <div className="w-14 h14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-white text-2xl">⚖️</div>
                <h3 className="font-semibold text-gray-900 mb-2">Side-by-Side Compare</h3>
                <p className="text-gray-600 text-sm">Select up to 4 yachts and compare every spec in one view.</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-white text-2xl">📊</div>
                <h3 className="font-semibold text-gray-900 mb-2">Performance Ratios</h3>
                <p className="text-gray-600 text-sm">D/L, SA/D, ballast ratio, capsize screening — calculated automatically.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {FAQ_ITEMS.map((item, idx) => (
                <div key={idx} className="border-b border-gray-200 pb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">{item.q}</h3>
                  <p className="text-gray-600">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="py-12 px-4 bg-blue-50 border-t border-blue-100">
          <div className="max-w-xl mx-auto text-center">
            <NewsletterSignup source="homepage" />
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-gray-900 text-white text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to find your next yacht?</h2>
            <p className="text-gray-300 mb-8">Search the database or compare boats side by side.</p>
            <Link
              href="/yachts"
              className="inline-block px-8 py-4 bg-blue-500 text-white rounded-lg font-semibold text-lg hover:bg-blue-400 transition"
            >
              Browse All Yachts
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}