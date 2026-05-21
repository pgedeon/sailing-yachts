import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { pool } from "@/lib/db";
import { generateBreadcrumbJsonLd, getSiteUrl, buildLocaleAlternates } from "@/lib/seo";
import { localePath } from "@/lib/i18n-paths";

// ISR: Revalidate every 6 hours
export const revalidate = 21600;

interface AlternativeYacht {
  id: number;
  slug: string;
  manufacturer: string;
  modelName: string;
  year: number | null;
  lengthOverall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  cabins: number | null;
  berths: number | null;
  hullMaterial: string | null;
  priceMin: number | null;
  priceMax: number | null;
  currency: string | null;
  primaryImageUrl: string | null;
}

interface SourceYacht {
  id: number;
  slug: string;
  manufacturer: string;
  modelName: string;
  lengthOverall: number | null;
  cabins: number | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "CheaperAlternatives" });

  const sourceYacht = await getSourceYacht(slug);
  if (!sourceYacht) {
    return { title: t("meta.notFoundTitle") };
  }

  const title = t("header.title", {
    manufacturer: sourceYacht.manufacturer,
    model: sourceYacht.modelName,
  });
  const desc = t("header.description", {
    manufacturer: sourceYacht.manufacturer,
    model: sourceYacht.modelName,
  });

  return {
    title,
    description: desc,
    keywords: [
      `cheaper alternative to ${sourceYacht.manufacturer} ${sourceYacht.modelName}`,
      "sailboat alternatives",
      "budget sailboat",
      sourceYacht.modelName,
    ],
    openGraph: {
      title,
      description: desc,
      url: getSiteUrl(`/cheaper-alternatives-to/${slug}`),
      type: "website",
      siteName: "Sailing Yacht Info",
    },
    alternates: buildLocaleAlternates(`/cheaper-alternatives-to/${slug}`),
  };
}

async function getSourceYacht(
  slug: string
): Promise<SourceYacht | null> {
  const result = await pool.query(
    `SELECT y.id, y.slug, m.name AS manufacturer, y.model_name, y.length_overall, y.cabins
     FROM yacht_models y
     LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
     WHERE y.slug = $1
     LIMIT 1`,
    [slug]
  );
  if (result.rows.length === 0) return null;
  const r = result.rows[0];
  return {
    id: r.id,
    slug: r.slug,
    manufacturer: r.manufacturer,
    modelName: r.model_name,
    lengthOverall: r.length_overall ? Number(r.length_overall) : null,
    cabins: r.cabins,
  };
}

async function getAlternatives(
  sourceYacht: SourceYacht
): Promise<AlternativeYacht[]> {
  if (!sourceYacht.lengthOverall) return [];

  const lengthMin = sourceYacht.lengthOverall * 0.85;
  const lengthMax = sourceYacht.lengthOverall * 1.15;

  const query = `
    SELECT
      y.id,
      y.slug,
      m.name AS manufacturer,
      y.model_name,
      y.year,
      y.length_overall,
      y.beam,
      y.draft,
      y.displacement,
      y.cabins,
      y.berths,
      y.hull_material,
      mi.url AS primary_image_url,
      yp.price_min,
      yp.price_max,
      yp.currency
    FROM yacht_models y
    LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
    LEFT JOIN LATERAL (
      SELECT url FROM images
      WHERE yacht_model_id = y.id AND is_primary = true
      LIMIT 1
    ) mi ON true
    LEFT JOIN LATERAL (
      SELECT price_min, price_max, currency
      FROM yacht_prices
      WHERE yacht_model_id = y.id AND is_active = true
      ORDER BY effective_date DESC
      LIMIT 1
    ) yp ON true
    WHERE y.length_overall >= $1
      AND y.length_overall <= $2
      AND y.id != $3
    ORDER BY
      ABS(y.cabins - $4) ASC,
      ABS(y.length_overall - $5) ASC
    LIMIT 12
  `;

  const result = await pool.query(query, [
    lengthMin,
    lengthMax,
    sourceYacht.id,
    sourceYacht.cabins || 0,
    sourceYacht.lengthOverall,
  ]);

  return result.rows.map((r: any) => ({
    id: r.id,
    slug: r.slug,
    manufacturer: r.manufacturer,
    modelName: r.model_name,
    year: r.year,
    lengthOverall: r.length_overall ? Number(r.length_overall) : null,
    beam: r.beam ? Number(r.beam) : null,
    draft: r.draft ? Number(r.draft) : null,
    displacement: r.displacement ? Number(r.displacement) : null,
    cabins: r.cabins,
    berths: r.berths,
    hullMaterial: r.hull_material,
    priceMin: r.price_min ? Number(r.price_min) : null,
    priceMax: r.price_max ? Number(r.price_max) : null,
    currency: r.currency,
    primaryImageUrl: r.primary_image_url,
  }));
}

function formatPrice(
  min: number | null,
  max: number | null,
  currency: string | null
): string {
  if (!min && !max) return "";
  const cur = currency || "USD";
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(n);
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min || max!);
}

export default async function CheaperAlternativesPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "CheaperAlternatives" });
  const sourceYacht = await getSourceYacht(slug);

  if (!sourceYacht) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t("meta.notFoundTitle")}
          </h1>
          <Link href={localePath(locale, "/")} className="text-blue-600 hover:underline">
            {t("meta.notFoundHomeLink")}
          </Link>
        </div>
      </main>
    );
  }

  const alternatives = await getAlternatives(sourceYacht);

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Yachts", path: "/yachts" },
    {
      name: `${sourceYacht.manufacturer} ${sourceYacht.modelName}`,
      path: `/yachts/${sourceYacht.slug}`,
    },
    { name: "Cheaper Alternatives" },
  ], locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Header */}
      <section className="bg-gradient-to-b from-amber-50 to-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-4 text-4xl">🏷️</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            {t("header.title", {
              manufacturer: sourceYacht.manufacturer,
              model: sourceYacht.modelName,
            })}
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            {t("header.description", {
              manufacturer: sourceYacht.manufacturer,
              model: sourceYacht.modelName,
            })}
          </p>
          {sourceYacht.lengthOverall && (
            <p className="text-sm text-gray-500">
              {t("header.rangeNote", {
                count: alternatives.length,
                min: (sourceYacht.lengthOverall * 0.85).toFixed(1),
                max: (sourceYacht.lengthOverall * 1.15).toFixed(1),
              })}
            </p>
          )}
        </div>
      </section>

      {/* Alternatives Grid */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {alternatives.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {alternatives.map((yacht) => (
                <Link
                  key={yacht.id}
                  href={localePath(locale, `/yachts/${yacht.slug}`)}
                  className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-amber-200 transition group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="text-sm text-amber-600 font-medium mb-1">
                        {yacht.manufacturer}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-lg group-hover:text-amber-600 transition">
                        {yacht.modelName}
                      </h3>
                      {yacht.year && (
                        <div className="text-sm text-gray-500 mt-1">
                          {yacht.year}
                        </div>
                      )}
                    </div>
                    {yacht.primaryImageUrl ? (
                      <div className="ml-4 flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={yacht.primaryImageUrl}
                          alt={`${yacht.manufacturer} ${yacht.modelName}`}
                          className="w-full h-full object-cover"
                          width={64}
                          height={64}
                        />
                      </div>
                    ) : (
                      <div className="ml-4 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-2xl flex-shrink-0">
                        ⛵
                      </div>
                    )}
                  </div>

                  {/* Specs */}
                  <div className="space-y-2 text-sm">
                    {yacht.lengthOverall && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t("specs.loa")}</span>
                        <span className="font-medium">
                          {yacht.lengthOverall.toFixed(1)}m
                        </span>
                      </div>
                    )}
                    {yacht.cabins && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t("specs.cabins")}</span>
                        <span className="font-medium">{yacht.cabins}</span>
                      </div>
                    )}
                    {yacht.displacement && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t("specs.displacement")}</span>
                        <span className="font-medium">
                          {yacht.displacement >= 1000
                            ? `${(yacht.displacement / 1000).toFixed(1)}t`
                            : `${yacht.displacement}kg`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  {(yacht.priceMin || yacht.priceMax) && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-sm font-semibold text-gray-900">
                      {formatPrice(yacht.priceMin, yacht.priceMax, yacht.currency)}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("empty.title")}
              </h3>
              <p className="text-gray-600 mb-6">
                {t("empty.description")}{" "}
                <Link
                  href={localePath(locale, "/yachts")}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {t("empty.databaseLink")}
                </Link>
                {t("empty.descriptionEnd")}
              </p>
            </div>
          )}

          {/* Back to source yacht */}
          <div className="mt-12 text-center">
            <Link
              href={localePath(locale, `/yachts/${sourceYacht.slug}`)}
              className="inline-flex items-center gap-2 text-blue-600 hover:underline"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
               aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {t("backTo", {
                manufacturer: sourceYacht.manufacturer,
                model: sourceYacht.modelName,
              })}
            </Link>
          </div>

          {/* Cross-link to best-value pages */}
          <div className="mt-6 text-center">
            <Link
              href="/best-value/40ft-cruisers"
              className="text-sm text-gray-500 hover:text-emerald-600"
            >
              {t("bestValueLink")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
