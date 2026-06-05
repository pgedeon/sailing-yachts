"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

interface FeaturedYacht {
  id: number;
  yachtModelId: number;
  weekStart: string;
  weekEnd: string;
  headline: string | null;
  editorialText: string | null;
  yacht: {
    id: number;
    modelName: string;
    slug: string;
    year: number;
    lengthOverall: string | null;
    beam: string | null;
    draft: string | null;
    displacement: string | null;
    cabins: number | null;
    berths: number | null;
    description: string | null;
    manufacturer: string;
    manufacturerSlug: string;
    imageUrl: string | null;
  };
}

export function FeaturedYachtOfTheWeek() {
  const t = useTranslations("FeaturedYacht");
  const locale = useLocale();
  const [featured, setFeatured] = useState<FeaturedYacht | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/featured")
      .then((res) => res.json())
      .then((data) => {
        setFeatured(data.active ?? null);
      })
      .catch(() => {
        // Silently fail — don't break homepage
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-12 px-4 bg-gradient-to-r from-blue-50 to-sky-50">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4" />
            <div className="h-48 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </section>
    );
  }

  if (!featured) return null;

  const yacht = featured.yacht;
  const headline = featured.headline || t("defaultHeadline", { manufacturer: yacht.manufacturer, model: yacht.modelName });

  return (
    <section className="py-12 px-4 bg-gradient-to-r from-blue-50 to-sky-50 border-y border-blue-100">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">⭐</span>
          <h2 className="text-2xl font-bold text-gray-900">{t("title")}</h2>
        </div>

        <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
          <div className="md:flex">
            {yacht.imageUrl && (
              <div className="md:w-1/3 h-48 md:h-auto bg-gray-100">
                <img
                  src={yacht.imageUrl}
                  alt={`${yacht.manufacturer} ${yacht.modelName}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 p-6">
              <div className="text-sm text-blue-600 font-medium mb-1">
                {t("weekLabel")}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{headline}</h3>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-semibold text-gray-700">
                  {yacht.manufacturer} {yacht.modelName}
                </span>
                <span className="text-sm text-gray-500">({yacht.year})</span>
              </div>

              {featured.editorialText && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {featured.editorialText}
                </p>
              )}

              {yacht.description && !featured.editorialText && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {yacht.description}
                </p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                {yacht.lengthOverall && (
                  <span className="bg-gray-50 px-3 py-1 rounded-full">
                    {Number(yacht.lengthOverall).toFixed(1)}m LOA
                  </span>
                )}
                {yacht.beam && (
                  <span className="bg-gray-50 px-3 py-1 rounded-full">
                    {Number(yacht.beam).toFixed(1)}m Beam
                  </span>
                )}
                {yacht.cabins && (
                  <span className="bg-gray-50 px-3 py-1 rounded-full">
                    {yacht.cabins} {t("cabins")}
                  </span>
                )}
                {yacht.berths && (
                  <span className="bg-gray-50 px-3 py-1 rounded-full">
                    {yacht.berths} {t("berths")}
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                <Link
                  href={`/${locale}/yachts/${yacht.slug}`}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition"
                >
                  {t("viewFullSpecs")}
                </Link>
                <Link
                  href={`/${locale}/yacht-of-the-week`}
                  className="px-5 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium text-sm hover:bg-blue-50 transition"
                >
                  {t("seeAllFeatured")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
