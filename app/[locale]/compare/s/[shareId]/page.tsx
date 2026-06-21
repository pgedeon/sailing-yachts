import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { edgePool } from "@/lib/edge-pool";
import { generateBreadcrumbJsonLd, getSiteUrl, buildLocaleAlternates, buildOgImageUrl } from "@/lib/seo";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SharedCompareClient from "./SharedCompareClientLazy";

export const revalidate = 3600;


interface SharedComparePageProps {
  params: Promise<{ locale: string; shareId: string }>;
}

async function getSharedComparison(shareId: string) {
  const rows = await edgePool.query(
    `SELECT share_id, yacht_ids, title, view_count, created_at
     FROM shared_comparisons
     WHERE share_id = $1`,
    [shareId]
  );

  if (rows.rows.length === 0) return null;

  // Increment view count (fire-and-forget)
  edgePool.query(
    `UPDATE shared_comparisons SET view_count = view_count + 1 WHERE share_id = $1`,
    [shareId]
  ).catch(() => {});

  const row = rows.rows[0];
  return {
    shareId: row.share_id,
    yachtIds: row.yacht_ids as number[],
    title: row.title as string | null,
    viewCount: row.view_count as number,
    createdAt: row.created_at as string,
  };
}

export async function generateMetadata({ params }: SharedComparePageProps): Promise<Metadata> {
  const { shareId, locale } = await params;
  // Enable static rendering for next-intl
  setRequestLocale(locale);
  const comparison = await getSharedComparison(shareId);

  if (!comparison) {
    return { title: "Comparison Not Found" };
  }

  const t = await getTranslations({ locale, namespace: "Compare" });
  const title = comparison.title || t("sharedComparison.title");
  const description = t("sharedComparison.description", { count: comparison.yachtIds.length });

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: getSiteUrl(`/compare/s/${shareId}`),
      type: "website",
      siteName: "Sailing Yacht Info",
      images: [
        {
          url: buildOgImageUrl({
            type: "compare",
            title: comparison.title || t("sharedComparison.ogTitle"),
            description: `${comparison.yachtIds.length} yachts compared`,
          }),
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: buildLocaleAlternates(`/compare/s/${shareId}`),
  };
}

export default async function SharedComparePage({ params }: SharedComparePageProps) {
  const { shareId, locale } = await params;
  const comparison = await getSharedComparison(shareId);

  if (!comparison) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "Compare" });

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(
    [
      { name: "Home", path: "/" },
      { name: t("heading"), path: "/compare" },
      { name: comparison.title || t("sharedComparison.title"), path: `/compare/s/${shareId}` },
    ],
    locale
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SharedCompareClient
        shareId={shareId}
        yachtIds={comparison.yachtIds}
        title={comparison.title}
        viewCount={comparison.viewCount}
        createdAt={comparison.createdAt}
      />
    </>
  );
}
