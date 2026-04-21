import type { Metadata } from "next";
import Link from "next/link";
import { pool } from "@/lib/db";
import { generateBreadcrumbJsonLd, getSiteUrl } from "@/lib/seo";

// ISR: Revalidate every 6 hours
export const revalidate = 21600;

interface BestValueYacht {
  id: number;
  slug: string;
  manufacturer: string;
  modelName: string;
  year: number | null;
  lengthOverall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  cabins: number | null;
  berths: number | null;
  hullMaterial: string | null;
  priceMin: number | null;
  priceMax: number | null;
  currency: string | null;
  completenessScore: number | null;
  primaryImageUrl: string | null;
  valueScore: number;
}

export interface BestValuePageDef {
  slug: string;
  title: string;
  metaDescription: string;
  intro: string;
  icon: string;
  lengthMin: number;
  lengthMax: number;
  category: string;
}

export const BEST_VALUE_PAGES: BestValuePageDef[] = [
  {
    slug: "40ft-cruisers",
    title: "Best Value 40ft Cruising Sailboats",
    metaDescription:
      "Find the best value 40-foot cruising sailboats ranked by specs-per-dollar. Compare LOA, cabins, displacement and price to find your ideal mid-size cruiser.",
    intro:
      "Getting the most boat for your budget matters. These 40-foot cruising sailboats are ranked by a value score that balances living space, build quality, and market pricing — so you can spot the standout deals at a glance.",
    icon: "💰",
    lengthMin: 11.5,
    lengthMax: 12.8,
    category: "Best Value Cruisers",
  },
  {
    slug: "35ft-sailboats",
    title: "Best Value 35ft Sailboats",
    metaDescription:
      "Discover the best value 35-foot sailboats. Our value ranking combines specs, accommodation, and pricing data to help you find the smartest buy.",
    intro:
      "The 35-foot range is one of the most competitive segments in sailing. With so many models to choose from, our value score helps you quickly identify which boats offer the most space, performance, and equipment for the price.",
    icon: "📊",
    lengthMin: 10.0,
    lengthMax: 11.5,
    category: "Best Value Cruisers",
  },
  {
    slug: "family-cruisers-under-45ft",
    title: "Best Value Family Cruisers Under 45ft",
    metaDescription:
      "Compare the best value family cruising sailboats under 45 feet. Ranked by cabins, berths, tankage and price to find the perfect family cruiser.",
    intro:
      "Family cruisers need cabins, berths, tankage, and predictable handling. We rank the best family-friendly sailboats under 45 feet by combining accommodation data with pricing so you can find the right boat at the right price.",
    icon: "👨‍👩‍👧‍👦",
    lengthMin: 10.5,
    lengthMax: 13.7,
    category: "Best Value Family",
  },
  {
    slug: "bluewater-value",
    title: "Best Value Bluewater Sailboats",
    metaDescription:
      "Find the best value bluewater sailboats for ocean cruising. Ranked by displacement, construction quality, and price-per-foot to help you choose wisely.",
    intro:
      "Bluewater sailboats demand heavier construction, reliable systems, and proven offshore track records. Our value ranking factors in displacement-to-length ratio, hull material, and available pricing to surface the smartest buys for ocean-bound sailors.",
    icon: "🌊",
    lengthMin: 10.0,
    lengthMax: 15.0,
    category: "Best Value Bluewater",
  },
];

export async function generateStaticParams() {
  return BEST_VALUE_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pageDef = BEST_VALUE_PAGES.find((p) => p.slug === slug);

  if (!pageDef) {
    return { title: "Not Found" };
  }

  return {
    title: pageDef.title,
    description: pageDef.metaDescription,
    keywords: [
      "best value sailboat",
      "sailboat value comparison",
      pageDef.title,
      "sailing yacht",
      "cruising sailboat",
    ],
    openGraph: {
      title: pageDef.title,
      description: pageDef.metaDescription,
      url: getSiteUrl(`/best-value/${slug}`),
      type: "website",
      siteName: "Sailing Yacht Info",
    },
    alternates: {
      canonical: getSiteUrl(`/best-value/${slug}`),
    },
  };
}

export function calculateValueScore(yacht: {
  cabins?: number | null;
  berths?: number | null;
  lengthOverall?: number | null;
  completenessScore?: number | null;
  displacement?: number | null;
  beam?: number | null;
  draft?: number | null;
  hullMaterial?: string | null;
  priceMin?: number | null;
}): number {
  let score = 0;

  // Accommodation score (0-30 points)
  if (yacht.cabins) score += Math.min(yacht.cabins * 8, 24);
  if (yacht.berths) score += Math.min(yacht.berths * 3, 18);

  // Size efficiency: cabins per meter of LOA (0-20 points)
  if (yacht.lengthOverall && yacht.cabins) {
    const cabinsPerMeter = yacht.cabins / yacht.lengthOverall;
    score += Math.min(cabinsPerMeter * 40, 20);
  }

  // Completeness bonus (0-15 points)
  if (yacht.completenessScore) {
    score += (yacht.completenessScore / 100) * 15;
  }

  // Data richness bonus (0-15 points) — more specs = more transparent
  let dataPoints = 0;
  if (yacht.displacement) dataPoints++;
  if (yacht.beam) dataPoints++;
  if (yacht.draft) dataPoints++;
  if (yacht.hullMaterial) dataPoints++;
  score += Math.min(dataPoints * 4, 15);

  // Price value bonus (0-20 points) — if price data exists, reward lower price per meter
  if (yacht.priceMin && yacht.lengthOverall) {
    const pricePerMeter = yacht.priceMin / yacht.lengthOverall;
    if (pricePerMeter < 30000) score += 20;
    else if (pricePerMeter < 50000) score += 15;
    else if (pricePerMeter < 80000) score += 10;
    else if (pricePerMeter < 150000) score += 7;
    else score += 5;
  } else {
    score += 10;
  }

  return Math.round(score * 10) / 10;
}

export async function getBestValueYachts(
  pageDef: BestValuePageDef
): Promise<BestValueYacht[]> {
  if (!process.env.DATABASE_URL) {
    console.warn(`[build-safe] Returning fallback data during build (no DATABASE_URL)`);
    return [];
  }

  const query = `
    SELECT
      y.id,
      y.slug,
      m.name AS manufacturer,
      y.model_name,
      y.year,
      y.length_overall,
      y.beam,
      y.draft,
      y.displacement,
      y.cabins,
      y.berths,
      y.hull_material,
      y.completeness_score,
      mi.url AS primary_image_url,
      yp.price_min,
      yp.price_max,
      yp.currency
    FROM yacht_models y
    LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
    LEFT JOIN LATERAL (
      SELECT url FROM images
      WHERE yacht_model_id = y.id AND is_primary = true
      LIMIT 1
    ) mi ON true
    LEFT JOIN LATERAL (
      SELECT price_min, price_max, currency
      FROM yacht_prices
      WHERE yacht_model_id = y.id AND is_active = true AND condition = 'new'
      ORDER BY effective_date DESC
      LIMIT 1
    ) yp ON true
    WHERE y.length_overall >= $1
      AND y.length_overall <= $2
    ORDER BY y.cabins DESC NULLS LAST, y.length_overall DESC
    LIMIT 24
  `;

  const result = await pool.query(query, [
    pageDef.lengthMin,
    pageDef.lengthMax,
  ]);

  const yachts: BestValueYacht[] = result.rows.map((r: any) => ({
    id: r.id,
    slug: r.slug,
    manufacturer: r.manufacturer,
    modelName: r.model_name,
    year: r.year,
    lengthOverall: r.length_overall ? Number(r.length_overall) : null,
    beam: r.beam ? Number(r.beam) : null,
    draft: r.draft ? Number(r.draft) : null,
    displacement: r.displacement ? Number(r.displacement) : null,
    cabins: r.cabins,
    berths: r.berths,
    hullMaterial: r.hull_material,
    priceMin: r.price_min ? Number(r.price_min) : null,
    priceMax: r.price_max ? Number(r.price_max) : null,
    currency: r.currency,
    completenessScore: r.completeness_score,
    primaryImageUrl: r.primary_image_url,
    valueScore: 0,
  }));

  // Calculate and sort by value score
  for (const yacht of yachts) {
    yacht.valueScore = calculateValueScore(yacht);
  }

  yachts.sort((a, b) => b.valueScore - a.valueScore);

  return yachts;
}

function formatPrice(
  min: number | null,
  max: number | null,
  currency: string | null
): string {
  if (!min && !max) return "Price on request";
  const cur = currency || "USD";
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(n);
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min || max!);
}

export default async function BestValuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pageDef = BEST_VALUE_PAGES.find((p) => p.slug === slug);

  if (!pageDef) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  const yachts = await getBestValueYachts(pageDef);

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Yachts", path: "/yachts" },
    { name: "Best Value", path: "/best-value" },
    { name: pageDef.title },
  ]);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageDef.title,
    description: pageDef.metaDescription,
    url: getSiteUrl(`/best-value/${slug}`),
    numberOfItems: yachts.length,
    isPartOf: {
      "@type": "WebSite",
      name: "Sailing Yacht Info",
      url: getSiteUrl(),
    },
  };

  // ItemList JSON-LD for ranked yacht entries
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: pageDef.title,
    description: pageDef.metaDescription,
    numberOfItems: yachts.length,
    itemListElement: yachts.map((yacht, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${yacht.manufacturer} ${yacht.modelName}`,
      url: getSiteUrl(`/yachts/${yacht.slug}`),
      ...(yacht.primaryImageUrl && {
        image: yacht.primaryImageUrl,
      }),
    })),
  };

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      {/* Header */}
      <section className="bg-gradient-to-b from-emerald-50 to-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-4 text-4xl">{pageDef.icon}</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            {pageDef.title}
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            {pageDef.intro}
          </p>
          <p className="text-sm text-gray-500">
            {yachts.length} {yachts.length === 1 ? "yacht" : "yachts"} ranked
            by value score
          </p>
        </div>
      </section>

      {/* Value Rankings */}
      <section data-testid="best-value-rankings" className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {yachts.length > 0 ? (
            <div className="space-y-4">
              {yachts.map((yacht, index) => (
                <Link
                  key={yacht.id}
                  href={`/yachts/${yacht.slug}`}
                  data-testid={`best-value-yacht-${index + 1}`}
                  className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-emerald-200 transition group"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Rank & Image */}
                    <div className="flex items-center gap-4 sm:w-40 flex-shrink-0">
                      <div
                        className={`text-2xl font-bold w-10 h-10 rounded-full flex items-center justify-center ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-700"
                            : index === 1
                              ? "bg-gray-100 text-gray-600"
                              : index === 2
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-50 text-gray-400"
                        }`}
                      >
                        {index + 1}
                      </div>
                      {yacht.primaryImageUrl ? (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={yacht.primaryImageUrl}
                            alt={`${yacht.manufacturer} ${yacht.modelName}`}
                            className="w-full h-full object-cover"
                            width={64}
                            height={64}
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-2xl flex-shrink-0">
                          ⛵
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <div className="text-sm text-emerald-600 font-medium">
                            {yacht.manufacturer}
                          </div>
                          <h3 className="font-semibold text-gray-900 text-lg group-hover:text-emerald-600 transition">
                            {yacht.modelName}
                          </h3>
                          {yacht.year && (
                            <span className="text-sm text-gray-500">
                              {yacht.year}
                            </span>
                          )}
                        </div>

                        {/* Value Score Badge */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-xs text-gray-500 uppercase tracking-wide">
                              Value Score
                            </div>
                            <div className="text-2xl font-bold text-emerald-600">
                              {yacht.valueScore}
                            </div>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-emerald-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Specs Row */}
                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                        {yacht.lengthOverall && (
                          <span>
                            <span className="text-gray-500">LOA:</span>{" "}
                            <span className="font-medium">
                              {yacht.lengthOverall.toFixed(1)}m
                            </span>
                          </span>
                        )}
                        {yacht.beam && (
                          <span>
                            <span className="text-gray-500">Beam:</span>{" "}
                            <span className="font-medium">
                              {yacht.beam.toFixed(1)}m
                            </span>
                          </span>
                        )}
                        {yacht.cabins && (
                          <span>
                            <span className="text-gray-500">Cabins:</span>{" "}
                            <span className="font-medium">{yacht.cabins}</span>
                          </span>
                        )}
                        {yacht.berths && (
                          <span>
                            <span className="text-gray-500">Berths:</span>{" "}
                            <span className="font-medium">{yacht.berths}</span>
                          </span>
                        )}
                        {yacht.displacement && (
                          <span>
                            <span className="text-gray-500">Displ:</span>{" "}
                            <span className="font-medium">
                              {yacht.displacement >= 1000
                                ? `${(yacht.displacement / 1000).toFixed(1)}t`
                                : `${yacht.displacement}kg`}
                            </span>
                          </span>
                        )}
                        {yacht.hullMaterial && (
                          <span>
                            <span className="text-gray-500">Hull:</span>{" "}
                            <span className="font-medium">
                              {yacht.hullMaterial}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Price Row */}
                      {(yacht.priceMin || yacht.priceMax) && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-500">Price:</span>{" "}
                          <span className="font-semibold text-gray-900">
                            {formatPrice(
                              yacht.priceMin,
                              yacht.priceMax,
                              yacht.currency
                            )}
                          </span>
                          {yacht.lengthOverall && yacht.priceMin && (
                            <span className="text-gray-400 ml-2">
                              (~
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: yacht.currency || "USD",
                                maximumFractionDigits: 0,
                              }).format(yacht.priceMin / yacht.lengthOverall)}
                              /m)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No yachts found in this category
              </h3>
              <p className="text-gray-600 mb-6">
                Try browsing our{" "}
                <Link
                  href="/yachts"
                  className="text-blue-600 hover:underline font-medium"
                >
                  complete yacht database
                </Link>
                .
              </p>
            </div>
          )}

          {/* Related Best-Value Pages */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Explore More Best-Value Rankings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {BEST_VALUE_PAGES.filter((p) => p.slug !== slug).map((page) => (
                <Link
                  key={page.slug}
                  href={`/best-value/${page.slug}`}
                  data-testid="related-best-value-link"
                  className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-emerald-300 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{page.icon}</span>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {page.title}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {page.intro.substring(0, 120)}...
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Cross-link to /best pages */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Looking for curated picks without the value ranking?{" "}
              <Link
                href="/best/40-foot-cruising-sailboats"
                className="text-blue-600 hover:underline"
              >
                Browse best-of collections →
              </Link>
            </p>
          </div>

          {/* Methodology Note */}
          <div className="mt-12 max-w-2xl mx-auto text-center">
            <details className="text-sm text-gray-500" data-testid="methodology-details">
              <summary className="cursor-pointer hover:text-gray-700">
                How is the value score calculated?
              </summary>
              <div className="mt-3 text-left space-y-2 bg-white rounded-lg border border-gray-200 p-4">
                <p>
                  The value score (0–100) combines multiple factors to rank
                  yachts by overall value:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Accommodation (30 pts)</strong> — Cabins and berths
                    capacity                  </li>
                  <li>
                    <strong>Space efficiency (20 pts)</strong> — Cabins per
                    meter of LOA
                  </li>
                  <li>
                    <strong>Data completeness (15 pts)</strong> — How
                    thoroughly specs are documented
                  </li>
                  <li>
                    <strong>Spec richness (15 pts)</strong> — Number of
                    verified data points
                  </li>
                  <li>
                    <strong>Price-per-meter (20 pts)</strong> — Market pricing
                    relative to size (when available)
                  </li>
                </ul>
                <p className="italic">
                  Scores improve as more pricing and spec data becomes available.
                </p>
              </div>
            </details>
          </div>
        </div>
      </section>
    </>
  );
}
