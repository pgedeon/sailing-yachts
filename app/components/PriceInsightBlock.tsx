"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "@/lib/utils/date";

interface PriceSummary {
  yachtModelId: number;
  modelName: string;
  manufacturerName: string;
  slug: string;
  newPriceMin: number | null;
  newPriceMax: number | null;
  usedPriceMin: number | null;
  usedPriceMax: number | null;
  currency: string;
  totalSources: number;
  avgConfidence: number;
}

interface PriceInsightBlockProps {
  yachtId: number;
  yachtModelId?: number;
  modelName: string;
  className?: string;
}

function formatPrice(amount: number, currency: string): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
  return formatted;
}

function formatPriceRange(min: number, max: number, currency: string): string {
  if (min === max) return formatPrice(min, currency);
  if (Math.abs(max - min) / min < 0.1) return formatPrice(min, currency);
  return `${formatPrice(min, currency)} – ${formatPrice(max, currency)}`;
}

function ConfidenceBadge({ score }: { score: number }) {
  const config = score >= 70
    ? { label: "High confidence", color: "text-green-700", bg: "bg-green-100" }
    : score >= 40
    ? { label: "Medium confidence", color: "text-yellow-700", bg: "bg-yellow-100" }
    : { label: "Low confidence", color: "text-red-700", bg: "bg-red-100" };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full text-xs font-medium px-2 py-0.5 ${config.bg} ${config.color}`}
      title={`Based on ${score}% average confidence across ${score < 40 ? "limited" : score < 70 ? "some" : "multiple"} sources`}
    >
      {score >= 70 ? (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
      ) : score >= 40 ? (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
      ) : (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
      )}
      {config.label}
    </span>
  );
}

function LastUpdatedBadge({ updatedAt }: { updatedAt: string }) {
  const date = new Date(updatedAt);
  const relative = formatDistanceToNow(date);
  return (
    <span className="text-xs text-gray-400">
      Updated {relative}
    </span>
  );
}

function PriceRow({
  label,
  priceMin,
  priceMax,
  currency,
  condition,
}: {
  label: string;
  priceMin: number;
  priceMax: number;
  currency: string;
  condition: string;
}) {
  const isNew = condition === "new";
  const colorClass = isNew ? "text-gray-900" : "text-gray-700";
  const labelColor = isNew ? "text-gray-500" : "text-gray-500";

  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
      <div>
        <span className={`text-sm font-medium ${labelColor}`}>{label}</span>
        <div className="text-xs text-gray-400 mt-0.5 capitalize">{condition}</div>
      </div>
      <div className="text-right">
        <span className={`text-sm font-bold ${colorClass}`}>
          {formatPriceRange(priceMin, priceMax, currency)}
        </span>
      </div>
    </div>
  );
}

export function PriceInsightBlock({
  yachtId,
  yachtModelId,
  modelName,
  className = "",
}: PriceInsightBlockProps) {
  const [priceData, setPriceData] = useState<PriceSummary | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const targetId = yachtModelId || yachtId;
    if (!targetId) return;

    const controller = new AbortController();
    fetch(`/api/prices?yachtId=${targetId}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) {
            setHidden(true);
            return null;
          }
          throw new Error("Failed to load price data");
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setPriceData(data);
        setUpdatedAt(data.updatedAt || data.effectiveDate || new Date().toISOString());
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [yachtId, yachtModelId]);

  // Hide gracefully when no price data available
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 sm:p-5 ${className}`} data-testid="price-insight-block">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (error || hidden || !priceData) {
    return null;
  }

  // Must have at least one price range to display
  const hasNewPrice = priceData.newPriceMin != null && priceData.newPriceMax != null;
  const hasUsedPrice = priceData.usedPriceMin != null && priceData.usedPriceMax != null;

  if (!hasNewPrice && !hasUsedPrice) {
    return null;
  }

  const currency = priceData.currency || "USD";

  return (
    <div
      className={`bg-white rounded-lg shadow p-4 sm:p-5 ${className}`}
      data-testid="price-insight-block"
      data-yacht-id={priceData.yachtModelId}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Price Range
        </h3>
        <ConfidenceBadge score={priceData.avgConfidence || 0} />
      </div>

      {/* Price Rows */}
      <div className="space-y-0">
        {hasNewPrice && (
          <PriceRow
            label="New Boat Price"
            priceMin={priceData.newPriceMin!}
            priceMax={priceData.newPriceMax!}
            currency={currency}
            condition="new"
          />
        )}
        {hasUsedPrice && (
          <PriceRow
            label="Used / Brokerage"
            priceMin={priceData.usedPriceMin!}
            priceMax={priceData.usedPriceMax!}
            currency={currency}
            condition="used"
          />
        )}
      </div>

      {/* Footer metadata */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        {updatedAt && <LastUpdatedBadge updatedAt={updatedAt} />}
        <span className="text-xs text-gray-400" title={`Based on ${priceData.totalSources} source${priceData.totalSources !== 1 ? "s" : ""}`}>
          {priceData.totalSources} source{priceData.totalSources !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}