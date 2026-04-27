"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface SearchResult {
  id: number;
  manufacturer: string;
  modelName: string;
  year?: number;
  slug?: string;
  lengthOverall?: number;
  beam?: number;
  draft?: number;
  displacement?: number;
  rigType?: string;
  keelType?: string;
  hullMaterial?: string;
  cabins?: number;
  description?: string;
}

interface AutocompleteSuggestion {
  id: number;
  modelName: string;
  manufacturer: string;
  slug?: string;
  year?: number;
  lengthOverall?: number;
  display: string;
}

export function SearchClient() {
  const t = useTranslations("Search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [acLoading, setAcLoading] = useState(false);

  // Save search state (P9.3)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if user is authenticated for save search feature
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setIsAuthenticated(!!data?.user?.id))
      .catch(() => {});
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced autocomplete
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setAcLoading(true);
    try {
      const res = await fetch(
        "/api/search?q=" + encodeURIComponent(q) + "&mode=autocomplete&limit=8"
      );
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
      setSelectedSuggestion(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setAcLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 200);
  };

  // Full search
  const handleSearch = useCallback(
    async (searchQuery?: string) => {
      const q = (searchQuery ?? query).trim();
      if (!q) return;
      setShowSuggestions(false);
      setLoading(true);
      setSearched(true);
      try {
        const res = await fetch(
          "/api/search?q=" + encodeURIComponent(q) + "&limit=20"
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(data.yachts || []);
        setTotal(data.total || 0);
      } catch {
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  // Save search handler (P9.3)
  const handleSaveSearch = async () => {
    if (!query.trim() || !isAuthenticated) return;
    try {
      const res = await fetch("/api/user/searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Search: " + query,
          searchParams: { query: query.trim() },
          resultCount: total,
        }),
      });
      if (res.ok) {
        setSaveMessage(t("saved"));
        setTimeout(() => setSaveMessage(null), 2000);
      } else {
        setSaveMessage(t("saveFailed"));
        setTimeout(() => setSaveMessage(null), 2000);
      }
    } catch {
      setSaveMessage(t("saveFailed"));
      setTimeout(() => setSaveMessage(null), 2000);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestion((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestion((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedSuggestion >= 0 && suggestions[selectedSuggestion]) {
        const s = suggestions[selectedSuggestion];
        if (s.slug) {
          window.location.href = "/yachts/" + s.slug;
        } else {
          setQuery(s.display);
          handleSearch(s.display);
        }
      } else {
        handleSearch();
      }
      setShowSuggestions(false);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const suggestionClick = (suggestion: AutocompleteSuggestion) => {
    if (suggestion.slug) {
      window.location.href = "/yachts/" + suggestion.slug;
    } else {
      setQuery(suggestion.display);
      handleSearch(suggestion.display);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero / Search Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t("heading")}
        </h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mb-8">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
               aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder={t("placeholder")}
              aria-label={t("heading")}
              className="w-full pl-12 pr-4 py-3 border border-border rounded-lg bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
              autoComplete="off"
            />
            {acLoading && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 overflow-hidden"
                role="listbox"
                aria-label={t("suggestions.label")}
              >
                {suggestions.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => suggestionClick(s)}
                    className={"w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors " + (i === selectedSuggestion ? "bg-gray-50" : "")}
                  >
                    <div>
                      <span className="font-medium text-foreground">
                        {s.display}
                      </span>
                      {s.year && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          ({s.year})
                        </span>
                      )}
                    </div>
                    {s.lengthOverall && (
                      <span className="text-sm text-muted-foreground">
                        {s.lengthOverall}m LOA
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors sm:w-auto w-full"
          >
            {loading ? t("searching") : t("searchButton")}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("hint")}
        </p>
      </div>

      {/* Search Results */}
      {searched && (
        <div role="region" aria-live="polite" aria-label="Search results">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {loading
                ? t("results.searching")
                : t("results.count", { total })}
              {query && (
                <span>
                  {" "}{t("results.for")} &ldquo;<span className="font-medium text-foreground">{query}</span>&rdquo;
                </span>
              )}
            </p>
            {/* Save Search button — visible when logged in and results exist */}
            {isAuthenticated && !loading && total > 0 && (
              <button
                onClick={handleSaveSearch}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                aria-label={t("saveSearch")}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {saveMessage || t("saveSearch")}
              </button>
            )}
          </div>

          {loading && (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="text-center py-12" role="status">
              <div className="text-4xl mb-4">⛵</div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {t("empty.heading")}
              </h2>
              <p className="text-muted-foreground mb-4">
                {t("empty.description")}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {["Beneteau", "Hanse", "Jeanneau", "Bavaria", "sloop"].map(
                  (term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setQuery(term);
                        handleSearch(term);
                      }}
                      className="px-3 py-1.5 bg-gray-100 text-sm rounded-full hover:bg-gray-200 transition-colors"
                    >
                      {term}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="grid gap-4">
              {results.map((yacht) => (
                <Link
                  key={yacht.id}
                  href={yacht.slug ? "/yachts/" + yacht.slug : "/yachts"}
                  className="block border border-border rounded-lg p-5 hover:border-primary/50 hover:shadow-sm transition-all bg-white"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h2 className="text-lg font-semibold text-foreground">
                          {yacht.manufacturer} {yacht.modelName}
                        </h2>
                        {yacht.year && (
                          <span className="text-sm text-muted-foreground">
                            ({yacht.year})
                          </span>
                        )}
                      </div>
                      {yacht.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {yacht.description.slice(0, 200)}
                          {yacht.description.length > 200 ? "..." : ""}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {yacht.rigType && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                            {yacht.rigType}
                          </span>
                        )}
                        {yacht.keelType && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                            {yacht.keelType}
                          </span>
                        )}
                        {yacht.hullMaterial && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
                            {yacht.hullMaterial}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 grid grid-cols-3 gap-3 text-center">
                      {yacht.lengthOverall && (
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {yacht.lengthOverall}m
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t("results.loa")}
                          </div>
                        </div>
                      )}
                      {yacht.beam && (
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {yacht.beam}m
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t("results.beam")}
                          </div>
                        </div>
                      )}
                      {yacht.draft && (
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {yacht.draft}m
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t("results.draft")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Popular Searches (shown before first search) */}
      {!searched && (
        <div className="mt-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            {t("popular")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              "Beneteau",
              "Jeanneau",
              "Hanse",
              "Bavaria Yachts",
              "Hallberg-Rassy",
              "sloop",
              "cutter",
              "GRP",
            ].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setQuery(term);
                  handleSearch(term);
                }}
                className="px-4 py-2 bg-gray-100 text-sm rounded-full hover:bg-gray-200 transition-colors text-foreground"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
