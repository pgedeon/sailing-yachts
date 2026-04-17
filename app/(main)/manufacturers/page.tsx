import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { getManufacturersWithCounts } from "@/lib/manufacturers";
import { buildSafeQuery } from "@/lib/build-safe";
import {
  generateBreadcrumbJsonLd,
  generateCollectionPageJsonLd,
  generateItemListJsonLd,
  getSiteUrl,
} from "@/lib/seo";

// ISR: Revalidate manufacturers list every hour
export const revalidate = 3600;

const FALLBACK_MANUFACTURERS: any[] = [];

// Cache manufacturers query with tag for invalidation
async function getManufacturers() {
  return unstable_cache(
    async () => {
      const manufacturers = await buildSafeQuery(
        () => getManufacturersWithCounts(),
        FALLBACK_MANUFACTURERS
      );
      return manufacturers;
    },
    ["manufacturers-list"],
    { tags: ["manufacturers"], revalidate: 3600 }
  )();
}

const title = "Sailing Yacht Manufacturers";
const description =
  "Browse sailing yacht manufacturers, explore brand histories, and discover how many models each builder offers.";
const ogImage = "https://info.sailboats.fr/api/og?title=Sailing%20Yacht%20Manufacturers&description=Browse%20builders%2C%20brands%2C%20and%20model%20counts&length=Brand%20directory";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: "/manufacturers",
    type: "website",
    siteName: "Sailing Yacht Info",
    images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
  alternates: {
    canonical: "/manufacturers",
  },
};

export default async function ManufacturersPage() {
  const manufacturers = await getManufacturers();

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Manufacturers" },
  ]);

  const collectionJsonLd = generateCollectionPageJsonLd({
    name: title,
    description,
    url: getSiteUrl("/manufacturers"),
    itemCount: manufacturers.length,
  });

  const itemListJsonLd = generateItemListJsonLd({
    name: "Sailing Yacht Manufacturers",
    description: "All sailing yacht manufacturers indexed in the database",
    items: manufacturers.map((m: any) => ({
      name: `${m.name} (${m.yachtCount} models)`,
      url: `/manufacturers/${m.name?.toLowerCase().replace(/\s+/g, "-")}`,
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
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground font-medium">
              Manufacturers
            </li>
          </ol>
        </nav>

        <section className="rounded-2xl border border-border bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 sm:p-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {title}
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              {description}
            </p>
            
            {manufacturers.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="text-center">
                  <div className="text-yellow-800 mb-2">
                    Manufacturers will appear here once the build completes.
                  </div>
                  <div className="text-sm text-yellow-600">
                    This page is using ISR (Incremental Static Regeneration) and will show live data on production.
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {manufacturers.map((manufacturer: any) => (
                  <Link
                    key={manufacturer.name}
                    href={`/manufacturers/${manufacturer.name?.toLowerCase().replace(/\s+/g, "-")}`}
                    className="block bg-white rounded-lg p-4 hover:bg-blue-50 transition border border-gray-100"
                  >
                    <div className="font-semibold text-gray-900">{manufacturer.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {manufacturer.yachtCount} model{manufacturer.yachtCount !== 1 ? "s" : ""}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
