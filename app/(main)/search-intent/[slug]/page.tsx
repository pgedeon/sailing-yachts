import type { Metadata } from "next";
import Link from "next/link";
import { getSearchIntentBySlug } from "@/lib/search-intents";
import { generateBreadcrumbJsonLd, getSiteUrl } from "@/lib/seo";
import { generateCollectionPageJsonLd, generateYachtJsonLd } from "@/lib/seo";

// ISR: Revalidate search intent pages every 6 hours
export const revalidate = 21600;
// Use dynamicParams to allow any slug at runtime
export const dynamicParams = true;

// Generate metadata for each search intent page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { intent } = await getSearchIntentBySlug(slug);

  if (!intent || intent.id === 0) {
    return {
      title: "Search Intent Not Found",
      description: "This search intent page is not available.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: intent.title,
    description: intent.metaDescription || intent.intro.substring(0, 160),
    keywords: [
      intent.title,
      "sailing yachts",
      "cruising sailboats",
      "compare boats",
      intent.category || "",
    ].filter(Boolean),
    openGraph: {
      title: intent.title,
      description: intent.metaDescription || intent.intro.substring(0, 160),
      url: getSiteUrl(`/search-intent/${slug}`),
      type: "website",
      siteName: "Sailing Yacht Info",
    },
    twitter: {
      card: "summary",
      title: intent.title,
      description: intent.metaDescription || intent.intro.substring(0, 160),
    },
    alternates: {
      canonical: getSiteUrl(`/search-intent/${slug}`),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// Main search intent page component
export default async function SearchIntentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { intent, yachts, totalCount } = await getSearchIntentBySlug(slug);

  // Not found
  if (!intent || intent.id === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Search Intent Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            This search intent page is not available.
          </p>
          <Link
            href="/"
            className="text-blue-600 hover:underline"
          >
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  // Generate JSON-LD structured data
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Browse Yachts", path: "/yachts" },
    { name: intent.category || "Search Results", path: `/search-intent/${slug}` },
    { name: intent.title },
  ]);

  const collectionJsonLd = generateCollectionPageJsonLd({
    name: intent.title,
    description: intent.metaDescription || intent.intro,
    url: getSiteUrl(`/search-intent/${slug}`),
    itemCount: totalCount,
  });

  // Prepare individual yacht JSON-LD
  const yachtJsonLd = yachts.map((yacht) => ({
    id: yacht.id,
    manufacturer: yacht.manufacturer,
    modelName: yacht.modelName,
    year: yacht.year,
    slug: yacht.slug,
    lengthOverall: yacht.lengthOverall,
    primaryImage: yacht.primaryImageUrl ?? undefined,
  }));

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      {yachtJsonLd.map((yacht, idx) => (
        <script
          key={yacht.id}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateYachtJsonLd(yacht)),
          }}
        />
      ))}

      {/* Page Header */}
      <section className="bg-gradient-to-b from-sky-50 to-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-4 text-4xl">{intent.icon}</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            {intent.title}
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            {intent.intro}
          </p>
          {intent.searchCount > 0 && (
            <p className="text-sm text-gray-500 mb-4">
              Popular search: {intent.searchCount.toLocaleString()} times
            </p>
          )}
          <p className="text-sm text-gray-500">
            Showing {yachts.length} of {totalCount} matching yachts
          </p>
        </div>
      </section>

      {/* Yacht Grid */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {yachts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {yachts.map((yacht) => (
                  <Link
                    key={yacht.id}
                    href={`/yachts/${yacht.slug}`}
                    className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="text-sm text-blue-600 font-medium mb-1">
                          {yacht.manufacturer}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition">
                          {yacht.modelName}
                        </h3>
                        {yacht.year && (
                          <div className="text-sm text-gray-500 mt-1">{yacht.year}</div>
                        )}
                      </div>
                      {yacht.primaryImageUrl && (
                        <div className="ml-4 flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={yacht.primaryImageUrl}
                            alt={`${yacht.manufacturer} ${yacht.modelName}`}
                            className="w-full h-full object-cover"
                            width={64}
                            height={64}
                          />
                        </div>
                      )}
                    </div>

                    {/* Key Specs */}
                    <div className="space-y-2 text-sm">
                      {yacht.lengthOverall && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">LOA:</span>
                          <span className="font-medium">
                            {yacht.lengthOverall.toFixed(1)}m
                          </span>
                        </div>
                      )}
                      {yacht.cabins && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cabins:</span>
                          <span className="font-medium">{yacht.cabins}</span>
                        </div>
                      )}
                      {yacht.displacement && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Displacement:</span>
                          <span className="font-medium">
                            {yacht.displacement >= 1000
                              ? `${(yacht.displacement / 1000).toFixed(1)}t`
                              : `${yacht.displacement}kg`}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {/* View All CTA */}
              {totalCount > yachts.length && (
                <div className="mt-12 text-center">
                  <p className="text-gray-600 mb-4">
                    Showing {yachts.length} of {totalCount} matching yachts
                  </p>
                  <Link
                    href="/yachts"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    View All Yachts
                  </Link>
                </div>
              )}

              {/* Newsletter Signup */}
              <div className="mt-16 bg-blue-50 rounded-xl p-8 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Get New Yacht Alerts
                </h3>
                <p className="text-gray-600 mb-6">
                  Be notified when new yachts matching your criteria are added to
                  our database.
                </p>
                <Link
                  href="/newsletter"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Subscribe for Updates
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No yachts found matching these criteria
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters or browse our{" "}
                <Link
                  href="/yachts"
                  className="text-blue-600 hover:underline font-medium"
                >
                  complete yacht database
                </Link>
                .
              </p>
              <Link
                href="/yachts"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Browse All Yachts
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
