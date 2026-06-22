"use client";

import { useLocale } from "next-intl";
import { useState, useEffect } from "react";
import Link from "next/link";
import YachtImage from "@/app/components/yacht/YachtImage";
import { localePath } from "@/lib/i18n-paths";

interface RecommendedYacht {
  id: number;
  manufacturer: string | null;
  modelName: string;
  slug: string | null;
  year: number;
  lengthOverall: string | null;
  beam: string | null;
  displacement: string | null;
  rigType: string | null;
  score?: number;
  primaryImage: string | null;
  reason: string;
  createdAt?: string | null;
}

interface Recommendations {
  similarToFavorites: RecommendedYacht[];
  newSinceVisit: RecommendedYacht[];
  favoritesCount: number;
}

/**
 * Personalized recommendations component shown on the homepage for logged-in users.
 * Falls back to nothing for guest users.
 */
export function PersonalizedRecommendations() {
  const locale = useLocale();
  const [data, setData] = useState<Recommendations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/recommendations")
      .then((r) => {
        if (r.status === 401) return null;
        return r.json();
      })
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch(() => {
        setData(null);
        setLoading(false);
      });
  }, []);

  // Don't render anything while loading or for guests
  if (loading) return null;
  if (!data || data.favoritesCount === 0) return null;

  const hasSimilar = data.similarToFavorites.length > 0;
  const hasNew = data.newSinceVisit.length > 0;

  if (!hasSimilar && !hasNew) return null;

  return (
    <section
      className="py-16 px-4 bg-linear-to-b from-blue-50 to-white"
      data-testid="personalized-recommendations"
    >
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Recommended for You
          </h2>
          <p className="text-gray-600 mt-1">
            Based on your {data.favoritesCount} saved favorite{data.favoritesCount !== 1 ? "s" : ""}
          </p>
        </div>

        {hasSimilar && (
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Similar to Your Favorites
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.similarToFavorites.slice(0, 3).map((yacht) => (
                <YachtRecommendationCard key={yacht.id} yacht={yacht} />
              ))}
            </div>
          </div>
        )}

        {hasNew && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Recently Added
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.newSinceVisit.slice(0, 3).map((yacht) => (
                <YachtRecommendationCard key={yacht.id} yacht={yacht} variant="new" />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function YachtRecommendationCard({
  yacht,
  variant = "similar",
}: {
  yacht: RecommendedYacht;
  variant?: "similar" | "new";
}) {
  const locale = useLocale();
  const formatNum = (val: string | null, decimals = 1) => {
    if (!val) return null;
    const n = parseFloat(val);
    return isNaN(n) ? null : n.toFixed(decimals);
  };

  return (
    <Link
      href={localePath(locale, `/yachts/${yacht.slug}`)}
      className="group block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-blue-200 transition"
      data-testid="recommendation-card"
    >
      {yacht.primaryImage ? (
        <div className="h-36 bg-gray-100 overflow-hidden">
          <YachtImage
            src={yacht.primaryImage}
            alt={`${yacht.manufacturer} ${yacht.modelName}`}
            fill
            className="w-full h-full group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="h-36 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          No image
        </div>
      )}

      <div className="p-4">
        <h4 className="font-semibold text-sm sm:text-base group-hover:text-blue-600 transition-colors">
          {yacht.manufacturer} {yacht.modelName}
        </h4>

        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
          {yacht.year && <span className="bg-gray-100 px-2 py-0.5 rounded">{yacht.year}</span>}
          {formatNum(yacht.lengthOverall) && (
            <span className="bg-gray-100 px-2 py-0.5 rounded">
              LOA {formatNum(yacht.lengthOverall)}m
            </span>
          )}
        </div>

        {variant === "similar" && yacht.score != null && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${Math.round(yacht.score * 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {Math.round(yacht.score * 100)}% match
            </span>
          </div>
        )}

        {variant === "similar" && yacht.reason && (
          <p className="mt-1.5 text-xs text-gray-400 italic">{yacht.reason}</p>
        )}

        {variant === "new" && (
          <span className="mt-2 inline-block text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded">
            New
          </span>
        )}
      </div>
    </Link>
  );
}
