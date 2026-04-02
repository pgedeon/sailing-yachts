import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  generateBreadcrumbJsonLd,
  buildOgImageUrl,
  getSiteUrl,
} from "@/lib/seo";
import {
  getManufacturerBySlug,
  getYachtsByManufacturerId,
} from "@/lib/manufacturers";

export const dynamic = "force-dynamic";

interface ManufacturerPageProps {
  params: Promise<{ slug: string }>;
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
  const { slug } = await params;
  const manufacturer = await getManufacturerBySlug(slug);

  if (!manufacturer) {
    return {
      title: "Manufacturer Not Found",
      description: "The requested sailing yacht manufacturer could not be found.",
    };
  }

  const title = `${manufacturer.name} Yachts | Models & Specs`;
  const description = manufacturer.description
    ? manufacturer.description
    : `Browse ${manufacturer.name} sailing yachts, model specs, and builder information${manufacturer.country ? ` from ${manufacturer.country}` : ""}${manufacturer.foundedYear ? ` since ${manufacturer.foundedYear}` : ""}.`;
  const ogImage = buildOgImageUrl({
    title: `${manufacturer.name} Yachts`,
    description: manufacturer.country || "Sailing yacht manufacturer",
    length: `${manufacturer.yachtCount} models`,
  });

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
      siteName: "Sailing Yachts Database",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: getSiteUrl(`/manufacturers/${slug}`),
    },
  };
}

export default async function ManufacturerPage({
  params,
}: ManufacturerPageProps) {
  const { slug } = await params;
  const manufacturer = await getManufacturerBySlug(slug);

  if (!manufacturer) {
    notFound();
  }

  const yachts = await getYachtsByManufacturerId(manufacturer.id);

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Manufacturers", path: "/manufacturers" },
    { name: manufacturer.name },
  ]);

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
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
            <li aria-current="page" className="text-foreground font-medium">
              {manufacturer.name}
            </li>
          </ol>
        </nav>

        <section className="rounded-2xl border border-border bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            Manufacturer Profile
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {manufacturer.name} Yachts
              </h1>
              <p className="mt-4 max-w-3xl text-muted-foreground leading-relaxed">
                {manufacturer.description ||
                  `${manufacturer.name} is featured in the Sailing Yachts Database with ${manufacturer.yachtCount} yacht${manufacturer.yachtCount === 1 ? "" : "s"} currently indexed.`}
              </p>
            </div>

            {manufacturer.websiteUrl && (
              <a
                href={manufacturer.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50 transition-colors"
              >
                Visit builder website
              </a>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-xl border border-border bg-white/80 p-4">
              <div className="text-sm text-muted-foreground">Country</div>
              <div className="mt-1 text-lg font-semibold">
                {manufacturer.country || "—"}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white/80 p-4">
              <div className="text-sm text-muted-foreground">Founded</div>
              <div className="mt-1 text-lg font-semibold">
                {manufacturer.foundedYear || "—"}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white/80 p-4">
              <div className="text-sm text-muted-foreground">Yachts indexed</div>
              <div className="mt-1 text-lg font-semibold">
                {manufacturer.yachtCount}
              </div>
            </div>
          </div>
        </section>


        {/* Cross-linking: Browse by Size */}
        <section className="mt-10 sm:mt-12 bg-muted/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Browse {manufacturer.name} Yachts by Size</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/yachts?minLength=0&maxLength=30" className="inline-flex items-center rounded-full bg-background border border-border px-4 py-2 text-sm hover:bg-accent transition-colors">
              Under 30ft
            </Link>
            <Link href="/yachts?minLength=30&maxLength=35" className="inline-flex items-center rounded-full bg-background border border-border px-4 py-2 text-sm hover:bg-accent transition-colors">
              30–35ft
            </Link>
            <Link href="/yachts?minLength=35&maxLength=40" className="inline-flex items-center rounded-full bg-background border border-border px-4 py-2 text-sm hover:bg-accent transition-colors">
              35–40ft
            </Link>
            <Link href="/yachts?minLength=40&maxLength=50" className="inline-flex items-center rounded-full bg-background border border-border px-4 py-2 text-sm hover:bg-accent transition-colors">
              40–50ft
            </Link>
            <Link href="/yachts?minLength=50" className="inline-flex items-center rounded-full bg-background border border-border px-4 py-2 text-sm hover:bg-accent transition-colors">
              50ft+
            </Link>
          </div>
        </section>

        <section className="mt-10 sm:mt-12">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Models & Specs</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse the current lineup and linked yacht detail pages.
              </p>
            </div>
          </div>

          {yachts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              No yacht models are available for this manufacturer yet.
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
                          <dt className="text-muted-foreground">Length</dt>
                          <dd className="font-medium">
                            {formatNumber(yacht.lengthOverall, "m")}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Beam</dt>
                          <dd className="font-medium">
                            {formatNumber(yacht.beam, "m")}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Draft</dt>
                          <dd className="font-medium">
                            {formatNumber(yacht.draft, "m")}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Cabins</dt>
                          <dd className="font-medium">{yacht.cabins ?? "—"}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Rig</dt>
                          <dd className="font-medium text-right">
                            {yacht.rigType || "—"}
                          </dd>
                        </div>
                      </dl>

                      {yacht.slug && (
                        <div className="mt-4 text-sm font-medium text-sky-700">
                          View yacht details →
                        </div>
                      )}
                    </div>
                  </>
                );

                if (yacht.slug) {
                  return (
                    <Link
                      key={yacht.id}
                      href={`/yachts/${yacht.slug}`}
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
      </div>
    </>
  );
}
