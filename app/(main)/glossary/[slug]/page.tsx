import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTermBySlug, getRelatedTerms } from "@/lib/glossary";
import { getSiteUrl, generateBreadcrumbJsonLd, generateCollectionPageJsonLd } from "@/lib/seo";

// ISR: Revalidate glossary term pages every 6 hours
export const revalidate = 21600;

interface GlossaryTermPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: GlossaryTermPageProps): Promise<Metadata> {
  const { slug } = await params;
  const term = getTermBySlug(slug);

  if (!term) {
    return {
      title: "Term Not Found",
      description: "The requested sailing glossary term could not be found.",
    };
  }

  const description = `${term.term}: ${term.definition.substring(0, 160)}`;

  return {
    title: `${term.term} – Sailing Glossary`,
    description,
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
      siteName: "Sailing Yachts Database",
    },
    twitter: {
      card: "summary",
      title: `${term.term} – Sailing Glossary`,
      description,
    },
    alternates: {
      canonical: getSiteUrl(`/glossary/${slug}`),
    },
  };
}

export async function generateStaticParams() {
  const terms = [
    "loa", "beam", "draft", "displacement", "ballast", "ballast-ratio",
    "fin-keel", "wing-keel", "cutter-rig", "sloop-rig", "ketch-rig",
    "shoal-draft", "lwl", "hull-speed", "cabin", "berth", "head",
    "bluewater", "coastal-cruiser", "liveaboard",
  ];
  return terms.map((slug) => ({ slug }));
}

export default async function GlossaryTermPage({ params }: GlossaryTermPageProps) {
  const { slug } = await params;
  const term = getTermBySlug(slug);

  if (!term) {
    notFound();
  }

  const relatedTerms = getRelatedTerms(term);

  const breadcrumbItems = [
    { name: "Home", item: getSiteUrl("/") },
    { name: "Glossary", item: getSiteUrl("/glossary") },
    { name: term.term, item: getSiteUrl(`/glossary/${slug}`) },
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
              <Link href="/" className="hover:text-gray-900">Home</Link>
            </li>
            <li className="mx-2">/</li>
            <li>
              <Link href="/glossary" className="hover:text-gray-900">Glossary</Link>
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
                <span className="font-medium">Also known as:</span> {term.aliases.join(", ")}
              </p>
            </div>
          )}
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-700 leading-relaxed">
              {term.definition}
            </p>
          </div>
        </section>

        {/* Related Terms */}
        {relatedTerms.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 py-8 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Terms</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {relatedTerms.map((related) => (
                <Link
                  key={related.slug}
                  href={`/glossary/${related.slug}`}
                  className="group p-4 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                    {related.term}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {related.definition}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">{related.category}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Browse All */}
        <section className="max-w-5xl mx-auto px-4 py-12 border-t border-gray-200">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Explore More Terms
            </h2>
            <p className="text-gray-600 mb-6">
              Browse our complete sailing glossary to learn more about nautical terminology and yacht specifications.
            </p>
            <Link
              href="/glossary"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              View All Glossary Terms
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
