"use client";

import { useLocale } from "next-intl";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useFavorites } from "@/lib/useFavorites";
import { localePath } from "@/lib/i18n-paths";

interface YachtSummary {
  id: number;
  manufacturer: string;
  modelName: string;
  year: number | null;
  slug: string;
  lengthOverall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  rigType: string | null;
}

export default function FavoritesClient() {
  const locale = useLocale();
  const { favorites, toggleFavorite, clearAll, count } = useFavorites();
  const [yachts, setYachts] = useState<YachtSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Fetch yacht details for all favorite slugs
  useEffect(() => {
    if (favorites.length === 0) {
      setYachts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch all yachts and filter client-side by slug
    // (We use the paginated API and fetch enough to cover favorites)
    const fetchFavorites = async () => {
      try {
        // Fetch yachts by slug — use individual fetches for each favorite
        const results = await Promise.all(
          favorites.map(async (slug) => {
            try {
              const res = await fetch(`/api/yachts/${slug}`, { cache: "no-store" });
              if (!res.ok) return null;
              const data = await res.json();
              return {
                id: data.id,
                manufacturer: data.manufacturer,
                modelName: data.modelName,
                year: data.year ?? null,
                slug: data.slug,
                lengthOverall: data.lengthOverall ?? null,
                beam: data.beam ?? null,
                draft: data.draft ?? null,
                displacement: data.displacement ?? null,
                rigType: data.rigType ?? null,
              } as YachtSummary;
            } catch {
              return null;
            }
          }),
        );
        setYachts(results.filter((y): y is YachtSummary => y !== null));
      } catch {
        setYachts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [favorites]);

  const fmt = (v: number | null | undefined) =>
    v != null ? v.toLocaleString() : "—";

  const compareUrl =
    yachts.length >= 2
      ? `/compare?ids=${yachts.map((y) => y.id).join(",")}`
      : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My Favorites</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {count === 0
              ? "No saved yachts yet"
              : `${count} yacht${count !== 1 ? "s" : ""} saved`}
          </p>
        </div>
        {count > 0 && (
          <div className="flex items-center gap-3">
            {showConfirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Clear all?</span>
                <button
                  onClick={() => {
                    clearAll();
                    setShowConfirmClear(false);
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Yes, clear
                </button>
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading favorites...
        </div>
      ) : count === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">⛵</div>
          <h2 className="text-lg font-semibold mb-2">No favorites yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Browse yachts and tap the heart icon to save your favorites for
            quick access.
          </p>
          <Link
            href={localePath(locale, "/yachts")}
            className="inline-flex items-center px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Browse Yachts
          </Link>
        </div>
      ) : (
        <>
          {/* Compare button */}
          {compareUrl && (
            <div className="mb-6">
              <Link
                href={compareUrl}
                className="inline-flex items-center px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Compare All ({yachts.length})
              </Link>
            </div>
          )}

          {/* Yacht cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {yachts.map((yacht) => (
              <div
                key={yacht.id}
                className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={localePath(locale, `/yachts/${yacht.slug}`)}
                    className="font-bold text-lg leading-tight hover:text-blue-600 transition-colors"
                  >
                    {yacht.manufacturer} {yacht.modelName}
                  </Link>
                  <button
                    onClick={() => toggleFavorite(yacht.slug)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors shrink-0"
                    aria-label={`Remove ${yacht.manufacturer} ${yacht.modelName} from favorites`}
                    title="Remove from favorites"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                     aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{yacht.year ?? "—"}</p>
                <dl className="mt-3 text-sm">
                  <div className="flex justify-between py-0.5">
                    <dt className="text-gray-500">Length:</dt>
                    <dd className="font-medium">{fmt(yacht.lengthOverall)} m</dd>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <dt className="text-gray-500">Beam:</dt>
                    <dd className="font-medium">{fmt(yacht.beam)} m</dd>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <dt className="text-gray-500">Draft:</dt>
                    <dd className="font-medium">{fmt(yacht.draft)} m</dd>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <dt className="text-gray-500">Displacement:</dt>
                    <dd className="font-medium">{fmt(yacht.displacement)} kg</dd>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <dt className="text-gray-500">Rig:</dt>
                    <dd className="font-medium">{yacht.rigType ?? "—"}</dd>
                  </div>
                </dl>
                <Link
                  href={localePath(locale, `/yachts/${yacht.slug}`)}
                  className="mt-3 inline-block text-blue-600 hover:underline text-sm font-medium"
                >
                  View Details →
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
