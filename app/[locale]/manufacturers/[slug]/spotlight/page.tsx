import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { marked } from "marked";

import { getSpotlightBySlug } from "@/lib/manufacturer-spotlights";
import { generateBreadcrumbJsonLd, getSiteUrl , buildLocaleAlternates } from "@/lib/seo";

export const revalidate = 3600;

interface ManufacturerSpotlightPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

async function getSpotlightData(slug: string) {
  return unstable_cache(
    async () => getSpotlightBySlug(slug + "-spotlight"),
    [`manufacturer-spotlight:${slug}`],
    {
      tags: [
        `manufacturer-spotlight:${slug}`,
        `manufacturer:${slug}`,
        "manufacturer-spotlights",
        "manufacturers",
      ],
      revalidate: 3600,
    },
  )();
}

function renderHistoryMarkdown(markdown: string) {
  return marked.parse(markdown) as string;
}

function formatDate(date: Date | string | null) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatSlugLabel(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: ManufacturerSpotlightPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "Manufacturers" });
  const spotlight = await getSpotlightData(slug);

  if (!spotlight) {
    return {
      title: t("spotlight.meta.notFoundTitle"),
      description: t("spotlight.meta.notFoundDescription"),
    };
  }

  const title = `${spotlight.title} | Sailing Yacht Info`;
  const description =
    spotlight.metaDescription ||
    `Explore ${spotlight.manufacturer.name}'s history, brand positioning, notable yacht models, and key milestones.`;
  const url = getSiteUrl(`/manufacturers/${spotlight.manufacturer.slug}/spotlight`);

  return {
    title,
    description,
    keywords: [
      spotlight.manufacturer.name,
      `${spotlight.manufacturer.name} spotlight`,
      `${spotlight.manufacturer.name} history`,
      `${spotlight.manufacturer.name} yachts`,
      "yacht manufacturer spotlight",
    ],
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "Sailing Yacht Info",
      images: [{ url: getSiteUrl("/api/og"), width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [getSiteUrl("/api/og")],
    },
    alternates: buildLocaleAlternates(`/manufacturers/${slug}/spotlight`),
  };
}

export default async function ManufacturerSpotlightPage({
  params,
}: ManufacturerSpotlightPageProps) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "Manufacturers" });
  const spotlight = await getSpotlightData(slug);

  if (!spotlight) {
    notFound();
  }

  const historyHtml = renderHistoryMarkdown(spotlight.historyMarkdown);
  const spotlightDate = spotlight.publishedAt || spotlight.updatedAt;

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Manufacturers", path: "/manufacturers" },
    {
      name: spotlight.manufacturer.name,
      path: `/manufacturers/${spotlight.manufacturer.slug}`,
    },
    {
      name: "Spotlight",
      path: `/manufacturers/${spotlight.manufacturer.slug}/spotlight`,
    },
  ], locale);

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: spotlight.manufacturer.name,
    description:
      spotlight.metaDescription ||
      spotlight.manufacturer.description ||
      undefined,
    url: getSiteUrl(`/manufacturers/${spotlight.manufacturer.slug}/spotlight`),
    foundingDate: spotlight.manufacturer.foundedYear
      ? String(spotlight.manufacturer.foundedYear)
      : undefined,
    address: spotlight.manufacturer.country
      ? {
          "@type": "PostalAddress",
          addressCountry: spotlight.manufacturer.country,
        }
      : undefined,
    sameAs: spotlight.manufacturer.websiteUrl
      ? [spotlight.manufacturer.websiteUrl]
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                {t("spotlight.breadcrumb.home")}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/manufacturers"
                className="hover:text-foreground transition-colors"
              >
                {t("spotlight.breadcrumb.manufacturers")}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`/manufacturers/${spotlight.manufacturer.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {spotlight.manufacturer.name}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground font-medium">
              {t("spotlight.breadcrumb.spotlight")}
            </li>
          </ol>
        </nav>

        <section className="rounded-2xl border border-border bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
                {t("spotlight.label")}
              </p>
              <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
                {spotlight.title}
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                {spotlight.metaDescription ||
                  t("spotlight.descriptionFallback", { name: spotlight.manufacturer.name })}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/manufacturers/${spotlight.manufacturer.slug}`}
                className="inline-flex items-center rounded-lg border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50 transition-colors"
              >
                {t("spotlight.backToManufacturer")}
              </Link>
              <Link
                href={`/yachts?filters[manufacturers]=${spotlight.manufacturerId}`}
                className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
              >
                {t("spotlight.browseYachts", { name: spotlight.manufacturer.name })}
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-xl border border-border bg-white/80 p-4">
              <div className="text-sm text-muted-foreground">{t("detail.founded")}</div>
              <div className="mt-1 text-lg font-semibold">
                {spotlight.manufacturer.foundedYear || "—"}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white/80 p-4">
              <div className="text-sm text-muted-foreground">{t("detail.country")}</div>
              <div className="mt-1 text-lg font-semibold">
                {spotlight.manufacturer.country || "—"}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white/80 p-4">
              <div className="text-sm text-muted-foreground">{t("spotlight.spotlightDate")}</div>
              <div className="mt-1 text-lg font-semibold">
                {formatDate(spotlightDate)}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10 grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-6">
          <section className="rounded-2xl border border-border bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight">{t("spotlight.brandHistory")}</h2>
            <div
              className="mt-5 prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-a:text-sky-700 prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: historyHtml }}
            />
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight">{t("spotlight.brandPositioning")}</h2>
              <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed whitespace-pre-line">
                {spotlight.brandPositioning ||
                  t("spotlight.brandPositioningFallback", { name: spotlight.manufacturer.name })}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight">{t("spotlight.milestones")}</h2>
              {spotlight.milestones.length === 0 ? (
                <p className="mt-4 text-muted-foreground">
                  {t("spotlight.milestonesEmpty")}
                </p>
              ) : (
                <ol className="mt-5 space-y-5">
                  {spotlight.milestones.map((milestone) => (
                    <li key={`${milestone.year}-${milestone.event}`} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-sky-500" />
                        <div className="mt-2 h-full w-px bg-sky-100 last:hidden" />
                      </div>
                      <div className="pb-1">
                        <div className="text-sm font-semibold uppercase tracking-wide text-sky-700">
                          {milestone.year}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                          {milestone.event}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </div>

        <section className="mt-10 rounded-2xl border border-border bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{t("spotlight.notableModels")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("spotlight.notableModelsSubtitle")}
              </p>
            </div>
            <Link
              href={`/manufacturers/${spotlight.manufacturer.slug}`}
              className="text-sm font-medium text-sky-700 hover:text-sky-800 transition-colors"
            >
              {t("spotlight.seeFullLineup")}
            </Link>
          </div>

          {spotlight.notableModels.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              {t("spotlight.notableModelsEmpty")}
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {spotlight.notableModels.map((model) => (
                <div
                  key={`${model.yachtSlug}-${model.reason}`}
                  className="rounded-2xl border border-border bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-5"
                >
                  <div className="text-sm font-semibold uppercase tracking-wide text-sky-700">
                    {model.yacht?.year || "Model spotlight"}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight">
                    {model.yacht
                      ? `${model.yacht.manufacturerName} ${model.yacht.modelName}`
                      : formatSlugLabel(model.yachtSlug)}
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {model.reason}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3 text-sm">
                    <Link
                      href={`/yachts/${model.yachtSlug}`}
                      className="font-medium text-sky-700 hover:text-sky-800 transition-colors"
                    >
                      {t("spotlight.viewYachtDetails")}
                    </Link>
                    {model.yacht?.manufacturerSlug && (
                      <Link
                        href={`/manufacturers/${model.yacht.manufacturerSlug}`}
                        className="font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {t("spotlight.builderPage")}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight">
            {t("spotlight.exploreMore", { name: spotlight.manufacturer.name })}
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">
            {t("spotlight.exploreMoreDescription")}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/manufacturers/${spotlight.manufacturer.slug}`}
              className="inline-flex items-center rounded-lg border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50 transition-colors"
            >
              {t("spotlight.returnTo", { name: spotlight.manufacturer.name })}
            </Link>
            <Link
              href={`/yachts?filters[manufacturers]=${spotlight.manufacturerId}`}
              className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
            >
              {t("spotlight.viewAllYachts", { name: spotlight.manufacturer.name })}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
