import type { Metadata } from "next";
import { db, yachtModels, manufacturers, images, reviews } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  generateYachtPageMetadata,
  generateYachtJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
  getSiteUrl,
} from "@/lib/seo";
import YachtDetailClient from "./YachtDetailClient";

export const dynamic = "force-dynamic";

interface YachtDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function getYachtBySlug(slug: string) {
  const yachtResult = await db
    .select({
      yacht: yachtModels,
      manufacturer: manufacturers.name,
    })
    .from(yachtModels)
    .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
    .where(eq(yachtModels.slug, slug))
    .limit(1);

  if (yachtResult.length === 0) return null;
  return yachtResult[0];
}

export async function generateMetadata({
  params,
}: YachtDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getYachtBySlug(slug);

  if (!result) {
    return {
      title: "Yacht Not Found",
      description: "The requested sailing yacht could not be found.",
    };
  }

  // Fetch primary image for OG
  const yachtImages = await db
    .select()
    .from(images)
    .where(eq(images.yachtModelId, result.yacht.id))
    .orderBy(images.sortOrder)
    .limit(1);

  const primaryImage = yachtImages.find((img: any) => img.isPrimary) || yachtImages[0];

  const baseMeta = generateYachtPageMetadata({
    manufacturer: result.manufacturer || "Unknown",
    modelName: result.yacht.modelName,
    year: result.yacht.year,
    slug: result.yacht.slug,
    description: result.yacht.description,
    lengthOverall: result.yacht.lengthOverall
      ? parseFloat(result.yacht.lengthOverall)
      : null,
    primaryImage: primaryImage?.url,
  });

  // Add hreflang alternates
  return {
    ...baseMeta,
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
  const { slug } = await params;
  const result = await getYachtBySlug(slug);

  if (!result) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-red-600">Yacht not found</h1>
        <p className="mt-2 text-muted-foreground">
          The requested sailing yacht could not be found.
        </p>
        <a href="/yachts" className="mt-4 inline-block text-primary underline">
          Browse all yachts
        </a>
      </div>
    );
  }

  const yachtData = result.yacht;
  const manufacturerName = result.manufacturer || "Unknown";

  // JSON-LD structured data
  const yachtImages = await db
    .select()
    .from(images)
    .where(eq(images.yachtModelId, yachtData.id))
    .orderBy(images.sortOrder)
    .limit(1);
  const primaryImage = yachtImages.find((img: any) => img.isPrimary) || yachtImages[0];

  // Fetch reviews for AggregateRating in JSON-LD
  const yachtReviews = await db
    .select({
      rating: reviews.rating,
      summary: reviews.summary,
      authorName: reviews.authorName,
      reviewDate: reviews.reviewDate,
    })
    .from(reviews)
    .where(eq(reviews.yachtModelId, yachtData.id));

  const reviewData = yachtReviews.length > 0
    ? yachtReviews.map((r: any) => ({
        rating: r.rating ? parseFloat(r.rating) : 0,
        summary: r.summary,
        authorName: r.authorName,
        reviewDate: r.reviewDate,
      }))
    : undefined;

  const jsonLd = generateYachtJsonLd({
    manufacturer: manufacturerName,
    modelName: yachtData.modelName,
    year: yachtData.year,
    slug: yachtData.slug,
    description: yachtData.description,
    lengthOverall: yachtData.lengthOverall ? parseFloat(yachtData.lengthOverall) : null,
    beam: yachtData.beam ? parseFloat(yachtData.beam) : null,
    draft: yachtData.draft ? parseFloat(yachtData.draft) : null,
    displacement: yachtData.displacement ? parseFloat(yachtData.displacement) : null,
    hullMaterial: yachtData.hullMaterial,
    rigType: yachtData.rigType,
    cabins: yachtData.cabins,
    primaryImage: primaryImage?.url,
    reviews: reviewData,
  });

  // Add Offer schema if price data exists
  const priceLow = yachtData.priceLow ? parseFloat(yachtData.priceLow) : null;
  const priceHigh = yachtData.priceHigh ? parseFloat(yachtData.priceHigh) : null;
  if (priceLow || priceHigh) {
    (jsonLd as any).offers = {
      "@type": "Offer",
      priceCurrency: "USD",
      ...(priceLow && priceHigh
        ? { price: `${priceLow}-${priceHigh}`, priceSpecification: { "@type": "PriceSpecification", price: priceLow, maxPrice: priceHigh, priceCurrency: "USD" } }
        : { price: priceLow || priceHigh }),
      availability: "https://schema.org/InStock",
    };
  }

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Yachts", path: "/yachts" },
    { name: `${manufacturerName} ${yachtData.modelName}` },
  ]);

  // FAQ structured data
  const faqJsonLd = generateFaqJsonLd({
    manufacturer: manufacturerName,
    modelName: yachtData.modelName,
    displacement: yachtData.displacement ? parseFloat(yachtData.displacement) : null,
    lengthOverall: yachtData.lengthOverall ? parseFloat(yachtData.lengthOverall) : null,
    draft: yachtData.draft ? parseFloat(yachtData.draft) : null,
    cabins: yachtData.cabins,
    beam: yachtData.beam ? parseFloat(yachtData.beam) : null,
  });

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
      <YachtDetailClient />
    </>
  );
}
