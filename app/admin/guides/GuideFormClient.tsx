"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ArticleData {
  id?: number;
  slug?: string;
  title?: string;
  excerpt?: string | null;
  content?: string | null;
  contentMarkdown?: string | null;
  category?: string | null;
  author?: string | null;
  authorTitle?: string | null;
  featuredImage?: string | null;
  buyingGuideTemplateId?: string | null;
  isPublished?: boolean;
}

export default function GuideFormClient({ article }: { article?: ArticleData }) {
  const router = useRouter();
  const isEdit = !!article?.id;

  const [title, setTitle] = useState(article?.title || "");
  const [slug, setSlug] = useState(article?.slug || "");
  const [excerpt, setExcerpt] = useState(article?.excerpt || "");
  const [contentMarkdown, setContentMarkdown] = useState(article?.contentMarkdown || article?.content || "");
  const [category, setCategory] = useState(article?.category || "");
  const [author, setAuthor] = useState(article?.author || "");
  const [authorTitle, setAuthorTitle] = useState(article?.authorTitle || "");
  const [featuredImage, setFeaturedImage] = useState(article?.featuredImage || "");
  const [buyingGuideTemplateId, setBuyingGuideTemplateId] = useState(article?.buyingGuideTemplateId || "");
  const [isPublished, setIsPublished] = useState(article?.isPublished ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const autoSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        title,
        slug,
        excerpt: excerpt || null,
        content: contentMarkdown, // Store markdown as content too
        contentMarkdown,
        category: category || null,
        author: author || null,
        authorTitle: authorTitle || null,
        featuredImage: featuredImage || null,
        buyingGuideTemplateId: buyingGuideTemplateId || null,
        isPublished,
      };

      let res: Response;
      if (isEdit && article?.id) {
        res = await fetch(`/api/admin/guides/${article.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/guides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      router.push("/admin/guides");
    } catch (err: any) {
      setError(err.message || "Failed to save guide");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Title & Slug */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Basic Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!isEdit) setSlug(autoSlug(e.target.value));
              }}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="e.g., How to Choose Your First Sailboat"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug *
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="auto-generated-from-title"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Excerpt
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Brief summary for listing pages and SEO..."
          />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Content (Markdown)</h2>
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="text-sm text-blue-600 hover:underline"
          >
            {preview ? "Edit" : "Preview"}
          </button>
        </div>
        {preview ? (
          <div
            className="prose prose-sm max-w-none p-4 border border-gray-200 rounded-md min-h-[300px] bg-gray-50"
            dangerouslySetInnerHTML={{
              __html: contentMarkdown
                .replace(/^### (.+)$/gm, "<h3>$1</h3>")
                .replace(/^## (.+)$/gm, "<h2>$1</h2>")
                .replace(/^# (.+)$/gm, "<h1>$1</h1>")
                .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.+?)\*/g, "<em>$1</em>")
                .replace(/^- (.+)$/gm, "<li>$1</li>")
                .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
                .replace(/\n\n/g, "</p><p>")
                .replace(/^(?!<[hulo])/gm, "<p>")
            }}
          />
        ) : (
          <textarea
            value={contentMarkdown}
            onChange={(e) => setContentMarkdown(e.target.value)}
            rows={20}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
            placeholder="# My Guide Title&#10;&#10;Write your content in Markdown...&#10;&#10;## Section&#10;&#10;Content here..."
          />
        )}
        <div className="text-xs text-gray-500">
          {contentMarkdown.split(/\s+/).filter(Boolean).length} words · ~{Math.max(1, Math.ceil(contentMarkdown.split(/\s+/).filter(Boolean).length / 200))} min read
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Metadata</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="e.g., buying-guide, cruising, maintenance"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buying Guide Template ID
            </label>
            <input
              type="text"
              value={buyingGuideTemplateId}
              onChange={(e) => setBuyingGuideTemplateId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="e.g., 40ft-cruiser"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Author
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Author name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Author Title
            </label>
            <input
              type="text"
              value={authorTitle}
              onChange={(e) => setAuthorTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="e.g., Senior Editor, Marine Expert"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Featured Image URL
          </label>
          <input
            type="url"
            value={featuredImage}
            onChange={(e) => setFeaturedImage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="https://..."
          />
        </div>
      </div>

      {/* SEO Preview */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">SEO Preview</h2>
        <div className="border border-gray-200 rounded-md p-4 bg-white">
          <div className="text-blue-700 text-lg font-medium truncate">
            {title || "Guide Title"}
          </div>
          <div className="text-green-700 text-sm truncate">
            info.sailboats.fr/guides/{slug || "slug"}
          </div>
          <div className="text-gray-600 text-sm mt-1 line-clamp-2">
            {excerpt || "No excerpt set — add a brief summary for better SEO"}
          </div>
        </div>
      </div>

      {/* Publish & Save */}
      <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">
              {isPublished ? "Published" : "Draft"}
            </span>
            <p className="text-xs text-gray-500">
              {isPublished
                ? "This guide will be visible to the public"
                : "Only visible to admins"}
            </p>
          </div>
        </label>
        <div className="flex gap-3">
          <a
            href="/admin/guides"
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
          >
            Cancel
          </a>
          <button
            type="submit"
            disabled={saving || !title || !slug}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {saving ? "Saving..." : isEdit ? "Update Guide" : "Create Guide"}
          </button>
        </div>
      </div>
    </form>
  );
}
