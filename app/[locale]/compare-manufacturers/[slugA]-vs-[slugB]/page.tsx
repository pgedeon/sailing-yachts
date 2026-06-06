import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { getTranslations , setRequestLocale } from "next-intl/server";
import { getManufacturerCompareData } from "@/lib/manufacturer-compare";
import {
  getSiteUrl,
  generateBreadcrumbJsonLd,
  buildLocaleAlternates,
  buildOgImageUrl,
} from "@/lib/seo";
import { localePath } from "@/lib/i18n-paths";
import { ManufacturerCompareClient } from "./ManufacturerCompareClient";
import { getManufacturerComparisonParams } from "@/lib/static-params";

// ISR: Revalidate every hour
export const revalidate = 3600;
function parseCompareParams(
  rawParams: Record<string, string | undefined>,
): { slugA: string; slugB: string } | null {
  for (const value of Object.values(rawParams)) {
    if (value && value.includes("-vs-")) {
      const idx = value.indexOf("-vs-");
      return {
        slugA: value.substring(0, idx),
        slugB: value.substring(idx + 4),
      };
    }
  }
  return null;
}

async function getCachedCompareData(slugA: string, slugB: string) {
  return unstable_cache(
    async () => {
      try {
        return await getManufacturerCompareData(slugA, slugB);
      } catch {
        return null;
      }
    },
    [`mfr-compare:${slugA}-vs-${slugB}`],
    { tags: [`mfr-compare:${slugA}-vs-${slugB}`, "manufacturers"], revalidate: 3600 },
  )();
}

export async function generateStaticParams() {
  return getManufacturerComparisonParams();
}

export async function generateMetadata({
  params,
}: {
  params: Record<string, string | undefined>;
}): Promise<Metadata> {
  const rawParams = params;
  const parsed = parseCompareParams(rawParams);
  if (!parsed) notFound();

  const data = await getCachedCompareData(parsed.slugA, parsed.slugB);
  if (!data) notFound();

  const title = `${data.mfrA.name} vs ${data.mfrB.name} — Manufacturer Comparison`;
  const description = `Compare ${data.mfrA.name} (${data.mfrA.yachtCount} models) vs ${data.mfrB.name} (${data.mfrB.yachtCount} models): fleet size, yacht ranges, and popular models side by side.`;

  return {
    title,
    description,
    keywords: [
      data.mfrA.name,
      data.mfrB.name,
      "manufacturer comparison",
      "sailing yachts",
      "boat brands",
    ],
    openGraph: {
      title,
      description,
      url: getSiteUrl(`/compare-manufacturers/${parsed.slugA}-vs-${parsed.slugB}`),
      type: "website",
      siteName: "Sailing Yacht Info",
      images: [
        {
          url: buildOgImageUrl({
            type: "compare",
            title: `${data.mfrA.name} vs ${data.mfrB.name}`,
            description: "Manufacturer comparison",
          }),
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    alternates: buildLocaleAlternates(
      `/compare-manufacturers/${parsed.slugA}-vs-${parsed.slugB}`,
    ),
  };
}

export default async function ManufacturerComparePage({
  params,
}: {
  params: Record<string, string | undefined>;
}) {
  const rawParams = params;
  const parsed = parseCompareParams(rawParams);
  if (!parsed) notFound();

  const data = await getCachedCompareData(parsed.slugA, parsed.slugB);
  if (!data) notFound();

  const locale = params.locale ?? "en";
  // Enable static rendering for next-intl
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "ManufacturerCompare" });

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(
    [
      { name: "Home", path: "/" },
      { name: "Manufacturers", path: "/manufacturers" },
      {
        name: `${data.mfrA.name} vs ${data.mfrB.name}`,
        path: `/compare-manufacturers/${parsed.slugA}-vs-${parsed.slugB}`,
      },
    ],
    locale,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 text-sm text-muted-foreground"
        >
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link
                href={localePath(locale, "/")}
                className="hover:text-foreground transition-colors"
              >
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
              {data.mfrA.name} vs {data.mfrB.name}
            </li>
          </ol>
        </nav>

        <ManufacturerCompareClient data={data} locale={locale} />
      </div>
    </>
  );
}
