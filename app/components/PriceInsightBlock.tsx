"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "@/lib/utils/date";

// --- Types ---

type CurrencyCode = "USD" | "EUR" | "GBP";

interface PriceRange {
  min: number;
  max: number;
  currency: CurrencyCode;
  confidence: number;
  sources: number;
}

interface PriceDisplayInfo {
  status: "available" | "contact" | "unavailable";
  label: string;
  priceRange?: PriceRange;
  usedPriceRange?: PriceRange;
  confidenceLabel: string;
  confidenceLevel: "high" | "medium" | "low" | "none";
}

interface PriceTrendPoint {
  date: string;
  priceMin: number;
  priceMax: number;
  currency: string;
  confidenceScore: number;
  snapshotReason: string;
}

interface PriceInsightBlockProps {
  yachtId: number;
  yachtModelId?: number;
  modelName: string;
  className?: string;
}

// --- Helpers ---

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

function formatPrice(amount: number, currency: CurrencyCode): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${symbol}${formatted}`;
}

function formatPriceRange(min: number, max: number, currency: CurrencyCode): string {
  if (min === max) return formatPrice(min, currency);
  if (Math.abs(max - min) / min < 0.1) return formatPrice(min, currency);
  return `${formatPrice(min, currency)} – ${formatPrice(max, currency)}`;
}

// --- Sub-components ---

function ConfidenceBadge({ score }: { score: number }) {
  const config = score >= 70
    ? { label: "High confidence", color: "text-green-700", bg: "bg-green-100", Icon: CheckIcon }
    : score >= 40
    ? { label: "Medium confidence", color: "text-yellow-700", bg: "bg-yellow-100", Icon: InfoIcon }
    : { label: "Low confidence", color: "text-red-700", bg: "bg-red-100", Icon: AlertIcon };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full text-xs font-medium px-2 py-0.5 ${config.bg} ${config.color}`}
      title={`Confidence: ${score}%`}
    >
      <config.Icon />
      {config.label}
    </span>
  );
}

function PriceUnavailableFallback({ status }: { status: "contact" | "unavailable" }) {
  if (status === "contact") {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center" data-testid="price-contact">
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <PhoneIcon />
          <span className="font-medium">Contact for price</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">Pricing available upon request from dealers</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center" data-testid="price-unavailable">
      <div className="flex items-center justify-center gap-2 text-gray-500">
        <DashIcon />
        <span className="font-medium">Price not available</span>
      </div>
      <p className="mt-1 text-xs text-gray-500">No pricing data found for this model</p>
    </div>
  );
}

function CurrencySelector({
  selected,
  onChange,
}: {
  selected: CurrencyCode;
  onChange: (c: CurrencyCode) => void;
}) {
  const currencies: CurrencyCode[] = ["EUR", "USD", "GBP"];
  return (
    <div className="flex gap-1" data-testid="currency-selector">
      {currencies.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
            selected === c
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          aria-label={`Show prices in ${c}`}
          data-testid={`currency-${c}`}
        >
          {CURRENCY_SYMBOLS[c]} {c}
        </button>
      ))}
    </div>
  );
}

function PriceTrendSparkline({ data }: { data: PriceTrendPoint[] }) {
  if (data.length < 2) return null;

  // Normalize prices to SVG coordinates
  const width = 200;
  const height = 40;
  const padding = 2;

  const allPrices = data.flatMap((d) => [d.priceMin, d.priceMax]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const range = maxPrice - minPrice || 1;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const yMin = height - padding - ((d.priceMin - minPrice) / range) * (height - padding * 2);
    const yMax = height - padding - ((d.priceMax - minPrice) / range) * (height - padding * 2);
    return { x, yMin, yMax };
  });

  const lineMin = points.map((p) => `${p.x},${p.yMin}`).join(" ");
  const lineMax = points.map((p) => `${p.x},${p.yMax}`).join(" ");

  // Area between min and max
  const areaPoints = [
    ...points.map((p) => `${p.x},${p.yMin}`),
    ...points.reverse().map((p) => `${p.x},${p.yMax}`),
  ].join(" ");

  return (
    <div className="mt-3" data-testid="price-trend-chart">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">Price History</span>
        <span className="text-xs text-gray-500">{data.length} data points</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-10"
        preserveAspectRatio="none"
        role="img"
        aria-label="Price trend chart"
      >
        <polygon points={areaPoints} fill="currentColor" className="text-primary/10" />
        <polyline points={lineMin} fill="none" stroke="currentColor" className="text-primary" strokeWidth="1.5" />
        <polyline points={lineMax} fill="none" stroke="currentColor" className="text-primary/50" strokeWidth="1" strokeDasharray="2,2" />
      </svg>
      <div className="flex justify-between text-xs text-gray-500 mt-0.5">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function PriceRow({
  label,
  priceRange,
  showConfidence,
}: {
  label: string;
  priceRange: PriceRange;
  showConfidence?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
      <div>
        <span className="text-sm font-medium text-gray-600">{label}</span>
        {showConfidence && (
          <ConfidenceBadge score={priceRange.confidence} />
        )}
      </div>
      <div className="text-right">
        <span className="text-sm font-bold text-gray-900">
          {formatPriceRange(priceRange.min, priceRange.max, priceRange.currency)}
        </span>
        <div className="text-xs text-gray-500">
          {priceRange.sources} source{priceRange.sources !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}

// --- Icons (inline SVG to avoid lucide dependency issues) ---

function CheckIcon() {
  return (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function DashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  );
}

// --- Main Component ---

export function PriceInsightBlock({
  yachtId,
  yachtModelId,
  modelName,
  className = "",
}: PriceInsightBlockProps) {
  const [currency, setCurrency] = useState<CurrencyCode>("EUR");
  const [displayInfo, setDisplayInfo] = useState<PriceDisplayInfo | null>(null);
  const [history, setHistory] = useState<PriceTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetId = yachtModelId || yachtId;

  const fetchNormalizedPrices = useCallback(async (cur: CurrencyCode) => {
    if (!targetId) return;
    try {
      const res = await fetch(
        `/api/prices/normalize?yachtModelId=${targetId}&currency=${cur}&history=true`
      );
      if (!res.ok) {
        if (res.status === 404) {
          setDisplayInfo({
            status: "unavailable",
            label: "Price not available",
            confidenceLabel: "No pricing data",
            confidenceLevel: "none",
          });
          return;
        }
        throw new Error("Failed to load price data");
      }
      const data = await res.json();
      setDisplayInfo(data.displayInfo);
      setHistory(data.history || []);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setError(err.message);
    }
  }, [targetId]);

  useEffect(() => {
    setLoading(true);
    fetchNormalizedPrices(currency).finally(() => setLoading(false));
  }, [currency, fetchNormalizedPrices]);

  // Loading state
  if (loading) {
    return (
      <div
        className={`bg-white rounded-lg shadow p-4 sm:p-5 ${className}`}
        data-testid="price-insight-block"
      >
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return null;
  }

  // No display info
  if (!displayInfo) {
    return null;
  }

  // Fallback UIs for missing/partial data
  if (displayInfo.status !== "available") {
    return (
      <div
        className={`bg-white rounded-lg shadow p-4 sm:p-5 ${className}`}
        data-testid="price-insight-block"
      >
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pricing
        </h3>
        <PriceUnavailableFallback status={displayInfo.status} />
      </div>
    );
  }

  // Full price display
  const hasNewPrice = displayInfo.priceRange && displayInfo.priceRange.min > 0;
  const hasUsedPrice = displayInfo.usedPriceRange && displayInfo.usedPriceRange.min > 0;

  if (!hasNewPrice && !hasUsedPrice) {
    return (
      <div
        className={`bg-white rounded-lg shadow p-4 sm:p-5 ${className}`}
        data-testid="price-insight-block"
      >
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pricing
        </h3>
        <PriceUnavailableFallback status="unavailable" />
      </div>
    );
  }

  const bestConfidence = Math.max(
    displayInfo.priceRange?.confidence || 0,
    displayInfo.usedPriceRange?.confidence || 0
  );

  return (
    <div
      className={`bg-white rounded-lg shadow p-4 sm:p-5 ${className}`}
      data-testid="price-insight-block"
      data-yacht-id={targetId}
    >
      {/* Header with currency selector */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Price Range
        </h3>
        <div className="flex items-center gap-2">
          <ConfidenceBadge score={bestConfidence} />
        </div>
      </div>

      {/* Currency selector */}
      <div className="mb-3">
        <CurrencySelector selected={currency} onChange={setCurrency} />
      </div>

      {/* Price Rows */}
      <div className="space-y-0">
        {hasNewPrice && displayInfo.priceRange && (
          <PriceRow label="New Boat Price" priceRange={displayInfo.priceRange} />
        )}
        {hasUsedPrice && displayInfo.usedPriceRange && (
          <PriceRow label="Used / Brokerage" priceRange={displayInfo.usedPriceRange} />
        )}
      </div>

      {/* Price trend chart */}
      {history.length >= 2 && (
        <PriceTrendSparkline data={history} />
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          Prices normalized to {currency}
        </span>
        <span className="text-xs text-gray-500">
          {displayInfo.confidenceLabel}
        </span>
      </div>
    </div>
  );
}
