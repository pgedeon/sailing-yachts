import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import NewsletterSignup from "@/components/NewsletterSignup";
import { PersonalizedRecommendations } from "@/components/PersonalizedRecommendations";
import { FeaturedYachtOfTheWeek } from "@/components/FeaturedYachtOfTheWeek";
import { db, yachtModels, manufacturers } from "@/lib/db";
import { desc, sql } from "drizzle-orm";
import { generateWebsiteJsonLd, generateFaqJsonLd, getSiteUrl , buildLocaleAlternates } from "@/lib/seo";
import { slugify } from "@/lib/utils/slugify";
import { getSiteStats, formatYachtPhrase, formatYachtCountFAQ } from "@/lib/site-stats";
import { buildSafeQuery } from "@/lib/build-safe";
import { useTranslations } from "next-intl";
import { getMessages, getTranslations , setRequestLocale } from "next-intl/server";

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

interface HomeProps {
  params: Promise<{ locale: string }>;
}

// Generate metadata with live yacht count
export async function generateMetadata(props: HomeProps) {
  const params = await props.params;
  const { locale } = params;
  // Enable static rendering for next-intl
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Home" });
  const stats = await getSiteStats();
  const yachtPhrase = formatYachtPhrase(stats, locale);

  return {
    title: t("meta.title"),
    description: t("meta.description", { yachtPhrase }),
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
      title: t("meta.ogTitle"),
      description: t("meta.ogDescription", { yachtPhrase }),
      url: getSiteUrl(`/${locale}`),
      type: "website",
      siteName: "Sailing Yacht Info",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      images: [{ url: getSiteUrl("/api/og?title=Sailing%20Yachts%20Database&description=Specs%2C%20Dimensions%20%26%20Comparison"), width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("meta.twitterTitle"),
      description: t("meta.twitterDescription", { yachtPhrase }),
    },
    alternates: buildLocaleAlternates("/", locale),
  };
}

export default async function Home(props: HomeProps) {
  const params = await props.params;
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "Home" });

  const [featuredYachts, topManufacturers, stats] = await Promise.all([
    getFeaturedYachts(),
    getTopManufacturers(),
    getSiteStats(),
  ]);
  const yachtPhrase = formatYachtPhrase(stats, locale);

  const FAQ_ITEMS = [
    { q: t("faq.q1"), a: formatYachtCountFAQ(stats, locale) },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
  ];

  const jsonLd = generateWebsiteJsonLd(locale);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const browseBySize = [
    { label: t("browseBySize.under25"), min: 0, max: 7.62 },
    { label: t("browseBySize.range2530"), min: 7.62, max: 9.14 },
    { label: t("browseBySize.range3035"), min: 9.14, max: 10.67 },
    { label: t("browseBySize.range3540"), min: 10.67, max: 12.19 },
    { label: t("browseBySize.range4050"), min: 12.19, max: 15.24 },
    { label: t("browseBySize.over50"), min: 15.24, max: 999 },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-linear-to-b from-sky-50 to-white py-16 sm:py-24 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {t("hero.title")}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {t.rich("hero.description", {
                yachtPhrase,
                strong: (children) => <strong>{children}</strong>,
              })}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${locale}/yachts`}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200"
              >
                {t("hero.browseYachts")}
              </Link>
              <Link
                href={`/${locale}/compare`}
                className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition"
              >
                {t("hero.compareSideBySide")}
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Links by Size */}
        <section className="py-12 px-4 bg-white border-b">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">{t("browseBySize.title")}</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {browseBySize.map(({ label, min, max }) => (
                <Link
                  key={label}
                  href={`/${locale}/yachts?filters[lengthMin]=${min}&filters[lengthMax]=${max}`}
                  className="px-5 py-2 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-full text-sm font-medium transition"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Yacht of the Week */}
        <FeaturedYachtOfTheWeek />

        {/* Featured Yachts */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{t("featuredYachts.title")}</h2>
                <p className="text-gray-600 mt-1">{t("featuredYachts.subtitle")}</p>
              </div>
              <Link href={`/${locale}/yachts`} className="text-blue-600 hover:underline font-medium text-sm">
                {t("featuredYachts.viewAll")}
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:cols-2 lg:grid-cols-3 gap-6">
              {featuredYachts.length > 0 ? (
                featuredYachts.map((yacht: any) => (
                  <Link
                    key={yacht.id}
                    href={`/${locale}/yachts/${yacht.slug}`}
                    className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-blue-200 transition"
                  >
                    <div className="text-sm text-gray-500 mb-1">{yacht.manufacturer || t("featuredYachts.unknown")}</div>
                    <h3 className="font-semibold text-gray-900 text-lg">{yacht.modelName}</h3>
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                      {yacht.year && <span>{yacht.year}</span>}
                      {yacht.lengthOverall && <span>{Number(yacht.lengthOverall).toFixed(1)}m LOA</span>}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <div className="text-gray-500">{t("featuredYachts.building")}</div>
                  <div className="text-sm text-gray-500 mt-1">{t("featuredYachts.buildingSubtitle")}</div>
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
                <h2 className="text-2xl font-bold text-gray-900">{t("popularManufacturers.title")}</h2>
                <p className="text-gray-600 mt-1">{t("popularManufacturers.subtitle")}</p>
              </div>
              <Link href={`/${locale}/manufacturers`} className="text-blue-600 hover:underline font-medium text-sm">
                {t("popularManufacturers.viewAll")}
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {topManufacturers.length > 0 ? (
                topManufacturers.map((mfr: any) => (
                  <Link
                    key={mfr.name}
                    href={`/${locale}/manufacturers/${slugify(mfr.name)}`}
                    className="block bg-gray-50 rounded-lg p-4 hover:bg-blue-50 transition border border-gray-100"
                  >
                    <div className="font-semibold text-gray-900">{mfr.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {t("featuredYachts.models", { count: mfr.yachtCount })}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <div className="text-gray-500">{t("featuredYachts.building")}</div>
                  <div className="text-sm text-gray-500 mt-1">{t("featuredYachts.buildingSubtitle")}</div>
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
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">{t("whyUse.title")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-white text-2xl">🔍</div>
                <h3 className="font-semibold text-gray-900 mb-2">{t("whyUse.detailedSpecs.title")}</h3>
                <p className="text-gray-600 text-sm">{t("whyUse.detailedSpecs.description")}</p>
              </div>
              <div className="text-center">
                <div className="w-14 h14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-white text-2xl">⚖️</div>
                <h3 className="font-semibold text-gray-900 mb-2">{t("whyUse.sideBySide.title")}</h3>
                <p className="text-gray-600 text-sm">{t("whyUse.sideBySide.description")}</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-white text-2xl">📊</div>
                <h3 className="font-semibold text-gray-900 mb-2">{t("whyUse.performanceRatios.title")}</h3>
                <p className="text-gray-600 text-sm">{t("whyUse.performanceRatios.description")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">{t("faq.title")}</h2>
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

        {/* Quiz CTA */}
        <section className="py-12 px-4 bg-linear-to-r from-sky-50 to-blue-50 border-t border-blue-100">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{t("quizCta.title")}</h2>
            <p className="text-gray-600 mb-6">{t("quizCta.subtitle")}</p>
            <Link
              href={`/${locale}/quiz`}
              className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
              {t("quizCta.button")}
            </Link>
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
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">{t("cta.title")}</h2>
            <p className="text-gray-300 mb-8">{t("cta.subtitle")}</p>
            <Link
              href={`/${locale}/yachts`}
              className="inline-block px-8 py-4 bg-blue-700 text-white rounded-lg font-semibold text-lg hover:bg-blue-600 transition"
            >
              {t("cta.browseAll")}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
