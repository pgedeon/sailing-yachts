import type { Metadata } from "next";
import Link from "next/link";
import { getAllPublishedArticles, getAllCategories } from "@/lib/articles";
import { getSiteUrl } from "@/lib/seo";

// ISR: Revalidate guides hub every hour
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Sailing Guides & Resources",
    description:
      "Expert sailing guides, buying advice, and educational resources for yacht buyers and sailors. Learn about boat selection, ownership, and sailing terminology.",
    keywords: [
      "sailing guides",
      "yacht buying guide",
      "sailing resources",
      "boat selection",
      "sailing education",
      "nautical glossary",
    ],
    openGraph: {
      title: "Sailing Guides & Resources",
      description:
        "Expert sailing guides, buying advice, and educational resources for yacht buyers and sailors.",
      url: getSiteUrl("/guides"),
      type: "website",
      siteName: "Sailing Yachts Database",
    },
    twitter: {
      card: "summary",
      title: "Sailing Guides & Resources",
      description:
        "Expert sailing guides, buying advice, and educational resources.",
    },
    alternates: {
      canonical: getSiteUrl("/guides"),
    },
  };
}

export default async function GuidesPage() {
  const [articles, categories] = await Promise.all([
    getAllPublishedArticles(),
    getAllCategories(),
  ]);

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-b from-sky-50 to-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Sailing Guides & Resources
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            Expert guides, buying advice, and educational resources to help you
            choose the right yacht and make the most of your sailing adventures.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar: Categories */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Categories
                </h2>
                {categories.length > 0 ? (
                  <ul className="space-y-2">
                    <li>
                      <Link
                        href="/guides"
                        className="block px-3 py-2 rounded-md text-blue-600 hover:bg-blue-50 transition"
                      >
                        All Guides ({articles.length})
                      </Link>
                    </li>
                    {categories.map((cat) => (
                      <li key={cat.name}>
                        <Link
                          href={`/guides?category=${encodeURIComponent(
                            cat.name
                          )}`}
                          className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition"
                        >
                          {formatCategoryName(cat.name)} ({cat.count})
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    No categories available yet.
                  </p>
                )}
              </div>

              {/* Newsletter Signup */}
              <div className="bg-blue-50 rounded-lg p-6 mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Get New Guides
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Subscribe for updates when we publish new guides.
                </p>
                <Link
                  href="/newsletter"
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition"
                >
                  Subscribe
                </Link>
              </div>
            </aside>

            {/* Main Content: Articles Grid */}
            <div className="lg:col-span-3">
              {articles.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {articles.map((article) => (
                      <Link
                        key={article.id}
                        href={`/guides/${article.slug}`}
                        className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition group"
                      >
                        {article.featuredImage && (
                          <div className="mb-4 aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={article.featuredImage}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-3">
                          {article.category && (
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              {formatCategoryName(article.category)}
                            </span>
                          )}
                          {article.readingTimeMinutes && (
                            <span className="text-xs text-gray-500">
                              {article.readingTimeMinutes} min read
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                          {article.title}
                        </h3>
                        {article.excerpt && (
                          <p className="text-gray-600 text-sm line-clamp-3">
                            {article.excerpt}
                          </p>
                        )}
                        {article.author && (
                          <div className="mt-4 flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                              {article.author.charAt(0)}
                            </div>
                            <span className="text-sm text-gray-600">
                              {article.author}
                              {article.authorTitle && (
                                <span className="text-gray-400">
                                  {" "}
                                  · {article.authorTitle}
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>

                  {/* Browse Yachts CTA */}
                  <div className="mt-12 bg-gradient-to-r from-blue-600 to-sky-500 rounded-xl p-8 text-center text-white">
                    <h3 className="text-2xl font-semibold mb-4">
                      Explore Our Yacht Database
                    </h3>
                    <p className="text-blue-50 mb-6 max-w-2xl mx-auto">
                      Browse our complete sailing yacht database from top manufacturers.
                      Compare specs, read reviews, and find your perfect boat.
                    </p>
                    <Link
                      href="/yachts"
                      className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition"
                    >
                      Browse Yachts
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Coming Soon
                  </h3>
                  <p className="text-gray-600 mb-6">
                    We're working on creating comprehensive sailing guides and
                    resources for you.
                  </p>
                  <Link
                    href="/yachts"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    Browse Yachts
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function formatCategoryName(category: string): string {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
