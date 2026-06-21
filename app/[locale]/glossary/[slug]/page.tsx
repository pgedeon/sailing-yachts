import { localePath } from "@/lib/i18n-paths";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getTermBySlug, getRelatedTerms } from "@/lib/glossary";
import { getYachtLinksForTerm } from "@/lib/glossary-yacht-links";
import { getSiteUrl, generateBreadcrumbJsonLd, buildLocaleAlternates, buildOgImageUrl } from "@/lib/seo";
import { getGlossaryParams } from "@/lib/static-params";

export const revalidate = 86400;


// ISR: Revalidate glossary term pages every 6 hours



interface GlossaryTermPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateStaticParams() {
  return getGlossaryParams();
}

export async function generateMetadata(props: GlossaryTermPageProps): Promise<Metadata> {
  const params = await props.params;
  const { slug, 
locale } = params;
  // Enable static rendering for next-intl
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Glossary" });
  const term = getTermBySlug(slug);

  if (!term) {
    return {
      title: t("meta.notFoundTitle"),
      description: t("meta.notFoundDescription"),
    };
  }

  const description = `${term.term}: ${term.definition.substring(0, 160)}`;

  return {
    title: t("term.meta.title", { term: term.term }),
    description: t("term.meta.description", { term: term.term, definition: term.definition.substring(0, 160) }),
    keywords: [
      term.term,
      term.category,
      "sailing glossary",
      "nautical terms",
      "yacht specifications",
      ...(term.aliases || []),
    ],
    openGraph: {
      title: `${term.term} – Sailing Glossary`,
      description,
      url: getSiteUrl(`/glossary/${slug}`),
      type: "website",
      siteName: "Sailing Yacht Info",
      images: [{ url: buildOgImageUrl({ type: "glossary", title: term.term, description: term.category ?? undefined }), width: 1200, height: 630, alt: term.term }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${term.term} – Sailing Glossary`,
      description,
      images: [buildOgImageUrl({ type: "glossary", title: term.term, description: term.category ?? undefined })],
    },
    alternates: buildLocaleAlternates(`/glossary/${slug}`),
  };
}


export default async function GlossaryTermPage(props: GlossaryTermPageProps) {
  const params = await props.params;
  const { slug, locale } = params;
  const t = await getTranslations({ locale, namespace: "Glossary" });
  const term = getTermBySlug(slug);

  if (!term) {
    notFound();
  }

  const relatedTerms = getRelatedTerms(term);
  const yachtLinks = getYachtLinksForTerm(slug, locale);

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Glossary", path: "/glossary" },
    { name: term.term, path: `/glossary/${slug}` },
  ];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="min-h-screen">
        {/* Breadcrumb */}
        <nav className="max-w-5xl mx-auto px-4 py-4" aria-label="Breadcrumb">
          <ol className="flex items-center text-sm text-gray-500">
            <li>
              <Link href={localePath(locale, "/")} className="hover:text-gray-900">{t("breadcrumb.home")}</Link>
            </li>
            <li className="mx-2">/</li>
            <li>
              <Link href={localePath(locale, "/glossary")} className="hover:text-gray-900">{t("breadcrumb.glossary")}</Link>
            </li>
            <li className="mx-2">/</li>
            <li className="text-gray-900">{term.term}</li>
          </ol>
        </nav>

        {/* Header */}
        <section className="max-w-5xl mx-auto px-4 py-8">
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              {term.category}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {term.term}
          </h1>
          {term.aliases && term.aliases.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                <span className="font-medium">{t("term.alsoKnownAs")}</span> {term.aliases.join(", ")}
              </p>
            </div>
          )}
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-700 leading-relaxed">
              {term.definition}
            </p>
          </div>
        </section>

        {/* Browse related yachts */}
        {yachtLinks.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 py-8 border-t border-gray-200" data-testid="glossary-yacht-links">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t("term.browseYachtsTitle")}
            </h2>
            <div className="flex flex-wrap gap-3">
              {yachtLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  {locale === "fr" ? link.labelFr : link.label}
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related Terms */}
        {relatedTerms.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 py-8 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("term.relatedTerms")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {relatedTerms.map((related) => (
                <Link
                  key={related.slug}
                  href={localePath(locale, `/glossary/${related.slug}`)}
                  className="group p-4 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                    {related.term}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {related.definition}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">{related.category}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Browse All */}
        <section className="max-w-5xl mx-auto px-4 py-12 border-t border-gray-200">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t("term.exploreMoreTitle")}
            </h2>
            <p className="text-gray-600 mb-6">
              {t("term.exploreMoreDescription")}
            </p>
            <Link
              href={localePath(locale, "/glossary")}
              className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              {t("term.viewAllTerms")}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
