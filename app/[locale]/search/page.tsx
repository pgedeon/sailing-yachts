import type { Metadata } from "next";
import { generateBreadcrumbJsonLd, getSiteUrl, buildLocaleAlternates, buildOgImageUrl } from "@/lib/seo";
import dynamic from "next/dynamic";
const SearchClient = dynamic(() => import("./SearchClient").then(m => ({ default: m.SearchClient })), { ssr: false, loading: () => null });
import { shouldNoindexSearchPage } from "@/lib/thin-page-governance";
import { getTranslations , setRequestLocale } from "next-intl/server";

interface SearchPageProps {
  params: { locale: string };
}

/**
 * Search page metadata.
 * Search results pages should be noindexed for user-specific queries,
 * but the base /search page itself can be indexed.
 */
export async function generateMetadata({ params }: SearchPageProps): Promise<Metadata> {
  const { locale } = params;
  // Enable static rendering for next-intl
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Search" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: buildLocaleAlternates("/search", locale),
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
      images: [{ url: buildOgImageUrl({ type: "default", title: t("meta.title"), description: "Search yachts" }), width: 1200, height: 630, alt: t("meta.title") }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("meta.title"),
      description: t("meta.description"),
    },
    robots: shouldNoindexSearchPage()
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default async function SearchPage({ params }: SearchPageProps) {
  const { locale } = params;
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
      {/* SSR H1 for SEO */}
      <h1 className="sr-only">{t("meta.title")}</h1>
      <SearchClient />
    </>
  );
}
