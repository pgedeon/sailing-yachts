import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getManufacturerSizePageData } from "@/lib/manufacturer-size-landing";
import { getSizeCategory } from "@/lib/size-categories";
import {
  getSiteUrl,
  generateBreadcrumbJsonLd,
  generateCollectionPageJsonLd,
  generateItemListJsonLd,
  buildLocaleAlternates,
  buildOgImageUrl,
} from "@/lib/seo";
import { localePath } from "@/lib/i18n-paths";
import { ManufacturerSizeClient } from "./ManufacturerSizeClient";

// Revalidate every 60 minutes
export const revalidate = 3600;

/**
 * Parse params — Next.js may pass combined or individual param keys.
 * The route is /manufacturers/[slug]/[sizeCategory].
 */
function parseParams(
  rawParams: Record<string, string | undefined>
): { slug: string; sizeCategory: string } | null {
  // Try individual keys
  if (rawParams.slug && rawParams.sizeCategory) {
    return { slug: rawParams.slug, sizeCategory: rawParams.sizeCategory };
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Record<string, string | undefined>>;
}): Promise<Metadata> {
  const rawParams = await params;
  const parsed = parseParams(rawParams);
  if (!parsed) notFound();

  const { slug, sizeCategory } = parsed;
  const locale = rawParams.locale || "en";
  const data = await getManufacturerSizePageData(slug, sizeCategory);
  if (!data || data.yachts.length === 0) notFound();

  const sizeLabel =
    locale === "fr"
      ? data.sizeCategory.labelFr
      : data.sizeCategory.labelEn;
  const title = `${data.manufacturer.name} ${sizeLabel} Sailboats | Specs & Reviews`;
  const description =
    locale === "fr"
      ? data.sizeCategory.descriptionFr(
          data.manufacturer.name,
          data.yachts.length
        )
      : data.sizeCategory.descriptionEn(
          data.manufacturer.name,
          data.yachts.length
        );

  const path = `/manufacturers/${slug}/${sizeCategory}`;

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
            type: "manufacturer",
            title: `${data.manufacturer.name} ${sizeLabel}`,
            description: `${data.yachts.length} sailboats`,
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

export default async function ManufacturerSizePage({
  params,
}: {
  params: Promise<Record<string, string | undefined>>;
}) {
  const rawParams = await params;
  const parsed = parseParams(rawParams);
  if (!parsed) notFound();

  const { slug, sizeCategory } = parsed;
  const locale = rawParams.locale || "en";
  const data = await getManufacturerSizePageData(slug, sizeCategory);
  if (!data || data.yachts.length === 0) notFound();

  const sizeLabel =
    locale === "fr"
      ? data.sizeCategory.labelFr
      : data.sizeCategory.labelEn;

  // JSON-LD: BreadcrumbList
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(
    [
      { name: "Home", path: "/" },
      { name: "Manufacturers", path: "/manufacturers" },
      {
        name: data.manufacturer.name,
        path: `/manufacturers/${slug}`,
      },
      { name: sizeLabel, path: `/manufacturers/${slug}/${sizeCategory}` },
    ],
    locale
  );

  const description =
    locale === "fr"
      ? data.sizeCategory.descriptionFr(
          data.manufacturer.name,
          data.yachts.length
        )
      : data.sizeCategory.descriptionEn(
          data.manufacturer.name,
          data.yachts.length
        );

  // JSON-LD: CollectionPage
  const collectionJsonLd = generateCollectionPageJsonLd({
    name: `${data.manufacturer.name} ${sizeLabel} Sailboats`,
    description,
    url: getSiteUrl(`/manufacturers/${slug}/${sizeCategory}`),
    itemCount: data.yachts.length,
  });

  // JSON-LD: ItemList
  const itemListJsonLd = generateItemListJsonLd({
    name: `${data.manufacturer.name} ${sizeLabel} Sailboats`,
    description,
    items: data.yachts.map((y) => ({
      name: `${data.manufacturer.name} ${y.modelName}`,
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
            <Link href={localePath(locale, "/manufacturers")} className="hover:text-foreground transition-colors">
              Manufacturers
            </Link>
          </li>
          <li>
            <span className="mx-1">/</span>
            <Link
              href={localePath(locale, `/manufacturers/${data.manufacturer.slug}`)}
              className="hover:text-foreground transition-colors"
            >
              {data.manufacturer.name}
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
          {data.manufacturer.logoUrl && (
            <img
              src={data.manufacturer.logoUrl}
              alt={`${data.manufacturer.name} logo`}
              className="h-12 mx-auto mb-4 object-contain"
            />
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {data.manufacturer.name} {sizeLabel} Sailboats
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {description}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
            <span className="text-lg">⛵</span>
            {data.yachts.length} {locale === "fr" ? "voiliers" : "sailboats"}{" "}
            {locale === "fr" ? "disponibles" : "available"}
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
                        href={localePath(
                          locale,
                          `/manufacturers/${slug}/${sc.slug}`
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

            {/* Other Manufacturers in Same Size */}
            {data.otherManufacturers.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                  {locale === "fr"
                    ? "Autres constructeurs"
                    : "Other Manufacturers"}
                </h3>
                <ul className="space-y-2">
                  {data.otherManufacturers.slice(0, 8).map((m) => (
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
          </aside>

          {/* Yacht Grid */}
          <div className="flex-1">
            <ManufacturerSizeClient
              yachts={data.yachts}
              locale={locale}
              manufacturerSlug={slug}
            />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gray-50 py-8 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-gray-600 mb-4">
            {locale === "fr"
              ? "Consultez tous les voiliers"
              : "Browse all sailboats"}{" "}
            {data.manufacturer.name}
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href={localePath(
                locale,
                `/manufacturers/${data.manufacturer.slug}`
              )}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {locale === "fr"
                ? `Voir ${data.manufacturer.name}`
                : `View ${data.manufacturer.name}`}
            </Link>
            <Link
              href={localePath(locale, "/yachts")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              {locale === "fr"
                ? "Tous les voiliers"
                : "All Yachts"}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
