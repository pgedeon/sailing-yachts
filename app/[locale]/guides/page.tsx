import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations , setRequestLocale } from "next-intl/server";
import { getAllPublishedArticles, getAllCategories, getBuyingGuideArticles } from "@/lib/articles";
import { getSiteUrl , buildLocaleAlternates , buildOgImageUrl } from "@/lib/seo";
import { BUYING_GUIDE_TEMPLATES, type GuideType } from "@/lib/buying-guides";
import { localePath } from "@/lib/i18n-paths";
import { SHIMMER_BLUR } from "@/lib/image-utils";

// ISR: Revalidate guides hub every hour
export const revalidate = 3600;

interface GuidesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(props: GuidesPageProps): Promise<Metadata> {
  const params = await props.params;
  const { locale } = params;
  // Enable static rendering for next-intl
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Guides" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    keywords: [
      "sailing guides",
      "yacht buying guide",
      "sailing resources",
      "boat selection",
      "sailing education",
      "nautical glossary",
    ],
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
      url: getSiteUrl("/guides"),
      type: "website",
      siteName: "Sailing Yacht Info",
      images: [{ url: buildOgImageUrl({ type: "guide", title: t("meta.title"), description: t("meta.description") }), width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary",
      title: t("meta.title"),
      description: t("meta.description"),
    },
    alternates: buildLocaleAlternates("/guides", locale),
  };
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function FreshnessBadge({
  reviewStatus,
  lastReviewedAt,
  needsReview,
  dueForReview,
  reviewed,
}: {
  reviewStatus: string | null;
  lastReviewedAt: Date | string | null;
  needsReview: string;
  dueForReview: string;
  reviewed: string;
}) {
  const status = reviewStatus || "fresh";
  if (status === "stale") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        {needsReview}
      </span>
    );
  }
  if (status === "due") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
        {dueForReview}
      </span>
    );
  }
  if (lastReviewedAt) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        {reviewed}
      </span>
    );
  }
  return null;
}

export default async function GuidesPage(props: GuidesPageProps) {
  const params = await props.params;
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "Guides" });

  const [articles, categories, buyingGuideArticles] = await Promise.all([
    getAllPublishedArticles(),
    getAllCategories(),
    getBuyingGuideArticles(),
  ]);

  // Freshness label helpers
  const freshnessNeedsReview = t("articleCard.freshness.needsReview");
  const freshnessDueForReview = t("articleCard.freshness.dueForReview");

  function getFreshnessReviewedLabel(lastReviewedAt: Date | string | null) {
    if (!lastReviewedAt) return "";
    return t("articleCard.freshness.reviewed", { date: formatDate(lastReviewedAt) });
  }

  // Group buying guides by type
  const guidesByType = new Map<GuideType, typeof buyingGuideArticles>();
  for (const guide of buyingGuideArticles) {
    if (guide.buyingGuideTemplateId) {
      const template = BUYING_GUIDE_TEMPLATES.find((bt) => bt.id === guide.buyingGuideTemplateId);
      if (template) {
        const typeGuides = guidesByType.get(template.type) || [];
        guidesByType.set(template.type, [...typeGuides, guide]);
      }
    }
  }

  // Guide type label translations
  const guideTypeLabels: Record<GuideType, string> = {
    "best-sailboats-for": t("guideTypes.bestSailboatsFor"),
    "how-to-choose": t("guideTypes.howToChoose"),
    "x-vs-y-explained": t("guideTypes.xVsYExplained"),
    "new-vs-used": t("guideTypes.newVsUsed"),
    "what-size-cruiser": t("guideTypes.whatSizeCruiser"),
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="bg-linear-to-b from-sky-50 to-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {t("heading")}
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            {t("description")}
          </p>
        </div>
      </section>

      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar: Categories */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t("sidebar.categories")}
                </h2>
                {categories.length > 0 ? (
                  <ul className="space-y-2">
                    <li>
                      <Link
                        href={localePath(locale, "/guides")}
                        className="block px-3 py-2 rounded-md text-blue-600 hover:bg-blue-50 transition"
                      >
                        {t("sidebar.allGuides", { count: articles.length })}
                      </Link>
                    </li>
                    {categories.map((cat) => (
                      <li key={cat.name}>
                        <Link
                          href={localePath(locale, `/guides?category=${encodeURIComponent(
                            cat.name,
                          )}`)}
                          className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition"
                        >
                          {formatCategoryName(cat.name)} ({cat.count})
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    {t("sidebar.noCategories")}
                  </p>
                )}
              </div>

              {/* Newsletter Signup */}
              <div className="bg-blue-50 rounded-lg p-6 mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {t("sidebar.getNewGuides")}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {t("sidebar.getNewGuidesDescription")}
                </p>
                <Link
                  href={localePath(locale, "/newsletter")}
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition"
                >
                  {t("sidebar.subscribe")}
                </Link>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Buying Guides Section */}
              {buyingGuideArticles.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {t("buyingGuides")}
                  </h2>
                  <div className="space-y-8">
                    {Array.from(guidesByType.entries()).map(([type, guides]) => (
                      <div key={type} className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          {guideTypeLabels[type]}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {guides.map((guide) => (
                            <Link
                              key={guide.id}
                              href={localePath(locale, `/guides/${guide.slug}`)}
                              className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition group"
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">
                                  {BUYING_GUIDE_TEMPLATES.find((bt) => bt.id === guide.buyingGuideTemplateId)?.icon || "📖"}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition truncate">
                                    {guide.title}
                                  </h4>
                                  {guide.excerpt && (
                                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                      {guide.excerpt}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    {guide.readingTimeMinutes && (
                                      <span className="text-xs text-gray-500">
                                        {t("articleCard.minRead", { minutes: guide.readingTimeMinutes })}
                                      </span>
                                    )}
                                    <FreshnessBadge
                                      reviewStatus={guide.reviewStatus}
                                      lastReviewedAt={guide.lastReviewedAt}
                                      needsReview={freshnessNeedsReview}
                                      dueForReview={freshnessDueForReview}
                                      reviewed={getFreshnessReviewedLabel(guide.lastReviewedAt)}
                                    />
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Guides Section */}
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {buyingGuideArticles.length > 0 ? t("otherGuides") : t("allGuidesHeading")}
              </h2>
              {articles.length > buyingGuideArticles.length ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {articles
                      .filter((a) => !a.buyingGuideTemplateId)
                      .map((article) => (
                        <Link
                          key={article.id}
                          href={localePath(locale, `/guides/${article.slug}`)}
                          className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition group"
                        >
                          {article.featuredImage && (
                            <div className="mb-4 aspect-video bg-gray-100 rounded-lg overflow-hidden">
                              <Image
                                src={article.featuredImage}
                                alt={article.title}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                className="object-cover group-hover:scale-105 transition duration-300"
                                placeholder="blur"
                                blurDataURL={SHIMMER_BLUR}
                              />
                            </div>
                          )}
                          <div className="flex items-center gap-2 mb-3">
                            {article.category && (
                              <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                {formatCategoryName(article.category)}
                              </span>
                            )}
                            {article.readingTimeMinutes && (
                              <span className="text-xs text-gray-500">
                                {t("articleCard.minRead", { minutes: article.readingTimeMinutes })}
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                            {article.title}
                          </h3>
                          {article.excerpt && (
                            <p className="text-gray-600 text-sm line-clamp-3">
                              {article.excerpt}
                            </p>
                          )}
                          <div className="mt-4 flex items-center justify-between">
                            {article.author && (
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                                  {article.author.charAt(0)}
                                </div>
                                <span className="text-sm text-gray-600">
                                  {article.author}
                                  {article.authorTitle && (
                                    <span className="text-gray-500">
                                      {" "}
                                      · {article.authorTitle}
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                            <FreshnessBadge
                              reviewStatus={article.reviewStatus}
                              lastReviewedAt={article.lastReviewedAt}
                              needsReview={freshnessNeedsReview}
                              dueForReview={freshnessDueForReview}
                              reviewed={getFreshnessReviewedLabel(article.lastReviewedAt)}
                            />
                          </div>
                        </Link>
                      ))}
                  </div>

                  {/* Browse Yachts CTA */}
                  <div className="mt-12 bg-linear-to-r from-blue-600 to-sky-500 rounded-xl p-8 text-center text-white">
                    <h3 className="text-2xl font-semibold mb-4">
                      {t("cta.exploreTitle")}
                    </h3>
                    <p className="text-blue-50 mb-6 max-w-2xl mx-auto">
                      {t("cta.exploreDescription")}
                    </p>
                    <Link
                      href={localePath(locale, "/yachts")}
                      className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition"
                    >
                      {t("cta.browseYachts")}
                    </Link>
                  </div>
                </>
              ) : articles.length > 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {t("empty.moreComingTitle")}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {t("empty.moreComingDescription")}
                  </p>
                  <Link
                    href={localePath(locale, "/yachts")}
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    {t("cta.browseYachts")}
                  </Link>
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {t("empty.comingSoonTitle")}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {t("empty.comingSoonDescription")}
                  </p>
                  <Link
                    href={localePath(locale, "/yachts")}
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    {t("cta.browseYachts")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function formatCategoryName(category: string): string {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
