import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getYachtsBySlugs, generateComparisonIntro, generateComparisonMetadata, getPrimaryImage, type YachtComparisonData } from "@/lib/compare-canonical";
import { getSiteUrl, generateBreadcrumbJsonLd, generateYachtJsonLd } from "@/lib/seo";
import { PriceTierBadge } from "@/app/components/PriceTierBadge";
import { calculatePriceTier } from "@/lib/price-tier";

// ISR: Revalidate comparison pages every 6 hours
export const revalidate = 21600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slugA: string; slugB: string }>;
}): Promise<Metadata> {
  const { slugA, slugB } = await params;
  const { yachtA, yachtB } = await getYachtsBySlugs(slugA, slugB);

  if (!yachtA || !yachtB) {
    return {
      title: "Yacht Comparison Not Found",
      description: "The yachts you're looking for could not be found.",
    };
  }

  const meta = generateComparisonMetadata(yachtA, yachtB);

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: getSiteUrl(`/compare/${slugA}-vs-${slugB}`),
      type: "website",
      siteName: "Sailing Yacht Info",
    },
    twitter: {
      card: "summary",
      title: meta.title,
      description: meta.description,
    },
    alternates: {
      canonical: getSiteUrl(`/compare/${slugA}-vs-${slugB}`),
    },
  };
}

export default async function CanonicalComparePage({
  params,
}: {
  params: Promise<{ slugA: string; slugB: string }>;
}) {
  const { slugA, slugB } = await params;
  const { yachtA, yachtB } = await getYachtsBySlugs(slugA, slugB);

  if (!yachtA || !yachtB) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Yacht Comparison Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            One or both yachts could not be found in our database.
          </p>
          <Link
            href="/compare"
            className="text-blue-600 hover:underline"
          >
            Try a different comparison
          </Link>
        </div>
      </main>
    );
  }

  const intro = generateComparisonIntro(yachtA, yachtB);
  const fullNameA = `${yachtA.manufacturer} ${yachtA.modelName}`;
  const fullNameB = `${yachtB.manufacturer} ${yachtB.modelName}`;

  // Fetch primary images for both yachts
  const [primaryImageUrlA, primaryImageUrlB] = await Promise.all([
    yachtA.slug ? getPrimaryImage(yachtA.slug) : null,
    yachtB.slug ? getPrimaryImage(yachtB.slug) : null,
  ]);

  // Generate JSON-LD structured data
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Compare Yachts", path: "/compare" },
    { name: `${fullNameA} vs ${fullNameB}` },
  ]);

  // Generate individual yacht JSON-LD
  const yachtALdData = {
    manufacturer: yachtA.manufacturer,
    modelName: yachtA.modelName,
    year: yachtA.year || new Date().getFullYear(),
    slug: yachtA.slug || "",
    lengthOverall: yachtA.lengthOverall,
    beam: yachtA.beam,
    draft: yachtA.draft,
    displacement: yachtA.displacement,
    hullMaterial: yachtA.hullMaterial,
    rigType: yachtA.rigType,
    cabins: yachtA.cabins,
    primaryImage: primaryImageUrlA ?? undefined,
  };

  const yachtBLdData = {
    manufacturer: yachtB.manufacturer,
    modelName: yachtB.modelName,
    year: yachtB.year || new Date().getFullYear(),
    slug: yachtB.slug || "",
    lengthOverall: yachtB.lengthOverall,
    beam: yachtB.beam,
    draft: yachtB.draft,
    displacement: yachtB.displacement,
    hullMaterial: yachtB.hullMaterial,
    rigType: yachtB.rigType,
    cabins: yachtB.cabins,
    primaryImage: primaryImageUrlB ?? undefined,
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateYachtJsonLd(yachtALdData)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateYachtJsonLd(yachtBLdData)),
        }}
      />

      {/* Page Header */}
      <section className="bg-gradient-to-b from-sky-50 to-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-4 text-4xl">⚓</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            {fullNameA} vs {fullNameB}
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            {intro}
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href={`/yachts/${yachtA.slug}`}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              View {fullNameA}
            </Link>
            <Link
              href={`/yachts/${yachtB.slug}`}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              View {fullNameB}
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">
                      Specification
                    </th>
                    <th className="px-6 py-4 text-left min-w-[200px]">
                      <Link
                        href={`/yachts/${yachtA.slug}`}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {fullNameA}
                      </Link>
                      {yachtA.year && (
                        <div className="text-xs text-gray-500 mt-1">{yachtA.year}</div>
                      )}
                    </th>
                    <th className="px-6 py-4 text-left min-w-[200px]">
                      <Link
                        href={`/yachts/${yachtB.slug}`}
                        className="font-semibold text-emerald-700 hover:underline"
                      >
                        {fullNameB}
                      </Link>
                      {yachtB.year && (
                        <div className="text-xs text-gray-500 mt-1">{yachtB.year}</div>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Price Tier Row */}
                  <tr className="bg-gray-50/50">
                    <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                      Est. Price Range
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <PriceTierBadge
                          info={calculatePriceTier({
                            lengthOverall: yachtA.lengthOverall,
                            displacement: yachtA.displacement,
                            beam: yachtA.beam,
                            cabins: yachtA.cabins,
                            hullMaterial: yachtA.hullMaterial,
                            keelType: yachtA.keelType,
                            rigType: yachtA.rigType,
                          })}
                          size="sm"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <PriceTierBadge
                          info={calculatePriceTier({
                            lengthOverall: yachtB.lengthOverall,
                            displacement: yachtB.displacement,
                            beam: yachtB.beam,
                            cabins: yachtB.cabins,
                            hullMaterial: yachtB.hullMaterial,
                            keelType: yachtB.keelType,
                            rigType: yachtB.rigType,
                          })}
                          size="sm"
                        />
                      </div>
                    </td>
                  </tr>

                  {/* Dimensions */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                      Length Overall (LOA)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtA.lengthOverall ? `${yachtA.lengthOverall.toFixed(1)} m` : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtB.lengthOverall ? `${yachtB.lengthOverall.toFixed(1)} m` : "—"}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                      Beam
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtA.beam ? `${yachtA.beam.toFixed(1)} m` : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtB.beam ? `${yachtB.beam.toFixed(1)} m` : "—"}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                      Draft
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtA.draft ? `${yachtA.draft.toFixed(2)} m` : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtB.draft ? `${yachtB.draft.toFixed(2)} m` : "—"}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                      Displacement
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtA.displacement
                        ? `${yachtA.displacement.toLocaleString()} kg`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtB.displacement
                        ? `${yachtB.displacement.toLocaleString()} kg`
                        : "—"}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                      Ballast
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtA.ballast ? `${yachtA.ballast.toLocaleString()} kg` : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtB.ballast ? `${yachtB.ballast.toLocaleString()} kg` : "—"}
                    </td>
                  </tr>

                  {/* Rigging & Sails */}
                  <tr className="bg-slate-50">
                    <td colSpan={3} className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Rigging & Sails
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                      Sail Area (Main)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtA.sailAreaMain
                        ? `${yachtA.sailAreaMain.toFixed(1)} m²`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtB.sailAreaMain
                        ? `${yachtB.sailAreaMain.toFixed(1)} m²`
                        : "—"}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                      Rig Type
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtA.rigType || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtB.rigType || "—"}
                    </td>
                  </tr>

                  {/* Construction */}
                  <tr className="bg-slate-50">
                    <td colSpan={3} className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Construction
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                      Keel Type
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtA.keelType || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtB.keelType || "—"}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                      Hull Material
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtA.hullMaterial || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtB.hullMaterial || "—"}
                    </td>
                  </tr>

                  {/* Accommodation */}
                  <tr className="bg-slate-50">
                    <td colSpan={3} className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Accommodation
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                      Cabins
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtA.cabins !== null ? yachtA.cabins : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtB.cabins !== null ? yachtB.cabins : "—"}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                      Berths
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtA.berths !== null ? yachtA.berths : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtB.berths !== null ? yachtB.berths : "—"}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                      Heads
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtA.heads !== null ? yachtA.heads : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtB.heads !== null ? yachtB.heads : "—"}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                      Max Occupancy
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtA.maxOccupancy !== null ? yachtA.maxOccupancy : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtB.maxOccupancy !== null ? yachtB.maxOccupancy : "—"}
                    </td>
                  </tr>

                  {/* Technical */}
                  <tr className="bg-slate-50">
                    <td colSpan={3} className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Technical
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                      Engine HP
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtA.engineHp !== null ? yachtA.engineHp : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtB.engineHp !== null ? yachtB.engineHp : "—"}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                      Engine Type
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtA.engineType || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtB.engineType || "—"}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                      Fuel Capacity
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtA.fuelCapacity !== null
                        ? `${yachtA.fuelCapacity} L`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtB.fuelCapacity !== null
                        ? `${yachtB.fuelCapacity} L`
                        : "—"}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                      Water Capacity
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtA.waterCapacity !== null
                        ? `${yachtA.waterCapacity} L`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {yachtB.waterCapacity !== null
                        ? `${yachtB.waterCapacity} L`
                        : "—"}
                    </td>
                  </tr>

                  {/* Notes */}
                  {(yachtA.designNotes || yachtB.designNotes) && (
                    <>
                      <tr className="bg-slate-50">
                        <td colSpan={3} className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Design Notes
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                          Notes
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {yachtA.designNotes || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {yachtB.designNotes || "—"}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t text-xs text-gray-600">
              Compare more yachts with our{" "}
              <Link href="/compare" className="text-blue-600 hover:underline font-medium">
                comparison tool
              </Link>
              . Data sourced from manufacturer specifications.
            </div>
          </div>

          {/* Related Links */}
          <div className="mt-12 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Learn More
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition">
                <h3 className="font-semibold text-gray-900 mb-2">{fullNameA}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {yachtA.description?.substring(0, 150) ||
                    `View detailed specifications for ${fullNameA}.`}
                </p>
                <Link
                  href={`/yachts/${yachtA.slug}`}
                  className="inline-flex items-center gap-2 text-blue-600 hover:underline font-medium"
                >
                  View Full Details
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                   aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-emerald-300 hover:shadow-md transition">
                <h3 className="font-semibold text-gray-900 mb-2">{fullNameB}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {yachtB.description?.substring(0, 150) ||
                    `View detailed specifications for ${fullNameB}.`}
                </p>
                <Link
                  href={`/yachts/${yachtB.slug}`}
                  className="inline-flex items-center gap-2 text-emerald-700 hover:underline font-medium"
                >
                  View Full Details
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                   aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/compare"
              className="text-blue-600 hover:underline text-sm"
            >
              ← Back to comparison tool
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
