import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { getArticleBySlug, getRelatedArticles } from "@/lib/articles";
import {
  getSiteUrl,
  generateBreadcrumbJsonLd,
} from "@/lib/seo";
import NewsletterSignup from "@/components/NewsletterSignup";

export const revalidate = 3600;

interface Heading {
  id: string;
  text: string;
  depth: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function extractHeadings(html: string): Heading[] {
  const headings: Heading[] = [];
  const regex = /<h([2-3]) id="([^"]+)">([^<]+)</g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    headings.push({
      depth: parseInt(match[1]),
      id: match[2],
      text: match[3],
    });
  }
  return headings;
}

function renderMarkdown(markdown: string): { html: string; headings: Heading[] } {
  const seenIds = new Map<string, number>();

  function uniqueId(base: string): string {
    const n = seenIds.get(base) || 0;
    seenIds.set(base, n + 1);
    return n === 0 ? base : `${base}-${n}`;
  }

  const renderer = new marked.Renderer();
  const originalHeading = renderer.heading.bind(renderer);

  renderer.heading = function ({ tokens, depth }: { tokens: any[]; depth: number }) {
    const text = tokens.map((t: any) => t.text || t.raw || "").join("");
    const id = uniqueId(slugify(text));
    const inline = this.parser.parseInline(tokens);
    return `<h${depth} id="${id}">${inline}</h${depth}>\n`;
  };

  const html = marked.parse(markdown, { renderer }) as string;
  const headings = extractHeadings(html);
  return { html, headings };
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCategoryName(category: string): string {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article) {
    return { title: "Article Not Found" };
  }

  const url = getSiteUrl(`/guides/${article.slug}`);
  return {
    title: `${article.title} | Sailing Yachts Guides`,
    description:
      article.excerpt ||
      `Read "${article.title}" on Sailing Yachts Database.`,
    openGraph: {
      title: article.title,
      description: article.excerpt || undefined,
      url,
      type: "article",
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt?.toISOString(),
      authors: article.author ? [article.author] : undefined,
      siteName: "Sailing Yachts Database",
      ...(article.featuredImage ? { images: [article.featuredImage] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt || undefined,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function GuideArticlePage({ params }: PageProps) {
  const article = await getArticleBySlug(params.slug);
  if (!article) {
    notFound();
  }

  const source = article.contentMarkdown || article.content || "";
  const { html: contentHtml, headings } = renderMarkdown(source);

  const relatedArticles = await getRelatedArticles(article.id, article.category);

  const breadcrumb = generateBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Guides", path: "/guides" },
    { name: article.title, path: `/guides/${article.slug}` },
  ]);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt || undefined,
    image: article.featuredImage || undefined,
    author: article.author
      ? {
          "@type": "Person",
          name: article.author,
          jobTitle: article.authorTitle || undefined,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "Sailing Yachts Database",
      url: getSiteUrl(),
    },
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt?.toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": getSiteUrl(`/guides/${article.slug}`),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <main className="min-h-screen">
        {/* Breadcrumb */}
        <nav className="bg-gray-50 border-b border-gray-200 py-3 px-4">
          <div className="max-w-5xl mx-auto flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">
              Home
            </Link>
            <span>/</span>
            <Link href="/guides" className="hover:text-blue-600">
              Guides
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate">
              {article.title}
            </span>
          </div>
        </nav>

        {/* Article Header */}
        <header className="bg-gradient-to-b from-sky-50 to-white py-12 px-4">
          <div className="max-w-3xl mx-auto">
            {article.category && (
              <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded-full mb-4">
                {formatCategoryName(article.category)}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="text-lg text-gray-600 mb-6">{article.excerpt}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {article.author && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                    {article.author.charAt(0)}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      {article.author}
                    </span>
                    {article.authorTitle && (
                      <span className="text-gray-400 ml-1">
                        · {article.authorTitle}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {article.publishedAt && (
                <time dateTime={article.publishedAt.toISOString()}>
                  {formatDate(article.publishedAt)}
                </time>
              )}
              {article.readingTimeMinutes && (
                <span>{article.readingTimeMinutes} min read</span>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="py-12 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* TOC Sidebar */}
            {headings.length > 0 && (
              <aside className="hidden lg:block lg:col-span-1">
                <div className="sticky top-8">
                  <h2 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                    On This Page
                  </h2>
                  <nav>
                    <ul className="space-y-2">
                      {headings.map((h) => (
                        <li key={h.id}>
                          <a
                            href={`#${h.id}`}
                            className={`text-sm hover:text-blue-600 transition block ${
                              h.depth === 3 ? "pl-4" : ""
                            } text-gray-600`}
                          >
                            {h.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              </aside>
            )}

            {/* Article Body */}
            <div
              className={`${
                headings.length > 0 ? "lg:col-span-3" : "lg:col-span-4"
              } max-w-3xl`}
            >
              {article.featuredImage && (
                <div className="mb-8 aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={article.featuredImage}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div
                className="prose prose-lg max-w-none prose-headings:scroll-mt-20 prose-a:text-blue-600 prose-img:rounded-lg"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />

              {/* Newsletter CTA */}
              <div className="mt-12 bg-blue-50 rounded-xl p-8 border border-blue-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Get New Guides in Your Inbox
                </h3>
                <p className="text-gray-600 mb-4">
                  Subscribe to receive the latest sailing guides, buying advice,
                  and resources.
                </p>
                <NewsletterSignup source={`guide-${article.slug}`} />
              </div>

              {/* Browse Yachts CTA */}
              <div className="mt-8 bg-gradient-to-r from-blue-600 to-sky-500 rounded-xl p-8 text-center text-white">
                <h3 className="text-2xl font-semibold mb-3">
                  Explore Our Yacht Database
                </h3>
                <p className="text-blue-50 mb-5">
                  Compare specs, read reviews, and find your perfect sailing
                  yacht.
                </p>
                <Link
                  href="/yachts"
                  className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition"
                >
                  Browse Yachts
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Related Guides */}
        {relatedArticles && relatedArticles.length > 0 && (
          <section className="py-12 px-4 bg-gray-50 border-t border-gray-200">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Related Guides
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    href={`/guides/${related.slug}`}
                    className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition group"
                  >
                    {related.category && (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full mb-3">
                        {formatCategoryName(related.category)}
                      </span>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                      {related.title}
                    </h3>
                    {related.excerpt && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {related.excerpt}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
