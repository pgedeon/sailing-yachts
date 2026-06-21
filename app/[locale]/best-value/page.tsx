import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations , setRequestLocale } from "next-intl/server";
import { getSiteUrl, buildLocaleAlternates } from "@/lib/seo";
import { buildOgImageUrl } from "@/lib/seo";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const { locale } = params;
  // Enable static rendering for next-intl
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "BestValue" });

  const ogImage = buildOgImageUrl({ type: "default", title: t("meta.title"), description: t("meta.description") });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
      url: getSiteUrl("/best-value"),
      type: "website",
      siteName: "Sailing Yacht Info",
      images: [{ url: ogImage, width: 1200, height: 630, alt: t("meta.title") }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("meta.title"),
      description: t("meta.description"),
      images: [ogImage],
    },
    alternates: buildLocaleAlternates("/best-value"),
  };
}

const BEST_VALUE_CATEGORIES = [
  {
    slug: "40ft-cruisers",
    icon: "💰",
  },
  {
    slug: "35ft-sailboats",
    icon: "📊",
  },
  {
    slug: "family-cruisers-under-45ft",
    icon: "👨‍👩‍👧‍👦",
  },
  {
    slug: "bluewater-value",
    icon: "🌊",
  },
];

export default async function BestValueIndexPage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "BestValue" });

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-b from-emerald-50 to-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-4 text-5xl">🏆</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            {t("index.heading")}
          </h1>
          <p className="text-lg text-gray-600 mb-4 max-w-3xl mx-auto">
            {t("index.description")}
          </p>
          <p className="text-sm text-gray-500">
            {t("index.rankingsNote")}
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
                  {t(`categories.${cat.slug}.title`)}
                </h2>
                <p className="text-sm text-gray-600 mb-3">
                  {t(`categories.${cat.slug}.description`)}
                </p>
                <span className="text-xs text-emerald-700 font-medium">
                  {t("index.viewYachts", { count: t(`categories.${cat.slug}.yachtCount`) })}
                </span>
              </Link>
            ))}
          </div>

          {/* Cross-link to /best pages */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">
              {t("index.curatedPicks")}{" "}
              <Link
                href="/best/40-foot-cruising-sailboats"
                className="text-blue-600 hover:underline"
              >
                {t("index.curatedPicksLink")}
              </Link>
            </p>
          </div>

          {/* Methodology */}
          <div className="mt-12 max-w-2xl mx-auto text-center">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {t("index.aboutTitle")}
            </h2>
            <p className="text-sm text-gray-600">
              {t("index.aboutDescription")}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
