import type { Metadata } from "next";
import { generateBreadcrumbJsonLd, getSiteUrl , buildLocaleAlternates } from "@/lib/seo";
import dynamic from "next/dynamic";
const SearchClient = dynamic(() => import("./SearchClient").then(m => ({ default: m.SearchClient })), { ssr: false, loading: () => null });
import { shouldNoindexSearchPage } from "@/lib/thin-page-governance";
import { getTranslations } from "next-intl/server";

interface SearchPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Search page metadata.
 * Search results pages should be noindexed for user-specific queries,
 * but the base /search page itself can be indexed.
 */
export async function generateMetadata({ params }: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Search" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: buildLocaleAlternates("/search"),
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
    },
    robots: shouldNoindexSearchPage()
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default async function SearchPage({ params }: SearchPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Search" });

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: t("heading") },
  ], locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SearchClient />
    </>
  );
}
