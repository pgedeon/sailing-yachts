"use client";

import Link from "next/link";
import { localePath } from "@/lib/i18n-paths";
import type { YachtListItem } from "@/lib/yachts";
import { useTranslations } from "next-intl";

interface BestYearSizeClientProps {
  yachts: YachtListItem[];
  locale: string;
  year: number;
}

export function BestYearSizeClient({
  yachts,
  locale,
  year,
}: BestYearSizeClientProps) {
  const t = useTranslations("BestYearSize");

  if (yachts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {t("noYachtsFound")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {t("showingCount", { count: yachts.length })}
        </p>
      </div>

      {/* Yacht ranking list */}
      <div className="space-y-4">
        {yachts.map((yacht, index) => {
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
              className="group block bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Rank badge */}
                  <div className="shrink-0 w-10 h-10 rounded-full bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {yacht.manufacturer} {yacht.modelName}
                      </h3>
                      {yacht.year && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {yacht.year}
                        </span>
                      )}
                    </div>

                    {/* Key Specs */}
                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      {loa && (
                        <div>
                          <span className="text-gray-500">{t("loa")}:</span>{" "}
                          <span className="font-medium">
                            {loa.toFixed(1)}m
                            {loaFt ? ` (${loaFt}′)` : ""}
                          </span>
                        </div>
                      )}
                      {yacht.beam && (
                        <div>
                          <span className="text-gray-500">{t("beam")}:</span>{" "}
                          <span className="font-medium">
                            {typeof yacht.beam === "number"
                              ? yacht.beam.toFixed(1)
                              : String(yacht.beam)}
                            m
                          </span>
                        </div>
                      )}
                      {yacht.cabins !== null && (
                        <div>
                          <span className="text-gray-500">
                            {t("cabins")}:
                          </span>{" "}
                          <span className="font-medium">{yacht.cabins}</span>
                        </div>
                      )}
                      {yacht.berths !== null && (
                        <div>
                          <span className="text-gray-500">
                            {t("berths")}:
                          </span>{" "}
                          <span className="font-medium">{yacht.berths}</span>
                        </div>
                      )}
                      {yacht.displacement && (
                        <div>
                          <span className="text-gray-500">
                            {t("displacement")}:
                          </span>{" "}
                          <span className="font-medium">
                            {typeof yacht.displacement === "number"
                              ? (yacht.displacement / 1000).toFixed(1)
                              : (
                                  parseFloat(String(yacht.displacement)) / 1000
                                ).toFixed(1)}
                            t
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="mt-2 flex flex-wrap gap-1">
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
                      {yacht.hullMaterial && (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                          {yacht.hullMaterial}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* View link */}
                  <div className="shrink-0 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg aria-hidden="true"
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom editorial note */}
      <div className="text-center py-4 text-sm text-gray-400 italic">
        {t("editorialDisclaimer", { year })}
      </div>
    </div>
  );
}
