"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";

interface StarRatingDisplayProps {
  /** Average rating (0-5, can be decimal) */
  average: number;
  /** Total number of ratings */
  count: number;
  /** Size of stars */
  size?: "sm" | "md" | "lg";
  /** Whether to show the count text */
  showCount?: boolean;
  /** Extra CSS classes */
  className?: string;
}

const sizeClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function StarRatingDisplay({
  average,
  count,
  size = "md",
  showCount = true,
  className = "",
}: StarRatingDisplayProps) {
  const t = useTranslations("Ratings");

  // Round to nearest 0.5 for display
  const displayAvg = Math.round(average * 2) / 2;

  return (
    <div
      className={`star-rating-display inline-flex items-center gap-1 ${className}`}
      role="img"
      aria-label={
        count > 0
          ? t("ratingLabel", { average: displayAvg.toFixed(1), count })
          : t("noRatings")
      }
    >
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          // Determine fill level: full, half, or empty
          let fillClass: string;
          if (star <= Math.floor(displayAvg)) {
            fillClass = "fill-yellow-400 text-yellow-400";
          } else if (star === Math.ceil(displayAvg) && displayAvg % 1 >= 0.25) {
            fillClass = "fill-yellow-400/50 text-yellow-400";
          } else {
            fillClass = "fill-none text-muted-foreground/30";
          }

          return (
            <Star
              key={star}
              className={`${sizeClasses[size]} ${fillClass}`}
              aria-hidden="true"
            />
          );
        })}
      </div>
      {showCount && (
        <span className="text-sm text-muted-foreground">
          {count > 0 ? (
            <>
              <span className="font-medium text-foreground">{displayAvg.toFixed(1)}</span>
              <span className="mx-0.5">·</span>
              {t("ratingCount", { count })}
            </>
          ) : (
            <span className="italic">{t("noRatings")}</span>
          )}
        </span>
      )}
    </div>
  );
}
