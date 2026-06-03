import { SHIMMER_BLUR } from "@/lib/image-utils";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { getTranslations } from "next-intl/server";
import {
  getArticleBySlug,
  getRelatedArticles,
} from "@/lib/articles";
import { getSiteUrl, generateBreadcrumbJsonLd , buildLocaleAlternates } from "@/lib/seo";
import NewsletterSignup from "@/components/NewsletterSignup";
import BuyingGuideYachtList from "@/components/BuyingGuideYachtList";
import { getTemplateById } from "@/lib/buying-guides";
import { localePath } from "@/lib/i18n-paths";





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

function countWords(text: string): number {
  return text.replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length;
}

interface PageProps {
  params: { slug: string; locale: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = params;
  const article = await getArticleBySlug(slug);
  if (!article) {
    return { title: "Article Not Found" };
  }

  const url = getSiteUrl(`/guides/${article.slug}`);
  return {
    title: `${article.title} | Sailing Yacht Info Guides`,
    description:
      article.excerpt ||
      `Read "${article.title}" on Sailing Yacht Info.`,
    openGraph: {
      title: article.title,
      description: article.excerpt || undefined,
      url,
      type: "article",
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt?.toISOString(),
      authors: article.author ? [article.author] : undefined,
      siteName: "Sailing Yacht Info",
      ...(article.featuredImage ? { images: [article.featuredImage] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt || undefined,
    },
    alternates: buildLocaleAlternates(`/guides/${slug}`),
  };
}

export default async function GuideArticlePage({ params }: PageProps) {
  const { slug, locale } = params;
  const t = await getTranslations({ locale, namespace: "Guides" });

  const article = await getArticleBySlug(slug);
  if (!article) {
    notFound();
  }

  const source = article.contentMarkdown || article.content || "";
  const { html: contentHtml, headings } = renderMarkdown(source);

  const relatedArticles = await getRelatedArticles(article.id, article.category);

  // Get buying guide template if this article is linked to one
  const template = article.buyingGuideTemplateId
    ? getTemplateById(article.buyingGuideTemplateId)
    : null;

  const breadcrumb = generateBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Guides", path: "/guides" },
    { name: article.title, path: `/guides/${article.slug}` },
  ], locale);

  const articleUrl = getSiteUrl(`/guides/${article.slug}`);
  const wordCount = countWords(contentHtml);
  const articleSection = article.category
    ? formatCategoryName(article.category)
    : "Sailing Guides";

  // Enhanced Article JSON-LD with wordCount, articleSection, about, speakable
  const articleJsonLd: Record<string, any> = {
    "@type": "Article",
    headline: article.title,
    description: article.excerpt || undefined,
    image: article.featuredImage || undefined,
    url: articleUrl,
    wordCount,
    articleSection,
    about: [
      { "@type": "Thing", name: "Sailing", url: "https://en.wikipedia.org/wiki/Sailing" },
      { "@type": "Thing", name: "Sailboat", url: "https://en.wikipedia.org/wiki/Sailboat" },
    ],
    author: article.author
      ? {
          "@type": "Person",
          name: article.author,
          jobTitle: article.authorTitle || undefined,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "Sailing Yacht Info",
      url: getSiteUrl(),
      logo: {
        "@type": "ImageObject",
        url: getSiteUrl("/logo.png"),
      },
    },
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt?.toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".article-content h2", ".article-content h3"],
    },
  };

  // Build structured data graph
  const graphNodes: Record<string, any>[] = [articleJsonLd, breadcrumb];

  // Add FAQPage schema if template has FAQs
  if (template && template.faqs.length > 0) {
    graphNodes.push({
      "@type": "FAQPage",
      url: articleUrl,
      mainEntity: template.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": graphNodes,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <main className="min-h-screen bg-white">
        {/* Breadcrumb */}
        <nav className="bg-slate-900 border-b border-slate-700/50 py-3 px-4">
          <div className="max-w-5xl mx-auto flex items-center gap-2 text-sm">
            <Link href={localePath(locale, "/")} className="text-amber-300/80 hover:text-amber-200 transition">
              {t("article.breadcrumb.home")}
            </Link>
            <span className="text-slate-600">/</span>
            <Link href={localePath(locale, "/guides")} className="text-amber-300/80 hover:text-amber-200 transition">
              {t("article.breadcrumb.guides")}
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300 font-medium truncate">
              {article.title}
            </span>
          </div>
        </nav>

        {/* Article Header */}
        <header className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 pt-16 pb-20 px-4 relative">
          <div className="max-w-3xl mx-auto relative z-10">
            {article.category && (
              <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-widest bg-amber-500/15 text-amber-300 rounded-full mb-6 border border-amber-500/20">
                {formatCategoryName(article.category)}
              </span>
            )}
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
                {article.excerpt}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {article.author && (
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-amber-500/20 rounded-full flex items-center justify-center text-sm font-semibold text-amber-300 border border-amber-500/30">
                    {article.author.charAt(0)}
                  </div>
                  <div>
                    <span className="font-medium text-amber-200">
                      {article.author}
                    </span>
                    {article.authorTitle && (
                      <span className="text-slate-400 ml-1">
                        · {article.authorTitle}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {article.publishedAt && (
                <time dateTime={article.publishedAt.toISOString()} className="text-slate-400">
                  {formatDate(article.publishedAt)}
                </time>
              )}
              {article.readingTimeMinutes && (
                <span className="text-slate-400">{t("article.minRead", { minutes: article.readingTimeMinutes })}</span>
              )}
              {article.lastReviewedAt && (
                <span className="text-emerald-400/80 text-xs">{t("article.reviewed", { date: formatDate(article.lastReviewedAt) })}</span>
              )}
            </div>
          </div>

          {/* Wave divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="white"/>
            </svg>
          </div>
        </header>

        {/* Content */}
        <div className="py-12 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* TOC Sidebar */}
            {headings.length > 0 && (
              <aside className="hidden lg:block lg:col-span-1">
                <div className="sticky top-8 bg-slate-50/50 rounded-xl border border-slate-100 p-6">
                  <div className="border-l-2 border-amber-500/40 pl-4">
                    <h2 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-[0.2em]">
                      {t("article.onThisPage")}
                    </h2>
                    <nav>
                      <ul className="space-y-2.5">
                        {headings.map((h) => (
                          <li key={h.id}>
                            <a
                              href={`#${h.id}`}
                              className={`text-sm text-slate-500 hover:text-amber-600 transition-colors block leading-snug ${
                                h.depth === 3 ? "pl-3 text-slate-400" : ""
                              }`}
                            >
                              {h.text}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </div>
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
                <div className="mb-8 aspect-video bg-slate-100 rounded-xl overflow-hidden shadow-lg">
                  <Image
                    src={article.featuredImage}
                    alt={article.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 800px"
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL={SHIMMER_BLUR}
                  />
                </div>
              )}

              <div
                className="article-content prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-slate-800 prose-a:text-amber-700 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-800 prose-li:marker:text-amber-500 prose-blockquote:border-l-amber-500/50 prose-blockquote:bg-amber-50/30 prose-blockquote:rounded-r-lg prose-hr:border-slate-200"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />

              {/* Buying Guide Yacht List */}
              {template && (
                <div className="mt-14">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 font-serif mb-2">
                      {template.title}
                    </h2>
                    <p className="text-slate-500 text-sm">{template.description}</p>
                  </div>
                  <BuyingGuideYachtList
                    templateId={article.buyingGuideTemplateId!}
                  />
                </div>
              )}

              {/* FAQ Section (if template exists) */}
              {template && template.faqs.length > 0 && (
                <section className="mt-14 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 font-serif">
                      {t("article.frequentlyAskedQuestions")}
                    </h2>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {template.faqs.map((faq, idx) => (
                      <details key={idx} className="p-6 group">
                        <summary className="text-lg font-semibold text-slate-800 cursor-pointer list-none flex items-center justify-between hover:text-amber-700 transition font-serif">
                          {faq.question}
                          <span className="text-amber-500 group-open:rotate-180 transition-transform duration-200 ml-4 flex-shrink-0">▼</span>
                        </summary>
                        <p className="text-slate-600 mt-4 pl-4 border-l-4 border-amber-500/50 leading-relaxed">{faq.answer}</p>
                      </details>
                    ))}
                  </div>
                </section>
              )}

              <div className="mt-14 bg-slate-900 rounded-2xl p-10 text-white shadow-xl">
                <h3 className="text-xl font-semibold text-amber-300 mb-2 font-serif">
                  {t("article.newsletter.title")}
                </h3>
                <p className="text-slate-300 mb-5">
                  {t("article.newsletter.description")}
                </p>
                <NewsletterSignup source={`guide-${article.slug}`} />
              </div>

              {/* Browse Yachts CTA */}
              <div className="mt-8 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 rounded-2xl p-10 text-center text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMwLTkuOTQtOC4wNi0xOC0xOC0xOGgydjM2YzAgOS45NCA4LjA2IDE4IDE4IDE4SDE4Yy05Ljk0IDAtMTgtOC4wNi0xOC0xOHYtMzZoMzZ6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4wMyIvPjwvZz48L3N2Zz4=')] opacity-30" />
                <div className="relative z-10">
                  <h3 className="text-2xl font-semibold mb-3 font-serif">
                    {t("article.browseCta.title")}
                  </h3>
                  <p className="text-amber-100 mb-6 max-w-md mx-auto">
                    {t("article.browseCta.description")}
                  </p>
                  <Link
                    href={localePath(locale, "/yachts")}
                    className="inline-block bg-white text-amber-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-amber-50 transition shadow-lg"
                  >
                    {t("article.browseCta.browseYachts")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Guides */}
        {relatedArticles && relatedArticles.length > 0 && (
          <section className="py-16 px-4 bg-slate-50 border-t border-slate-200">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-800 mb-8 font-serif">
                {t("article.relatedGuides")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    href={localePath(locale, `/guides/${related.slug}`)}
                    className="block bg-white rounded-xl border border-slate-200 p-6 hover:border-amber-300 hover:shadow-xl transition-all duration-300 group"
                  >
                    {related.category && (
                      <span className="inline-block px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-full mb-3 border border-amber-200/50">
                        {formatCategoryName(related.category)}
                      </span>
                    )}
                    <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-amber-700 transition font-serif">
                      {related.title}
                    </h3>
                    {related.excerpt && (
                      <p className="text-sm text-slate-500 line-clamp-2">
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
