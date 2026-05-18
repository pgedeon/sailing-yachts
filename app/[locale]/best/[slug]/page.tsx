import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";
import { getLandingPageYachts } from "@/lib/landing-pages";
import { getLandingPageBySlug, getAllLandingPageSlugs } from "@/data/landing-pages";
import { generateBreadcrumbJsonLd, getSiteUrl, generateCollectionPageJsonLd, generateYachtJsonLd, buildLocaleAlternates } from "@/lib/seo";

// ISR: Revalidate landing pages every 6 hours
export const revalidate = 21600;

// Generate static params for all defined landing pages

// Generate metadata for each landing page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const pageDefinition = getLandingPageBySlug(slug);

  if (!pageDefinition) {
    return {
      title: "Landing Page Not Found",
      description: "This landing page is not available.",
    };
  }

  return {
    title: pageDefinition.title,
    description: pageDefinition.metaDescription,
    keywords: [
      pageDefinition.title,
      "sailing yachts",
      "cruising sailboats",
      "compare boats",
      "yacht specifications",
    ],
    openGraph: {
      title: pageDefinition.title,
      description: pageDefinition.metaDescription,
      url: getSiteUrl(`/${locale}/best/${slug}`),
      type: "website",
      siteName: "Sailing Yacht Info",
    },
    twitter: {
      card: "summary",
      title: pageDefinition.title,
      description: pageDefinition.metaDescription,
    },
    alternates: buildLocaleAlternates(`/best/${slug}`),
  };
}

// Main landing page component
export default async function LandingPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "LandingPages" });
  const pageDefinition = getLandingPageBySlug(slug);

  if (!pageDefinition) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t("notFound.title")}
          </h1>
          <p className="text-gray-600 mb-6">
            {t("notFound.description")}
          </p>
          <Link
            href="/"
            className="text-blue-600 hover:underline"
          >
            {t("notFound.homeLink")}
          </Link>
        </div>
      </main>
    );
  }

  // Fetch matching yachts with caching
  const { yachts } = await getLandingPageYachts(pageDefinition);

  // Generate JSON-LD structured data
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Browse Yachts", path: "/yachts" },
    { name: "Best Yachts", path: "/best" },
    { name: pageDefinition.title },
  ], locale);

  const collectionJsonLd = generateCollectionPageJsonLd({
    name: pageDefinition.title,
    description: pageDefinition.metaDescription,
    url: getSiteUrl(`/${locale}/best/${slug}`),
    itemCount: yachts.length,
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
      {yachtJsonLd.map((yacht) => (
        <script
          key={yacht.id}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateYachtJsonLd(yacht, locale)),
          }}
        />
      ))}

      {/* Page Header */}
      <section className="bg-gradient-to-b from-sky-50 to-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-4 text-4xl">{pageDefinition.icon}</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            {pageDefinition.title}
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            {pageDefinition.intro}
          </p>
          <p className="text-sm text-gray-500">
            {t("header.showingYachts", { count: yachts.length })}
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
                          <span className="text-gray-600">{t("specs.loa")}</span>
                          <span className="font-medium">
                            {yacht.lengthOverall.toFixed(1)}m
                          </span>
                        </div>
                      )}
                      {yacht.cabins && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t("specs.cabins")}</span>
                          <span className="font-medium">{yacht.cabins}</span>
                        </div>
                      )}
                      {yacht.displacement && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t("specs.displacement")}</span>
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

              {/* Related Categories */}
              {pageDefinition.related && pageDefinition.related.length > 0 && (
                <div className="mt-16 pt-8 border-t border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    {t("related.title")}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pageDefinition.related.map((relatedSlug) => {
                      const relatedPage = getLandingPageBySlug(relatedSlug);
                      if (!relatedPage) return null;

                      return (
                        <Link
                          key={relatedSlug}
                          href={`/best/${relatedSlug}`}
                          className="block bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition"
                        >
                          <div className="flex items-center mb-3">
                            <span className="text-2xl mr-3">{relatedPage.icon}</span>
                            <h3 className="font-semibold text-gray-900">
                              {relatedPage.title}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600">
                            {relatedPage.intro.substring(0, 150)}
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("empty.title")}
              </h3>
              <p className="text-gray-600 mb-6">
                {t("empty.description")}{" "}
                <Link
                  href="/yachts"
                  className="text-blue-600 hover:underline font-medium"
                >
                  {t("empty.databaseLink")}
                </Link>
                {t("empty.descriptionEnd")}
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
