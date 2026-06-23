import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getSizeCategoryStats, generateSizeCategoryFaqs } from "@/lib/faq-generation";
import { SIZE_CATEGORIES } from "@/lib/size-categories";
import { getSiteUrl, buildLocaleAlternates } from "@/lib/seo";
import { localePath } from "@/lib/i18n-paths";
import FaqStructuredData from "../../FaqStructuredData";

export const revalidate = 3600;

interface SizeFaqPageProps {
  params: Promise<{ locale: string; category: string }>;
}

export async function generateStaticParams() {
  return SIZE_CATEGORIES.flatMap((cat) => [
    { locale: "en", category: cat.slug },
    { locale: "fr", category: cat.slug },
  ]);
}

export async function generateMetadata(props: SizeFaqPageProps): Promise<Metadata> {
  const params = await props.params;
  const { locale, category } = params;
  setRequestLocale(locale);

  try {
    const cat = SIZE_CATEGORIES.find((c) => c.slug === category);
    if (!cat) return {};

    const stats = await getSizeCategoryStats(cat);
    if (!stats) return {};

    const data = generateSizeCategoryFaqs(stats);
    const title = locale === "fr" ? data.titleFr : data.title;

    return {
      title,
      description: locale === "fr" ? data.descriptionFr : data.description,
      alternates: buildLocaleAlternates(`/faq/size/${category}`, locale),
      openGraph: {
        title,
        description: locale === "fr" ? data.descriptionFr : data.description,
        type: "website",
        url: getSiteUrl(`/${locale}/faq/size/${category}`),
      },
    };
  } catch {
    return {};
  }
}

export default async function SizeCategoryFaqPage(props: SizeFaqPageProps) {
  const params = await props.params;
  const { locale, category: categorySlug } = params;
  setRequestLocale(locale);
  const isFr = locale === "fr";

  const cat = SIZE_CATEGORIES.find((c) => c.slug === categorySlug);
  if (!cat) notFound();

  let stats: Awaited<ReturnType<typeof getSizeCategoryStats>> = null;
  try {
    stats = await getSizeCategoryStats(cat);
  } catch {
    // DB error — allow dynamic rendering at runtime
  }
  if (!stats) notFound();

  const data = generateSizeCategoryFaqs(stats);
  const title = isFr ? data.titleFr : data.title;

  return (
    <main className="min-h-screen bg-white">
      <FaqStructuredData jsonLd={data.jsonLd} />
      {/* Hero */}
      <section className="bg-linear-to-b from-blue-50 to-white py-12 border-b">
        <div className="max-w-4xl mx-auto px-4">
          <Link
            href={localePath(locale, "/faq")}
            className="text-blue-600 hover:text-blue-800 text-sm mb-3 inline-block"
          >
            ← {isFr ? "Toutes les FAQ" : "All FAQs"}
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h1>
          <p className="text-lg text-gray-600">
            {isFr ? data.descriptionFr : data.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {stats.yachtCount} {isFr ? "voiliers" : "yachts"}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {isFr ? cat.labelFr : cat.labelEn}
            </span>
          </div>
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
                <span className="ml-4 text-blue-600 group-open:rotate-180 transition-transform shrink-0">
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
      {/* Top Manufacturers in this size */}
      {stats.manufacturers.length > 0 && (
        <section className="bg-gray-50 py-8 border-t">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isFr ? "Constructeurs populaires dans cette taille" : "Popular manufacturers in this size"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stats.manufacturers.map((m) => (
                <Link
                  key={m.name}
                  href={localePath(locale, `/faq/${m.name.toLowerCase().replace(/\s+/g, "-")}`)}
                  className="px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 transition-colors"
                >
                  <div className="font-semibold text-gray-900 text-sm">{m.name}</div>
                  <div className="text-xs text-gray-500">{m.count} {isFr ? "modèles" : "models"}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
