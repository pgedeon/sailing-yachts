"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

interface SearchResult {
  id: number;
  modelName: string;
  manufacturer: string;
  year: number | null;
  lengthOverall: number | null;
  slug: string | null;
}

type LayoutMode = "full" | "compact";
type ThemeMode = "light" | "dark" | "auto";

const MAX_YACHTS = 4;

export default function EmbedConfiguratorClient({ siteUrl }: { siteUrl: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedYachts, setSelectedYachts] = useState<SearchResult[]>([]);
  const [layout, setLayout] = useState<LayoutMode>("compact");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [isSearching, setIsSearching] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [embedFormat, setEmbedFormat] = useState<"iframe" | "js">("iframe");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search yachts with debounce using the /api/search autocomplete endpoint
  const searchYachts = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `${siteUrl}/api/search?q=${encodeURIComponent(query)}&mode=autocomplete&limit=10`
      );
      if (res.ok) {
        const data = await res.json();
        const suggestions = data.suggestions || [];
        // Filter out already selected
        const selectedIds = new Set(selectedYachts.map((y) => y.id));
        setSearchResults(
          suggestions.filter((y: SearchResult) => !selectedIds.has(y.id))
        );
      }
    } catch {
      // ignore
    } finally {
      setIsSearching(false);
    }
  }, [siteUrl, selectedYachts]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchYachts(searchQuery), 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, searchYachts]);

  const addYacht = (yacht: SearchResult) => {
    if (selectedYachts.length >= MAX_YACHTS) return;
    setSelectedYachts((prev) => [...prev, yacht]);
    setSearchResults((prev) => prev.filter((y) => y.id !== yacht.id));
    setSearchQuery("");
  };

  const removeYacht = (id: number) => {
    setSelectedYachts((prev) => prev.filter((y) => y.id !== id));
  };

  const embedUrl = selectedYachts.length >= 2
    ? `${siteUrl}/embed/compare?ids=${selectedYachts.map((y) => y.id).join(",")}&layout=${layout}&theme=${theme}`
    : "";

  const iframeCode = embedUrl
    ? `<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="${layout === "compact" ? "400" : "600"}"\n  frameBorder="0"\n  style="border: 1px solid #e5e7eb; border-radius: 8px; max-width: 900px;"\n  title="Yacht Comparison Widget"\n  loading="lazy"\n></iframe>`
    : "";

  const jsCode = embedUrl
    ? `<!-- Sailing Yacht Comparison Widget -->\n<div id="sailing-yachts-widget"></div>\n<script>\n(function() {\n  var iframe = document.createElement('iframe');\n  iframe.src = '${embedUrl}';\n  iframe.width = '100%';\n  iframe.style.border = '1px solid #e5e7eb';\n  iframe.style.borderRadius = '8px';\n  iframe.style.maxWidth = '900px';\n  iframe.frameBorder = '0';\n  iframe.title = 'Yacht Comparison Widget';\n  iframe.loading = 'lazy';\n\n  // Auto-resize based on content height\n  window.addEventListener('message', function(e) {\n    if (e.data && e.data.type === 'sailing-yachts-embed' && e.data.height) {\n      iframe.height = e.data.height + 'px';\n    }\n  });\n\n  document.getElementById('sailing-yachts-widget').appendChild(iframe);\n})();\n</script>`
    : "";

  const embedCode = embedFormat === "iframe" ? iframeCode : jsCode;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">⛵</span>
            <h1 className="text-2xl font-bold text-gray-900">Embed Comparison Widget</h1>
          </div>
          <p className="text-gray-600 text-sm">
            Create a customizable yacht comparison widget for your website, blog, or forum. Select yachts, choose a layout, and copy the embed code.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Step 1: Select Yachts */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mr-2">
              1
            </span>
            Select Yachts ({selectedYachts.length}/{MAX_YACHTS})
          </h2>
          <p className="text-sm text-gray-500 mb-4">Search and select 2–4 yachts to compare</p>

          {/* Selected Yachts Chips */}
          {selectedYachts.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedYachts.map((y) => (
                <div
                  key={y.id}
                  className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-sm"
                >
                  <span className="font-medium text-blue-900">{y.manufacturer}</span>
                  <span className="text-blue-700">{y.modelName}</span>
                  {y.year && <span className="text-blue-400 text-xs">({y.year})</span>}
                  <button
                    onClick={() => removeYacht(y.id)}
                    className="text-blue-400 hover:text-blue-600 transition-colors"
                    aria-label={`Remove ${y.modelName}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search Input */}
          {selectedYachts.length < MAX_YACHTS && (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by model or manufacturer name..."
                className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              {isSearching && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
              )}

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((y) => (
                    <button
                      key={y.id}
                      onClick={() => addYacht(y)}
                      className="w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors text-sm border-b last:border-0"
                    >
                      <span className="font-medium">{y.manufacturer}</span>{" "}
                      <span className="text-gray-700">{y.modelName}</span>
                      {y.year && <span className="text-gray-400 ml-1">({y.year})</span>}
                      {y.lengthOverall && (
                        <span className="text-gray-400 ml-2 text-xs">{Number(y.lengthOverall).toFixed(1)}m</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Step 2: Customize */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mr-2">
              2
            </span>
            Customize Widget
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Layout */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Layout</label>
              <div className="flex gap-3">
                {(["compact", "full"] as LayoutMode[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLayout(l)}
                    className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      layout === l
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {l === "compact" ? "📐 Compact" : "📊 Full"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {layout === "compact"
                  ? "Key specs only, ~400px height. Best for sidebars and small spaces."
                  : "All specs with extra details, ~600px height. Best for dedicated sections."}
              </p>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color Theme</label>
              <div className="flex gap-2">
                {(["light", "dark", "auto"] as ThemeMode[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex-1 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      theme === t
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {t === "light" ? "☀️ Light" : t === "dark" ? "🌙 Dark" : "🔄 Auto"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {theme === "auto"
                  ? "Adapts to the visitor's system preference."
                  : `Fixed ${theme} color scheme.`}
              </p>
            </div>
          </div>
        </section>

        {/* Step 3: Preview */}
        {selectedYachts.length >= 2 && (
          <section className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mr-2">
                3
              </span>
              Preview
            </h2>
            <div className="border rounded-lg overflow-hidden bg-white">
              <iframe
                src={embedUrl}
                width="100%"
                height={layout === "compact" ? "400" : "600"}
                frameBorder="0"
                style={{ maxWidth: 900, display: "block" }}
                title="Widget Preview"
              />
            </div>
          </section>
        )}

        {/* Step 4: Embed Code */}
        {selectedYachts.length >= 2 && (
          <section className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mr-2">
                4
              </span>
              Get Embed Code
            </h2>

            {/* Format Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setEmbedFormat("iframe")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  embedFormat === "iframe"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                &lt;iframe&gt;
              </button>
              <button
                onClick={() => setEmbedFormat("js")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  embedFormat === "js"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                JavaScript (auto-resize)
              </button>
            </div>

            {/* Code Block */}
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono leading-relaxed whitespace-pre-wrap">
                {embedCode}
              </pre>
              <button
                onClick={() => copyToClipboard(embedCode, "embed")}
                className="absolute top-2 right-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-md transition-colors"
              >
                {copied === "embed" ? "✓ Copied!" : "Copy"}
              </button>
            </div>

            {/* Direct Link */}
            <div className="mt-4 pt-4 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-1">Direct link to widget</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={embedUrl}
                  className="flex-1 px-3 py-2 border rounded-lg text-xs text-gray-600 bg-gray-50"
                />
                <button
                  onClick={() => copyToClipboard(embedUrl, "url")}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors"
                >
                  {copied === "url" ? "✓ Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Usage note */}
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <strong>💡 Tip:</strong> The JavaScript embed auto-resizes the iframe height based on content.
              The iframe version uses a fixed height. For responsive layouts, set the container width to 100%.
            </div>
          </section>
        )}

        {/* Need more yachts prompt */}
        {selectedYachts.length < 2 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Select at least 2 yachts to generate the embed code</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t mt-8">
        <div className="max-w-4xl mx-auto px-6 py-4 text-center text-xs text-gray-400">
          <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">
            Sailing Yacht Info
          </a>{" "}
          · Embed widgets are free to use with attribution
        </div>
      </div>
    </div>
  );
}
