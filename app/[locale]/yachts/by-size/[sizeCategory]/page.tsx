import { USE_CASES } from "@/lib/use-case-meta";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { getSizeCategoryHubData } from "@/lib/size-category-hub";

import {
  getSiteUrl,
  generateBreadcrumbJsonLd,
  generateCollectionPageJsonLd,
  generateItemListJsonLd,
  buildLocaleAlternates,
  buildOgImageUrl,
} from "@/lib/seo";
import { localePath } from "@/lib/i18n-paths";
import { SizeCategoryHubClient } from "./SizeCategoryHubClient";


// ISR: cache for 1 hour, invalidate via tags when admin updates yacht data



const getCachedSizeCategoryHubData = unstable_cache(
  async (sizeCategorySlug: string) => getSizeCategoryHubData(sizeCategorySlug),
  ["size-category-hub"],
  { tags: ["yachts", "manufacturers"] }
);

export async function generateMetadata({
  params,
}: {
  params: Record<string, string | undefined>;
}): Promise<Metadata> {
  const rawParams = params;
  const sizeCategory = rawParams.sizeCategory;
  if (!sizeCategory) notFound();

  const locale = rawParams.locale || "en";
  const data = await getCachedSizeCategoryHubData(sizeCategory);
  if (!data) notFound();

  const sizeLabel =
    locale === "fr" ? data.sizeCategory.labelFr : data.sizeCategory.labelEn;
  const title = `${sizeLabel} Sailboats — All Manufacturers | Specs & Reviews`;
  const description =
    locale === "fr"
      ? data.sizeCategory.descriptionFr("all manufacturers", data.yachts.length)
      : data.sizeCategory.descriptionEn("all manufacturers", data.yachts.length);

  const path = `/yachts/by-size/${sizeCategory}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: getSiteUrl(path),
      type: "website",
      siteName: "Sailing Yacht Info",
      images: [
        {
          url: buildOgImageUrl({
            type: "default",
            title: `${sizeLabel} Sailboats`,
            description: `${data.yachts.length} sailboats from ${data.topManufacturers.length} manufacturers`,
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

export default async function SizeCategoryHubPage({
  params,
}: {
  params: Record<string, string | undefined>;
}) {
  const rawParams = params;
  const sizeCategory = rawParams.sizeCategory;
  if (!sizeCategory) notFound();

  const locale = rawParams.locale || "en";
  const data = await getCachedSizeCategoryHubData(sizeCategory);
  if (!data) notFound();

  const sizeLabel =
    locale === "fr" ? data.sizeCategory.labelFr : data.sizeCategory.labelEn;

  const description =
    locale === "fr"
      ? data.sizeCategory.descriptionFr("all manufacturers", data.yachts.length)
      : data.sizeCategory.descriptionEn("all manufacturers", data.yachts.length);

  // JSON-LD: BreadcrumbList
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(
    [
      { name: "Home", path: "/" },
      { name: "Yachts", path: "/yachts" },
      { name: "By Size", path: "/yachts/by-size" },
      { name: sizeLabel, path: `/yachts/by-size/${sizeCategory}` },
    ],
    locale
  );

  // JSON-LD: CollectionPage
  const collectionJsonLd = generateCollectionPageJsonLd({
    name: `${sizeLabel} Sailboats`,
    description,
    url: getSiteUrl(`/yachts/by-size/${sizeCategory}`),
    itemCount: data.yachts.length,
  });

  // JSON-LD: ItemList
  const itemListJsonLd = generateItemListJsonLd({
    name: `${sizeLabel} Sailboats`,
    description,
    items: data.yachts.slice(0, 20).map((y) => ({
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
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListJsonLd),
        }}
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link href={localePath(locale, "/")} className="hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          <li>
            <span className="mx-1">/</span>
            <Link href={localePath(locale, "/yachts")} className="hover:text-foreground transition-colors">
              Yachts
            </Link>
          </li>
          <li>
            <span className="mx-1">/</span>
            <Link href={localePath(locale, "/yachts/by-size/35-40ft")} className="hover:text-foreground transition-colors">
              By Size
            </Link>
          </li>
          <li>
            <span className="mx-1">/</span>
            <span className="text-foreground font-medium">{sizeLabel}</span>
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <section className="bg-gradient-to-b from-sky-50 to-white py-12 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {sizeLabel}{" "}
            {locale === "fr" ? "Voiliers" : "Sailboats"}
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {description}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
              <span className="text-lg">⛵</span>
              {data.yachts.length}{" "}
              {locale === "fr" ? "voiliers" : "sailboats"}
            </span>
            <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
              {data.topManufacturers.length}{" "}
              {locale === "fr" ? "constructeurs" : "manufacturers"}
            </span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            {/* Other Size Categories */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                {locale === "fr" ? "Tailles" : "Sizes"}
              </h3>
              <ul className="space-y-2">
                {data.otherSizes.map((sc) => (
                  <li key={sc.slug}>
                    {sc.count > 0 ? (
                      <Link
                        href={localePath(locale, `/yachts/by-size/${sc.slug}`)}
                        className="flex items-center justify-between text-sm text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <span>{locale === "fr" ? sc.labelFr : sc.labelEn}</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                          {sc.count}
                        </span>
                      </Link>
                    ) : (
                      <span className="flex items-center justify-between text-sm text-gray-300">
                        <span>{locale === "fr" ? sc.labelFr : sc.labelEn}</span>
                        <span className="text-xs">0</span>
                      </span>
                    )}
                  </li>
                ))}
                {/* Current size */}
                <li>
                  <span className="flex items-center justify-between text-sm text-blue-600 font-medium">
                    <span>{sizeLabel}</span>
                    <span className="text-xs bg-blue-100 px-2 py-0.5 rounded-full">
                      {data.yachts.length}
                    </span>
                  </span>
                </li>
              </ul>
            </div>

            {/* Top Manufacturers in this size */}
            {data.topManufacturers.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                  {locale === "fr"
                    ? "Constructeurs populaires"
                    : "Top Manufacturers"}
                </h3>
                <ul className="space-y-2">
                  {data.topManufacturers.map((m) => (
                    <li key={m.slug}>
                      <Link
                        href={localePath(
                          locale,
                          `/manufacturers/${m.slug}/${sizeCategory}`
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

            {/* Related Use Cases */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                {locale === "fr" ? "Cas d\'utilisation" : "Use Cases"}
              </h3>
              <ul className="space-y-2">
                {USE_CASES.map((uc) => (
                  <li key={uc.slug}>
                    <Link
                      href={localePath(locale, `/yachts/for/${uc.slug}`)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <span>{uc.emoji}</span>
                      <span>{locale === "fr" ? uc.labelFr : uc.labelEn}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Yacht Grid */}
          <div className="flex-1">
            <SizeCategoryHubClient yachts={data.yachts} locale={locale} />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gray-50 py-8 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-gray-600 mb-4">
            {locale === "fr"
              ? "Explorez par constructeur ou comparez des voiliers"
              : "Explore by manufacturer or compare sailboats"}
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href={localePath(locale, "/manufacturers")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {locale === "fr"
                ? "Tous les constructeurs"
                : "All Manufacturers"}
            </Link>
            <Link
              href={localePath(locale, "/yachts")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              {locale === "fr" ? "Tous les voiliers" : "All Yachts"}
            </Link>
            <Link
              href={localePath(locale, "/compare")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              {locale === "fr" ? "Comparer" : "Compare"}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
