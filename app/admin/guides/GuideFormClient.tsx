"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface RelatedYacht {
  id: number;
  slug?: string;
  modelName?: string;
  year?: number;
  manufacturerName?: string;
  label?: string;
  lengthOverall?: string | null;
  rigType?: string | null;
}

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
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  canonicalUrl?: string | null;
  noindex?: boolean;
  relatedYachts?: RelatedYacht[];
  relatedYachtIds?: number[];
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

  // SEO fields
  const [metaTitle, setMetaTitle] = useState(article?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(article?.metaDescription || "");
  const [ogImage, setOgImage] = useState(article?.ogImage || "");
  const [canonicalUrl, setCanonicalUrl] = useState(article?.canonicalUrl || "");
  const [noindex, setNoindex] = useState(article?.noindex ?? false);

  // Related yachts
  const [relatedYachts, setRelatedYachts] = useState<RelatedYacht[]>(article?.relatedYachts || []);
  const [yachtSearch, setYachtSearch] = useState("");
  const [yachtSearchResults, setYachtSearchResults] = useState<RelatedYacht[]>([]);
  const [yachtSearching, setYachtSearching] = useState(false);

  // Image upload
  const [uploading, setUploading] = useState(false);

  const autoSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const searchYachts = useCallback(async (query: string) => {
    if (query.length < 2) {
      setYachtSearchResults([]);
      return;
    }
    setYachtSearching(true);
    try {
      const res = await fetch(`/api/admin/guides/yacht-search?q=${encodeURIComponent(query)}&limit=8`);
      if (res.ok) {
        const data = await res.json();
        setYachtSearchResults(data.yachts || []);
      }
    } catch {
      // ignore
    } finally {
      setYachtSearching(false);
    }
  }, []);

  const addRelatedYacht = (yacht: RelatedYacht) => {
    if (relatedYachts.some((y) => y.id === yacht.id)) return;
    setRelatedYachts([...relatedYachts, yacht]);
    setYachtSearch("");
    setYachtSearchResults([]);
  };

  const removeRelatedYacht = (id: number) => {
    setRelatedYachts(relatedYachts.filter((y) => y.id !== id));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/guides/upload-image", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }
      const data = await res.json();
      setFeaturedImage(data.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
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
        content: contentMarkdown,
        contentMarkdown,
        category: category || null,
        author: author || null,
        authorTitle: authorTitle || null,
        featuredImage: featuredImage || null,
        buyingGuideTemplateId: buyingGuideTemplateId || null,
        isPublished,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        ogImage: ogImage || featuredImage || null,
        canonicalUrl: canonicalUrl || null,
        noindex,
        relatedYachtIds: relatedYachts.map((y) => y.id),
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

  const wordCount = contentMarkdown.split(/\s+/).filter(Boolean).length;

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
          <div className="text-xs text-gray-400 mt-1">{excerpt.length}/1000 characters</div>
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
          {wordCount} words · ~{Math.max(1, Math.ceil(wordCount / 200))} min read
        </div>
      </div>

      {/* Featured Image with Upload */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Featured Image</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Image
            </label>
            <div className="flex items-center gap-3">
              <label className={`px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-sm cursor-pointer hover:bg-blue-100 transition ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                {uploading ? "Uploading..." : "Choose File"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <span className="text-xs text-gray-400">Max 5MB · JPG, PNG, WebP, GIF</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Or paste URL
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
        {featuredImage && (
          <div className="relative w-full max-w-md h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            <Image
              src={featuredImage}
              alt="Featured image preview"
              fill
              className="object-cover"
              unoptimized={featuredImage.startsWith("/uploads/")}
            />
          </div>
        )}
      </div>

      {/* Related Yachts */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Related Yachts</h2>
        <p className="text-sm text-gray-500">Link yachts that are mentioned or relevant to this guide.</p>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={yachtSearch}
            onChange={(e) => {
              setYachtSearch(e.target.value);
              searchYachts(e.target.value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Search yachts by name or manufacturer..."
          />
          {yachtSearching && (
            <div className="absolute right-3 top-2.5 text-gray-400 text-sm">Searching...</div>
          )}
          {yachtSearchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {yachtSearchResults.map((yacht) => (
                <button
                  key={yacht.id}
                  type="button"
                  onClick={() => addRelatedYacht(yacht)}
                  className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0"
                >
                  <span className="font-medium">{yacht.manufacturerName} {yacht.modelName}</span>
                  <span className="text-gray-400 ml-2">({yacht.year})</span>
                  {yacht.lengthOverall && (
                    <span className="text-gray-400 ml-2">{yacht.lengthOverall}m</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Yachts */}
        {relatedYachts.length > 0 && (
          <div className="space-y-2">
            {relatedYachts.map((yacht, idx) => (
              <div
                key={yacht.id}
                className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-mono">#{idx + 1}</span>
                  <span className="text-sm font-medium text-gray-800">
                    {yacht.manufacturerName || ""} {yacht.modelName || yacht.label || `Yacht #${yacht.id}`}
                  </span>
                  {yacht.year && (
                    <span className="text-xs text-gray-400">({yacht.year})</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeRelatedYacht(yacht.id)}
                  className="text-red-400 hover:text-red-600 text-sm px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        {relatedYachts.length === 0 && (
          <p className="text-sm text-gray-400 italic">No yachts linked yet. Search above to add related yachts.</p>
        )}
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
      </div>

      {/* SEO Fields */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">SEO Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Title
            </label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Override title for search engines (leave empty to use article title)"
            />
            <div className="text-xs mt-1 flex justify-between">
              <span className="text-gray-400">{metaTitle.length} characters</span>
              <span className={metaTitle.length > 60 ? "text-amber-500" : "text-gray-400"}>Recommended: ≤ 60</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Description
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Custom description for search engines (leave empty to use excerpt)"
            />
            <div className="text-xs mt-1 flex justify-between">
              <span className="text-gray-400">{metaDescription.length} characters</span>
              <span className={metaDescription.length > 160 ? "text-amber-500" : "text-gray-400"}>Recommended: ≤ 160</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OG Image URL
              </label>
              <input
                type="url"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Override image for social sharing (defaults to featured image)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Canonical URL
              </label>
              <input
                type="url"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="https://... (for cross-posted content)"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={noindex}
              onChange={(e) => setNoindex(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">
              Hide from search engines (noindex)
            </span>
          </label>
        </div>

        {/* SEO Preview */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Google Preview</h3>
          <div className="border border-gray-200 rounded-md p-4 bg-white">
            <div className="text-blue-700 text-lg font-medium truncate">
              {metaTitle || title || "Guide Title"} — Sailing Yacht Info
            </div>
            <div className="text-green-700 text-sm truncate">
              info.sailboats.fr/guides/{slug || "slug"}
            </div>
            <div className="text-gray-600 text-sm mt-1 line-clamp-2">
              {metaDescription || excerpt || "No description set — add a meta description or excerpt for better SEO"}
            </div>
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
