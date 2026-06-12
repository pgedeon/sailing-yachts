"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { slugify } from "@/lib/utils/slugify";
import type { ManufacturerSummary } from "@/lib/manufacturers";
import ManufacturerLogo from "./manufacturer-logo";
import { COUNTRY_FLAGS } from "@/lib/utils/country-flags";
type SortKey = "name" | "yachtCount" | "foundedYear";
type SortOrder = "asc" | "desc";
interface ManufacturerListingClientProps {
  manufacturers: ManufacturerSummary[];
  locale: string;
}
export default function ManufacturerListingClient({
  manufacturers,
  locale,
}: ManufacturerListingClientProps) {
  const t = useTranslations("Manufacturers");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // P26.1: Tier priority for sorting
  const TIER_PRIORITY: Record<string, number> = { premium: 0, verified: 1, free: 2 };
  function tierPriority(tier: string | null): number {
    return TIER_PRIORITY[tier ?? "free"] ?? 2;
  }

  // Derive unique countries from data
  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const m of manufacturers) {
      if (m.country) set.add(m.country);
    }
    return Array.from(set).sort();
  }, [manufacturers]);

  // Filter and sort
  const filtered = useMemo(() => {
    let list = manufacturers;
    if (countryFilter !== "all") {
      list = list.filter((m) => m.country === countryFilter);
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "yachtCount":
          cmp = a.yachtCount - b.yachtCount;
          break;
        case "foundedYear": {
          const aYear = a.foundedYear ?? 9999;
          const bYear = b.foundedYear ?? 9999;
          cmp = aYear - bYear;
          break;
        }
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
    // P26.1: Premium manufacturers always float to top regardless of sort
    return list;
  }, [manufacturers, countryFilter, sortKey, sortOrder]);

  function handleSortChange(newKey: SortKey) {
    if (newKey === sortKey) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(newKey);
      setSortOrder(newKey === "name" ? "asc" : "desc"); // default desc for count/year
    }
  }
  function getSortIndicator(key: SortKey) {
    if (sortKey !== key) return "";
    return sortOrder === "asc" ? " ↑" : " ↓";
  }
  function getDescription(m: ManufacturerSummary): string | null {
    if (locale === "fr" && m.descriptionFr) return m.descriptionFr;
    return m.description ?? null;
  }

  // P26.1: Tier badge styling
  const tierBadgeStyle = (tier: string | null): string => {
    switch (tier) {
      case "premium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "verified":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "";
    }
  };

  // P26.1: Card border styling for premium manufacturers
  const cardStyle = (tier: string | null): string => {
    if (tier === "premium") {
      return "block bg-white rounded-xl p-5 hover:bg-blue-50 hover:shadow-md transition border-2 border-amber-300 group ring-1 ring-amber-100";
    }
    return "block bg-white rounded-xl p-5 hover:bg-blue-50 hover:shadow-md transition border border-gray-100 group";
  };

  return (
    <>
      {/* Filters & Sort Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Country Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="country-filter" className="text-sm font-medium text-gray-700">
            {t("listing.country")}:
          </label>
          <select
            id="country-filter"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">
              {t("listing.allCountries")}
            </option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {COUNTRY_FLAGS[c] ?? ""} {c}
              </option>
            ))}
          </select>
        </div>
        {/* Sort Buttons */}
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-sm font-medium text-gray-700 mr-1">
            {t("listing.sortBy")}:
          </span>
          {(
            [
              ["name", t("listing.sortName")],
              ["yachtCount", t("listing.sortYachtCount")],
              ["foundedYear", t("listing.sortFoundedYear")],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleSortChange(key as SortKey)}
              className={`px-3 py-1.5 text-sm rounded-md border transition ${
                sortKey === key
                  ? "bg-sky-600 text-white border-sky-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {label}
              {getSortIndicator(key as SortKey)}
            </button>
          ))}
        </div>
      </div>
      {/* Results count */}
      <div className="text-sm text-gray-500 mb-4">
        {t("listing.resultsCount", {
          filtered: filtered.length,
          total: manufacturers.length,
        })}
      </div>
      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="text-center">
            <div className="text-yellow-800 mb-2">
              {t("listing.noResults")}
            </div>
            <button
              onClick={() => setCountryFilter("all")}
              className="text-sm text-sky-600 hover:underline"
            >
              {t("listing.clearFilter")}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m) => {
            const desc = getDescription(m);
            return (
              <Link
                key={m.id}
                href={`/${locale}/manufacturers/${slugify(m.name)}`}
                className={cardStyle(m.tier)}
              >
                <div className="flex items-start gap-3">
                  <ManufacturerLogo name={m.name} logoUrl={m.logoUrl} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-gray-900 group-hover:text-sky-700 transition flex items-center gap-1.5 flex-wrap">
                        {m.name}
                        {/* P26.1: Tier badge on listing cards */}
                        {m.tier === "premium" && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold border bg-amber-100 text-amber-800 border-amber-200" title="Premium manufacturer">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            Premium
                          </span>
                        )}
                        {m.tier === "verified" && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold border bg-blue-100 text-blue-800 border-blue-200" title="Verified manufacturer">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Verified
                          </span>
                        )}
                      </div>
                  {m.country && (
                    <span className="text-xl shrink-0" title={m.country}>
                      {COUNTRY_FLAGS[m.country] ?? ""}
                    </span>
                  )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <svg aria-hidden="true" className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    {t("listing.models", { count: m.yachtCount })}
                  </span>
                  {m.foundedYear && (
                    <span className="inline-flex items-center gap-1">
                      <svg aria-hidden="true" className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {t("listing.foundedYear", { year: m.foundedYear })}
                    </span>
                  )}
                </div>
                {desc && (
                  <p className="mt-2 text-xs text-gray-400 line-clamp-2">
                    {desc}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
