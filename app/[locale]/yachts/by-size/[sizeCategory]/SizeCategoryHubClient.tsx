"use client";

import Link from "next/link";
import { localePath } from "@/lib/i18n-paths";
import type { YachtListItem } from "@/lib/yachts";

interface SizeCategoryHubClientProps {
  yachts: YachtListItem[];
  locale: string;
}

export function SizeCategoryHubClient({
  yachts,
  locale,
}: SizeCategoryHubClientProps) {
  if (yachts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {locale === "fr"
          ? "Aucun voilier trouvé dans cette catégorie."
          : "No yachts found in this size category."}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {yachts.map((yacht) => {
        const loa = yacht.lengthOverall
          ? typeof yacht.lengthOverall === "number"
            ? yacht.lengthOverall
            : parseFloat(String(yacht.lengthOverall))
          : null;
        const loaFt = loa ? Math.round(loa * 3.28084) : null;

        return (
          <Link
            key={yacht.id}
            href={localePath(locale, `/yachts/${yacht.slug}`)}
            className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="p-4">
              <div className="text-xs text-blue-600 font-medium mb-1">
                {yacht.manufacturer}
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {yacht.modelName}
              </h3>
              {yacht.year && (
                <p className="text-sm text-gray-500">{yacht.year}</p>
              )}

              {/* Key Specs Grid */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {loa && (
                  <div>
                    <span className="text-gray-500">LOA</span>
                    <p className="font-medium">
                      {loa.toFixed(1)}m{loaFt ? ` (${loaFt}&apos;)` : ""}
                    </p>
                  </div>
                )}
                {yacht.beam && (
                  <div>
                    <span className="text-gray-500">Beam</span>
                    <p className="font-medium">
                      {typeof yacht.beam === "number"
                        ? yacht.beam.toFixed(1)
                        : String(yacht.beam)}
                      m
                    </p>
                  </div>
                )}
                {yacht.cabins !== null && (
                  <div>
                    <span className="text-gray-500">Cabins</span>
                    <p className="font-medium">{yacht.cabins}</p>
                  </div>
                )}
                {yacht.berths !== null && (
                  <div>
                    <span className="text-gray-500">Berths</span>
                    <p className="font-medium">{yacht.berths}</p>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-1">
                {yacht.rigType && (
                  <span className="text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full">
                    {yacht.rigType}
                  </span>
                )}
                {yacht.keelType && (
                  <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">
                    {yacht.keelType}
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
