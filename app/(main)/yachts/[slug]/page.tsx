import type { Metadata } from "next";
import { unstable_cache } from "next/cache";

import {
  generateYachtPageMetadata,
  generateYachtJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
  getSiteUrl,
} from "@/lib/seo";
import { getYachtDetailData, getPrimaryImage } from "@/lib/yachts";
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

interface YachtDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: YachtDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getYachtData(slug);

  if (!data) {
    return {
      title: "Yacht Not Found",
      description: "The requested sailing yacht could not be found.",
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
  const data = await getYachtData(slug);

  if (!data) {
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
    { name: "Home", path: "/" },
    { name: "Yachts", path: "/yachts" },
    { name: `${manufacturerName} ${yachtData.modelName}`, path: `/yachts/${slug}` },
  ]);

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
