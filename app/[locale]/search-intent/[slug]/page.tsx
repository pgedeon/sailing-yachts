import { SHIMMER_BLUR } from "@/lib/image-utils";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSearchIntentBySlug } from "@/lib/search-intents";
import { generateBreadcrumbJsonLd, getSiteUrl, generateCollectionPageJsonLd, generateYachtJsonLd, buildLocaleAlternates , buildOgImageUrl } from "@/lib/seo";
import { localePath } from "@/lib/i18n-paths"
import { getSearchIntentParams } from "@/lib/static-params";

export const revalidate = 21600;


// ISR: Revalidate search intent pages every 6 hours


// Use dynamicParams to allow any slug at runtime
export const dynamicParams = true;

// Generate metadata for each search intent page
export async function generateStaticParams() {
  return getSearchIntentParams();
}

export async function generateMetadata(
  props: {
    params: Promise<{ slug: string; locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const { slug, 
locale } = params;
  // Enable static rendering for next-intl
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "SearchIntent" });
  const { intent } = await getSearchIntentBySlug(slug);

  if (!intent || intent.id === 0) {
    return {
      title: t("meta.notFoundTitle"),
      description: t("meta.notFoundDescription"),
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
      url: getSiteUrl(`/${locale}/search-intent/${slug}`),
      type: "website",
      siteName: "Sailing Yacht Info",
      images: [{ url: buildOgImageUrl({ type: "default", title: intent.title }), width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary",
      title: intent.title,
      description: intent.metaDescription || intent.intro.substring(0, 160),
    },
    alternates: buildLocaleAlternates(`/search-intent/${slug}`),
    robots: {
      index: true,
      follow: true,
    },
  };
}

// Main search intent page component
export default async function SearchIntentPage(
  props: {
    params: Promise<{ slug: string; locale: string }>;
  }
) {
  const params = await props.params;
  const { slug, locale } = params;
  const t = await getTranslations({ locale, namespace: "SearchIntent" });
  const { intent, yachts, totalCount } = await getSearchIntentBySlug(slug);

  // Not found
  if (!intent || intent.id === 0) {
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
            href={localePath(locale, "/")}
            className="text-blue-600 hover:underline"
          >
            {t("notFound.homeLink")}
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
  ], locale);

  const collectionJsonLd = generateCollectionPageJsonLd({
    name: intent.title,
    description: intent.metaDescription || intent.intro,
    url: getSiteUrl(`/${locale}/search-intent/${slug}`),
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
      <section className="bg-linear-to-b from-sky-50 to-white py-16 px-4">
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
              {t("header.popularSearch", { count: intent.searchCount.toLocaleString() })}
            </p>
          )}
          <p className="text-sm text-gray-500">
            {t("header.showingYachts", { shown: yachts.length, total: totalCount })}
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
                    href={localePath(locale, `/yachts/${yacht.slug}`)}
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
                        <div className="ml-4 shrink-0 w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                          <Image
                            src={yacht.primaryImageUrl}
                            alt={`${yacht.manufacturer} ${yacht.modelName}`}
                            width={64}
                            height={64}
                            className="object-cover"
                            placeholder="blur"
                            blurDataURL={SHIMMER_BLUR}
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

              {/* View All CTA */}
              {totalCount > yachts.length && (
                <div className="mt-12 text-center">
                  <p className="text-gray-600 mb-4">
                    {t("cta.showing", { shown: yachts.length, total: totalCount })}
                  </p>
                  <Link
                    href={localePath(locale, "/yachts")}
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    {t("cta.viewAll")}
                  </Link>
                </div>
              )}

              {/* Newsletter Signup */}
              <div className="mt-16 bg-blue-50 rounded-xl p-8 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {t("newsletter.title")}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t("newsletter.description")}
                </p>
                <Link
                  href={localePath(locale, "/newsletter")}
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  {t("newsletter.subscribe")}
                </Link>
              </div>
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
                  href={localePath(locale, "/yachts")}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {t("empty.databaseLink")}
                </Link>
                {t("empty.descriptionEnd")}
              </p>
              <Link
                href={localePath(locale, "/yachts")}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                {t("empty.browseAll")}
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
