"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Yacht {
  id: number;
  modelName: string;
  slug: string;
  year: number;
  manufacturer: string;
  manufacturerSlug: string | null;
  lengthOverall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  cabins: number | null;
  berths: number | null;
  hullMaterial: string | null;
  rigType: string | null;
  keelType: string | null;
  primaryImageUrl: string | null;
}

interface BuyingGuideYachtListProps {
  templateId: string;
  title?: string;
  description?: string;
  showAllLink?: boolean;
}

export default function BuyingGuideYachtList({
  templateId,
  title,
  description,
  showAllLink = true,
}: BuyingGuideYachtListProps) {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchYachts() {
      try {
        setLoading(true);
        const response = await fetch(`/api/buying-guides/${templateId}/yachts`);
        if (!response.ok) {
          throw new Error("Failed to fetch yachts");
        }
        const data = await response.json();
        setYachts(data.yachts || []);
        setTotal(data.total || 0);
      } catch (err: any) {
        setError(err.message || "Failed to load yachts");
      } finally {
        setLoading(false);
      }
    }

    fetchYachts();
  }, [templateId]);

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-300 rounded w-1/3 mx-auto"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-6 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (yachts.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-4xl mb-4">⚓</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No matching yachts found
        </h3>
        <p className="text-gray-600">
          We couldn't find any yachts matching these criteria. Try browsing our
          full catalog or adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <section className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      {(title || description) && (
        <div className="p-6 border-b border-gray-200">
          {title && (
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          )}
          {description && (
            <p className="text-gray-600 text-sm">{description}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Showing {yachts.length} of {total} matching yachts
          </p>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {yachts.map((yacht) => (
          <Link
            key={yacht.id}
            href={`/yachts/${yacht.slug}`}
            className="block hover:bg-blue-50 transition p-6"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              {yacht.primaryImageUrl && (
                <div className="w-full sm:w-32 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={yacht.primaryImageUrl}
                    alt={`${yacht.manufacturer} ${yacht.modelName}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-grow min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className="text-lg font-semibold text-gray-900 truncate">
                    {yacht.manufacturer} {yacht.modelName}
                  </h4>
                  {yacht.year && (
                    <span className="text-sm text-gray-500">{yacht.year}</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  {yacht.lengthOverall && (
                    <span className="flex items-center gap-1">
                      <span className="text-gray-400">📏</span>
                      {yacht.lengthOverall.toFixed(1)} ft
                    </span>
                  )}
                  {yacht.beam && (
                    <span className="flex items-center gap-1">
                      <span className="text-gray-400">↔️</span>
                      {yacht.beam.toFixed(1)} ft beam
                    </span>
                  )}
                  {yacht.cabins && (
                    <span className="flex items-center gap-1">
                      <span className="text-gray-400">🛏️</span>
                      {yacht.cabins} cabin{yacht.cabins > 1 ? "s" : ""}
                    </span>
                  )}
                  {yacht.hullMaterial && (
                    <span className="flex items-center gap-1">
                      <span className="text-gray-400">🔨</span>
                      {yacht.hullMaterial}
                    </span>
                  )}
                  {yacht.rigType && (
                    <span className="flex items-center gap-1">
                      <span className="text-gray-400">⛵</span>
                      {yacht.rigType}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end">
                <span className="text-blue-600 font-medium text-sm whitespace-nowrap">
                  View Details →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {showAllLink && total > yachts.length && (
        <div className="p-4 bg-white border-t border-gray-200 text-center">
          <Link
            href={`/yachts`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Browse all {total} matching yachts →
          </Link>
        </div>
      )}
    </section>
  );
}
