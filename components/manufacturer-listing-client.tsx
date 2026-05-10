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
                className="block bg-white rounded-xl p-5 hover:bg-blue-50 hover:shadow-md transition border border-gray-100 group"
              >
                <div className="flex items-start gap-3">
                  <ManufacturerLogo name={m.name} logoUrl={m.logoUrl} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-gray-900 group-hover:text-sky-700 transition">
                        {m.name}
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
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    {t("listing.models", { count: m.yachtCount })}
                  </span>
                  {m.foundedYear && (
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
