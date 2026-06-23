import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getManufacturerStats, generateManufacturerFaqs, getAllManufacturerSlugs } from "@/lib/faq-generation";
import { getSiteUrl, buildLocaleAlternates } from "@/lib/seo";
import { localePath } from "@/lib/i18n-paths";
import { slugify } from "@/lib/utils/slugify";
import FaqStructuredData from "../FaqStructuredData";

export const revalidate = 3600;

interface MfrFaqPageProps {
  params: Promise<{ locale: string; manufacturer: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllManufacturerSlugs();
  return slugs.flatMap((slug) => [
    { locale: "en", manufacturer: slug },
    { locale: "fr", manufacturer: slug },
  ]);
}

export async function generateMetadata(props: MfrFaqPageProps): Promise<Metadata> {
  const params = await props.params;
  const { locale, manufacturer } = params;
  setRequestLocale(locale);

  try {
    // Resolve manufacturer name from slug
    const slugs = await getAllManufacturerSlugs();
    if (!slugs.includes(manufacturer)) return {};

    const { db, manufacturers, yachtModels } = await import("@/lib/db-edge");
    const { eq, count, sql } = await import("drizzle-orm");

    const mfrRows = await db
      .select({ name: manufacturers.name })
      .from(manufacturers)
      .innerJoin(yachtModels, eq(yachtModels.manufacturerId, manufacturers.id))
      .groupBy(manufacturers.name)
      .having(sql`count(*) >= 3`);

    const mfr = mfrRows.find((r: any) => slugify(r.name) === manufacturer);
    if (!mfr) return {};

    const stats = await getManufacturerStats(mfr.name);
    if (!stats) return {};

    const data = generateManufacturerFaqs(stats);
    const title = locale === "fr" ? data.titleFr : data.title;

    return {
      title,
      description: locale === "fr" ? data.descriptionFr : data.description,
      alternates: buildLocaleAlternates(`/faq/${manufacturer}`, locale),
      openGraph: {
        title,
        description: locale === "fr" ? data.descriptionFr : data.description,
        type: "website",
        url: getSiteUrl(`/${locale}/faq/${manufacturer}`),
      },
    };
  } catch {
    return {};
  }
}

export default async function ManufacturerFaqPage(props: MfrFaqPageProps) {
  const params = await props.params;
  const { locale, manufacturer: manufacturerSlug } = params;
  setRequestLocale(locale);
  const isFr = locale === "fr";

  let stats: Awaited<ReturnType<typeof getManufacturerStats>> = null;

  try {
    // Resolve manufacturer name
    const { db, manufacturers, yachtModels } = await import("@/lib/db-edge");
    const { eq, count, sql } = await import("drizzle-orm");

    const mfrRows = await db
      .select({ name: manufacturers.name })
      .from(manufacturers)
      .innerJoin(yachtModels, eq(yachtModels.manufacturerId, manufacturers.id))
      .groupBy(manufacturers.name)
      .having(sql`count(*) >= 3`);

    const mfr = mfrRows.find((r: any) => slugify(r.name) === manufacturerSlug);
    if (!mfr) notFound();

    stats = await getManufacturerStats(mfr.name);
  } catch {
    // DB error — allow dynamic rendering at runtime
  }

  if (!stats) notFound();

  const data = generateManufacturerFaqs(stats);
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
              {stats.yachtCount} {isFr ? "modèles" : "models"}
            </span>
            {stats.minLoa && stats.maxLoa && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {stats.minLoa.toFixed(1)}m – {stats.maxLoa.toFixed(1)}m
              </span>
            )}
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

      {/* CTA */}
      <section className="bg-blue-50 py-8 border-t">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link
            href={localePath(locale, `/manufacturers/${manufacturerSlug}`)}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {isFr ? `Voir tous les voiliers ${stats.name}` : `Browse all ${stats.name} yachts`}
          </Link>
        </div>
      </section>
    </main>
  );
}
