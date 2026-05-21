"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import Link from "next/link";
import { localePath } from "@/lib/i18n-paths";

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
  const locale = useLocale();
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
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8">
        <div className="animate-pulse space-y-5">
          <div className="h-4 bg-slate-200 rounded w-1/3 mx-auto"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="w-28 h-20 bg-slate-200 rounded-xl flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50/50 rounded-2xl border border-red-200/60 p-6 text-center">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (yachts.length === 0) {
    return (
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-10 text-center">
        <div className="text-4xl mb-4">⚓</div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2 font-serif">
          No matching yachts found
        </h3>
        <p className="text-slate-500 text-sm">
          We couldn&apos;t find any yachts matching these criteria. Try browsing our
          full catalog instead.
        </p>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {(title || description) && (
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          {title && (
            <h3 className="text-lg font-bold text-slate-800 mb-1 font-serif">{title}</h3>
          )}
          {description && (
            <p className="text-slate-500 text-sm">{description}</p>
          )}
          <p className="text-xs text-slate-400 mt-2">
            Showing {yachts.length} of {total} matching yachts
          </p>
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {yachts.map((yacht) => (
          <Link
            key={yacht.id}
            href={localePath(locale, `/yachts/${yacht.slug}`)}
            className="block hover:bg-amber-50/40 transition-colors duration-200 p-5 group"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              {yacht.primaryImageUrl ? (
                <div className="w-full sm:w-28 h-20 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={yacht.primaryImageUrl}
                    alt={`${yacht.manufacturer} ${yacht.modelName}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="w-full sm:w-28 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex-shrink-0 flex items-center justify-center">
                  <span className="text-2xl opacity-40">⛵</span>
                </div>
              )}
              <div className="flex-grow min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h4 className="text-base font-semibold text-slate-800 group-hover:text-amber-700 transition font-serif truncate">
                    {yacht.manufacturer} {yacht.modelName}
                  </h4>
                  {yacht.year && (
                    <span className="text-xs text-slate-400 font-mono">{yacht.year}</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  {yacht.lengthOverall && (
                    <span>LOA {yacht.lengthOverall.toFixed(1)}m</span>
                  )}
                  {yacht.beam && (
                    <span>Beam {yacht.beam.toFixed(1)}m</span>
                  )}
                  {yacht.cabins && (
                    <span>{yacht.cabins} cabin{yacht.cabins > 1 ? "s" : ""}</span>
                  )}
                  {yacht.hullMaterial && (
                    <span>{yacht.hullMaterial}</span>
                  )}
                  {yacht.rigType && (
                    <span>{yacht.rigType}</span>
                  )}
                </div>
              </div>
              <div className="hidden sm:flex items-center">
                <span className="text-amber-600 font-medium text-xs whitespace-nowrap group-hover:translate-x-1 transition-transform">
                  View →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {showAllLink && total > yachts.length && (
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
          <Link
            href={localePath(locale, "/yachts")}
            className="text-amber-700 hover:text-amber-800 text-sm font-medium transition"
          >
            Browse all {total} matching yachts →
          </Link>
        </div>
      )}
    </section>
  );
}
