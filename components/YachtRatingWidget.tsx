"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { StarRatingInput } from "./StarRatingInput";
import { StarRatingDisplay } from "./StarRatingDisplay";
import { RatingDistribution } from "./RatingDistribution";

interface YachtRatingWidgetProps {
  /** Yacht slug */
  slug: string;
  /** Compact mode for listing cards */
  compact?: boolean;
}

interface RatingStats {
  average: number;
  count: number;
  distribution: Record<number, number>;
  userRating?: number | null;
}

export function YachtRatingWidget({
  slug,
  compact = false,
}: YachtRatingWidgetProps) {
  const t = useTranslations("Ratings");
  const [stats, setStats] = useState<RatingStats>({
    average: 0,
    count: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [userRating, setUserRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch rating stats on mount
  useEffect(() => {
    if (!slug) return;

    const controller = new AbortController();

    fetch(`/api/yachts/${slug}/rating`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data: RatingStats | null) => {
        if (data) {
          setStats({
            average: data.average ?? 0,
            count: data.count ?? 0,
            distribution: data.distribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          });
          if (data.userRating != null) {
            setUserRating(data.userRating);
          }
        }
      })
      .catch(() => {
        // Silent fail — ratings are non-critical
      });

    return () => controller.abort();
  }, [slug]);

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
        setStats({
          average: data.average,
          count: data.count,
          distribution: data.distribution,
        });
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
    return <StarRatingDisplay average={stats.average} count={stats.count} size="sm" />;
  }

  return (
    <div className="yacht-rating-widget space-y-3">
      {/* Display existing rating */}
      <StarRatingDisplay average={stats.average} count={stats.count} size="lg" showCount />

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
      {stats.count > 0 && (
        <RatingDistribution distribution={stats.distribution} total={stats.count} />
      )}
    </div>
  );
}
