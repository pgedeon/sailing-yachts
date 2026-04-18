"use client";

import { Star } from "lucide-react";

interface ReviewData {
  source: string | null;
  rating: number | null;
  summary: string | null;
  fullText: string | null;
  reviewDate: string | null;
  authorName: string | null;
  sourceUrl: string | null;
  reviewType?: string | null;
  verified?: boolean | null;
  ratingBreakdown?: {
    build_quality: number | null;
    sailing_performance: number | null;
    comfort: number | null;
    value_for_money: number | null;
  } | null;
  pros?: string[] | null;
  cons?: string[] | null;
  helpfulCount?: number | null;
}

interface RatingBreakdown {
  build_quality: number;
  sailing_performance: number;
  comfort: number;
  value_for_money: number;
}

interface ReviewSummaryProps {
  reviews: ReviewData[];
  overallRating: number;
  ratingBreakdown: RatingBreakdown;
}

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function RatingBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-40 shrink-0">{label}</span>
      <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium w-8 text-right">
        {value > 0 ? value.toFixed(1) : "—"}
      </span>
    </div>
  );
}

export function ReviewSummary({ reviews, overallRating, ratingBreakdown }: ReviewSummaryProps) {
  const verifiedCount = reviews.filter(
    (r) => r.verified !== true
  ).length;
  const expertCount = reviews.filter(
    (r) => !r.reviewType || r.reviewType === "expert"
  ).length;
  const ownerCount = reviews.filter(
    (r) => r.reviewType && r.reviewType !== "expert"
  ).length;

  return (
    <section className="bg-card border border-border rounded-xl p-6 sm:p-8" data-testid="review-summary">
      <h2 className="text-lg sm:text-xl font-bold mb-6">Review Summary</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Overall rating */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="text-5xl font-bold mb-2">
            {overallRating > 0 ? overallRating.toFixed(1) : "—"}
          </div>
          <StarRating rating={overallRating} size="lg" />
          <p className="text-sm text-muted-foreground mt-2">
            Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {expertCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                {expertCount} expert review{expertCount !== 1 ? "s" : ""}
              </span>
            )}
            {ownerCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                {ownerCount} owner review{ownerCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Rating breakdown */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Rating Breakdown
          </h3>
          <RatingBar label="Build Quality" value={ratingBreakdown.build_quality} />
          <RatingBar label="Sailing Performance" value={ratingBreakdown.sailing_performance} />
          <RatingBar label="Comfort" value={ratingBreakdown.comfort} />
          <RatingBar label="Value for Money" value={ratingBreakdown.value_for_money} />
        </div>
      </div>
    </section>
  );
}
