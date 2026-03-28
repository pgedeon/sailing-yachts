import type { Metadata } from "next";
import YachtDetailClient from "./YachtDetailClient";

interface YachtData {
  manufacturer: string;
  modelName: string;
  year: number;
  lengthOverall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  description: string | null;
  images: Array<{ url: string; altText?: string; isPrimary: boolean }>;
}

async function getYacht(slug: string): Promise<YachtData | null> {
  try {
    const base =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/yachts/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const yacht = await getYacht(params.slug);
  if (!yacht) {
    return { title: "Yacht Not Found" };
  }

  const title = `${yacht.manufacturer} ${yacht.modelName} (${yacht.year}) — Specs & Reviews`;
  const description =
    yacht.description ||
    `${yacht.manufacturer} ${yacht.modelName} sailing yacht. ${yacht.lengthOverall ? `LOA ${yacht.lengthOverall}m.` : ""} Full specifications, dimensions, sail plan, and accommodation details.`;
  const url = `https://sailing-yachts.vercel.app/yachts/${params.slug}`;
  const image = yacht.images.find((i) => i.isPrimary)?.url;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Sailing Yachts",
      type: "website",
      ...(image ? { images: [{ url: image, alt: `${yacht.manufacturer} ${yacht.modelName}` }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function YachtDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const yacht = await getYacht(params.slug);

  const jsonLd = yacht
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: `${yacht.manufacturer} ${yacht.modelName}`,
        description:
          yacht.description ||
          `${yacht.manufacturer} ${yacht.modelName} sailing yacht built in ${yacht.year}.`,
        brand: {
          "@type": "Brand",
          name: yacht.manufacturer,
        },
        model: yacht.modelName,
        ...(yacht.images.length > 0
          ? {
              image: yacht.images.map((i) => i.url),
            }
          : {}),
        additionalProperty: [
          ...(yacht.lengthOverall
            ? [
                {
                  "@type": "PropertyValue",
                  name: "Length Overall",
                  value: `${yacht.lengthOverall} m`,
                },
              ]
            : []),
          ...(yacht.beam
            ? [
                {
                  "@type": "PropertyValue",
                  name: "Beam",
                  value: `${yacht.beam} m`,
                },
              ]
            : []),
          ...(yacht.draft
            ? [
                {
                  "@type": "PropertyValue",
                  name: "Draft",
                  value: `${yacht.draft} m`,
                },
              ]
            : []),
          ...(yacht.displacement
            ? [
                {
                  "@type": "PropertyValue",
                  name: "Displacement",
                  value: `${yacht.displacement} kg`,
                },
              ]
            : []),
        ],
        url: `https://sailing-yachts.vercel.app/yachts/${params.slug}`,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <YachtDetailClient />
    </>
  );
}
