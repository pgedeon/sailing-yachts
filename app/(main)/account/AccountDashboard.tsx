"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AlertPreferences from "@/components/AlertPreferences";
import PushNotificationSettings from "@/components/PushNotificationSettings";
import PrivacySettings from "@/components/PrivacySettings";

// Types
interface FavoriteItem {
  id: number;
  yachtModelId: number;
  slug: string;
  modelName: string;
  manufacturerName: string;
  year: number;
  lengthOverall: string | null;
  rigType: string | null;
  createdAt: string;
}

interface SavedSearch {
  id: number;
  name: string;
  searchParams: Record<string, unknown>;
  resultCount: number | null;
  createdAt: string;
}

interface SavedComparison {
  id: number;
  name: string;
  yachtIds: number[];
  createdAt: string;
}

type Tab = "favorites" | "searches" | "comparisons" | "alerts" | "push" | "privacy";

export default function AccountDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("favorites");
  const [session, setSession] = useState<{ user: { id: string; name?: string | null; email?: string | null } } | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Check auth
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.id) {
          setSession(data);
        }
        setLoadingAuth(false);
      })
      .catch(() => setLoadingAuth(false));
  }, []);

  if (loadingAuth) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-100 rounded-lg w-1/3" />
          <div className="h-20 bg-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="text-5xl mb-4">🔐</div>
        <h1 className="text-2xl font-bold mb-2">Sign in Required</h1>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Please sign in to access your account dashboard, manage favorites, saved searches, and alert preferences.
        </p>
        <Link
          href="/auth/signin"
          className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Sign In or Create Account
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">My Account</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {session.user.email || session.user.name || "Manage your preferences"}
        </p>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0 overflow-x-auto" aria-label="Account sections">
          {([
            { id: "favorites" as Tab, label: "Favorites", icon: "❤️" },
            { id: "searches" as Tab, label: "Saved Searches", icon: "🔍" },
            { id: "comparisons" as Tab, label: "Comparisons", icon: "⚖️" },
            { id: "alerts" as Tab, label: "Alerts", icon: "🔔" },
            { id: "push" as Tab, label: "Push Notifications", icon: "📱" },
            { id: "privacy" as Tab, label: "Privacy", icon: "🔒" },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "favorites" && <FavoritesTab />}
      {activeTab === "searches" && <SearchesTab />}
      {activeTab === "comparisons" && <ComparisonsTab />}
      {activeTab === "alerts" && <AlertsTab />}
      {activeTab === "push" && <PushNotificationSettings />}
      {activeTab === "privacy" && <PrivacySettings />}

      {/* Personalized Recommendations (P9.6) */}
      <DashboardRecommendations />
    </div>
  );
}

// === Favorites Tab ===
function FavoritesTab() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/user/favorites");
      if (res.status === 401) { setFavorites([]); return; }
      const data = await res.json();
      setFavorites(data.favorites || []);
    } catch { setFavorites([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function removeFavorite(yachtModelId: number) {
    try {
      const res = await fetch(`/api/user/favorites?yachtModelId=${yachtModelId}`, { method: "DELETE" });
      if (res.ok) {
        setFavorites((prev) => prev.filter((f) => f.yachtModelId !== yachtModelId));
      }
    } catch { /* ignore */ }
  }

  if (loading) return <LoadingSkeleton />;

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon="❤️"
        title="No favorites yet"
        description="Browse yachts and save your favorites for quick access."
        actionLabel="Browse Yachts"
        actionHref="/yachts"
      />
    );
  }

  const compareUrl = favorites.length >= 2
    ? `/compare?ids=${favorites.map((f) => f.yachtModelId).join(",")}`
    : null;

  return (
    <div>
      {compareUrl && (
        <div className="mb-4">
          <Link href={compareUrl} className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
            Compare All ({favorites.length})
          </Link>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map((fav) => (
          <div key={fav.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <Link href={`/yachts/${fav.slug}`} className="font-bold text-lg leading-tight hover:text-blue-600 transition-colors">
                {fav.manufacturerName} {fav.modelName}
              </Link>
              <button
                onClick={() => removeFavorite(fav.yachtModelId)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex-shrink-0"
                title="Remove"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600">{fav.year}</p>
            {fav.lengthOverall && (
              <p className="text-sm text-gray-500 mt-1">{fav.lengthOverall}m {fav.rigType || ""}</p>
            )}
            <Link href={`/yachts/${fav.slug}`} className="mt-2 inline-block text-blue-600 hover:underline text-sm">
              View Details →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// === Searches Tab ===
function SearchesTab() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/user/searches");
      if (res.status === 401) { setSearches([]); return; }
      const data = await res.json();
      setSearches(data.searches || []);
    } catch { setSearches([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteSearch(id: number) {
    try {
      const res = await fetch(`/api/user/searches?id=${id}`, { method: "DELETE" });
      if (res.ok) setSearches((prev) => prev.filter((s) => s.id !== id));
    } catch { /* ignore */ }
  }

  function buildSearchUrl(params: Record<string, unknown>): string {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== "") qs.set(k, String(v));
    }
    return `/search?${qs.toString()}`;
  }

  if (loading) return <LoadingSkeleton />;

  if (searches.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title="No saved searches"
        description="Use the search page to find yachts and save your filter combinations."
        actionLabel="Search Yachts"
        actionHref="/search"
      />
    );
  }

  return (
    <div className="space-y-3">
      {searches.map((search) => (
        <div key={search.id} className="border rounded-lg p-4 bg-white shadow-sm flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{search.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {search.resultCount != null ? `${search.resultCount} results` : "Results vary"} · Saved {new Date(search.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={buildSearchUrl(search.searchParams)}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Run Search
            </Link>
            <button
              onClick={() => deleteSearch(search.id)}
              className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// === Comparisons Tab ===
function ComparisonsTab() {
  const [comparisons, setComparisons] = useState<SavedComparison[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/user/comparisons");
      if (res.status === 401) { setComparisons([]); return; }
      const data = await res.json();
      setComparisons(data.comparisons || []);
    } catch { setComparisons([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteComparison(id: number) {
    try {
      const res = await fetch(`/api/user/comparisons?id=${id}`, { method: "DELETE" });
      if (res.ok) setComparisons((prev) => prev.filter((c) => c.id !== id));
    } catch { /* ignore */ }
  }

  if (loading) return <LoadingSkeleton />;

  if (comparisons.length === 0) {
    return (
      <EmptyState
        icon="⚖️"
        title="No saved comparisons"
        description="Compare yachts side by side and save your comparisons for later."
        actionLabel="Compare Yachts"
        actionHref="/compare"
      />
    );
  }

  return (
    <div className="space-y-3">
      {comparisons.map((comp) => (
        <div key={comp.id} className="border rounded-lg p-4 bg-white shadow-sm flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{comp.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {comp.yachtIds.length} yachts · Saved {new Date(comp.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/compare?ids=${comp.yachtIds.join(",")}`}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              View
            </Link>
            <button
              onClick={() => deleteComparison(comp.id)}
              className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// === Alerts Tab ===
function AlertsTab() {
  return (
    <div>
      <AlertPreferences />
    </div>
  );
}

// === Shared components ===
function EmptyState({ icon, title, description, actionLabel, actionHref }: {
  icon: string; title: string; description: string; actionLabel: string; actionHref: string;
}) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">{icon}</div>
      <h2 className="text-lg font-semibold mb-1">{title}</h2>
      <p className="text-muted-foreground mb-4 max-w-md mx-auto text-sm">{description}</p>
      <Link href={actionHref} className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
        {actionLabel}
      </Link>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-gray-100 rounded-lg" />
      ))}
    </div>
  );
}

// === Dashboard Recommendations (P9.6) ===
interface RecommendationItem {
  id: number;
  manufacturer: string | null;
  modelName: string;
  slug: string | null;
  year: number;
  lengthOverall: string | null;
  rigType: string | null;
  score?: number;
  primaryImage: string | null;
  reason: string;
}

interface CompareAgainItem {
  id: number;
  name: string;
  yachtIds: number[];
  createdAt: string;
}

function DashboardRecommendations() {
  const [similar, setSimilar] = useState<RecommendationItem[]>([]);
  const [compareAgain, setCompareAgain] = useState<CompareAgainItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/recommendations")
      .then((r) => {
        if (r.status === 401) return null;
        return r.json();
      })
      .then((data) => {
        if (data) {
          setSimilar(data.similarToFavorites || []);
          setCompareAgain(data.compareAgain || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (similar.length === 0 && compareAgain.length === 0) return null;

  return (
    <div className="mt-10 border-t border-gray-200 pt-8" data-testid="dashboard-recommendations">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Recommended for You</h2>

      {similar.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
            Yachts You Might Like
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {similar.slice(0, 3).map((yacht) => (
              <Link
                key={yacht.id}
                href={yacht.slug ? `/yachts/${yacht.slug}` : "#"}
                className="block border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition"
                data-testid="dashboard-rec-card"
              >
                <div className="font-medium text-sm text-gray-900">
                  {yacht.manufacturer} {yacht.modelName}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {yacht.year} {yacht.lengthOverall ? `· LOA ${parseFloat(yacht.lengthOverall).toFixed(1)}m` : ""}
                </div>
                {yacht.reason && (
                  <div className="text-xs text-blue-600 mt-1.5">{yacht.reason}</div>
                )}
                {yacht.score != null && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${Math.round(yacht.score * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{Math.round(yacht.score * 100)}%</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {compareAgain.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
            Compare Again
          </h3>
          <div className="space-y-2">
            {compareAgain.slice(0, 3).map((comp) => (
              <Link
                key={comp.id}
                href={`/compare?ids=${comp.yachtIds.join(",")}`}
                className="flex items-center justify-between border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition"
                data-testid="dashboard-compare-again"
              >
                <div>
                  <div className="font-medium text-sm text-gray-900">
                    {comp.name || `Comparison #${comp.id}`}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {comp.yachtIds.length} yachts · Saved {new Date(comp.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span className="text-sm text-blue-600 font-medium">View →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
