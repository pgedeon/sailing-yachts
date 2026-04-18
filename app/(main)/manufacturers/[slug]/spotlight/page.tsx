import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { marked } from "marked";

import { getSpotlightBySlug } from "@/lib/manufacturer-spotlights";
import { generateBreadcrumbJsonLd, getSiteUrl } from "@/lib/seo";

export const revalidate = 3600;

interface ManufacturerSpotlightPageProps {
  params: Promise<{ slug: string }>;
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

function formatDate(date: Date | null) {
  if (!date) {
    return "—";
  }

  return date.toLocaleDateString("en-US", {
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
  const { slug } = await params;
  const spotlight = await getSpotlightData(slug);

  if (!spotlight) {
    return {
      title: "Manufacturer Spotlight Not Found",
      description: "The requested manufacturer spotlight could not be found.",
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
    alternates: {
      canonical: url,
    },
  };
}

export default async function ManufacturerSpotlightPage({
  params,
}: ManufacturerSpotlightPageProps) {
  const { slug } = await params;
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
  ]);

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
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/manufacturers"
                className="hover:text-foreground transition-colors"
              >
                Manufacturers
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
              Spotlight
            </li>
          </ol>
        </nav>

        <section className="rounded-2xl border border-border bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
                Manufacturer Spotlight
              </p>
              <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
                {spotlight.title}
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                {spotlight.metaDescription ||
                  `Explore ${spotlight.manufacturer.name}'s history, positioning, and standout yachts in the Sailing Yacht Info.`}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/manufacturers/${spotlight.manufacturer.slug}`}
                className="inline-flex items-center rounded-lg border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50 transition-colors"
              >
                Back to manufacturer page
              </Link>
              <Link
                href={`/yachts?filters[manufacturers]=${spotlight.manufacturerId}`}
                className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
              >
                Browse {spotlight.manufacturer.name} yachts
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-xl border border-border bg-white/80 p-4">
              <div className="text-sm text-muted-foreground">Founded</div>
              <div className="mt-1 text-lg font-semibold">
                {spotlight.manufacturer.foundedYear || "—"}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white/80 p-4">
              <div className="text-sm text-muted-foreground">Country</div>
              <div className="mt-1 text-lg font-semibold">
                {spotlight.manufacturer.country || "—"}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white/80 p-4">
              <div className="text-sm text-muted-foreground">Spotlight date</div>
              <div className="mt-1 text-lg font-semibold">
                {formatDate(spotlightDate)}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10 grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-6">
          <section className="rounded-2xl border border-border bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight">Brand History</h2>
            <div
              className="mt-5 prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-a:text-sky-700 prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: historyHtml }}
            />
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight">Brand Positioning</h2>
              <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed whitespace-pre-line">
                {spotlight.brandPositioning ||
                  `${spotlight.manufacturer.name} sits in the Sailing Yacht Info as a builder worth tracking for sailors comparing brand philosophy, fleet depth, and notable production models.`}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight">Milestones</h2>
              {spotlight.milestones.length === 0 ? (
                <p className="mt-4 text-muted-foreground">
                  Milestones will appear here as this spotlight expands.
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
              <h2 className="text-2xl font-bold tracking-tight">Notable Models</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                These yachts help illustrate how the brand expresses its design brief in real boats.
              </p>
            </div>
            <Link
              href={`/manufacturers/${spotlight.manufacturer.slug}`}
              className="text-sm font-medium text-sky-700 hover:text-sky-800 transition-colors"
            >
              See full manufacturer lineup →
            </Link>
          </div>

          {spotlight.notableModels.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              Notable models will appear here as this spotlight expands.
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
                      View yacht details →
                    </Link>
                    {model.yacht?.manufacturerSlug && (
                      <Link
                        href={`/manufacturers/${model.yacht.manufacturerSlug}`}
                        className="font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Builder page
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
            Explore more from {spotlight.manufacturer.name}
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">
            Jump back to the full builder profile, compare the current lineup, or browse yachts filtered to this manufacturer.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/manufacturers/${spotlight.manufacturer.slug}`}
              className="inline-flex items-center rounded-lg border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50 transition-colors"
            >
              Return to {spotlight.manufacturer.name}
            </Link>
            <Link
              href={`/yachts?filters[manufacturers]=${spotlight.manufacturerId}`}
              className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
            >
              View all {spotlight.manufacturer.name} yachts
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
