import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { generateGeneralFaqs, getAllManufacturerSlugs } from "@/lib/faq-generation";
import { SIZE_CATEGORIES } from "@/lib/size-categories";
import { getSiteUrl, buildLocaleAlternates } from "@/lib/seo";
import { localePath } from "@/lib/i18n-paths";
import FaqStructuredData from "./FaqStructuredData";

export const revalidate = 3600; // ISR: revalidate every hour

interface FaqPageProps {
  params: { locale: string };
}

export async function generateMetadata({ params }: FaqPageProps): Promise<Metadata> {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Faq" });

  return {
    title: locale === "fr" ? "Questions Fréquentes sur les Voiliers" : "Sailing Yachts — Frequently Asked Questions",
    description: locale === "fr"
      ? "Questions fréquentes sur les voiliers. Découvrez les constructeurs, tailles, types de gréement et comment choisir le bon voilier."
      : "Frequently asked questions about sailing yachts. Learn about manufacturers, sizes, rig types, keel configurations, and how to choose the right yacht.",
    alternates: buildLocaleAlternates("/faq", locale),
    openGraph: {
      title: locale === "fr" ? "Questions Fréquentes sur les Voiliers" : "Sailing Yachts — FAQ",
      description: locale === "fr"
        ? "Trouvez des réponses aux questions les plus fréquentes sur les voiliers"
        : "Find answers to the most frequently asked questions about sailing yachts",
      type: "website",
      url: getSiteUrl(`/${locale}/faq`),
    },
  };
}

export default async function FaqPage({ params }: FaqPageProps) {
  const { locale } = params;
  setRequestLocale(locale);
  const isFr = locale === "fr";

  const data = await generateGeneralFaqs();
  const mfrSlugs = await getAllManufacturerSlugs();

  const title = isFr ? data.titleFr : data.title;
  const description = isFr ? data.descriptionFr : data.description;

  return (
    <main className="min-h-screen bg-white">
      <FaqStructuredData jsonLd={data.jsonLd} />
      
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-12 border-b">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h1>
          <p className="text-lg text-gray-600">{description}</p>
        </div>
      </section>

      {/* FAQ Items */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <div className="space-y-6">
          {data.faqs.map((faq, i) => (
            <details
              key={i}
              className="group border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors"
              open={i === 0}
            >
              <summary className="flex items-center justify-between cursor-pointer text-lg font-semibold text-gray-900 list-none">
                <span>{isFr ? faq.questionFr : faq.question}</span>
                <span className="ml-4 text-blue-600 group-open:rotate-180 transition-transform flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-gray-600 leading-relaxed">
                {isFr ? faq.answerFr : faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Browse by Manufacturer */}
      {mfrSlugs.length > 0 && (
        <section className="bg-gray-50 py-10 border-t">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {isFr ? "FAQ par constructeur" : "FAQ by Manufacturer"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {mfrSlugs.map((slug) => (
                <Link
                  key={slug}
                  href={localePath(locale, `/faq/${slug}`)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-blue-400 hover:text-blue-700 transition-colors text-sm font-medium text-center"
                >
                  {slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse by Size */}
      <section className="py-10 border-t">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {isFr ? "FAQ par taille" : "FAQ by Size"}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SIZE_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={localePath(locale, `/faq/size/${cat.slug}`)}
                className="px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 transition-colors"
              >
                <div className="font-semibold text-gray-900 text-sm">
                  {isFr ? cat.labelFr : cat.labelEn}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {cat.loaMin.toFixed(1)}m – {cat.loaMax < 100 ? cat.loaMax.toFixed(1) + "m" : "∞"}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
