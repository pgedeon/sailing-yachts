import type { Metadata } from "next";
import Link from "next/link";
import { getActiveFeaturedYacht, getRecentFeaturedYachts } from "@/lib/featured-yacht-service";
import { generateWebsiteJsonLd, getSiteUrl } from "@/lib/seo";
import { getTranslations } from "next-intl/server";
import { FeaturedYachtPageClient } from "./FeaturedYachtPageClient";

export const revalidate = 3600;

interface Props {
  params: { locale: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "FeaturedYacht" });
  const featured = await getActiveFeaturedYacht();

  const title = featured
    ? `${t("pageTitle")} — ${featured.yacht.manufacturer} ${featured.yacht.modelName}`
    : t("pageTitle");

  const description = featured?.editorialText || featured?.yacht.description || t("pageDescription");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: getSiteUrl(`/${locale}/yacht-of-the-week`),
      type: "article",
      siteName: "Sailing Yacht Info",
      images: featured?.yacht.imageUrl
        ? [{ url: featured.yacht.imageUrl, width: 1200, height: 630 }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function YachtOfTheWeekPage({ params }: Props) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "FeaturedYacht" });

  const [active, recent] = await Promise.all([
    getActiveFeaturedYacht(),
    getRecentFeaturedYachts(10),
  ]);

  const jsonLd = generateWebsiteJsonLd(locale);

  // Product JSON-LD for the featured yacht
  const productJsonLd = active
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: `${active.yacht.manufacturer} ${active.yacht.modelName}`,
        description: active.editorialText || active.yacht.description || undefined,
        image: active.yacht.imageUrl || undefined,
        brand: {
          "@type": "Brand",
          name: active.yacht.manufacturer,
        },
      }
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {productJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      )}

      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-gradient-to-b from-blue-50 to-white py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-4xl mb-4">⭐</div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t("pageTitle")}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("pageDescription")}
            </p>
          </div>
        </section>

        {/* Active Featured Yacht */}
        {active ? (
          <section className="py-12 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl border border-blue-100 shadow-lg overflow-hidden">
                <div className="md:flex">
                  {active.yacht.imageUrl && (
                    <div className="md:w-2/5 h-64 md:h-auto bg-gray-100">
                      <img
                        src={active.yacht.imageUrl}
                        alt={`${active.yacht.manufacturer} ${active.yacht.modelName}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 p-8">
                    <div className="text-sm text-blue-600 font-semibold mb-2 uppercase tracking-wide">
                      {t("thisWeeksPick")}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {active.headline || `${active.yacht.manufacturer} ${active.yacht.modelName}`}
                    </h2>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg font-medium text-gray-700">
                        {active.yacht.manufacturer}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">{active.yacht.year}</span>
                    </div>

                    {(active.editorialText || active.yacht.description) && (
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        {active.editorialText || active.yacht.description}
                      </p>
                    )}

                    {/* Key Specs */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                      {active.yacht.lengthOverall && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 uppercase">{t("specLabels.loa")}</div>
                          <div className="font-semibold text-gray-900">{Number(active.yacht.lengthOverall).toFixed(1)}m</div>
                        </div>
                      )}
                      {active.yacht.beam && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 uppercase">{t("specLabels.beam")}</div>
                          <div className="font-semibold text-gray-900">{Number(active.yacht.beam).toFixed(1)}m</div>
                        </div>
                      )}
                      {active.yacht.draft && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 uppercase">{t("specLabels.draft")}</div>
                          <div className="font-semibold text-gray-900">{Number(active.yacht.draft).toFixed(1)}m</div>
                        </div>
                      )}
                      {active.yacht.displacement && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 uppercase">{t("specLabels.displacement")}</div>
                          <div className="font-semibold text-gray-900">{Number(active.yacht.displacement).toLocaleString()} kg</div>
                        </div>
                      )}
                      {active.yacht.cabins !== null && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 uppercase">{t("specLabels.cabins")}</div>
                          <div className="font-semibold text-gray-900">{active.yacht.cabins}</div>
                        </div>
                      )}
                      {active.yacht.berths !== null && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 uppercase">{t("specLabels.berths")}</div>
                          <div className="font-semibold text-gray-900">{active.yacht.berths}</div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Link
                        href={`/${locale}/yachts/${active.yacht.slug}`}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                      >
                        {t("viewFullSpecs")}
                      </Link>
                      <Link
                        href={`/${locale}/compare?ids=${active.yacht.id}`}
                        className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
                      >
                        {t("compareWithOthers")}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="py-16 px-4 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-5xl mb-4">⛵</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                {t("noFeaturedYet")}
              </h2>
              <p className="text-gray-500">
                {t("checkBackSoon")}
              </p>
              <Link
                href={`/${locale}/yachts`}
                className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                {t("browseAllYachts")}
              </Link>
            </div>
          </section>
        )}

        {/* Archive */}
        {recent.length > 1 && (
          <section className="py-12 px-4 bg-white">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("previousFeatures")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recent
                  .filter((r) => !active || r.id !== active.id)
                  .map((item) => (
                    <Link
                      key={item.id}
                      href={`/${locale}/yachts/${item.yacht.slug}`}
                      className="block bg-gray-50 rounded-lg p-4 hover:bg-blue-50 transition border border-gray-100"
                    >
                      <div className="text-sm text-gray-500 mb-1">
                        {new Date(item.weekStart).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="font-semibold text-gray-900">
                        {item.yacht.manufacturer} {item.yacht.modelName}
                      </div>
                      {item.headline && (
                        <div className="text-sm text-gray-600 mt-1 truncate">{item.headline}</div>
                      )}
                      <div className="flex gap-3 mt-2 text-xs text-gray-500">
                        {item.yacht.lengthOverall && <span>{Number(item.yacht.lengthOverall).toFixed(1)}m</span>}
                        <span>{item.yacht.year}</span>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </section>
        )}

        {/* Newsletter CTA */}
        <section className="py-12 px-4 bg-blue-50 border-t border-blue-100">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t("neverMissTitle")}</h2>
            <p className="text-gray-600 mb-4">{t("neverMissDescription")}</p>
            <FeaturedYachtPageClient locale={locale} />
          </div>
        </section>
      </main>
    </>
  );
}
