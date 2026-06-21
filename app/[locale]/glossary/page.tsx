import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations , setRequestLocale } from "next-intl/server";
import { getAllGlossaryTerms, getGlossaryCategories } from "@/lib/glossary";
import { getSiteUrl, generateBreadcrumbJsonLd, generateCollectionPageJsonLd , buildLocaleAlternates , buildOgImageUrl } from "@/lib/seo";
import { localePath } from "@/lib/i18n-paths";

// ISR: Revalidate glossary every 6 hours
export const revalidate = 21600;

interface GlossaryPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(props: GlossaryPageProps): Promise<Metadata> {
  const params = await props.params;
  const { locale } = params;
  // Enable static rendering for next-intl
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Glossary" });
  const terms = getAllGlossaryTerms();
  const categories = getGlossaryCategories();

  return {
    title: t("meta.title"),
    description: t("meta.description", { count: terms.length }),
    keywords: [
      "sailing glossary",
      "nautical terms",
      "yacht specifications",
      "sailing terminology",
      "boat terminology",
      "sailing dictionary",
      "nautical dictionary",
      "LOA",
      "beam",
      "draft",
      "ballast ratio",
      "keel types",
      ...categories.map((c) => c.toLowerCase()),
    ],
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description", { count: terms.length }),
      url: getSiteUrl("/glossary"),
      type: "website",
      siteName: "Sailing Yacht Info",
      images: [{ url: buildOgImageUrl({ type: "glossary", title: t("meta.title") }), width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary",
      title: t("meta.title"),
      description: t("meta.description", { count: terms.length }),
    },
    alternates: buildLocaleAlternates("/glossary", locale),
  };
}

export default async function GlossaryPage(props: GlossaryPageProps) {
  const params = await props.params;
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "Glossary" });

  const [terms, categories] = await Promise.all([
    getAllGlossaryTerms(),
    getGlossaryCategories(),
  ]);

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Glossary", path: "/glossary" },
  ];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);

  const collectionJsonLd = generateCollectionPageJsonLd({
    name: "Sailing Glossary",
    description: `Comprehensive sailing glossary with ${terms.length} nautical terms and yacht specifications.`,
    url: getSiteUrl("/glossary"),
    itemCount: terms.length,
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
      <main className="min-h-screen">
        {/* Header */}
        <section className="bg-gradient-to-b from-sky-50 to-white py-16 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t("heading")}
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              {t("description")}
            </p>
            <p className="text-sm text-gray-500">
              {t("termStats", { terms: terms.length, categories: categories.length })}
            </p>
          </div>
        </section>

        {/* Category Filter */}
        <section className="py-8 px-4 border-b border-gray-200">
          <div className="max-w-5xl mx-auto">
            <nav className="flex flex-wrap gap-2 justify-center" aria-label="Filter by category">
              <Link
                href={localePath(locale, "/glossary")}
                className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
              >
                {t("filterAll", { count: terms.length })}
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`#category-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                  className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition"
                >
                  {cat}
                </Link>
              ))}
            </nav>
          </div>
        </section>

        {/* Terms by Category */}
        <section className="py-12 px-4">
          <div className="max-w-5xl mx-auto space-y-16">
            {categories.map((category) => {
              const categoryTerms = terms.filter((term) => term.category === category);
              if (categoryTerms.length === 0) return null;

              return (
                <div
                  key={category}
                  id={`category-${category.toLowerCase().replace(/\s+/g, "-")}`}
                  className="scroll-mt-8"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                    {category}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryTerms.map((term) => (
                      <Link
                        key={term.slug}
                        href={localePath(locale, `/glossary/${term.slug}`)}
                        className="group p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                            {term.term}
                          </h3>
                          {term.aliases && term.aliases.length > 0 && (
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {t("altCount", { count: term.aliases.length })}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {term.definition}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gray-50 py-12 px-4 mt-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t("cta.title")}
            </h2>
            <p className="text-gray-600 mb-6">
              {t("cta.description")}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={localePath(locale, "/guides")}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
              >
                {t("cta.browseGuides")}
              </Link>
              <Link
                href={localePath(locale, "/yachts")}
                className="px-6 py-3 bg-white text-gray-900 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition"
              >
                {t("cta.browseYachts")}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
