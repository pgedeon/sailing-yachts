import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";

import {
  generateYachtPageMetadata,
  generateYachtJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
  getSiteUrl,
  generateImageObjectJsonLd,
  generateVideoObjectJsonLd,
  generateDigitalDocumentJsonLd,
} from "@/lib/seo";
import { getYachtDetailData, getPrimaryImage } from "@/lib/yachts";
import { getPriceSummary } from "@/lib/price-data";
import { calculateCompletenessScore, shouldNoindex } from "@/lib/completeness";
import YachtDetailClient from "./YachtDetailClient";

// ISR: Revalidate yacht detail pages every hour
export const revalidate = 3600;

// Cache yacht detail data query with tag for invalidation
async function getYachtData(slug: string) {
  return unstable_cache(
    async () => getYachtDetailData(slug),
    [`yacht:${slug}`],
    { tags: [`yacht:${slug}`, "yachts"], revalidate: 3600 }
  )();
}

// Cache primary image query
async function getYachtImage(slug: string) {
  return unstable_cache(
    async () => getPrimaryImage(slug),
    [`yacht-image:${slug}`],
    { tags: [`yacht:${slug}`, "yachts"], revalidate: 3600 }
  )();
}

function generateOfferJsonLd(params: {
  name: string;
  url: string;
  image?: string;
  newPriceMin: number | null;
  newPriceMax: number | null;
  usedPriceMin: number | null;
  usedPriceMax: number | null;
  currency: string;
}) {
  const offers: any[] = [];

  if (params.newPriceMin != null && params.newPriceMax != null) {
    offers.push({
      "@type": "Offer",
      priceCurrency: params.currency,
      price: params.newPriceMin,
      highPrice: params.newPriceMax,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      url: params.url,
    });
  }

  if (params.usedPriceMin != null && params.usedPriceMax != null) {
    offers.push({
      "@type": "Offer",
      priceCurrency: params.currency,
      price: params.usedPriceMin,
      highPrice: params.usedPriceMax,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
      url: params.url,
    });
  }

  if (offers.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "AggregateOffer",
    name: params.name,
    url: params.url,
    ...(params.image && { image: params.image }),
    priceCurrency: params.currency,
    lowPrice: Math.min(
      ...[params.newPriceMin, params.usedPriceMin].filter((p): p is number => p != null)
    ),
    highPrice: Math.max(
      ...[params.newPriceMax, params.usedPriceMax].filter((p): p is number => p != null)
    ),
    offerCount: offers.length,
    offers,
  };
}

interface YachtDetailPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({
  params,
}: YachtDetailPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "YachtDetail" });
  const data = await getYachtData(slug);

  if (!data) {
    return {
      title: t("meta.notFoundTitle"),
      description: t("meta.notFoundDescription"),
    };
  }

  // Fetch primary image for OG
  const primaryImage = await getYachtImage(slug);

  const baseMeta = generateYachtPageMetadata({
    manufacturer: data.manufacturer,
    modelName: data.yacht.modelName,
    year: data.yacht.year,
    slug: data.yacht.slug ?? "",
    description: data.yacht.description ?? undefined,
    lengthOverall: data.yacht.lengthOverall
      ? parseFloat(data.yacht.lengthOverall)
      : null,
    primaryImage: primaryImage ?? undefined,
  });

  // P10.5: Calculate completeness score
  const completenessScore = calculateCompletenessScore(data.yacht);
  const noindexThin = shouldNoindex(completenessScore);

  // Add hreflang alternates
  return {
    ...baseMeta,
    ...(noindexThin && {
      robots: { index: false, follow: true },
    }),
    alternates: {
      canonical: getSiteUrl(`/yachts/${slug}`),
      languages: {
        en: getSiteUrl(`/yachts/${slug}`),
        fr: "https://sailboats.fr",
      },
    },
  };
}

export default async function YachtDetailPage({ params }: YachtDetailPageProps) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "YachtDetail" });
  const data = await getYachtData(slug);

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-red-600">{t("notFound.heading")}</h1>
        <p className="mt-2 text-muted-foreground">
          {t("notFound.description")}
        </p>
        <a href="/yachts" className="mt-4 inline-block text-primary underline">
          {t("notFound.browseAll")}
        </a>
      </div>
    );
  }

  const yachtData = data.yacht;
  const manufacturerName = data.manufacturer;

  // JSON-LD structured data
  const primaryImage = data.images.find((img) => img.isPrimary) || data.images[0];

  const reviewData = data.reviews.length > 0
    ? data.reviews
        .filter((r) => r.rating !== null) // Only include reviews with ratings
        .map((r) => ({
          rating: r.rating as number, // Type guard: r.rating is not null here
          summary: r.summary ?? undefined,
          authorName: r.authorName ?? undefined,
          reviewDate: r.reviewDate ? new Date(r.reviewDate) : undefined,
        }))
    : undefined;

  const jsonLd = generateYachtJsonLd({
    manufacturer: manufacturerName,
    modelName: yachtData.modelName,
    year: yachtData.year,
    slug: yachtData.slug ?? "",
    description: yachtData.description ?? undefined,
    lengthOverall: yachtData.lengthOverall ? parseFloat(yachtData.lengthOverall) : null,
    beam: yachtData.beam ? parseFloat(yachtData.beam) : null,
    draft: yachtData.draft ? parseFloat(yachtData.draft) : null,
    displacement: yachtData.displacement ? parseFloat(yachtData.displacement) : null,
    hullMaterial: yachtData.hullMaterial ?? undefined,
    rigType: yachtData.rigType ?? undefined,
    cabins: yachtData.cabins ?? undefined,
    primaryImage: primaryImage?.url ?? undefined,
    reviews: reviewData,
  });

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: t("breadcrumb.home"), path: "/" },
    { name: t("breadcrumb.yachts"), path: "/yachts" },
    { name: `${manufacturerName} ${yachtData.modelName}`, path: `/yachts/${slug}` },
  ]);

  // ImageObject structured data for primary image
  const imageObjectJsonLd = primaryImage?.url
    ? generateImageObjectJsonLd({
        url: primaryImage.url,
        name: `${manufacturerName} ${yachtData.modelName}`,
        description: yachtData.description ?? `Photo of ${manufacturerName} ${yachtData.modelName} sailing yacht.`,
      })
    : null;

  // P10.8: Rich media structured data (VideoObject + brochures)
  const mediaJsonLdItems: Array<Record<string, unknown>> = [];
  if (data.mediaAssets && data.mediaAssets.length > 0) {
    for (const asset of data.mediaAssets) {
      if (asset.mediaType === "video") {
        mediaJsonLdItems.push(generateVideoObjectJsonLd({
          name: asset.title || `${manufacturerName} ${yachtData.modelName} Video`,
          description: asset.description || undefined,
          thumbnailUrl: asset.thumbnailUrl || undefined,
          contentUrl: asset.url || undefined,
          embedUrl: asset.embedUrl || undefined,
        }) as unknown as Record<string, unknown>);
      } else if (asset.mediaType === "brochure" || asset.mediaType === "deck_plan" || asset.mediaType === "interior_layout") {
        mediaJsonLdItems.push(generateDigitalDocumentJsonLd({
          name: asset.title || `${manufacturerName} ${yachtData.modelName} ${asset.mediaType.replace("_", " ")}`,
          description: asset.description || undefined,
          url: asset.url || undefined,
          encodingFormat: asset.fileFormat || undefined,
        }) as unknown as Record<string, unknown>);
      }
    }
  }

  // FAQ structured data
  const faqJsonLd = generateFaqJsonLd({
    manufacturer: manufacturerName,
    modelName: yachtData.modelName,
    displacement: yachtData.displacement ? parseFloat(yachtData.displacement) : null,
    lengthOverall: yachtData.lengthOverall ? parseFloat(yachtData.lengthOverall) : null,
    draft: yachtData.draft ? parseFloat(yachtData.draft) : null,
    cabins: yachtData.cabins ?? undefined,
    beam: yachtData.beam ? parseFloat(yachtData.beam) : null,
  });

  // P8.2: Fetch price data for AggregateOffer JSON-LD
  let offerJsonLd: any = null;
  try {
    const priceSummary = await getPriceSummary(data.yacht.id);
    if (priceSummary && (priceSummary.newPriceMin != null || priceSummary.usedPriceMin != null)) {
      offerJsonLd = generateOfferJsonLd({
        name: `${manufacturerName} ${yachtData.modelName}`,
        url: getSiteUrl(`/yachts/${slug}`),
        image: primaryImage?.url,
        newPriceMin: priceSummary.newPriceMin,
        newPriceMax: priceSummary.newPriceMax,
        usedPriceMin: priceSummary.usedPriceMin,
        usedPriceMax: priceSummary.usedPriceMax,
        currency: priceSummary.currency,
      });
    }
  } catch {
    // Price data unavailable — skip offer schema silently
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      {imageObjectJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(imageObjectJsonLd) }}
        />
      )}
      {offerJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(offerJsonLd) }}
        />
      )}
      {mediaJsonLdItems.length > 0 && mediaJsonLdItems.map((item, idx) => (
        <script
          key={`media-jsonld-${idx}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
      <YachtDetailClient />
    </>
  );
}
