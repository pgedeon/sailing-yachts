import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";

import {
  generateBreadcrumbJsonLd,
  generateCollectionPageJsonLd,
  getSiteUrl,
  buildLocaleAlternates,
  buildOgImageUrl,
} from "@/lib/seo";
import {
  getManufacturerBySlug,
  getYachtsByManufacturerId,
  getRelatedManufacturers,
} from "@/lib/manufacturers";
import { getCountryFlag } from "@/lib/utils/country-flags";
import { getSpotlightByManufacturerId } from "@/lib/manufacturer-spotlights";
import { ManufacturerComparisons } from "./ManufacturerComparisons";
import ManufacturerLogo from "@/components/manufacturer-logo";
import { localePath } from "@/lib/i18n-paths";
import dynamic from "next/dynamic";

const ManufacturerFleetChart = dynamic(() => import("@/components/manufacturer-fleet-chart"), { ssr: false });

// ISR: Revalidate manufacturer detail pages every hour
export const revalidate = 3600;

// Cache manufacturer data query with tag for invalidation
async function getManufacturerData(slug: string) {
  return unstable_cache(
    async () => {
      const manufacturer = await getManufacturerBySlug(slug);
      if (!manufacturer) return null;

      const [yachts, spotlight, related] = await Promise.all([
        getYachtsByManufacturerId(manufacturer.id),
        getSpotlightByManufacturerId(manufacturer.id),
        getRelatedManufacturers(manufacturer.id, manufacturer.country),
      ]);

      return { manufacturer, yachts, spotlight, related };
    },
    [`manufacturer:${slug}`],
    { tags: [`manufacturer:${slug}`, "manufacturers"], revalidate: 3600 }
  )();
}

interface ManufacturerPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

function formatNumber(value: number | null, suffix: string) {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${suffix}`.trim();
}

export async function generateMetadata({
  params,
}: ManufacturerPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "Manufacturers" });
  const data = await getManufacturerData(slug);

  if (!data || !data.manufacturer) {
    notFound();
  }

  const manufacturer = data.manufacturer;
  const title = `${manufacturer.name} Yachts | Models & Specs`;
  const localeDescription = locale === "fr" && manufacturer.descriptionFr
    ? manufacturer.descriptionFr
    : manufacturer.description;
  const description = localeDescription
    ? localeDescription
    : `Browse ${manufacturer.name} sailing yachts, model specs, and builder information${manufacturer.country ? ` from ${manufacturer.country}` : ""}${manufacturer.foundedYear ? ` since ${manufacturer.foundedYear}` : ""}.`;

  return {
    title,
    description,
    keywords: [
      manufacturer.name,
      `${manufacturer.name} yachts`,
      `${manufacturer.name} sailboats`,
      "yacht manufacturer",
      "boat builder",
    ],
    openGraph: {
      title,
      description,
      url: getSiteUrl(`/manufacturers/${slug}`),
      type: "website",
      siteName: "Sailing Yacht Info",
      images: [{ url: buildOgImageUrl({
        type: "manufacturer",
        title: manufacturer.name,
        description: manufacturer.country ?? undefined,
        length: manufacturer.foundedYear ? `Est. ${manufacturer.foundedYear}` : undefined,
      }), width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [buildOgImageUrl({
        type: "manufacturer",
        title: manufacturer.name,
        description: manufacturer.country ?? undefined,
        length: manufacturer.foundedYear ? `Est. ${manufacturer.foundedYear}` : undefined,
      })],
    },
    alternates: buildLocaleAlternates(`/manufacturers/${slug}`),
  };
}

export default async function ManufacturerPage({
  params,
}: ManufacturerPageProps) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "Manufacturers" });
  const data = await getManufacturerData(slug);

  if (!data || !data.manufacturer) {
    notFound();
  }

  const { manufacturer, yachts, spotlight, related } = data;

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Manufacturers", path: "/manufacturers" },
    { name: manufacturer.name, path: `/manufacturers/${slug}` },
  ], locale);

  const collectionJsonLd = generateCollectionPageJsonLd({
    name: `${manufacturer.name} Yachts`,
    description: (locale === "fr" && manufacturer.descriptionFr ? manufacturer.descriptionFr : manufacturer.description) || `Browse ${manufacturer.name} sailing yachts, model specs, and builder information.`, 
    url: getSiteUrl(`/manufacturers/${slug}`),
    itemCount: yachts.length,
  });

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${manufacturer.name} yacht models`,
    itemListElement: yachts
      .filter((yacht) => yacht.slug)
      .map((yacht, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${manufacturer.name} ${yacht.modelName}`,
        url: getSiteUrl(`/yachts/${yacht.slug}`),
      })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href={localePath(locale, "/")} className="hover:text-foreground transition-colors">
                {t("breadcrumb.home")}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={localePath(locale, "/manufacturers")}
                className="hover:text-foreground transition-colors"
              >
                {t("breadcrumb.manufacturers")}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground font-medium">
              {manufacturer.name}
            </li>
          </ol>
        </nav>

        <section className="rounded-2xl border border-border bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            {t("detail.profileLabel")}
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-4">
                <ManufacturerLogo name={manufacturer.name} logoUrl={manufacturer.logoUrl} size={64} />
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  {manufacturer.name} {t("detail.yachtsSuffix")}
                </h1>
              </div>
              <p className="mt-4 max-w-3xl text-muted-foreground leading-relaxed">
                {(locale === "fr" && manufacturer.descriptionFr ? manufacturer.descriptionFr : manufacturer.description) ||
                  t("detail.descriptionFallback", { name: manufacturer.name, count: manufacturer.yachtCount })}
              </p>
            </div>

            {manufacturer.websiteUrl && (
              <a
                href={manufacturer.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50 transition-colors"
              >
                {t("detail.visitWebsite")}
              </a>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-xl border border-border bg-white/80 p-4">
              <div className="text-sm text-muted-foreground">{t("detail.country")}</div>
              <div className="mt-1 text-lg font-semibold">
                {manufacturer.country
                  ? <>{getCountryFlag(manufacturer.country)} {manufacturer.country}</>
                  : "—"}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white/80 p-4">
              <div className="text-sm text-muted-foreground">{t("detail.founded")}</div>
              <div className="mt-1 text-lg font-semibold">
                {manufacturer.foundedYear || "—"}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white/80 p-4">
              <div className="text-sm text-muted-foreground">{t("detail.yachtsIndexed")}</div>
              <div className="mt-1 text-lg font-semibold">
                {manufacturer.yachtCount}
              </div>
            </div>
          </div>
        </section>

        {spotlight && (
          <section className="mt-8 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
                  {t("detail.spotlight.label")}
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight">
                  {t("detail.spotlight.title", { name: manufacturer.name })}
                </h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {spotlight.metaDescription ||
                    t("detail.spotlight.descriptionFallback", { name: manufacturer.name })}
                </p>
              </div>

              <Link
                href={localePath(locale, `/manufacturers/${manufacturer.slug}/spotlight`)}
                className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
              >
                {t("detail.spotlight.openSpotlight")}
              </Link>
            </div>
          </section>
        )}


        {/* Cross-linking: Browse by Size */}
        <section className="mt-10 sm:mt-12 bg-muted/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">{t("detail.browseBySize.title", { name: manufacturer.name })}</h2>
          <div className="flex flex-wrap gap-3">
            <Link href={localePath(locale, "/yachts?minLength=0&maxLength=30")} className="inline-flex items-center rounded-full bg-background border border-border px-4 py-2 text-sm hover:bg-accent transition-colors">
              {t("detail.browseBySize.under30")}
            </Link>
            <Link href={localePath(locale, "/yachts?minLength=30&maxLength=35")} className="inline-flex items-center rounded-full bg-background border border-border px-4 py-2 text-sm hover:bg-accent transition-colors">
              {t("detail.browseBySize.range3035")}
            </Link>
            <Link href={localePath(locale, "/yachts?minLength=35&maxLength=40")} className="inline-flex items-center rounded-full bg-background border border-border px-4 py-2 text-sm hover:bg-accent transition-colors">
              {t("detail.browseBySize.range3540")}
            </Link>
            <Link href={localePath(locale, "/yachts?minLength=40&maxLength=50")} className="inline-flex items-center rounded-full bg-background border border-border px-4 py-2 text-sm hover:bg-accent transition-colors">
              {t("detail.browseBySize.range4050")}
            </Link>
            <Link href={localePath(locale, "/yachts?minLength=50")} className="inline-flex items-center rounded-full bg-background border border-border px-4 py-2 text-sm hover:bg-accent transition-colors">
              {t("detail.browseBySize.over50")}
            </Link>
          </div>
        </section>

        <section className="mt-10 sm:mt-12">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">{t("detail.modelsAndSpecs")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("detail.modelsSubtitle")}
              </p>
            </div>
          </div>

          {yachts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              {t("detail.noModels")}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {yachts.map((yacht) => {
                const cardContent = (
                  <>
                    <div className="aspect-[16/9] bg-muted">
                      {yacht.primaryImage ? (
                        <img
                          src={yacht.primaryImage}
                          alt={`${manufacturer.name} ${yacht.modelName}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-100 to-cyan-50 text-sm font-medium text-sky-700">
                          {manufacturer.name} {yacht.modelName}
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold tracking-tight">
                            {manufacturer.name} {yacht.modelName}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {yacht.year}
                          </p>
                        </div>
                      </div>

                      <dl className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">{t("detail.specLabels.length")}</dt>
                          <dd className="font-medium">
                            {formatNumber(yacht.lengthOverall, "m")}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">{t("detail.specLabels.beam")}</dt>
                          <dd className="font-medium">
                            {formatNumber(yacht.beam, "m")}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">{t("detail.specLabels.draft")}</dt>
                          <dd className="font-medium">
                            {formatNumber(yacht.draft, "m")}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">{t("detail.specLabels.cabins")}</dt>
                          <dd className="font-medium">{yacht.cabins ?? "—"}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">{t("detail.specLabels.rig")}</dt>
                          <dd className="font-medium text-right">
                            {yacht.rigType || "—"}
                          </dd>
                        </div>
                      </dl>

                      {yacht.slug && (
                        <div className="mt-4 text-sm font-medium text-sky-700">
                          {t("detail.viewYachtDetails")}
                        </div>
                      )}
                    </div>
                  </>
                );

                if (yacht.slug) {
                  return (
                    <Link
                      key={yacht.id}
                      href={localePath(locale, `/yachts/${yacht.slug}`)}
                      className="rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md hover:border-sky-200 transition-all"
                    >
                      {cardContent}
                    </Link>
                  );
                }

                return (
                  <div
                    key={yacht.id}
                    className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"
                  >
                    {cardContent}
                  </div>
                );
              })}
            </div>
          )}
        </section>


        {/* About section */}
        {((locale === "fr" && manufacturer.descriptionFr) || manufacturer.description) && (
          <section className="mt-10 sm:mt-12">
            <h2 className="text-2xl font-bold">{t("detail.aboutBrand", { name: manufacturer.name })}</h2>
            <div className="mt-4 max-w-3xl text-muted-foreground leading-relaxed whitespace-pre-line">
              {locale === "fr" && manufacturer.descriptionFr
                ? manufacturer.descriptionFr
                : manufacturer.description}
            </div>
            {manufacturer.websiteUrl && (
              <a
                href={manufacturer.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-900 transition-colors"
              >
                {t("detail.visitWebsite")}
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </section>
        )}

        {/* Related manufacturers */}
        {related.length > 0 && (
          <section className="mt-10 sm:mt-12">
            <h2 className="text-2xl font-bold">{t("detail.relatedManufacturers.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("detail.relatedManufacturers.subtitle", { country: manufacturer.country ?? "" })}
            </p>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={localePath(locale, `/manufacturers/${rel.slug}`)}
                  className="rounded-xl border border-border bg-card p-4 hover:border-sky-200 hover:shadow-sm transition-all text-center"
                >
                  <div className="flex justify-center"><ManufacturerLogo name={rel.name} logoUrl={rel.logoUrl} size={36} /></div>
                  {rel.country && <div className="text-lg mt-1">{getCountryFlag(rel.country)}</div>}
                  <div className="mt-2 text-sm font-semibold leading-tight">{rel.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {t("detail.relatedManufacturers.yachtCount", { count: rel.yachtCount })}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* P15.5 — Fleet overview chart */}
        <ManufacturerFleetChart yachts={yachts} manufacturerName={manufacturer.name} />

        {/* INTERNAL LINKING MODULE (P6.7) */}
        <ManufacturerComparisons manufacturerName={manufacturer.name} yachts={yachts} />
      </div>
    </>
  );
}
