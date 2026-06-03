"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { StarRatingInput } from "./StarRatingInput";
import { StarRatingDisplay } from "./StarRatingDisplay";
import { RatingDistribution } from "./RatingDistribution";

interface YachtRatingWidgetProps {
  /** Yacht slug */
  slug: string;
  /** Initial rating stats */
  initialAverage: number;
  initialCount: number;
  initialDistribution: Record<number, number>;
  /** Current user's rating (null if not rated) */
  userRating: number | null;
  /** Compact mode for listing cards */
  compact?: boolean;
}

export function YachtRatingWidget({
  slug,
  initialAverage,
  initialCount,
  initialDistribution,
  userRating: initialUserRating,
  compact = false,
}: YachtRatingWidgetProps) {
  const t = useTranslations("Ratings");
  const [average, setAverage] = useState(initialAverage);
  const [count, setCount] = useState(initialCount);
  const [distribution, setDistribution] = useState(initialDistribution);
  const [userRating, setUserRating] = useState<number | null>(initialUserRating);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (score: number) => {
      setSubmitting(true);
      setError(null);
      try {
        const res = await fetch(`/api/yachts/${slug}/rate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Failed to submit" }));
          throw new Error(data.error || "Failed to submit rating");
        }
        const data = await res.json();
        setAverage(data.average);
        setCount(data.count);
        setDistribution(data.distribution);
        setUserRating(score);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("submitError"));
      } finally {
        setSubmitting(false);
      }
    },
    [slug, t],
  );

  if (compact) {
    return <StarRatingDisplay average={average} count={count} size="sm" />;
  }

  return (
    <div className="yacht-rating-widget space-y-3">
      {/* Display existing rating */}
      <StarRatingDisplay average={average} count={count} size="lg" showCount />

      {/* Interactive rating input */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("yourRating")}:</span>
        <StarRatingInput
          value={userRating}
          onChange={handleSubmit}
          disabled={submitting}
          size="md"
        />
        {userRating && (
          <span className="text-xs text-muted-foreground">
            ({userRating}/5)
          </span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Distribution chart */}
      {count > 0 && (
        <RatingDistribution distribution={distribution} total={count} />
      )}
    </div>
  );
}
