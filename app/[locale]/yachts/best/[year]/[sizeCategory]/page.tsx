import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBestYearSizePageData,
  EDITORIAL_CONTENT,
  parseYear,
  EDITORIAL_YEARS,
} from "@/lib/best-year-size-landing";
import { getSizeCategory } from "@/lib/size-categories";
import {
  getSiteUrl,
  generateBreadcrumbJsonLd,
  generateArticleJsonLd,
  generateItemListJsonLd,
  buildLocaleAlternates,
  buildOgImageUrl,
} from "@/lib/seo";
import { localePath } from "@/lib/i18n-paths";
import { BestYearSizeClient } from "./BestYearSizeClient";
import { setRequestLocale } from "next-intl/server";
import { getBestYearSizeParams } from "@/lib/static-params";

export const revalidate = 21600;




export async function generateStaticParams() {
  return getBestYearSizeParams();
}

export async function generateMetadata(
  props: {
    params: Promise<Record<string, string | undefined>>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const rawParams = params;
  const yearStr = rawParams.year;
  const sizeCategoryStr = rawParams.sizeCategory;
  if (!yearStr || !sizeCategoryStr) notFound();

  const year = parseYear(yearStr);
  if (!year) notFound();

  const sizeCategory = getSizeCategory(sizeCategoryStr);
  if (!sizeCategory) notFound();

  const locale = rawParams.locale || "en";
  // Enable static rendering for next-intl
  setRequestLocale(locale);
  const content = EDITORIAL_CONTENT[sizeCategoryStr];
  const sizeLabel =
    locale === "fr" ? sizeCategory.labelFr : sizeCategory.labelEn;

  const title = content
    ? locale === "fr"
      ? content.titleFr(year, sizeLabel)
      : content.titleEn(year, sizeLabel)
    : `Best ${sizeLabel} Sailboats of ${year}`;

  const description =
    locale === "fr"
      ? `Découvrez les meilleurs voiliers ${sizeLabel} de ${year}. Comparaison détaillée des spécifications, performances et avis.`
      : `Discover the best ${sizeLabel} sailboats of ${year}. Detailed specs, performance data, and editorial reviews to help you choose.`;

  const path = `/yachts/best/${yearStr}/${sizeCategoryStr}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: getSiteUrl(path),
      type: "article",
      siteName: "Sailing Yacht Info",
      publishedTime: `${year}-01-01T00:00:00Z`,
      images: [
        {
          url: buildOgImageUrl({
            type: "editorial",
            title,
            description: `${sizeLabel} sailboats for ${year}`,
          }),
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: buildLocaleAlternates(path),
  };
}

export default async function BestYearSizePage(
  props: {
    params: Promise<Record<string, string | undefined>>;
  }
) {
  const params = await props.params;
  const rawParams = params;
  const yearStr = rawParams.year;
  const sizeCategoryStr = rawParams.sizeCategory;
  if (!yearStr || !sizeCategoryStr) notFound();

  const year = parseYear(yearStr);
  if (!year) notFound();

  const sizeCategory = getSizeCategory(sizeCategoryStr);
  if (!sizeCategory) notFound();

  const locale = rawParams.locale || "en";
  const data = await getBestYearSizePageData(year, sizeCategoryStr);
  if (!data) notFound();

  const sizeLabel =
    locale === "fr" ? sizeCategory.labelFr : sizeCategory.labelEn;
  const content = EDITORIAL_CONTENT[sizeCategoryStr];

  const title = content
    ? locale === "fr"
      ? content.titleFr(year, sizeLabel)
      : content.titleEn(year, sizeLabel)
    : `Best ${sizeLabel} Sailboats of ${year}`;

  const intro = content
    ? locale === "fr"
      ? content.introFr(year, data.yachts.length)
      : content.introEn(year, data.yachts.length)
    : "";

  const conclusion = content
    ? locale === "fr"
      ? content.conclusionFr
      : content.conclusionEn
    : "";

  const path = `/yachts/best/${yearStr}/${sizeCategoryStr}`;

  // JSON-LD: BreadcrumbList
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(
    [
      { name: "Home", path: "/" },
      { name: "Best Sailboats", path: "/yachts/best" },
      { name: String(year), path: `/yachts/best/${yearStr}` },
      { name: sizeLabel, path },
    ],
    locale
  );

  // JSON-LD: Article
  const articleJsonLd = generateArticleJsonLd({
    headline: title,
    description: intro,
    url: getSiteUrl(path),
    datePublished: `${year}-01-01T00:00:00Z`,
    dateModified: new Date().toISOString(),
    authorName: "Sailing Yacht Info Editorial",
  });

  // JSON-LD: ItemList
  const itemListJsonLd = generateItemListJsonLd({
    name: title,
    description: intro,
    items: data.yachts.map((y) => ({
      name: `${y.manufacturer} ${y.modelName}`,
      url: getSiteUrl(`/yachts/${y.slug}`),
    })),
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3"
      >
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link
              href={localePath(locale, "/")}
              className="hover:text-foreground transition-colors"
            >
              Home
            </Link>
          </li>
          <li>
            <span className="mx-1">/</span>
            <Link
              href={localePath(locale, "/yachts")}
              className="hover:text-foreground transition-colors"
            >
              Yachts
            </Link>
          </li>
          <li>
            <span className="mx-1">/</span>
            <span className="text-foreground font-medium">
              Best {year} {sizeLabel}
            </span>
          </li>
        </ol>
      </nav>

      {/* Hero Section */}
      <section className="bg-linear-to-b from-amber-50 via-orange-50 to-white py-12 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <span className="text-lg">🏆</span>
            {locale === "fr" ? "Sélection éditoriale" : "Editorial Pick"}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">{intro}</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
            <span className="text-lg">⛵</span>
            {data.yachts.length}{" "}
            {locale === "fr" ? "voiliers évalués" : "yachts reviewed"} ·{" "}
            {data.topManufacturers.length}{" "}
            {locale === "fr" ? "constructeurs" : "manufacturers"}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0 space-y-4">
            {/* Other Size Categories */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                {locale === "fr" ? "Tailles" : "Sizes"}
              </h3>
              <ul className="space-y-2">
                {data.otherSizes.map((sc) => (
                  <li key={sc.slug}>
                    {sc.count > 0 ? (
                      <Link
                        href={localePath(
                          locale,
                          `/yachts/best/${yearStr}/${sc.slug}`
                        )}
                        className="flex items-center justify-between text-sm text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <span>
                          {locale === "fr" ? sc.labelFr : sc.labelEn}
                        </span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                          {sc.count}
                        </span>
                      </Link>
                    ) : (
                      <span className="flex items-center justify-between text-sm text-gray-300">
                        <span>
                          {locale === "fr" ? sc.labelFr : sc.labelEn}
                        </span>
                        <span className="text-xs">0</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Other Years */}
            {data.otherYears.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                  {locale === "fr" ? "Années" : "Years"}
                </h3>
                <ul className="space-y-2">
                  {data.otherYears.map((y) => (
                    <li key={y.year}>
                      {y.count > 0 ? (
                        <Link
                          href={localePath(
                            locale,
                            `/yachts/best/${y.year}/${sizeCategoryStr}`
                          )}
                          className="flex items-center justify-between text-sm text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <span>{y.year}</span>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                            {y.count}
                          </span>
                        </Link>
                      ) : (
                        <span className="flex items-center justify-between text-sm text-gray-300">
                          <span>{y.year}</span>
                          <span className="text-xs">0</span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Top Manufacturers */}
            {data.topManufacturers.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                  {locale === "fr"
                    ? "Top constructeurs"
                    : "Top Manufacturers"}
                </h3>
                <ul className="space-y-2">
                  {data.topManufacturers.slice(0, 8).map((m) => (
                    <li key={m.slug}>
                      <Link
                        href={localePath(
                          locale,
                          `/manufacturers/${m.slug}/${sizeCategoryStr}`
                        )}
                        className="flex items-center justify-between text-sm text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <span>{m.name}</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                          {m.count}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Pages */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                {locale === "fr" ? "Voir aussi" : "See Also"}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href={localePath(
                      locale,
                      `/yachts/by-size/${sizeCategoryStr}`
                    )}
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    {locale === "fr"
                      ? `Tous les voiliers ${sizeLabel}`
                      : `All ${sizeLabel} Sailboats`}
                  </Link>
                </li>
              </ul>
            </div>
          </aside>

          {/* Yacht Ranking List */}
          <div className="flex-1">
            <BestYearSizeClient
              yachts={data.yachts}
              locale={locale}
              year={year}
            />
          </div>
        </div>
      </section>

      {/* Conclusion Section */}
      {conclusion && (
        <section className="bg-gray-50 py-10 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-gray max-w-none">
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                {locale === "fr"
                  ? "Notre avis éditorial"
                  : "Our Editorial Take"}
              </h2>
              <p className="text-gray-600 leading-relaxed">{conclusion}</p>
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="bg-white py-8 px-4 border-t border-gray-100">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-gray-600 mb-4">
            {locale === "fr"
              ? "Explorez plus de voiliers par taille et fabricant"
              : "Explore more sailboats by size and manufacturer"}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={localePath(
                locale,
                `/yachts/by-size/${sizeCategoryStr}`
              )}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {locale === "fr"
                ? `Tous les ${sizeLabel}`
                : `All ${sizeLabel} Yachts`}
            </Link>
            <Link
              href={localePath(locale, "/yachts")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              {locale === "fr" ? "Tous les voiliers" : "All Yachts"}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
