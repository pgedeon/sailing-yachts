"use client";

import { useTranslations } from "next-intl";

interface RatingDistributionProps {
  /** Distribution object { 1: count, 2: count, ... 5: count } */
  distribution: Record<number, number>;
  /** Total number of ratings */
  total: number;
}

export function RatingDistribution({
  distribution,
  total,
}: RatingDistributionProps) {
  const t = useTranslations("Ratings");

  if (total === 0) return null;

  return (
    <div className="rating-distribution space-y-1.5">
      <h4 className="text-sm font-medium text-muted-foreground">{t("distribution")}</h4>
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[star] || 0;
        const pct = total > 0 ? (count / total) * 100 : 0;

        return (
          <div key={star} className="flex items-center gap-2 text-sm">
            <span className="w-8 text-right text-muted-foreground tabular-nums">
              {star}★
            </span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-yellow-400 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 text-muted-foreground tabular-nums text-right">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
