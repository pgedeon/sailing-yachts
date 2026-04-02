import type { Metadata } from "next";
import Link from "next/link";

import { buildOgImageUrl, getSiteUrl } from "@/lib/seo";
import { getManufacturersWithCounts } from "@/lib/manufacturers";

export const dynamic = "force-dynamic";

const title = "Sailing Yacht Manufacturers";
const description =
  "Browse sailing yacht manufacturers, explore brand histories, and discover how many models each builder offers.";
const ogImage = buildOgImageUrl({
  title: "Sailing Yacht Manufacturers",
  description: "Browse builders, brands, and model counts",
  length: "Brand directory",
});

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: getSiteUrl("/manufacturers"),
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
    canonical: getSiteUrl("/manufacturers"),
  },
};

export default async function ManufacturersPage() {
  const manufacturers = await getManufacturersWithCounts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <section className="rounded-2xl border border-border bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
          Brand Directory
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
          Sailing Yacht Manufacturers
        </h1>
        <p className="mt-4 max-w-3xl text-muted-foreground leading-relaxed">
          Explore yacht builders from around the world, compare their lineups,
          and jump into dedicated landing pages for every manufacturer in the
          database.
        </p>
      </section>

      <section className="mt-10 sm:mt-12">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold">Manufacturers</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {manufacturers.length} brands indexed.
            </p>
          </div>
        </div>

        {manufacturers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
            No manufacturers are available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {manufacturers.map((manufacturer) => (
              <Link
                key={manufacturer.id}
                href={`/manufacturers/${manufacturer.slug}`}
                className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-sky-200 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">
                      {manufacturer.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {manufacturer.country || "Country not listed"}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                    {manufacturer.yachtCount} yachts
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Founded</dt>
                    <dd className="mt-1 font-medium">
                      {manufacturer.foundedYear || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Models</dt>
                    <dd className="mt-1 font-medium">{manufacturer.yachtCount}</dd>
                  </div>
                </dl>

                {manufacturer.description && (
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                    {manufacturer.description}
                  </p>
                )}

                <div className="mt-4 text-sm font-medium text-sky-700">
                  View manufacturer page →
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
